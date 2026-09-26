# Smoother Race Scroll Implementation Plan

> **For Qwen3.5:** Implement task-by-task using superpowers:executing-plans if available. This is the next concrete implementation brief. Do not wait for the older monitor-placement question: this change concerns motion and scrolling, not desk composition. Do not launch additional agents or publish automatically.

**Goal:** Make the existing race-weekend experience feel responsive, fluid and less tiring to scroll, beginning with the opening pit-wall scene.

**Architecture:** Retain native document scrolling. Smooth animation progress through one shared, frame-rate-independent presentation timeline; use that same opening progress for the Three.js camera, lights, cars, cover and DOM captions. Shorten the opening and vary its pace without introducing automatic playback or changing the chosen viewpoint.

**Tech stack:** Existing HTML/CSS/JavaScript, Three.js 0.170.0, esbuild 0.24.0. No new motion or scroll dependency is necessary.

**Spec:** The user's request, “make the scrolling animation smoother … too tiring … make it dynamic”, plus existing `DESIGN.md`. This brief supersedes the earlier requirement for an absolutely immediate stop only to allow a brief settling response. Scroll still determines where the story goes.

## Scope and constraints

- Project root: `C:/Users/rapee/Documents/Codex/2026-09-25/i-want-u-to-create-a-2/outputs/portfolio`.
- Main changes: `dist/index.html` and `src/pitwall3d.js`; generated bundle rebuilt with `npm run build`.
- Update `DESIGN.md` after implementation; put verification findings in `docs/superpowers/plans/2026-09-26-smoother-race-scroll-verification.md`.
- The HTML inside `dist` is currently canonical and edited directly. Never hand-edit minified JavaScript.
- Preserve the seated pit-wall viewpoint, monitor/desk arrangement, palette and portfolio content.
- No wheel interception, `preventDefault` on scrolling, scroll snapping, virtual page scrolling or autoplay. Do not multiply wheel deltas.
- Keep read-as-page and reduced-motion usable. A decorative sequence must never trap navigation or hide content.
- The separate final-session car in `src/car3d.js` remains out of scope.
- Implementation values below are starting targets to tune by visual verification. Report any changes and their reason.

## Evidence from current source

1. Opening height is `480vh`, giving `380vh` of pinned playback after subtracting the viewport.
2. Initial camera position and target are identical at p=0 and p=.39. That holds the camera completely still over roughly 148vh of scrolling.
3. Each subsequent camera segment uses an independent smoothstep, bringing velocity to zero at every waypoint.
4. `render()` in `src/pitwall3d.js` reads raw section position and renders only when requested by scroll or resize. It does not interpolate between coarse wheel inputs.
5. The HTML controller independently reads raw progress for captions and effects. Smoothing only the camera would desynchronize the opening.
6. Global speed lines can reach .9 opacity and disappear using a fixed timer, amplifying visual activity without reducing scrolling effort.

These facts explain likely contributors; no frame-time measurements or new user tests have been performed for this plan.

## Review focus

| Input / condition | Expected behavior | Owned by |
| --- | --- | --- |
| Coarse mouse-wheel notches, slow touchpad input | Fluid updates with a short response, no long trailing drift | Task 2 |
| Fast reversal, large fling, scrollbar drag, navigation jump | Immediate direction response; do not play through skipped sections | Task 2 |
| Narrow screen and resize during animation | Stable framing and progress; no clipping or camera jump | Tasks 1 and 3 |
| Reduced motion, page-mode switch, hidden-tab resume | Static reading works; cancel pending motion and resume at actual position | Task 2 |
| Missing WebGL / context loss | Visible fallback with captions following the same progress | Tasks 2 and 4 |

## Task 1: shorten the opening and replace dead scrolling with a clearer rhythm

**Files:** `dist/index.html` (opening height and `data-cap` ranges), `src/pitwall3d.js` (timing thresholds, camera stops), `DESIGN.md`.

- [ ] Record baseline screenshots at the opening, lights-out, monitor turn and notebook approach. Reuse the local preview at `http://127.0.0.1:8765/`.
- [ ] Change only the opening height from `480vh` to `300vh` for desktop. This reduces pinned playback from 380vh to 200vh, about 47% less scroll distance.
- [ ] Use `280svh` on narrow screens where supported, with a `280vh` fallback. Confirm the actual scene-height rule and override its custom property with sufficient specificity; do not add an ineffective class below an inline variable.
- [ ] Adopt this opening rhythm consistently across HTML and Three.js:

| Progress | Action |
| --- | --- |
| 0–.05 | Establish the seat, foreground monitors and race start. |
| .05–.23 | Five lights illuminate at .05, .09, .13, .17 and .21. |
| .25 | Lights out; cars launch. |
| .25–.37 | Fast visual race beat. Keep the race visible before turning away. |
| .32–.56 | Continuous head turn toward telemetry, with a gentle lead-in. |
| .56–.77 | Look down and approach the notebook; decelerate near it. |
| .77–.90 | Open the cover and give the notebook a readable moment. |
| .90–1 | Move into the page and hand off to the driver section. |

- [ ] Retune captions to these beats: opening 0–.09, lights .10–.23, telemetry .38–.56, quieter moment .60–.73, notebook .79–.92. Use short fades around these windows; do not leave invisible text over the next focal point.
- [ ] Replace the old launch threshold in the car-position formula, speed readout and CSS fallback racing class. Calibrate car displacement to make a pass visible in .25–.37; moving only the threshold will change how far the cars travel.
- [ ] Ensure the cover-opening and final-fade thresholds match the table. Keep all of them deterministic functions of progress so reverse scrolling works.
- [ ] Visually verify the new raw pacing before adding smoothing. The shorter distance must still allow the first screen, race launch and notebook to register.

**Acceptance:** roughly half the former opening scroll effort; no long initial dead region; complete sequence remains reachable on wheel, touchpad, keyboard and touch. Do not shorten all other scenes in this task.

## Task 2: one shared presentation timeline, with brief damping

**Files:** `dist/index.html` (`tick`, `request`, `sceneProgress`, mode and visibility handling), `src/pitwall3d.js` (`render`, event scheduling).

**Interface:** HTML owns `portfolio:opening-frame`, a CustomEvent on `window` with detail `{ progress: number, active: boolean, film: boolean, reducedMotion: boolean, snap: boolean }`. Three.js consumes it and renders that progress instead of maintaining an independent smoothed clock. Dispatch during an active opening frame or when opening visibility/mode changes, not continuously after it leaves view.

- [ ] Separate target progress derived from layout from displayed progress used to paint effects. Keep native scrollY untouched. Use a Map keyed by scene if smoothing other existing scroll effects in the same central frame loop.
- [ ] Use exponential damping with a time constant around 70ms. The mathematical update is:

```js
const alpha = 1 - Math.exp(-dtSeconds / 0.07);
displayed += (target - displayed) * alpha;
```

This is frame-rate independent. Do not use a fixed per-frame interpolation coefficient. Clamp dt to at most .05 seconds during normal stepping and explicitly synchronize after a hidden tab resumes.

- [ ] Keep requesting animation frames only while visible effects differ from targets. Settle exactly to target below .001 progress error; cap the settling tail at 180ms after the last input. A new input cancels that cap and starts the next brief settling interval.
- [ ] Snap to actual progress at initialization, mode changes, resize, document-hidden/resume, entering a different scene, and targets reaching 0 or 1. Snap on within-scene jumps above .25 progress to avoid a delayed cinematic when a visitor drags the scrollbar or uses a navigation link.
- [ ] On scroll reversal, cancel the previous directional momentum. The exponential approach should immediately head toward the new target; do not introduce spring overshoot, bounce or accumulated velocity.
- [ ] Pass displayed progress to `pw.update()` and dispatch that exact same value to Three.js. The gantry, car launch, telemetry, cover, captions and letterbox must cross thresholds together.
- [ ] Refactor Three.js to expose an internal `renderAt(progress)` called by the shared event handler. Keep local resize invalidation and one initial synchronization from current DOM geometry so deferred script loading cannot miss the initial event. Reuse the last received progress for a resize paint; the main controller will then send a newly synchronized value.
- [ ] Remove duplicate Three.js scroll listeners and root-class render scheduling where the new event now handles them. Retain visibility/context safeguards and avoid two loops drawing the same frame.
- [ ] Use raw scroll position for navigation location and page geometry; use displayed progress for visible story effects. At section exit, finalize the previous scene at its endpoint so damping cannot leave it partially faded.
- [ ] On read-as-page or reduced motion, cancel settling frames and apply the existing static content state. If the user explicitly enables race mode while reduced motion is active, keep the illustrated/static fallback visible; do not mark an undrawn WebGL canvas as ready.
- [ ] Pause completely in a hidden tab. On return, resync to actual scroll position rather than integrating the elapsed wall time.

**Acceptance:** coarse wheel input no longer jumps directly between camera poses; the response begins on the next frame, settles within 180ms, does not lag behind navigation jumps, and does not desynchronize the DOM and WebGL layers. An idle page does not keep requesting frames solely for smoothing.

## Task 3: make the camera move continuously through the turn

**Files:** `src/pitwall3d.js` (`stops`, camera interpolation and portrait offset).

- [ ] Preserve the existing spatial camera stops and desk layout as the baseline. Replace the long duplicated initial stop with a very small trackward glance beginning around .05; keep it subtle enough to remain a person looking from a chair.
- [ ] Replace independent zero-velocity smoothsteps between the monitor-turn waypoints with a continuous bounded path across .32–.77. Use piecewise cubic Hermite interpolation for camera position and look target, with shared tangents at intermediate knots. Derive each tangent from neighboring positions divided by their progress span; cap tangent magnitudes to avoid overshoot. Ease only the entry and final approach, not every intermediate waypoint.
- [ ] Preallocate vectors. Avoid creating new `Vector3` instances for every render. Existing Three.js math utilities are enough; no additional dependency.
- [ ] Inspect the sampled path at intervals no wider than .025 progress, especially near screens and the tabletop. If any curve crosses geometry, reduce that knot's tangent or insert a clearance waypoint; do not hide the collision with blur.
- [ ] Preserve a deliberate slowdown at the notebook. The cover must clear the camera before the final approach.
- [ ] Apply mobile framing as a continuous weight based on aspect ratio rather than a hard jump at exactly 700px width. Blend the existing portrait offset out before the notebook close-up. Test at 390px portrait, 768px and normal desktop size.
- [ ] Keep the camera up vector stable; no roll, shake or oscillation. “Dynamic” here means a fast race moment followed by a controlled turn and readable notebook arrival.

**Acceptance:** the camera flows through the monitor turn without a full pause at each stop, clears all objects, preserves the selected viewpoint and reverses cleanly.

## Task 4: remove distracting motion and verify the full interaction

**Files:** `dist/index.html` (speed lines and optional last-caption spacing), documentation verification file.

- [ ] Cap speed-line opacity at approximately .12 during fast scrolling, and hide it during the notebook close-up. Prefer smoothly decaying its value through the central loop over abrupt timer resets. Ensure it does not force an endless frame loop.
- [ ] Keep existing text content. Check that shortened timing does not leave the scroll hint and title overlapping or captions covering the notebook.
- [ ] Build from the project root with `& 'C:/Program Files/nodejs/npm.cmd' run build`; expect exit 0. Keep the local `build.cjs` resolver used for restricted Windows directories.
- [ ] Verify slowly scrolling, coarse wheel input, rapid scrolling forward, reverse direction mid-turn, dragging the scrollbar, and navigating to START and RACE. A skipped scene should not animate belatedly.
- [ ] Verify page-mode switching, reduced-motion startup and changes, hidden-tab return, narrow-screen resize, and the WebGL fallback. Check readiness is applied only after a successful render; context loss must make the fallback visible immediately.
- [ ] Inspect browser warnings/errors. Use a brief performance recording if the scene still feels choppy; record actual frame times and identify whether scripting or GPU drawing dominates before lowering visual quality.
- [ ] Confirm the later story sections still receive their scroll effects and the final 3D car still loads. Do not redesign them during this pass.
- [ ] Record the implemented scene heights, damping constant, timing changes, screenshots and actually completed checks in the verification file. Clearly list checks not performed. Update DESIGN.md to match.
- [ ] Restore the default viewport and leave the preview at the opening for user review.

## Definition of done

The opening requires materially less scrolling, coarse input produces smooth but responsive movement, the camera has varied pacing without repeated stops, all opening effects share one timeline, and native navigation remains predictable. The user can then judge the feel before we decide whether later sections also need shorter scroll distances.

## Copyable execution prompt

Implement `docs/superpowers/plans/2026-09-26-smoother-race-scroll.md` in the existing portfolio. The user has requested smoother, less tiring, more dynamic scrolling. Keep native scrolling and the established seated pit-wall composition. Follow the tasks in order, verify the shared DOM/WebGL timing and accessibility cases, and report evidence. The older monitor-layout question does not block this motion task. Do not change personal content, redesign other scenes, or publish automatically.
