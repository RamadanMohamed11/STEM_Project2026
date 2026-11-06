"""Bounded real-Chrome audit; application files and scientific stores are never edited.

Run live: python tests/browserBaselineAudit.py
Run isolated: python tests/browserBaselineAudit.py --snapshot-ref <git-revision>
The isolated copy is extracted under artifacts/ with HMR/watch disabled.
Uses port 5174, starts Vite with Popen, and kills its process tree in finally.
Outputs screenshots, raw browser messages, timings and source manifests in artifacts/.
The existing acceptance is imported unchanged; only its URL/output path are redirected.
Synthetic cancellation probes are explicitly labelled, not claimed as OS input tests.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
import traceback
import urllib.request
import zipfile

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts"
URL = "http://127.0.0.1:5174"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
ROUTE = "/experiments/exp-salt-water-001/lab"
ARGS = ["--enable-webgl", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"]


def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def manifest():
    paths = [p for p in (ROOT / "src").rglob("*") if p.is_file()]
    paths += [ROOT / n for n in ("index.html", "package.json", "package-lock.json", "vite.config.ts", "tests/browserMouseAcceptance.py")]
    return {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(paths)}


def acceptance():
    spec = importlib.util.spec_from_file_location("existing_mouse_acceptance", ROOT / "tests/browserMouseAcceptance.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.BASE_URL = URL
    module.OUTPUT = OUT / "lab-existing-acceptance.png"
    return module


# Every store operation below is getState() followed by reading data, never actions/setState.
SNAPSHOT = """async () => {
 const urls=performance.getEntriesByType('resource').map(r=>r.name);
 const load=async(path)=>import(urls.filter(u=>u.includes(path)).at(-1) ?? path);
 const {useLabSceneStore}=await load('/src/features/simulations/state/useLabSceneStore.ts');
 const {useSaltSimulationStore}=await load('/src/features/simulations/state/useSaltSimulationStore.ts');
 const s=useLabSceneStore.getState(), c=useSaltSimulationStore.getState();
 return {placedIds:s.placedIds,positions:s.positions,relationships:s.relationships,
 selectedId:s.selectedId,hoveredId:s.hoveredId,tiltHandleHoveredId:s.tiltHandleHoveredId,
 draggingId:s.draggingId,placement:s.placement,sceneFeedback:s.feedback,
 experiment:c.experiment,workflow:c.workflow,events:c.events,effect:c.effect,
 livePour:c.livePour,validation:c.validation,feedback:c.feedback};
}"""
FIBER = """const urls=performance.getEntriesByType('resource').map(r=>r.name);
 const fiber=await import(urls.filter(u=>u.includes('/@react-three_fiber.js')).at(-1) ?? '/node_modules/.vite/deps/@react-three_fiber.js');
 const root=[...fiber._roots.values()][0];
 if(!root) throw Error('No R3F root yet');
 const {scene,camera,gl}=root.store.getState();
 const rect=gl.domElement.getBoundingClientRect();
 const screen=(v)=>{v.project(camera);return {x:rect.left+(v.x+1)*rect.width/2,y:rect.top+(1-v.y)*rect.height/2}};
"""
PROJECT = "async (p)=>{" + FIBER + "return screen(scene.position.clone().set(p.x,p.y,p.z));}"
POINT_ON_PLANE = "async(p)=>{" + FIBER + """
 const origin=camera.position.clone();
 const v=origin.clone().set((p.x-rect.left)/rect.width*2-1,1-(p.y-rect.top)/rect.height*2,.5).unproject(camera);
 const direction=v.sub(origin).normalize();
 const hit=origin.addScaledVector(direction,(p.height-origin.y)/direction.y);
 return {x:hit.x,z:hit.z};}"""
CANDIDATES = "async(id)=>{" + FIBER + """
 scene.updateMatrixWorld(true);
 const group=scene.getObjectByName(id), result=[];
 if(!group)return result;
 group.traverse(o=>{
   if(!o.isMesh || !o.visible || (o.material?.transparent && o.material.opacity===0))return;
   let parent=o;while(parent && parent!==group){if(parent.name.endsWith('-tilt-handle'))return;parent=parent.parent;}
   const v=scene.position.clone();o.getWorldPosition(v);
   result.push(screen(v));
 });return result;
}"""
HANDLE = "async(id)=>{" + FIBER + """
 scene.updateMatrixWorld(true);const o=scene.getObjectByName(id+'-tilt-handle');
 if(!o)return null;const v=scene.position.clone();o.getWorldPosition(v);return screen(v);
}"""


class Audit:
    def __init__(self, page, report):
        self.page, self.report = page, report
        self.started = time.perf_counter()
        self.deadline = self.started + 300
        self.sequence = []

    def state(self):
        if time.perf_counter() > self.deadline:
            raise TimeoutError("Diagnostic exceeded its 300-second budget")
        return self.page.evaluate(SNAPSHOT)

    def log(self, name, ok, **data):
        item = {"name": name, "ok": bool(ok), "elapsed_s": round(time.perf_counter()-self.started, 3), **data}
        self.report["checks"].append(item)
        print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(data, ensure_ascii=False), flush=True)
        return ok

    def shot(self, name):
        path = OUT / name
        self.page.screenshot(path=str(path), timeout=15000)
        self.report["screenshots"].append(path.relative_to(ROOT).as_posix())

    def wait(self, predicate, timeout=8):
        end = min(time.perf_counter()+timeout, self.deadline)
        state = self.state()
        while not predicate(state) and time.perf_counter() < end:
            self.page.wait_for_timeout(90)
            state = self.state()
        return state

    def idle(self):
        state = self.wait(lambda s: s["effect"] is None)
        if state["effect"]:
            raise AssertionError("Effect did not clear via application's own timer")
        # Let the visible pivot settle before raycasting a thin instrument.
        self.page.wait_for_timeout(350)

    def project(self, x, z, y=.78):
        return self.page.evaluate(PROJECT, {"x": x, "y": y, "z": z})

    def hover(self, tool):
        points = self.page.evaluate(CANDIDATES, tool)
        # Mesh centres plus small offsets: all actual input is sent through Playwright's mouse.
        candidates = [(p["x"]+dx, p["y"]+dy) for p in points[:35] for dx,dy in [(0,0),(3,0),(-3,0),(0,3)]]
        for x,y in candidates:
            if not (10<x<1430 and 65<y<880):
                continue
            self.page.mouse.move(x,y)
            state = self.state()
            if state["hoveredId"] == tool and state["tiltHandleHoveredId"] != tool:
                return {"x":x,"y":y}
        raise AssertionError(f"No real mouse body hit for {tool}; tried {len(candidates)} candidates")

    def grab(self, tool):
        self.idle()
        for attempt in range(3):
            point = self.hover(tool)
            self.page.mouse.down()
            state = self.state()
            if state["draggingId"] == tool:
                if attempt:self.log("body hit retry "+tool,True,attempts=attempt+1,reason="Thin animated mesh moved between hover and press")
                return point, state
            self.page.mouse.up()
            self.page.wait_for_timeout(650)
        raise AssertionError(f"Body press did not grab {tool} after three hits: {state['draggingId']}")

    def move_held(self, point, start, x, z, steps=14):
        hit = self.page.evaluate(POINT_ON_PLANE, {**point,"height":.78})
        end = self.project(hit["x"]+x-start["x"],hit["z"]+z-start["z"])
        self.page.mouse.move(end["x"],end["y"],steps=steps)
        return end

    def drag(self, tool, x, z):
        before = self.state()["positions"][tool]
        point,_ = self.grab(tool)
        self.move_held(point,before,x,z)
        held = self.state()
        self.page.mouse.up()
        after = self.state()
        self.log("body drag " + tool, after["draggingId"] is None and math.hypot(after['positions'][tool]['x']-x,after['positions'][tool]['z']-z)<.08,
                 requested={"x":x,"z":z}, actual=after["positions"][tool], heldFeedback=held["sceneFeedback"])
        return after

    def place(self, name, tool, x, z):
        self.page.get_by_role("button",name="Toggle equipment inventory").click()
        inventory=self.page.get_by_role("complementary",name="Lab inventory")
        inventory.get_by_role("button").filter(has_text=name).first.click()
        self.page.get_by_role("button",name="Collapse inventory").click()
        p=self.project(x,z)
        self.page.mouse.move(p["x"],p["y"])
        self.page.wait_for_timeout(140)
        preview=self.state()["placement"]
        if not preview or not preview["valid"]:
            raise AssertionError(f"Invalid mouse placement for {tool}: {preview}")
        self.page.mouse.click(p["x"],p["y"])
        state=self.wait(lambda s:tool in s["placedIds"],2)
        if tool not in state["placedIds"]:
            raise AssertionError(f"Click did not place {tool}")
        self.log("inventory mouse placement " + tool,True,position=state["positions"][tool])

    def cancel(self, kind):
        if kind=="pointercancel (synthetic DOM event)":
            self.page.evaluate("""() => document.querySelector('canvas').dispatchEvent(new PointerEvent('pointercancel',
             {bubbles:true,pointerId:window.__auditPointer.pointerId,pointerType:'mouse',isPrimary:true}))""")
        elif kind=="lostpointercapture (native releasePointerCapture)":
            self.page.evaluate("() => document.querySelector('canvas').releasePointerCapture(window.__auditPointer.pointerId)")
            # Capture changes become pending until Chrome processes another pointer event.
            p=self.page.evaluate("() => window.__auditPointer")
            self.page.mouse.move(p["x"]+1,p["y"])
            self.page.wait_for_timeout(140)
        elif kind=="blur (synthetic DOM event)":
            self.page.evaluate("() => window.dispatchEvent(new Event('blur'))")
        elif kind=="Escape (real keyboard)":
            self.page.keyboard.press("Escape")
        elif kind=="outside-canvas release (real mouse)":
            self.page.mouse.move(10,10,steps=4)
            self.page.mouse.up()
        else:
            raise ValueError(kind)

    def cancellations(self):
        for kind in ["pointercancel (synthetic DOM event)","lostpointercapture (native releasePointerCapture)","blur (synthetic DOM event)","Escape (real keyboard)","outside-canvas release (real mouse)"]:
            before=self.state()
            point,_=self.grab("beaker")
            self.move_held(point,before["positions"]["beaker"],.80,.08,8)
            held=self.state()
            self.cancel(kind)
            after=self.state()
            self.page.mouse.up()
            ok=(held["draggingId"]=="beaker" and after["draggingId"] is None and after["positions"]["beaker"]==before["positions"]["beaker"] and after["experiment"]==before["experiment"] and after["events"]==before["events"])
            self.log(kind,ok,before=before["positions"]["beaker"],held=held["positions"]["beaker"],after=after["positions"]["beaker"],dragging=after["draggingId"])

    def tilt(self, tool, target, partial_cancel=False):
        self.idle()
        handle=self.page.evaluate(HANDLE,tool)
        if not handle:raise AssertionError(f"No {tool} tilt grip")
        self.page.mouse.move(handle["x"],handle["y"])
        self.page.wait_for_timeout(80)
        hover=self.state()
        gesture_started=time.perf_counter()
        self.page.mouse.down()
        self.page.mouse.move(handle["x"],handle["y"]+80,steps=8)
        started=time.perf_counter()
        downstroke_s=started-gesture_started
        samples=[]
        end=started+(1 if partial_cancel else 18)
        while time.perf_counter()<end:
            state=self.state()
            samples.append({"s":round(time.perf_counter()-started,3),"water":state["experiment"]["waterMl"],"dragging":state["draggingId"]})
            if (partial_cancel and state["experiment"]["waterMl"][target]>0) or (not partial_cancel and state["experiment"]["waterMl"][target]==100):break
            self.page.wait_for_timeout(120)
        if partial_cancel:
            self.cancel("pointercancel (synthetic DOM event)")
            cancelled=self.state()
            self.page.wait_for_timeout(500)
            stable=self.state()
            self.page.mouse.up()
            self.log("active liquid pointercancel preserves transferred water and stops flow",cancelled["draggingId"] is None and stable["livePour"] is None and stable["experiment"]["waterMl"]==cancelled["experiment"]["waterMl"] and 0<stable["experiment"]["waterMl"][target]<100,
                     cancelledWater=cancelled["experiment"]["waterMl"],laterWater=stable["experiment"]["waterMl"])
        else:
            self.page.mouse.up()
        after=self.state()
        self.log("held tilt " + tool + " -> " + target, after["experiment"]["waterMl"][target]>0 if partial_cancel else after["experiment"]["waterMl"][target]==100,
                 gesture_to_release_s=round(time.perf_counter()-gesture_started,3),downstroke_s=round(downstroke_s,3),poll_to_release_s=round(time.perf_counter()-started,3),gripHovered=hover["tiltHandleHoveredId"],samples=samples,step=after["workflow"]["stepIndex"])
        if sum(after["experiment"]["waterMl"].values())!=400:raise AssertionError("Water conservation violated")
        return after

    def mouth_path(self, tool, vessel, height, radius, turns=1, stationary=False, shake=False):
        point,before=self.grab(tool)
        center=before["positions"][vessel]
        coords=[]
        sample_count=10 if stationary else 12 if shake else 21
        for i in range(sample_count):
            angle=(i/(sample_count-1))*math.tau*turns
            if stationary:angle=0
            if shake:angle=.4 if i%2 else -.4
            coords.append({"x":center["x"]+radius*math.cos(angle),"y":height,"z":center["z"]+radius*math.sin(angle)})
        screens=self.page.evaluate("async(points)=>{"+FIBER+"return points.map(p=>screen(scene.position.clone().set(p.x,p.y,p.z)));}",coords)
        started=time.perf_counter()
        move_start=self.page.evaluate("window.__auditMoves.length")
        for p in screens:
            self.page.mouse.move(p["x"],p["y"]) 
            self.page.wait_for_timeout(30)
        held=self.state()
        self.page.mouse.up()
        after=self.state()
        self.log(f"{tool} {('stationary' if stationary else 'shake' if shake else 'circular')} path in {vessel}",
                 after["experiment"]==before["experiment"] if stationary or shake else after["experiment"]!=before["experiment"],
                 duration_s=round(time.perf_counter()-started,3),pointer_samples=self.page.evaluate("(n)=>window.__auditMoves.slice(n)",move_start),before=before["experiment"],after=after["experiment"],step=after["workflow"]["stepIndex"],heldPosition=held["positions"][tool],heldFeedback=held["sceneFeedback"],feedback=after["feedback"],validation=after["validation"])
        self.sequence.append(after)
        return after

    def workflow(self):
        self.page.get_by_role("button",name="Confirm safety").click()
        self.place("Graduated Cylinder","graduated-cylinder",-.52,-.45)
        self.place("Water","water",-1.23,-.45)
        self.tilt("water","graduated-cylinder",True)
        measured=self.tilt("water","graduated-cylinder")
        if measured["workflow"]["stepIndex"]!=3:raise AssertionError("Water stage blocked")
        self.drag("graduated-cylinder",-.25,.08)
        transferred=self.tilt("graduated-cylinder","beaker")
        self.shot("lab-water-transfer.png")
        if transferred["workflow"]["stepIndex"]!=4:raise AssertionError("Beaker water stage blocked")
        self.place("Sodium Chloride","sodium-chloride",2.14,.25)
        self.place("Spatula","spatula",1.45,-.2)
        self.place("Weighing Boat","weighing-boat",-1.37,.9)
        self.place("Stirring Rod","stirring-rod",.65,-.9)
        before=self.state()
        # Empty-boat measurement must be refused using the real mouse.
        empty=self.drag("weighing-boat",-1.28,.32)
        self.log("empty boat cannot record mass",empty["workflow"]["measurements"]["saltG"] is None and empty["workflow"]["stepIndex"]==4)
        self.drag("weighing-boat",-1.37,.9)
        scoop=self.mouth_path("spatula","sodium-chloride",1.50,.10)
        self.shot("lab-scoop.png")
        if scoop["experiment"]["saltOnSpatulaG"]!=5:
            self.log("downstream boat/balance/stirring",False,blocked_by="Real mouse scoop did not load 5 g; no state seeding used")
            return
        self.idle()
        deposited=self.drag("spatula",-.61,.90)
        self.shot("lab-boat-deposit.png")
        self.log("release loaded spatula beside boat deposits 5 g",deposited["experiment"]["saltOnBoatG"]==5,state=deposited)
        if deposited["experiment"]["saltOnBoatG"]!=5:return
        self.idle()
        weighed=self.drag("weighing-boat",-1.28,.32)
        self.idle()
        self.shot("lab-balance.png")
        self.log("loaded boat balance contact records actual 5 g",weighed["workflow"]["measurements"]["saltG"]==5 and weighed["workflow"]["stepIndex"]==5,relationship=weighed["relationships"],measurements=weighed["workflow"]["measurements"])
        if weighed["workflow"]["stepIndex"]!=5:return
        point=self.hover("weighing-boat")
        self.page.mouse.click(point["x"],point["y"])
        clicked=self.state()
        self.log("click attached boat keeps balance relationship",clicked["relationships"].get("weighing-boat",{}).get("targetId")=="digital-balance" and clicked["events"]==weighed["events"])
        point,attached=self.grab("weighing-boat")
        self.move_held(point,attached["positions"]["weighing-boat"],-1.05,.32,6)
        self.cancel("pointercancel (synthetic DOM event)")
        cancelled=self.state()
        self.page.mouse.up()
        self.log("cancel attached boat grab restores balance contact",cancelled["relationships"].get("weighing-boat",{}).get("targetId")=="digital-balance" and cancelled["experiment"]==weighed["experiment"] and cancelled["draggingId"] is None,state=cancelled)
        # The visible boat is now on the balance pan, not at its collider's bench slot.
        beside=self.drag("weighing-boat",.55,.90)
        self.idle()
        handle=self.page.evaluate(HANDLE,"weighing-boat")
        self.page.mouse.move(handle["x"],handle["y"])
        self.page.mouse.down()
        self.page.mouse.move(handle["x"],handle["y"]+80,steps=10)
        self.page.wait_for_timeout(350)
        self.page.mouse.up()
        salted=self.state()
        self.log("boat grip tilt releases measured salt into beaker",salted["experiment"]["saltInBeakerG"]==5 and salted["workflow"]["stepIndex"]==6,state=salted)
        self.shot("lab-salt-addition.png")
        if salted["workflow"]["stepIndex"]!=6:return
        self.idle()
        self.drag("stirring-rod",1.30,.08)
        self.mouth_path("stirring-rod","beaker",1.52,.15,stationary=True)
        self.mouth_path("stirring-rod","beaker",1.52,.15,shake=True)
        stirred=self.state()
        for attempt in range(4):
            if stirred["workflow"]["stepIndex"]!=6:break
            stirred=self.mouth_path("stirring-rod","beaker",1.52,.15)
            self.idle()
        self.shot("lab-stirring.png")
        if stirred["workflow"]["stepIndex"]==8:
            point=self.hover("beaker")
            self.page.mouse.click(point["x"],point["y"])
            self.page.wait_for_timeout(200)
        final=self.state()
        self.log("full mouse salt workflow completed",final["workflow"]["completed"],state=final)
        self.shot("lab-final.png")


def diagnostic(report):
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=str(CHROME),headless=True,args=ARGS)
        try:
            page=browser.new_page(viewport={"width":1440,"height":900},device_scale_factor=1)
            page.set_default_timeout(12000)
            page.set_default_navigation_timeout(25000)
            page.add_init_script("""window.__auditPointerEvents=[];window.__auditMoves=[];
              for(const type of ['pointerdown','pointerup','pointercancel','gotpointercapture','lostpointercapture'])
                window.addEventListener(type,e=>{
                  window.__auditPointer={pointerId:e.pointerId,pointerType:e.pointerType,x:e.clientX,y:e.clientY};
                  window.__auditPointerEvents.push({type,id:e.pointerId,trusted:e.isTrusted,x:e.clientX,y:e.clientY,t:performance.now()});
                },true);
              window.addEventListener('pointermove',e=>{
                              window.__auditPointer={pointerId:e.pointerId,x:e.clientX,y:e.clientY};
                              window.__auditMoves.push({x:e.clientX,y:e.clientY,t:performance.now(),trusted:e.isTrusted});
                            },true);
            """)
            audit=Audit(page,report)
            def message(msg):
                if msg.type in ("error","warning") or "[vite]" in msg.text:
                    report["browser_messages"].append({"type":msg.type,"text":msg.text,"location":msg.location,"elapsed_s":round(time.perf_counter()-audit.started,3)})
            page.on("console",message)
            page.on("pageerror",lambda error:report["page_errors"].append(str(error)))
            page.on("requestfailed",lambda request:report["failed_requests"].append({"url":request.url,"failure":request.failure}))
            page.on("websocket",lambda ws:ws.on("framereceived",lambda payload:report["websocket_frames"].append(str(payload))))
            def source_response(response):
                if "/src/" in response.url and response.status==200:
                    try:report["served_module_hashes"][response.url]=hashlib.sha256(response.body()).hexdigest()
                    except Exception:pass
            page.on("response",source_response)
            nav=time.perf_counter()
            response=page.goto(URL+ROUTE,wait_until="networkidle")
            report["timings"]["route_networkidle_s"]=round(time.perf_counter()-nav,3)
            page.locator("canvas").wait_for(timeout=20000)
            audit.wait(lambda s: s["placedIds"]==["beaker","digital-balance"],10)
            rendered_deadline=time.perf_counter()+20
            while time.perf_counter()<rendered_deadline:
                if page.evaluate("async()=>{"+FIBER+"return Boolean(scene.getObjectByName('beaker'));}"):
                    break
                page.wait_for_timeout(150)
            page.evaluate("() => new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))")
            page.wait_for_timeout(1000)
            report["timings"]["initial_settled_s"]=round(time.perf_counter()-nav,3)
            report["initial_state"]=audit.state()
            audit.shot("lab-before.png")
            audit.log("initial HTTP/layout/scientific state",response.status==200 and page.evaluate("document.documentElement.scrollHeight <= innerHeight+2") and report["initial_state"]["workflow"]["stepIndex"]==0,status=response.status)
            report["render_environment"]=page.evaluate("async()=>{"+FIBER+"""
              const ctx=gl.getContext(),ext=ctx.getExtension('WEBGL_debug_renderer_info');
              return {userAgent:navigator.userAgent,dpr:devicePixelRatio,viewport:[innerWidth,innerHeight],
              canvas:{width:gl.domElement.width,height:gl.domElement.height,cssWidth:rect.width,cssHeight:rect.height},
              renderer:ext?ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),
              vendor:ext?ctx.getParameter(ext.UNMASKED_VENDOR_WEBGL):ctx.getParameter(ctx.VENDOR)};}""")
            # These are real callback intervals, not presented as GPU/rendered FPS.
            report["raf_intervals_ms"]=page.evaluate("""() => new Promise(resolve=>{
              const samples=[];let last=null,start=null;
              function tick(t){if(start===null)start=t;if(last!==null)samples.push(t-last);last=t;
              if(t-start>=1500)resolve(samples);else requestAnimationFrame(tick)}requestAnimationFrame(tick);
            })""")
            audit.cancellations()
            audit.workflow()
        except Exception as error:
            report["diagnostic_exception"]={"message":str(error),"traceback":traceback.format_exc()}
            print(traceback.format_exc(),flush=True)
            try:audit.shot("lab-diagnostic-failure.png")
            except Exception:pass
        finally:
            try:
                report["last_state"]=audit.state()
                report["pointer_events"]=page.evaluate("window.__auditPointerEvents")
            except Exception:pass
            report["timings"]["diagnostic_total_s"]=round(time.perf_counter()-audit.started,3)
            browser.close()


def existing_worker():
    # Run the original run() function with its original assertions/gestures.
    started=time.perf_counter()
    try:
        acceptance().run()
    finally:
        print(f"Existing acceptance duration: {time.perf_counter()-started:.3f} s",flush=True)


def main():
    OUT.mkdir(exist_ok=True)
    start=time.perf_counter()
    report={"started_utc":utc(),"base_url":URL,"snapshot_start":manifest(),"checks":[],"screenshots":[],"browser_messages":[],"page_errors":[],"failed_requests":[],"websocket_frames":[],"served_module_hashes":{},"timings":{},"limits":["Without --snapshot-ref the source is live; with it, the archived revision is served from artifacts/ with watching/HMR disabled. Working-tree manifests separately identify concurrent agent changes.","Headless desktop Chrome with SwiftShader, not physical GPU or headed/OS focus acceptance.","Scientific stores are read only; all science is caused by real UI input.","pointercancel and blur are synthetic DOM probes; lost capture, outside release, mouse paths and Escape use browser input/APIs.","rAF intervals are callback scheduling measurements, not rendered FPS."]}
    server=None
    log=None
    try:
        if not CHROME.exists():raise FileNotFoundError(CHROME)
        with socket.socket() as sock:sock.bind(("127.0.0.1",5174))
        log=(OUT/"audit-vite.log").open("w",encoding="utf-8")
        if "--snapshot-ref" in sys.argv:
            revision=sys.argv[sys.argv.index("--snapshot-ref")+1]
            archive=OUT/"audit-initial-source.zip"
            subprocess.run(["git","--no-pager","archive","--format=zip","--output="+str(archive),revision,"src","public","index.html","package.json","vite.config.ts","tsconfig.json","tsconfig.app.json","tsconfig.node.json","tests/browserMouseAcceptance.py"],cwd=ROOT,check=True,timeout=15)
            snapshot=OUT/"initial-source"
            snapshot.mkdir(exist_ok=True)
            with zipfile.ZipFile(archive) as source:
                source.extractall(snapshot)
                # The initial checkout uses LF; git archive honors Windows autocrlf.
                for name in source.namelist():
                    path=snapshot/name
                    if path.is_file() and (path.suffix in ('.ts','.tsx','.css','.json','.html','.py') or path.name=='.gitkeep'):
                        path.write_bytes(path.read_bytes().replace(b'\r\n',b'\n'))
            dependency_link=snapshot/"node_modules"
            if not dependency_link.exists():
                if os.name=="nt":
                    subprocess.run(["cmd","/c","mklink","/J",str(dependency_link),str(ROOT/"node_modules")],check=True,capture_output=True,timeout=10)
                else:dependency_link.symlink_to(ROOT/"node_modules",target_is_directory=True)
            report["isolated_snapshot"]={"revision":revision,"root":str(snapshot),"hmr":False,"watch":None,
                "files":{p.relative_to(snapshot).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in (snapshot/"src").rglob('*') if p.is_file()}}
            js="import {createServer} from 'vite'; const server=await createServer({root:"+json.dumps(str(snapshot))+",server:{host:'127.0.0.1',port:5174,strictPort:true,hmr:false,watch:null}});await server.listen();server.printUrls();"
            command=["node","--input-type=module","-e",js]
        else:
            command=["node",str(ROOT/"node_modules/vite/bin/vite.js"),"--host","127.0.0.1","--port","5174","--strictPort"]
        server=subprocess.Popen(command,cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name=="nt" else 0)
        report["server"]={"pid":server.pid,"command":command}
        health=time.perf_counter()
        deadline=health+25
        while time.perf_counter()<deadline:
            if server.poll() is not None:raise RuntimeError(f"Vite exited {server.returncode}")
            try:
                with urllib.request.urlopen(URL,timeout=1) as response:
                    if response.status==200:break
            except Exception:time.sleep(.15)
        else:raise TimeoutError("Vite did not become healthy in 25 seconds")
        report["timings"]["server_health_s"]=round(time.perf_counter()-health,3)
        print(f"Vite healthy at {URL} in {report['timings']['server_health_s']} s",flush=True)
        # Baseline is deliberately captured before executing the existing acceptance.
        diagnostic(report)
        report["snapshot_before_existing"]=manifest()
        existing=time.perf_counter()
        try:
            child=subprocess.run([sys.executable,str(Path(__file__).resolve()),"--existing-worker"],cwd=ROOT,capture_output=True,text=True,timeout=110)
            report["existing_acceptance"]={"returncode":child.returncode,"stdout":child.stdout,"stderr":child.stderr}
        except subprocess.TimeoutExpired as error:
            report["existing_acceptance"]={"timeout_s":110,"stdout":str(error.stdout),"stderr":str(error.stderr)}
        report["timings"]["existing_acceptance_s"]=round(time.perf_counter()-existing,3)
        (OUT/"audit-existing-acceptance.log").write_text(json.dumps(report["existing_acceptance"],indent=2),encoding="utf-8")
        print("EXISTING ACCEPTANCE",json.dumps(report["existing_acceptance"]),flush=True)
    except Exception as error:
        report["harness_exception"]={"message":str(error),"traceback":traceback.format_exc()}
        print(traceback.format_exc(),flush=True)
    finally:
        if server is not None:
            if os.name=="nt":
                killed=subprocess.run(["taskkill","/PID",str(server.pid),"/T","/F"],capture_output=True,text=True,timeout=10)
                report["server_cleanup"]={"returncode":killed.returncode,"output":killed.stdout+killed.stderr}
            else:
                server.terminate()
            try:server.wait(timeout=8)
            except subprocess.TimeoutExpired:server.kill();server.wait(timeout=5)
        if log:log.close()
        report["snapshot_end"]=manifest()
        entry_path=OUT/"audit-entry-snapshot.json"
        entry=json.loads(entry_path.read_text())["files"] if entry_path.exists() else report["snapshot_start"]
        report["changed_since_entry"]=[path for path in sorted(set(entry)|set(report["snapshot_end"])) if entry.get(path)!=report["snapshot_end"].get(path)]
        report["changed_during_harness"]=[path for path in sorted(set(report["snapshot_start"])|set(report["snapshot_end"])) if report["snapshot_start"].get(path)!=report["snapshot_end"].get(path)]
        report["finished_utc"]=utc()
        report["timings"]["harness_total_s"]=round(time.perf_counter()-start,3)
        (OUT/"browser-baseline-report.json").write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding="utf-8")
        print("Report:",OUT/"browser-baseline-report.json",flush=True)
        print("Timings:",json.dumps(report["timings"]),flush=True)
        print("Changed source files:",report["changed_since_entry"],flush=True)
        if report.get('isolated_snapshot'):
            print('Isolated baseline revision:',report['isolated_snapshot']['revision'],flush=True)
        with socket.socket() as sock:
            try:sock.bind(("127.0.0.1",5174));print("Port 5174 released",flush=True)
            except OSError:print("WARNING: port 5174 is still occupied",flush=True)
    return 1 if report.get("harness_exception") or report.get("diagnostic_exception") or any(not item["ok"] for item in report["checks"]) or report.get("existing_acceptance",{}).get("returncode")!=0 else 0


if __name__=="__main__":
    if "--existing-worker" in sys.argv:existing_worker()
    else:sys.exit(main())
