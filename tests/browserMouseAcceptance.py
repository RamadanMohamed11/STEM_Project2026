"""Optional *real browser* mouse acceptance, no new npm dependencies.

Run from the project root after `npm.cmd run dev -- --host 127.0.0.1`:
    python tests/browserMouseAcceptance.py

Requires the separately installed Python Playwright package and desktop Chrome.
Only mouse pointer events are used to manipulate equipment. Direct store imports
read snapshots for assertions; they never mutate the stores.
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("STEM_TEST_URL", "http://127.0.0.1:5173")
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
OUTPUT = Path(__file__).resolve().parent.parent / "taskf-browser-acceptance.png"

SCENE = """async () => {
  // Vite HMR can assign '?t=...' module identities; import the exact URL
  // actually loaded by the application to avoid reading a duplicate store.
  const resources=performance.getEntriesByType('resource').map(item=>item.name);
  const scenePath='/src/features/simulations/state/useLabSceneStore.ts';
  const sciencePath='/src/features/simulations/state/useSaltSimulationStore.ts';
  const sceneURL=resources.find(url=>url.includes(scenePath)) ?? scenePath;
  const scienceURL=resources.find(url=>url.includes(sciencePath)) ?? sciencePath;
  const {useLabSceneStore}=await import(sceneURL);
  const scene=useLabSceneStore.getState();
  const {useSaltSimulationStore}=await import(scienceURL);
  const science=useSaltSimulationStore.getState();
  return {
    placedIds: scene.placedIds, positions:scene.positions, hoveredId:scene.hoveredId, tiltHandleHoveredId:scene.tiltHandleHoveredId,
    selectedId:scene.selectedId, draggingId:scene.draggingId,
    placement:scene.placement, feedback:scene.feedback,
    step: science.workflow.stepIndex, waterMl:science.experiment.waterMl,
    events:science.events.length,
  };
}"""

PROJECT_WORLD = """async ({x, y, z}) => {
  const fiber = await import('/node_modules/.vite/deps/@react-three_fiber.js');
  const root = [...fiber._roots.values()][0];
  const {scene,camera,gl} = root.store.getState();
  const v=scene.position.clone().set(x,y,z);
  v.project(camera);
  const r=gl.domElement.getBoundingClientRect();
  return {x:r.left+(v.x+1)*r.width/2, y:r.top+(1-v.y)*r.height/2};
}"""

PROJECT_HANDLE = """async (name) => {
  const fiber = await import('/node_modules/.vite/deps/@react-three_fiber.js');
  const root = [...fiber._roots.values()][0];
  const {scene,camera,gl} = root.store.getState();
  scene.updateMatrixWorld(true);
  const handle=scene.getObjectByName(name+'-tilt-handle');
  if (!handle) return null;
  const v=handle.position.clone();
  handle.getWorldPosition(v);
  v.project(camera);
  const r=gl.domElement.getBoundingClientRect();
  return {x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2};
}"""

READ_CAMERA = """async () => {
  const fiber=await import('/node_modules/.vite/deps/@react-three_fiber.js');
  const root=[...fiber._roots.values()][0];
  return root.store.getState().camera.position.toArray();
}"""


def assert_true(condition: bool, why: str) -> None:
    if not condition:
        raise AssertionError(why)


def hover_tool(page, name: str, points: list[tuple[int, int]]):
    for x, y in points:
        page.mouse.move(x, y)
        page.wait_for_timeout(85)
        if page.evaluate(SCENE)["hoveredId"] == name:
            return x, y
    raise AssertionError(f"Unable to hover {name} using tested mouse coordinates: {points}")


def place_inventory_tool(page, name: str, tool_id: str, x: float, z: float) -> None:
    page.get_by_role("button", name="Toggle equipment inventory").click()
    inventory=page.get_by_role("complementary", name="Lab inventory")
    matching=inventory.get_by_role("button").filter(has_text=name)
    assert_true(matching.count() >= 1, f"Missing inventory equipment: {name}")
    matching.first.click()
    assert_true(page.evaluate(SCENE)["placement"]["id"] == tool_id, f"Placement did not start for {tool_id}")
    page.get_by_role("button", name="Collapse inventory").click()
    location=page.evaluate(PROJECT_WORLD, {"x":x,"y":0.78,"z":z})
    page.mouse.move(location["x"],location["y"])
    page.wait_for_timeout(150)
    preview=page.evaluate(SCENE)["placement"]
    assert_true(preview is not None and preview["valid"], f"Invalid computed placement for {tool_id}: {preview}")
    page.mouse.click(location["x"],location["y"])
    page.wait_for_timeout(140)
    after=page.evaluate(SCENE)
    assert_true(tool_id in after["placedIds"] and after["placement"] is None, f"Mouse click did not place {tool_id}")


def run() -> None:
    assert_true(CHROME.exists(), f"Desktop Chrome not found: {CHROME}")
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=str(CHROME),
            headless=True,
            args=["--enable-webgl", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
        )
        try:
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            console_errors = []
            page.on("pageerror", lambda error: console_errors.append(str(error)))
            response = page.goto(BASE_URL + "/experiments/exp-salt-water-001/lab", wait_until="networkidle")
            assert_true(response is not None and response.status == 200, "Lab HTTP route is not 200")
            page.locator("canvas").wait_for(timeout=20000)
            page.wait_for_timeout(1800)

            before = page.evaluate(SCENE)
            assert_true(before["step"] == 0, "Lab did not initialize at validated step zero")
            assert_true(before["waterMl"]["beaker"] == 0, "Lab beaker must initialize empty")
            assert_true(before["placedIds"] == ["beaker", "digital-balance"], "Unexpected initial placed equipment")
            assert_true(page.evaluate("document.documentElement.scrollHeight <= innerHeight + 2"), "Workspace scrolls vertically")
            print("PASS: initial scene, quantities and no page scrolling")

            # User mouse hovers and drags a real 3D beaker mesh, not a DOM button.
            points = [(x, y) for x in (786, 770, 795, 805, 750, 820) for y in (410, 430, 390, 448)]
            bx, by = hover_tool(page, "beaker", points)
            assert_true(page.locator("canvas").evaluate("el => getComputedStyle(el).cursor") in ("grab", "pointer"), "3D hover does not advertise grab cursor")
            initial_position = page.evaluate(SCENE)["positions"]["beaker"]
            camera_before_grab=page.evaluate(READ_CAMERA)
            page.mouse.move(bx, by)
            page.mouse.down(button="left")
            page.mouse.move(bx + 75, by + 5, steps=14)
            while_held = page.evaluate(SCENE)
            assert_true(while_held["draggingId"] == "beaker", "Left mouse hold did not start a beaker drag")
            page.mouse.up(button="left")
            after = page.evaluate(SCENE)
            assert_true(after["draggingId"] is None, "Beaker mouse release left drag mode active")
            changed = after["positions"]["beaker"] != initial_position
            assert_true(changed, f"Beaker did not reposition under real mouse drag: {initial_position} -> {after['positions']['beaker']}")
            camera_after_grab=page.evaluate(READ_CAMERA)
            assert_true(max(abs(a-b) for a,b in zip(camera_before_grab,camera_after_grab)) < .01, "Camera moved while grabbing the beaker")
            print(f"PASS: real mouse hover, grab, move, release and cursor ({initial_position} -> {after['positions']['beaker']})")

            # The safety control is legitimate: later scientific actions are physical.
            page.get_by_role("button", name="Confirm safety").click()
            page.wait_for_timeout(100)
            assert_true(page.evaluate(SCENE)["step"] >= 1, "Safety acknowledgement did not validate")

            place_inventory_tool(page, "Graduated Cylinder", "graduated-cylinder", -.52, -.45)
            place_inventory_tool(page, "Water", "water", -1.23, -.45)
            print("PASS: inventory->canvas translucent placement previews and left-mouse confirmation")

            # A user-requested Hint is informational only, including event evidence.
            pre_hint = page.evaluate(SCENE)
            page.get_by_role("button", name="Show contextual hint").click()
            post_hint = page.evaluate(SCENE)
            for key in ("waterMl", "step", "events"):
                assert_true(post_hint[key] == pre_hint[key], f"Hint mutated scientific state: {key}")
            print("PASS: Hint does not dispatch science or advance workflow")

            # Actual left-mouse 3D manipulation handle, not an external Pour button:
            # hold it down for deterministic tick-driven water transfer.
            before_pour = page.evaluate(SCENE)
            assert_true(before_pour["step"] == 2, f"Expected the cylinder-measurement step, got {before_pour['step']}")
            handle=page.evaluate(PROJECT_HANDLE, "water")
            assert_true(handle is not None, "3D water TILT handle is missing")
            page.mouse.move(handle["x"],handle["y"])
            page.wait_for_timeout(90)
            cursor=page.locator("canvas").evaluate("el => getComputedStyle(el).cursor")
            grip_hover=page.evaluate(SCENE)["tiltHandleHoveredId"]
            assert_true(cursor == "ns-resize", f"Tilt grip hover cursor is {cursor}, grip hover={grip_hover}, coordinates={handle}")
            page.mouse.down(button="left")
            page.mouse.move(handle["x"],handle["y"]+80,steps=10)
            page.wait_for_timeout(1800)
            while_pouring=page.evaluate(SCENE)
            assert_true(while_pouring["draggingId"] == "water", "Tilt handle did not engage left-button drag")
            assert_true(
                while_pouring["waterMl"]["graduated-cylinder"] > 0,
                f"Left-drag TILT handle failed to transfer real water: {while_pouring['waterMl']}",
            )
            assert_true(
                while_pouring["waterMl"]["water"] + while_pouring["waterMl"]["graduated-cylinder"] + while_pouring["waterMl"]["beaker"] == 400,
                "Holding a real mouse tilt violated water-volume conservation",
            )
            page.mouse.up(button="left")
            released=page.evaluate(SCENE)
            assert_true(released["draggingId"] is None, "Releasing handle did not end active tilt")
            print(f"PASS: held left-mouse 3D TILT handle transferred {while_pouring['waterMl']['graduated-cylinder']} mL; source+receivers conserve 400 mL")

            # Resume a *partial* physical pour to exactly 100 mL; partial water
            # cannot validate the step before the accepted completed-transfer event.
            assert_true(released["step"] == 2, "Partial 92mL pour incorrectly validated the water step")
            handle=page.evaluate(PROJECT_HANDLE,"water")
            page.mouse.move(handle["x"],handle["y"])
            page.mouse.down(button="left")
            page.mouse.move(handle["x"],handle["y"]+80,steps=9)
            page.wait_for_timeout(750)
            page.mouse.up(button="left")
            measured=page.evaluate(SCENE)
            assert_true(measured["waterMl"]["graduated-cylinder"] == 100, f"Repeated mouse pour did not reach exact 100mL: {measured['waterMl']}")
            assert_true(measured["step"] == 3, "Real measured 100mL did not auto-advance to cylinder-to-beaker transfer")
            print("PASS: releasing and repeating a partial pour validates exactly 100 mL automatically")

            # Move the actual cylinder body close to the beaker and use its own
            # grip with the mouse, without synthetic buttons or store dispatches.
            start=page.evaluate(PROJECT_WORLD,{"x":-.52,"y":1.42,"z":-.45})
            end=page.evaluate(PROJECT_WORLD,{"x":.30,"y":1.42,"z":-.45})
            hover_tool(page,"graduated-cylinder",[(round(start["x"]+dx),round(start["y"]+dy)) for dx in (0,-9,8) for dy in (0,-17,14)])
            page.mouse.move(start["x"],start["y"])
            page.mouse.down(button="left")
            page.mouse.move(end["x"],end["y"],steps=15)
            page.mouse.up(button="left")
            moved=page.evaluate(SCENE)
            assert_true(moved["draggingId"] is None, "Cylinder release remained in drag mode")
            assert_true(moved["positions"]["graduated-cylinder"]["x"] > -0.15, f"Cylinder move did not reach beaker zone: {moved['positions']['graduated-cylinder']}")
            print(f"PASS: real left-mouse cylinder-body drag near beaker: {moved['positions']['graduated-cylinder']}")

            cylinder_grip=page.evaluate(PROJECT_HANDLE,"graduated-cylinder")
            page.mouse.move(cylinder_grip["x"],cylinder_grip["y"])
            page.mouse.down(button="left")
            page.mouse.move(cylinder_grip["x"],cylinder_grip["y"]+80,steps=10)
            page.wait_for_timeout(2800)
            second_pour=page.evaluate(SCENE)
            page.mouse.up(button="left")
            assert_true(second_pour["waterMl"]["beaker"] == 100, f"Cylinder TILT did not transfer 100mL: {second_pour['waterMl']}")
            assert_true(second_pour["waterMl"]["graduated-cylinder"] == 0, "Cylinder was not emptied by mouse transfer")
            assert_true(second_pour["step"] == 4, "Beaker transfer did not advance to solid measurement step")
            print("PASS: cylinder-to-beaker 100mL physical mouse transfer, conservation and automatic step validation")

            page.get_by_role("button",name="Restart experiment").click()
            fresh=page.evaluate(SCENE)
            assert_true(fresh["step"] == 0 and fresh["events"] == 0, "Mouse experiment reset left workflow evidence")
            assert_true(fresh["waterMl"] == {"water":400,"graduated-cylinder":0,"beaker":0}, "Reset failed to restore original water state")
            assert_true(fresh["placedIds"] == ["beaker","digital-balance"], "Reset failed to restore default equipment")
            print("PASS: complete experiment restart clears equipment, verified events, and transferred water")

            page.screenshot(path=str(OUTPUT), full_page=False)
            assert_true(not console_errors, f"Browser threw application errors: {console_errors}")
            print(f"PASS: browser console has no page errors; screenshot {OUTPUT}")
        except Exception:
            try:
                page.screenshot(path=str(OUTPUT), full_page=False)
                print(f"Failure screenshot: {OUTPUT}")
            except Exception:
                pass
            raise
        finally:
            browser.close()


if __name__ == "__main__":
    started = time.perf_counter()
    try:
        run()
    finally:
        print(f"Browser interaction run: {time.perf_counter() - started:.1f} s")
