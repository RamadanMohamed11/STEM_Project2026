"""Real browser/mouse acceptance for Smart Dual Object transfers.

Run: python tests/browserSmartTransfers.py
Focused rerun: python tests/browserSmartTransfers.py --workflow-only
(The focused mode explicitly skips, rather than claims to pass, selection tests.)
Owns only this helper and artifacts/smart-* evidence. Starts live-source Vite on
5175 with HMR/watch disabled using a temporary JS launcher outside src; always
kills its process tree. No legacy audit/tilt tests are imported or executed.
Scientific and scene stores are read ONLY through getState(). All actions use
Playwright mouse, keyboard, accessible buttons and native form controls.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import os
from pathlib import Path
import signal
import socket
import subprocess
import tempfile
import time
import traceback
import urllib.request

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts"
URL = "http://127.0.0.1:5175"
ROUTE = "/experiments/exp-salt-water-001/lab"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
ARGS = ["--enable-webgl", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"]
LABELS = {"water": "Water container", "graduated-cylinder": "Graduated cylinder",
          "beaker": "Beaker", "sodium-chloride": "Sodium chloride jar",
          "spatula": "Spatula", "weighing-boat": "Weighing boat"}

# This instrumentation observes state/rendering only. It never calls store
# actions, setState, subscribe, dispatch, or a scientific/selection engine.
INSTALL = """async () => {
 const urls=performance.getEntriesByType('resource').map(r=>r.name);
 const load=async path=>import(urls.filter(u=>u.includes(path)).at(-1)??path);
 const {useLabSceneStore:S}=await load('/src/features/simulations/state/useLabSceneStore.ts');
 const {useSaltSimulationStore:C}=await load('/src/features/simulations/state/useSaltSimulationStore.ts');
 const fiber=await load('/@react-three_fiber.js');
 const root=[...fiber._roots.values()][0];
 if(!root)throw Error('No R3F root');
 window.__smartFiber=()=>root.store.getState();
 const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true};
 window.__smartVisual=()=>{
   const {scene,camera,controls,gl}=root.store.getState(),poses={},streams=[];
   for(const id of S.getState().placedIds){
     const group=scene.getObjectByName(id),pivot=group?.children[0];
     if(pivot)poses[id]={position:pivot.position.toArray(),rotation:pivot.rotation.toArray().slice(0,3),
       world:pivot.matrixWorld.elements.slice(),root:group.matrixWorld.elements.slice()};
   }
   scene.traverse(o=>{
     if(!o.isInstancedMesh)return;
     for(let p=o;p;p=p.parent)if(p.userData?.equipmentId)return;
     // The shipped WaterJet/SaltGranules have these distinctive geometries/counts.
     const water=o.count===14&&o.geometry?.type==='SphereGeometry';
     const salt=o.count===18&&o.geometry?.type==='BoxGeometry';
     if(water||salt)streams.push({uuid:o.uuid,kind:water?'liquid':'solid',visible:visible(o),
       count:o.count,matrixVersion:o.instanceMatrix.version,matrices:Array.from(o.instanceMatrix.array.slice(0,48))});
   });
   return {poses,streams,camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),
     target:controls?.target.toArray(),enabled:controls?.enabled},
     renderFrame:gl.info.render.frame,canvas:{width:gl.domElement.width,height:gl.domElement.height}};
 };
 window.__smartRead=()=>{
   const s=S.getState(),c=C.getState();
   return {placedIds:s.placedIds,positions:s.positions,rotations:s.rotations,relationships:s.relationships,
     selectedId:s.selectedId,selectedIds:s.selectedIds,pressedId:s.pressedId,draggingId:s.draggingId,
     hoveredId:s.hoveredId,placement:s.placement,sceneFeedback:s.feedback,experiment:c.experiment,
     workflow:c.workflow,transfer:c.transfer,effect:c.effect,livePour:c.livePour,events:c.events,
     validation:c.validation,feedback:c.feedback,resetRevision:c.resetRevision};
 };
 window.__smartSamples=[];
 const started=performance.now();
 const timer=setInterval(()=>{
   if(performance.now()-started>870000){clearInterval(timer);return}
   const s=window.__smartRead();
   window.__smartSamples.push({t:performance.now(),revision:s.resetRevision,transfer:s.transfer,
     chemistry:structuredClone(s.experiment),positions:structuredClone(s.positions),visual:window.__smartVisual()});
 },80);
 window.__smartStop=()=>clearInterval(timer);
} """
FIBER = """const {scene,camera,gl,raycaster:original,pointer}=window.__smartFiber();
 const rect=gl.domElement.getBoundingClientRect();
 const screen=v=>{v.project(camera);return {x:rect.left+(v.x+1)*rect.width/2,y:rect.top+(1-v.y)*rect.height/2}};
"""
PROJECT = "(p)=>{" + FIBER + "return screen(camera.position.clone().set(p.x,p.y,p.z));}"
PLANE = "(p)=>{" + FIBER + """
 const origin=camera.position.clone();
 const v=origin.clone().set((p.x-rect.left)/rect.width*2-1,1-(p.y-rect.top)/rect.height*2,.5).unproject(camera);
 const direction=v.sub(origin).normalize();
 const hit=origin.addScaledVector(direction,(p.height-origin.y)/direction.y);
 return {x:hit.x,z:hit.z};}"""
CANDIDATES = "(id)=>{" + FIBER + """
 const group=scene.getObjectByName(id),points=[],result=[];
 if(!group)return [];
 group.traverse(o=>{
   if(!o.isMesh||!o.geometry)return;
   for(let p=o;p;p=p.parent)if(!p.visible)return;
   const material=Array.isArray(o.material)?o.material[0]:o.material;
   if(material?.transparent&&material.opacity===0)return;
   const v=camera.position.clone().set(0,0,0);
   if(o.geometry.boundingSphere)v.copy(o.geometry.boundingSphere.center);
   v.applyMatrix4(o.matrixWorld);points.push({...screen(v),mesh:o.uuid});
 });
 const ray=new original.constructor();
 for(const p of points){
   for(const [dx,dy] of [[0,0],[4,0],[-4,0],[0,4],[0,-4],[8,0],[-8,0]]){
     const x=p.x+dx,y=p.y+dy;
     if(x<rect.left+3||x>rect.right-3||y<rect.top+3||y>rect.bottom-3)continue;
     if(document.elementFromPoint(x,y)!==gl.domElement)continue;
     ray.setFromCamera(pointer.clone().set((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2),camera);
     const hit=ray.intersectObjects(scene.children,true).find(h=>{
       for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return true;
     });
     let owner=hit?.object;while(owner&&!owner.userData?.equipmentId)owner=owner.parent;
     if(owner?.userData.equipmentId===id)result.push({x,y,mesh:p.mesh,hitMesh:hit.object.uuid});
     if(result.length>=32)return result;
   }
 }return result;
}"""


def manifest():
    return {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted((ROOT / "src").rglob("*")) if p.is_file()}


def near(a, b, tolerance=1e-6):
    return abs(a - b) <= tolerance


def pose_distance(a, b):
    return max(abs(x-y) for key in ("position", "rotation") for x,y in zip(a[key], b[key]))


class SmartAudit:
    def __init__(self, page, report):
        self.page, self.report = page, report
        self.started = time.perf_counter()
        # Reserve startup/evidence/cleanup time inside the terminal's 900s bound.
        self.deadline = self.started + 840
        self.stage = "initialization"
        self.completed_first = False

    def state(self):
        if time.perf_counter() > self.deadline:
            raise TimeoutError("Smart browser audit exceeded its 840-second audit / 900-second task budget")
        return self.page.evaluate("window.__smartRead()")

    def check(self, name, ok, fatal=True, **details):
        item = {"name": name, "ok": bool(ok), "stage": self.stage,
                "elapsed_s": round(time.perf_counter()-self.started, 3), **details}
        self.report["checks"].append(item)
        if not ok or self.report.get("verbose"):
            console_details = details if self.report.get("verbose") else {k:v for k,v in details.items() if k not in ("state","panel","operation","receipts")}
            print(("PASS " if ok else "FAIL ") + name + " " + json.dumps(console_details, ensure_ascii=False), flush=True)
        if not ok and fatal:
            raise AssertionError(name + ": " + json.dumps(details, ensure_ascii=False))
        return ok

    def wait(self, predicate, timeout=10, label="condition"):
        end = min(time.perf_counter()+timeout, self.deadline)
        while True:
            state = self.state()
            if predicate(state):
                return state
            if time.perf_counter() >= end:
                raise TimeoutError(f"Timed out waiting for {label}; state={json.dumps(state)}")
            self.page.wait_for_timeout(70)

    def visual(self):
        return self.page.evaluate("window.__smartVisual()")

    def settle(self):
        self.wait(lambda s: not s["transfer"] and not s["effect"], 35, "idle operation/effect")
        previous = self.visual()["poses"]
        consecutive = 0
        end = min(time.perf_counter()+35, self.deadline)
        while time.perf_counter() < end:
            self.page.wait_for_timeout(160)
            current = self.visual()["poses"]
            state = self.state()
            expected = {k:[0,.42,0] for k in state["placedIds"]}
            if state["relationships"].get("weighing-boat",{}).get("targetId") == "digital-balance":
                boat,balance = state["positions"]["weighing-boat"],state["positions"]["digital-balance"]
                yaw = state["rotations"]["weighing-boat"]
                dx,dz = balance["x"]-boat["x"],balance["z"]-.047-boat["z"]
                expected["weighing-boat"] = [math.cos(yaw)*dx-math.sin(yaw)*dz,.628,math.sin(yaw)*dx+math.cos(yaw)*dz]
            # An unchanged pose is not necessarily settled: SwiftShader can leave
            # several observer samples between rendered frames. Require rest too.
            stable = set(current) == set(previous) == set(state["placedIds"]) and all(
                pose_distance(p, previous[k]) < .0005 and
                max(abs(x-y) for x,y in zip(p["position"],expected[k])) < .002 and
                max(abs(r) for r in p["rotation"]) < .002 and
                max(abs(x-y) for x,y in zip(p["world"],previous[k]["world"])) < .0005 and
                near(p["root"][12],state["positions"][k]["x"],.002) and
                near(p["root"][14],state["positions"][k]["z"],.002)
                for k,p in current.items())
            consecutive = consecutive+1 if stable else 0
            if consecutive >= 2:
                return
            previous = current
        raise AssertionError("Visible source/equipment poses did not settle before mouse input")

    def shot(self, name):
        path = OUT / (name + ".png")
        self.page.screenshot(path=str(path), timeout=30000)
        self.report["screenshots"][name] = {"path": path.relative_to(ROOT).as_posix(), "stage": self.stage}

    def layout(self, label):
        measurements = self.page.evaluate("""()=>{
          const panel=document.querySelector('[aria-label="Object interaction"]'),r=panel?.getBoundingClientRect();
          return {viewport:[innerWidth,innerHeight],document:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
            panel:r?{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,scrollHeight:panel.scrollHeight}:null};
        }""")
        w,h = measurements["viewport"]
        p = measurements["panel"]
        self.check(label+" no page/panel overflow", measurements["document"][0] <= w+2 and measurements["document"][1] <= h+2 and
                   (p is None or (p["x"] >= 0 and p["y"] >= 0 and p["right"] <= w+1 and p["bottom"] <= h+1)), **measurements)

    def project(self, x, z, y=.78):
        return self.page.evaluate(PROJECT, {"x": x, "y": y, "z": z})

    def hover(self, tool):
        self.settle()
        # Move away first: hoveredId alone can be stale after geometry has moved.
        self.page.mouse.move(720, 75)
        candidates = self.page.evaluate(CANDIDATES, tool)
        for point in candidates:
            self.page.mouse.move(point["x"], point["y"])
            if self.state()["hoveredId"] == tool:
                self.report["mesh_hits"].append({"stage": self.stage, "tool": tool, **point})
                return point
        raise AssertionError(f"No unobscured, actual mesh mouse hit for {tool}; projected {len(candidates)} ray-verified candidates")

    def press(self, tool):
        point = self.hover(tool)
        self.page.mouse.down()
        s = self.state()
        self.check("body press is pending, not a grab: "+tool,
                   s["pressedId"] == tool and s["draggingId"] is None,
                   pressed=s["pressedId"], dragging=s["draggingId"], point=point)
        return point, s

    def click(self, tool, modifier=None, jitter=0):
        before = self.state()
        camera = self.visual()["camera"]
        if modifier:
            self.page.keyboard.down(modifier)
        try:
            point,_ = self.press(tool)
            if jitter:
                self.page.mouse.move(point["x"]+jitter, point["y"])
            self.page.mouse.up()
        finally:
            if modifier:
                self.page.keyboard.up(modifier)
        after = self.state()
        self.check("click does not drag/move camera or equipment: "+tool,
                   after["positions"] == before["positions"] and after["draggingId"] is None and after["pressedId"] is None and
                   self.visual()["camera"]["position"] == camera["position"] and self.visual()["camera"]["quaternion"] == camera["quaternion"],
                   selected=after["selectedIds"], jitter_px=jitter, modifier=modifier)
        return after

    def clear(self):
        self.page.keyboard.press("Escape")
        self.check("Escape clears object pair", self.state()["selectedIds"] == [])

    def pair(self, source, target):
        self.settle()
        state = self.state()
        if set(state["selectedIds"]) != {source,target}:
            self.clear()
            self.click(source)
            state = self.click(target)
            self.check("sequential two-object selection", state["selectedIds"] == [source,target], selected=state["selectedIds"])
        else:
            self.check("existing UI-selected pair retained", len(state["selectedIds"]) == 2, selected=state["selectedIds"])
        panel = self.page.get_by_role("region", name="Object interaction")
        panel.wait_for(state="visible")
        return panel

    def place(self, name, tool, x, z):
        self.settle()
        toggle = self.page.get_by_role("button", name="Toggle equipment inventory")
        if toggle.get_attribute("aria-expanded") != "true":
            toggle.click()
        inventory = self.page.get_by_role("complementary", name="Lab inventory")
        inventory.get_by_role("button").filter(has_text=name).first.click()
        self.page.get_by_role("button", name="Collapse inventory").click()
        point = self.project(x,z)
        self.page.mouse.move(point["x"],point["y"])
        preview = self.wait(lambda s: s["placement"] and s["placement"]["position"], 2, "placement preview")["placement"]
        self.check("inventory preview is valid: "+tool, preview["valid"], preview=preview)
        self.page.mouse.click(point["x"],point["y"])
        state = self.wait(lambda s: tool in s["placedIds"], 3, "placed "+tool)
        self.check("inventory mouse placement: "+tool, math.hypot(state["positions"][tool]["x"]-x,state["positions"][tool]["z"]-z) < .02,
                   position=state["positions"][tool])
        self.settle()

    def move_held(self, point, initial, x, z, steps=12):
        hit = self.page.evaluate(PLANE, {**point,"height":.78})
        end = self.project(hit["x"]+x-initial["x"],hit["z"]+z-initial["z"])
        self.page.mouse.move(end["x"],end["y"],steps=steps)
        return end

    def drag(self, tool, x, z):
        before = self.state()
        camera = self.visual()["camera"]
        point,_ = self.press(tool)
        self.move_held(point,before["positions"][tool],x,z)
        held = self.state()
        self.page.mouse.up()
        after = self.state()
        self.check("real >5px drag moves only grabbed object: "+tool,
                   held["draggingId"] == tool and after["draggingId"] is None and after["pressedId"] is None and
                   after["selectedIds"] == before["selectedIds"] and
                   all(after["positions"][k] == v for k,v in before["positions"].items() if k != tool) and
                   math.hypot(after["positions"][tool]["x"]-x,after["positions"][tool]["z"]-z) < .08 and
                   self.visual()["camera"]["position"] == camera["position"],
                   requested={"x":x,"z":z}, actual=after["positions"][tool], selection=after["selectedIds"], feedback=held["sceneFeedback"])
        self.settle()
        return after

    def selection_and_cancellation(self):
        self.stage = "selection and native grab cancellation"
        self.clear()
        self.click("beaker", jitter=5)
        s = self.click("digital-balance")
        self.check("sequential pair without modifier", s["selectedIds"] == ["beaker","digital-balance"])
        s = self.click("beaker")
        self.check("click selected member deselects only it", s["selectedIds"] == ["digital-balance"])
        for modifier in ("Control", "Meta"):
            self.clear()
            self.click("beaker")
            s = self.click("digital-balance", modifier)
            self.check(modifier+" optionally selects second object", s["selectedIds"] == ["beaker","digital-balance"])
            s = self.click("digital-balance", modifier)
            self.check(modifier+" deselects second object", s["selectedIds"] == ["beaker"])
        self.clear()
        self.click("digital-balance")
        self.drag("beaker", .80, .08)
        self.drag("beaker", .55, .08)
        for kind in ("Escape", "outside release", "pointercancel (synthetic DOM probe)",
                     "lostpointercapture (native browser API)", "blur (synthetic DOM probe)"):
            before = self.state()
            point,_ = self.press("beaker")
            self.move_held(point,before["positions"]["beaker"],.80,.08,6)
            held = self.state()
            if kind == "Escape":
                self.page.keyboard.press("Escape")
            elif kind == "outside release":
                self.page.mouse.move(10,10,steps=3)
                self.page.mouse.up()
            elif kind.startswith("pointercancel"):
                self.page.evaluate("""()=>document.querySelector('canvas').dispatchEvent(new PointerEvent('pointercancel',
                  {bubbles:true,pointerId:window.__smartPointer.pointerId,pointerType:'mouse',isPrimary:true}))""")
            elif kind.startswith("lostpointercapture"):
                self.page.evaluate("()=>document.querySelector('canvas').releasePointerCapture(window.__smartPointer.pointerId)")
                self.page.mouse.move(point["x"]+12,point["y"])
            else:
                self.page.evaluate("()=>window.dispatchEvent(new Event('blur'))")
            self.page.wait_for_timeout(100)
            self.page.mouse.up()
            after = self.state()
            self.check(kind+" restores grab without scientific/selection changes",
                       held["draggingId"] == "beaker" and after["draggingId"] is None and after["pressedId"] is None and
                       before["positions"] == after["positions"] and before["experiment"] == after["experiment"] and
                       before["events"] == after["events"] and before["selectedIds"] == after["selectedIds"],
                       held=held["positions"]["beaker"], after=after["positions"]["beaker"])
            self.settle()
        self.clear()

    def setup_water(self):
        self.page.get_by_role("button",name="Confirm safety",exact=True).click()
        self.place("Graduated Cylinder","graduated-cylinder",-.52,-.45)
        self.place("Water","water",-1.23,-.45)

    def prepare_form(self, source, target, amount, unit="mL"):
        panel = self.pair(source,target)
        material = "water" if unit in ("mL","L") else "NaCl"
        direction = panel.get_by_role("button",name=f"Transfer {material} from {LABELS[source]} to {LABELS[target]}",exact=True)
        self.check("requested transfer direction is enabled", direction.is_enabled(),
                   source=source,target=target,panel=panel.inner_text())
        if direction.get_attribute("aria-pressed") != "true":
            direction.click()
        field = panel.get_by_role("spinbutton",name="Transfer amount",exact=True)
        self.check("amount input is enabled", field.is_enabled(), panel=panel.inner_text())
        units = panel.get_by_role("combobox",name="Transfer unit",exact=True)
        if units.input_value() != unit:
            units.select_option(unit)
        field.fill(str(amount))
        submit = panel.locator('button[type="submit"]')
        return panel,field,submit

    def invalid_inputs(self):
        panel,field,submit = self.prepare_form("water","graduated-cylinder",0)
        before = self.state()
        for value in ("0","-1","101","37.55"):
            field.fill(value)
            submit.click()
            self.page.wait_for_timeout(90)
            s = self.state()
            error = panel.get_by_role("alert").all_text_contents()
            self.check("invalid amount rejected without mutation: "+value,
                       s["transfer"] is None and s["experiment"] == before["experiment"] and s["events"] == before["events"] and
                       field.get_attribute("aria-invalid") == "true" and bool(error), error=error)
        self.layout("invalid form desktop")
        for width,height in ((1024,768),(390,844)):
            self.page.set_viewport_size({"width":width,"height":height})
            self.page.wait_for_timeout(200)
            self.layout(f"selected pair {width}x{height}")
        self.page.set_viewport_size({"width":1440,"height":900})
        self.settle()

    def samples_for(self, operation_id):
        return self.page.evaluate("id=>window.__smartSamples.filter(s=>s.transfer?.operationId===id)",operation_id)

    def start_transfer(self, source, target, amount, unit="mL", double=False):
        panel,field,submit = self.prepare_form(source,target,amount,unit)
        before = self.state()
        home = self.visual()
        box = submit.bounding_box()
        # Two browser mouse clicks at one button location, not JS click()/dispatch.
        self.page.mouse.click(box["x"]+box["width"]/2,box["y"]+box["height"]/2,click_count=2 if double else 1,delay=35)
        s = self.wait(lambda s: s["transfer"] is not None, 10, "UI-created transfer")
        op = s["transfer"]
        self.check("UI starts expected asynchronous operation", op["sourceId"] == source and op["targetId"] == target and
                   near(op["amount"],float(amount)*{"mL":1,"L":1000,"g":1,"mg":.001}[unit]) and
                   field.is_disabled() and panel.get_by_role("button",name="Dismiss object interaction and clear selection").is_disabled(),
                   operation_id=op["operationId"],requested=amount,unit=unit,double_click=double)
        return before,home,op

    def verify_operation(self, before, home, op, cancelled=False):
        end = self.wait(lambda s: s["transfer"] is None, 35, "safe return")
        self.settle()
        samples = self.samples_for(op["operationId"])
        self.report["operations"].append({"operation":op,"cancelled":cancelled,"sample_count":len(samples),
                                          "before":before,"after":end})
        material = op["materialId"]
        def quantity(c, tool):
            if material == "water":
                return c["waterMl"][tool]
            return c[{"sodium-chloride":"saltStockG","spatula":"saltOnSpatulaG",
                      "weighing-boat":"saltOnBoatG","beaker":"saltInBeakerG"}[tool]]
        timeline = [before["experiment"]]+[s["chemistry"] for s in samples]+[end["experiment"]]
        monotonic = all(quantity(a,op["sourceId"])+1e-7 >= quantity(b,op["sourceId"]) and
                        quantity(a,op["targetId"]) <= quantity(b,op["targetId"])+1e-7 for a,b in zip(timeline,timeline[1:]))
        receipt = [e for e in end["events"][len(before["events"]):] if e.get("operationId") == op["operationId"]]
        all_receipts = [e for e in end["events"][len(before["events"]):] if e["type"].startswith("MATERIAL_TRANSFER_")]
        self.check("one operation/receipt with monotonic quantities", monotonic and len(receipt) == 1 and len(all_receipts) == 1,
                   operation_id=op["operationId"],receipts=receipt,samples=len(samples))
        moving = op["targetId"] if op["method"] == "scoop" else op["sourceId"]
        flow = [s for s in samples if not s["transfer"]["cancelled"] and s["transfer"]["approachMs"] < s["transfer"]["elapsedMs"] < s["transfer"]["approachMs"]+s["transfer"]["flowMs"]]
        moved = any(pose_distance(s["visual"]["poses"][moving],home["poses"][moving]) > .05 for s in flow)
        tilted = any(max(abs(r) for r in s["visual"]["poses"][moving]["rotation"]) > .1 for s in flow)
        streams = [stream for s in flow for stream in s["visual"]["streams"] if stream["visible"] and stream["kind"] == op["kind"]]
        stream_motion = len({json.dumps(stream["matrices"]) for stream in streams}) >= 2
        returned = pose_distance(self.visual()["poses"][moving],home["poses"][moving]) < .003
        # Keep visual failures in failed_checks, but do not block downstream UI
        # science on a render observation (especially a short cancelled interval).
        self.check("actual moving/tilting source, animated stream and safe home return", moved and tilted and stream_motion and returned and end["positions"] == before["positions"],
                   fatal=False,operation_id=op["operationId"],moving=moving,moved=moved,tilted=tilted,visible_stream_samples=len(streams),stream_motion=stream_motion,returned=returned)
        no_flow = [s for s in samples if s["transfer"]["elapsedMs"] < s["transfer"]["approachMs"] or s["transfer"]["cancelled"] or s["transfer"]["elapsedMs"] > s["transfer"]["approachMs"]+s["transfer"]["flowMs"]+150]
        self.check("no stream outside transfer flow", not any(st["visible"] for s in no_flow for st in s["visual"]["streams"]), fatal=False,operation_id=op["operationId"])
        delivered = quantity(end["experiment"],op["targetId"])-quantity(before["experiment"],op["targetId"])
        self.check("exact requested delivery" if not cancelled else "cancel preserves a strict partial delivery",
                   0 < delivered < op["amount"] if cancelled else near(delivered,op["amount"]), delivered=delivered,requested=op["amount"])
        return end

    def transfer(self, source, target, amount, unit="mL", double=False, cancel=False, screenshot=False):
        before,home,op = self.start_transfer(source,target,amount,unit,double)
        partial = None
        if cancel or screenshot:
            self.wait(lambda s: s["transfer"] and s["transfer"]["amount"]*.25 <= s["transfer"]["transferred"] < s["transfer"]["amount"]*.8, 35, "partial flow")
            if screenshot:
                self.shot("smart-transfer")
            if cancel:
                self.page.keyboard.press("Escape")
                interrupted = self.state()
                self.check("Escape cancels partial transfer immediately", interrupted["transfer"] is not None and interrupted["transfer"]["cancelled"], operation=interrupted["transfer"])
                partial = interrupted["experiment"]
        end = self.verify_operation(before,home,op,cancel)
        if partial is not None:
            self.check("cancelled return cannot deliver extra material", end["experiment"] == partial)
        print(f"TRANSFER {source} -> {target}: {op['amount']} {op['unit']}"+(" (cancelled partial)" if cancel else "")+f"; step={end['workflow']['stepIndex']}",flush=True)
        return end

    def expect_water(self, cylinder, beaker, step):
        s = self.state()
        self.check("cumulative water and guided step", near(s["experiment"]["waterMl"]["graduated-cylinder"],cylinder) and
                   near(s["experiment"]["waterMl"]["beaker"],beaker) and s["workflow"]["stepIndex"] == step,
                   water=s["experiment"]["waterMl"],step=s["workflow"]["stepIndex"],expected_step=step)

    def workflow(self, repeat=False):
        self.stage = "repeat workflow" if repeat else "water measurement and reversible transfers"
        self.setup_water()
        if not repeat:
            self.invalid_inputs()
        self.transfer("water","graduated-cylinder",37.5,double=not repeat,screenshot=not repeat)
        self.expect_water(37.5,0,2)
        if not repeat:
            interrupted = self.transfer("water","graduated-cylinder",62.5,cancel=True)
            delivered = interrupted["experiment"]["waterMl"]["graduated-cylinder"]
            remainder = round(100-delivered,1)
            self.check("cancel leaves cumulative step incomplete", delivered < 100 and interrupted["workflow"]["stepIndex"] == 2,
                       cylinder=delivered,exact_remainder=remainder)
            self.transfer("water","graduated-cylinder",remainder)
        else:
            self.transfer("water","graduated-cylinder",62.5)
        self.expect_water(100,0,3)
        self.transfer("graduated-cylinder","beaker",75)
        self.expect_water(25,75,3)
        self.transfer("beaker","graduated-cylinder",12.5)
        self.expect_water(37.5,62.5,3)
        self.transfer("graduated-cylinder","beaker",37.5)
        self.expect_water(0,100,4)
        self.stage = "repeat solids and physical balance" if repeat else "solid units, contextual transfers and physical balance"
        self.place("Sodium Chloride","sodium-chloride",2.14,.25)
        self.place("Spatula","spatula",1.45,-.2)
        self.place("Weighing Boat","weighing-boat",-1.37,.9)
        self.place("Stirring Rod","stirring-rod",.65,-.9)
        for portion in range(2):
            s = self.transfer("sodium-chloride","spatula",2.5,"g")
            self.check("jar scoop loads exact 2.5 g", s["experiment"]["saltOnSpatulaG"] == 2.5)
            s = self.transfer("spatula","weighing-boat",2500,"mg")
            self.check("2500 mg deposit accumulates in boat", s["experiment"]["saltOnBoatG"] == 2.5*(portion+1) and s["experiment"]["saltOnSpatulaG"] == 0)
        s = self.state()
        self.check("five grams cannot bypass physical balance", s["workflow"]["stepIndex"] == 4 and s["workflow"]["measurements"]["saltG"] is None)
        self.clear()
        s = self.drag("weighing-boat",-1.28,.32)
        self.check("real boat/pan release measures 5 g", s["workflow"]["stepIndex"] == 5 and s["workflow"]["measurements"]["saltG"] == 5 and
                   s["relationships"].get("weighing-boat",{}).get("targetId") == "digital-balance", measurements=s["workflow"]["measurements"],relationships=s["relationships"])
        if not repeat:
            self.shot("smart-balance")
        self.transfer("weighing-boat","beaker",2,"g")
        self.check("partial salt does not finish addition step", self.state()["workflow"]["stepIndex"] == 5)
        s = self.transfer("weighing-boat","beaker",3,"g")
        self.check("2 g plus 3 g completes salt addition", s["experiment"]["saltInBeakerG"] == 5 and s["experiment"]["saltOnBoatG"] == 0 and s["workflow"]["stepIndex"] == 6)
        self.stage = "repeat continuous rod circles and review" if repeat else "continuous real rod circles and final review"
        self.clear()
        self.drag("spatula",1.93,-.82)
        # Route around the beaker's inflated swept-collision footprint rather
        # than cutting diagonally through its rim on the way to the near slot.
        self.drag("stirring-rod",1.30,-.65)
        self.drag("stirring-rod",1.30,.08)
        self.stir()
        self.click("beaker")
        s = self.wait(lambda s: s["workflow"]["completed"],3,"final beaker review click")
        self.check("full UI workflow completed", s["workflow"]["completed"] and s["workflow"]["measurements"] == {"waterMl":100,"saltG":5}, state=s)
        self.layout("completed workspace")
        self.shot("smart-final" if not repeat else "smart-repeat-final")
        if not repeat:
            self.completed_first = True

    def stir(self):
        point,before = self.press("stirring-rod")
        self.page.mouse.move(point["x"]+8,point["y"],steps=2)
        center = before["positions"]["beaker"]
        coords = [{"x":center["x"]+.15*math.cos(i*math.tau/24),"y":1.52,
                   "z":center["z"]+.15*math.sin(i*math.tau/24)} for i in range(24*5+1)]
        screens = self.page.evaluate("points=>{"+FIBER+"return points.map(p=>screen(camera.position.clone().set(p.x,p.y,p.z)));}",coords)
        dissolved = []
        try:
            for i,p in enumerate(screens):
                self.page.mouse.move(p["x"],p["y"])
                self.page.wait_for_timeout(35)
                if i % 8 == 0:
                    s = self.state()
                    dissolved.append(s["experiment"]["dissolvedSaltG"])
                    if s["workflow"]["stepIndex"] >= 8:
                        break
        finally:
            self.page.mouse.up()
        s = self.state()
        self.check("continuous mouse circles progressively dissolve all salt", s["experiment"]["dissolvedSaltG"] == 5 and
                   s["workflow"]["stepIndex"] == 8 and s["workflow"]["observationRecorded"] and
                   len(set(dissolved)) > 2 and all(a <= b for a,b in zip(dissolved,dissolved[1:])),
                   dissolved_samples=dissolved,step=s["workflow"]["stepIndex"],state=s)
        self.settle()

    def reset(self):
        self.page.get_by_role("button",name="Restart experiment",exact=True).click()
        s = self.wait(lambda s: s["workflow"]["stepIndex"] == 0 and s["transfer"] is None,3,"reset")
        self.settle()
        self.check("Reset clears session, quantities, pair, pending press and drag",
                   s["placedIds"] == ["beaker","digital-balance"] and not s["selectedIds"] and not s["pressedId"] and not s["draggingId"] and
                   s["experiment"]["waterMl"] == {"water":400,"graduated-cylinder":0,"beaker":0} and
                   s["experiment"]["saltStockG"] == 100 and s["experiment"]["saltInBeakerG"] == 0 and not s["workflow"]["completed"], state=s)
        return s

    def reset_mid_operation(self):
        self.stage = "Reset during partial operation"
        self.reset()
        self.setup_water()
        before,_,op = self.start_transfer("water","graduated-cylinder",62.5)
        self.wait(lambda s: s["transfer"] and 0 < s["transfer"]["transferred"] < 45,35,"partial flow before reset")
        reset = self.reset()
        self.page.wait_for_timeout(1600)
        after = self.state()
        self.check("stale operation cannot resume after Reset", reset["experiment"] == after["experiment"] and
                   reset["events"] == after["events"] and reset["resetRevision"] > before["resetRevision"] and
                   after["transfer"] is None and not any(s["visible"] for s in self.visual()["streams"]), operation_id=op["operationId"])
        self.shot("smart-reset")

    def case(self, name, function):
        self.stage = name
        check_start = len(self.report["checks"])
        print("RUN CASE "+name,flush=True)
        try:
            function()
            failed = [c for c in self.report["checks"][check_start:] if not c["ok"]]
            self.report["cases"].append({"name":name,"status":"failed" if failed else "passed",
                                         "nonblocking_failures":failed})
            print(("FAIL CASE " if failed else "PASS CASE ")+name+f"; assertions={len(self.report['checks'])-check_start}, failures={len(failed)}",flush=True)
            # True means the UI path ran to completion, not that every check passed.
            return True
        except Exception as error:
            failure = {"name":name,"stage":self.stage,"message":str(error),"traceback":traceback.format_exc()}
            try:
                self.page.mouse.up()
                failure["state"] = self.state()
                failure["visual"] = self.visual()
                failure["panel"] = self.page.get_by_role("region",name="Object interaction").all_text_contents()
                self.shot("smart-failure-"+str(len(self.report["failures"])+1))
            except Exception as evidence_error:
                failure["evidence_error"] = str(evidence_error)
            self.report["failures"].append(failure)
            self.report["cases"].append({"name":name,"status":"failed","stage":self.stage})
            print("FAIL CASE",name,str(error).split("; state=",1)[0].splitlines()[0],flush=True)
            return False

    def check_observations(self):
        self.page.evaluate("window.__smartStop()")
        samples = self.page.evaluate("window.__smartSamples")
        (OUT/"smart-observations.json").write_text(json.dumps(samples,indent=2),encoding="utf-8")
        bad = []
        for i,s in enumerate(samples):
            c = s["chemistry"]
            w = c["waterMl"]
            total_salt = sum(c[k] for k in ("saltStockG","saltOnSpatulaG","saltOnBoatG","saltInBeakerG"))
            if not (near(sum(w.values()),400) and all(0 <= w[k] <= cap for k,cap in (("water",500),("graduated-cylinder",100),("beaker",250))) and
                    near(total_salt,100) and 0 <= c["saltOnSpatulaG"] <= 5 and 0 <= c["saltOnBoatG"] <= 5 and
                    0 <= c["dissolvedSaltG"] <= c["saltInBeakerG"] <= 5):
                bad.append({"index":i,"sample":s})
        self.stage = "cross-run observations"
        self.check("all observed quantities conserve 400 mL water and 100 g salt within capacities", bool(samples) and not bad,
                   fatal=False,samples=len(samples),violations=bad)
        passive = [m for m in self.report["browser_messages"] if "passive" in m["text"].lower() or "preventdefault" in m["text"].lower()]
        errors = [m for m in self.report["browser_messages"] if m["type"] == "error"]
        self.check("browser has no passive-event errors", not passive,fatal=False,messages=passive)
        self.check("browser has no console/page errors", not errors and not self.report["page_errors"],fatal=False,console=errors,page_errors=self.report["page_errors"])


def browser_run(report, workflow_only=False):
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=str(CHROME),headless=True,args=ARGS)
        try:
            page = browser.new_page(viewport={"width":1440,"height":900},device_scale_factor=1)
            page.set_default_timeout(35000)
            page.set_default_navigation_timeout(30000)
            page.add_init_script("""window.__smartPointerEvents=[];
              for(const type of ['pointerdown','pointerup','pointercancel','gotpointercapture','lostpointercapture'])
                window.addEventListener(type,e=>{
                  window.__smartPointer={pointerId:e.pointerId,x:e.clientX,y:e.clientY};
                  window.__smartPointerEvents.push({type,id:e.pointerId,x:e.clientX,y:e.clientY,trusted:e.isTrusted,t:performance.now()});
                },true);""")
            page.on("console",lambda m: report["browser_messages"].append({"type":m.type,"text":m.text,"location":m.location}) if m.type in ("warning","error") else None)
            page.on("pageerror",lambda error: report["page_errors"].append(str(error)))
            page.on("requestfailed",lambda request: report["failed_requests"].append({"url":request.url,"failure":request.failure}))
            def response_hash(response):
                if "/src/" in response.url and response.status == 200:
                    try:
                        report["served_module_hashes"][response.url] = hashlib.sha256(response.body()).hexdigest()
                    except Exception:
                        pass
            page.on("response",response_hash)
            response = page.goto(URL+ROUTE,wait_until="networkidle")
            page.locator("canvas").wait_for(timeout=20000)
            page.wait_for_timeout(1200)
            page.evaluate(INSTALL)
            audit = SmartAudit(page,report)
            audit.settle()
            audit.check("live lab HTTP 200", response.status == 200,status=response.status)
            report["render_environment"] = page.evaluate("""()=>{
              const {gl}=window.__smartFiber(),ctx=gl.getContext(),ext=ctx.getExtension('WEBGL_debug_renderer_info');
              return {userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,
                renderer:ext?ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER)};
            }""")
            audit.shot("smart-initial")
            audit.layout("initial workspace")
            if workflow_only:
                report["cases"].append({"name":"selection, click/grab distinction and pointer cancellation","status":"skipped","reason":"Explicit --workflow-only; prior run evidence is not reclassified as this run passing"})
            else:
                audit.case("selection, click/grab distinction and pointer cancellation",audit.selection_and_cancellation)
            workflow_started = time.perf_counter()
            passed = audit.case("full decimal UI workflow",audit.workflow)
            workflow_seconds = time.perf_counter()-workflow_started
            reset_passed = audit.case("reset mid-operation with stale tick protection",audit.reset_mid_operation)
            remaining = audit.deadline-time.perf_counter()
            repeat_reserve = workflow_seconds*1.1+40
            if passed and reset_passed and remaining >= repeat_reserve:
                audit.case("repeat complete workflow after Reset",lambda: audit.workflow(repeat=True))
            elif passed and reset_passed:
                reason = f"Budget: {remaining:.1f}s left, {repeat_reserve:.1f}s reserved from measured first-workflow duration; first workflow ran completely"
                report["cases"].append({"name":"repeat complete workflow after Reset","status":"skipped","reason":reason})
                print("SKIP CASE repeat complete workflow after Reset; "+reason,flush=True)
            else:
                report["cases"].append({"name":"repeat complete workflow after Reset","status":"blocked","reason":"Earlier UI workflow/reset failed; no state seeding or repeated failing attempts"})
            # Required names always exist; the report records the actual stage if blocked.
            for name in ("smart-transfer","smart-balance","smart-final"):
                if name not in report["screenshots"]:
                    audit.shot(name)
                    report["screenshots"][name]["requested_stage_blocked"] = True
            audit.check_observations()
            report["last_state"] = audit.state()
            report["pointer_events"] = page.evaluate("window.__smartPointerEvents")
        finally:
            browser.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workflow-only",action="store_true",help="Skip selection/cancellation suite on a focused workflow rerun")
    parser.add_argument("--verbose",action="store_true",help="Print every assertion and its full details; JSON always keeps them")
    options = parser.parse_args()
    OUT.mkdir(exist_ok=True)
    started = time.perf_counter()
    report = {"started_utc":dt.datetime.now(dt.timezone.utc).isoformat(),"base_url":URL,
              "mode":"workflow-only" if options.workflow_only else "full","verbose":options.verbose,
              "bounds":{"task_seconds":900,"audit_seconds":840,"operation_wait_seconds":35,"pose_settle_seconds":35},
              "prior_run_evidence":[p.relative_to(ROOT).as_posix() for p in
                                    (OUT/"smart-before-physics-authority-rerun.zip",OUT/"smart-before-stable-rerun.zip",OUT/"smart-launch-attempt1.json",OUT/"smart-selection-run.json",OUT/"smart-workflow-attempt1.json") if p.exists()],
              "checks":[],"cases":[],"failures":[],"screenshots":{},"operations":[],"mesh_hits":[],
              "browser_messages":[],"page_errors":[],"failed_requests":[],"served_module_hashes":{},
              "source_start":manifest(),"limits":[
                  "Live working-tree source, not an archived build. HMR false and watch null; source hashes expose concurrent changes.",
                  "Headless desktop Chrome / SwiftShader software rendering. No physical-GPU FPS claim.",
                  "Only getState reads of scientific/scene stores. Selection, placement, transfer, stirring and Reset use real browser UI input.",
                  "pointercancel and blur are explicitly synthetic DOM probes, not OS events; lost capture uses native browser API.",
                  "80 ms read-only samples are observations, not proof of every intermediate GPU frame. Screenshots are evidence, not automated visual-quality approval."]}
    server = log = launcher = None
    try:
        if not CHROME.exists():
            raise FileNotFoundError(CHROME)
        with socket.socket() as sock:
            sock.bind(("127.0.0.1",5175))
        # Outside src/project; createRequire resolves the project's installed Vite.
        js = ("import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';const require=createRequire("+json.dumps((ROOT/"package.json").as_uri())+");"
              "const {createServer}=await import(pathToFileURL(require.resolve('vite')).href);const server=await createServer({root:"+json.dumps(str(ROOT))+
              ",server:{host:'127.0.0.1',port:5175,strictPort:true,hmr:false,watch:null}});await server.listen();server.printUrls();")
        with tempfile.NamedTemporaryFile(mode="w",suffix=".mjs",prefix="smart-vite-",encoding="utf-8",delete=False) as temp:
            temp.write(js)
            launcher = Path(temp.name)
        log = (OUT/"smart-vite.log").open("w",encoding="utf-8")
        command = ["node",str(launcher)]
        server = subprocess.Popen(command,cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,
                                  creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0,
                                  start_new_session=os.name != "nt")
        report["server"] = {"pid":server.pid,"command":command,"hmr":False,"watch":None}
        deadline = time.perf_counter()+25
        while time.perf_counter() < deadline:
            if server.poll() is not None:
                raise RuntimeError(f"Vite exited {server.returncode}; see artifacts/smart-vite.log")
            try:
                with urllib.request.urlopen(URL,timeout=1) as response:
                    if response.status == 200:
                        break
            except Exception:
                time.sleep(.15)
        else:
            raise TimeoutError("Vite not healthy in 25 seconds")
        print("Live no-HMR/watch Vite ready: "+URL,flush=True)
        browser_run(report,options.workflow_only)
    except Exception as error:
        report["failures"].append({"name":"harness","message":str(error),"traceback":traceback.format_exc()})
        print(traceback.format_exc(),flush=True)
    finally:
        if server is not None:
            try:
                if os.name == "nt":
                    killed = subprocess.run(["taskkill","/PID",str(server.pid),"/T","/F"],capture_output=True,text=True,timeout=10)
                    report["server_cleanup"] = {"returncode":killed.returncode,"output":killed.stdout+killed.stderr}
                else:
                    os.killpg(server.pid,signal.SIGTERM)
                server.wait(timeout=8)
            except Exception as error:
                report["cleanup_error"] = str(error)
                server.kill()
                server.wait(timeout=5)
        if log:
            log.close()
        if launcher:
            launcher.unlink(missing_ok=True)
        report["helper_sha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
        report["source_end"] = manifest()
        report["source_changed_during_run"] = [p for p in sorted(set(report["source_start"])|set(report["source_end"]))
                                               if report["source_start"].get(p) != report["source_end"].get(p)]
        with socket.socket() as sock:
            try:
                sock.bind(("127.0.0.1",5175))
                report["port_released"] = True
            except OSError:
                report["port_released"] = False
        report["failed_checks"] = [c for c in report["checks"] if not c["ok"]]
        report["status"] = ("failed" if report["failures"] or report["failed_checks"] or not report["port_released"]
                            else "passed_with_skips" if any(c["status"] == "skipped" for c in report["cases"]) else "passed")
        report["elapsed_s"] = round(time.perf_counter()-started,3)
        report["finished_utc"] = dt.datetime.now(dt.timezone.utc).isoformat()
        (OUT/"smart-summary.json").write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding="utf-8")
        lines = ["# Smart transfer real-browser acceptance", "", "Status: **"+report["status"]+"**", "",
                 "Run: `python tests/browserSmartTransfers.py"+(" --workflow-only" if options.workflow_only else "")+"`", "", "## Cases"]
        lines += ["- "+case["name"]+": **"+case["status"]+"**" for case in report["cases"]]
        lines += ["", "## Failures"]+["- "+f["name"]+": "+f["message"] for f in report["failures"]]
        lines += ["", "Full assertions, failures, states, source hashes and browser errors: `smart-summary.json`.",
                  "Read-only timeline and actual rendered pose/stream observations: `smart-observations.json`.",
                  "", "## Limits"]+["- "+s for s in report["limits"]]
        (OUT/"smart-report.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
        print("Smart acceptance "+report["status"]+f" in {report['elapsed_s']}s; port released={report['port_released']}",flush=True)
        print("Report: artifacts/smart-summary.json",flush=True)
    return 0 if report["status"] in ("passed","passed_with_skips") else 1


if __name__ == "__main__":
    raise SystemExit(main())
