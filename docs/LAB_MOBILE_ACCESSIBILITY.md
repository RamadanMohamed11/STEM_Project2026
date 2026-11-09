# L12 — Mobile, accessibility and rendering pass

9 November 2026. Status: implementation prepared; browser acceptance and measured mobile FPS remain blocked. Do not mark L12 complete until the pending checks below pass.

## Changes

- `AccessibleBenchControls` adds native keyboard controls for selecting two placed instances, moving by 0.15 m, attaching to compatible holders, camera orbit/zoom, timed salt stirring, and final solution inspection. The existing inventory Add to Bench buttons, transfer panels, burner controls, instrument panels, rotate/remove/undo toolbar and data log remain the action implementations.
- Keyboard placement uses the same collision/temperature checks, snapshot history and snap rules as pointer placement. Holder offsets are shared, including clamp arms. Weighing still requires real loaded mass on the balance. Stirring passes bounded, real elapsed time through the existing scientific command/workflow validation; it stops on hiding, blur, Escape, closing its panel, selection changes or unmount. No completion flag or scientific quantity is fabricated.
- Native checkboxes preserve multi-selection. Bench descriptions distinguish instance IDs and announce item/selection changes in a polite live region even while the controls panel is closed. The 3D workspace references that description. Closing the panel returns focus to its summary.
- One-finger equipment dragging reuses existing pointer capture. A second touch cancels the active grab safely before camera interaction; non-primary touches cannot start a new equipment grab. OrbitControls explicitly maps two touches to dolly/rotate. Actual multi-touch behavior is pending physical/browser validation.
- Lab-scoped controls have 44px minimum targets. The bench toolbar can scroll horizontally on small screens rather than expanding the document width. Existing responsive inventory and reduced-motion behavior remain.
- `usePageVisibility` suspends both laboratory and molecular-view Canvas frame loops while hidden; laboratory physics receives the matching paused flag. Existing quantity/transfer controllers keep their visibility cleanup. Resuming does not restart the experiment.
- `ScenePerformance` is development-only and reports actual R3F frames over two-second windows, draw calls and effective DPR. Hidden intervals are excluded. Existing adaptive DPR and instanced particle geometry are retained; no unmeasured geometry/LOD rewrite was added.

## Verification and pending acceptance

Automated evidence is recorded in `docs/TEST_RESULTS.md` and ignored `artifacts/l12-*` logs. Tests cover validated movement and undo, rejected missing/incompatible holders, no empty-mass measurement, instance-aware descriptions, visibility subscription cleanup, and a non-pointer salt flow through real transfers, loaded weighing, timed mixing and final inspection. These are model/DOM-render checks, not proof of native keyboard or touch usability.

Computer Use failed before opening a browser with `failed to write kernel assets: The system cannot find the path specified (os error 3)`. Resetting the runtime and retrying after the owner's acknowledgement did not restore it. No browser screenshots, mobile FPS samples or fabricated measurements were produced for L12.

Pending checks after restoring the browser tool:

1. Start `npm run dev`. Review salt lab at desktop and 375px: controls, overflow, toolbar scrolling, inventory, transfer panel, measurement log and molecular view.
2. Complete salt practice using only Tab, Space, Enter and the new controls. Check close/Escape focus restoration; ensure transfer/stirring stops on hiding/blur/leave and restart resets real progress.
3. Validate one-finger tool placement/dragging and two-finger orbit/pinch on an actual touch device, including adding a second finger during a grab or tilt. Test long-press and cancellation; no accidental chemical operation should be committed.
4. Verify draw/physics suspension in a hidden tab and correct resume without quantity jumps. Check the molecular canvas too.
5. On a real mobile browser, read the development FPS output after 10 seconds of warm-up. Record device/OS/browser, viewport, DPR, placed-item count, scene actions and at least three separate samples (idle, movement, pouring/effects). Record desktop 375px emulation separately; it is not a physical-phone performance measurement. Do not claim a 45/60 FPS target without those samples.
6. Perform an actual screen-reader and touch-target pass. No complete WCAG compliance claim is made.

No backend, authentication, curriculum or scientific engine definition is changed. The pre-existing untracked `.claude/` directory is outside this task. No push or deployment is authorized by this task.
