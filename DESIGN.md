# Engineering portfolio: curiosity in motion

The portfolio is a story about how Rapeepat's curiosity developed into persistence, collaboration and useful engineering. Formula 1 remains a visual influence and personal interest, not the narrative structure.

Desktop narrative and visual direction are being finalized first. Mobile-specific polish is deliberately deferred until the desktop story is approved.

## Opening: bedroom desk → notebook (2026-09-26)

A Three.js opening begins in near-empty blue space with one word, “curiosity,” then reveals a slightly messy bedroom study desk at night and moves into the notebook. Warm lamplight, cool monitor light, an opened device, tools, books, notes, a bed edge, curtains and shelves make the room feel lived in. A small F1 model sits on a shelf as one personal interest. Scene source: `src/pitwall3d.js`; layout contract: `src/bedroom-layout.mjs`; story-state source: `src/opening-sequence.mjs`; build with `npm run build`. The CSS bedroom illustration remains as the WebGL fallback.

| Beat (scene progress) | What happens |
|---|---|
| 0–.12 | Blank deep-blue space holds “curiosity,” with only a quiet scroll cue. |
| .12–.50 | The blank layer recedes and the bedroom desk emerges. The text continues: looking closer, understanding connected parts, and wanting to build. |
| .18–.64 | Camera explores monitors labelled Questions, System View and Build Log, then turns across the desk. |
| .64–.79 | Camera approaches the engineering notebook. |
| .78–.92 | The physical notebook cover opens around its spine. |
| .96–1 | The notebook page fills the view and dissolves into page 01. |

Then p.01 introduces Rapeepat. Every chapter keeps a notebook page number. The opening exists only in Story mode; Read-as-page starts at p.01. Three.js renders on scroll/resize rather than continuously, stops offscreen and in hidden tabs, and caps device pixel ratio at 1.75. Reduced motion uses Read-as-page.

| Session | Answers | What plays as you scroll |
|---|---|---|
| CURIOSITY · Opening + p.01 | Who is this? | A quiet question becomes his bedroom desk and notebook, then the personal introduction. |
| ORIGIN | Where did it start? | Take things apart → meet the computer → write the code. |
| GROWTH | How do they respond to difficulty? | TCTT P62 becomes P8 through reflection, preparation and teamwork. |
| PURPOSE | Why build? | WordFlow makes system accuracy matter to children, doctors and the team building it. |
| TEAM | How do they work with others? | ZeiTop, SubTrack and DoCode show the role Rapeepat took in different teams. |
| PROOF | What supports the story? | Results and tools provide concise evidence without interrupting the narrative. |
| FUTURE | Where does this lead? | Connected systems, networks, security, contact, and the optional interactive F1 study. |

## HUD and energy (each has a job)

- Chapter ticker uses Curiosity, Origin, Growth, Purpose, Team, Proof and Future. Seven segments fill as the reader moves; direct links remain available.
- “Chapter complete” toast provides progress feedback.
- Speed lines react to how fast the visitor scrolls.
- Less text: one big line per beat; longer explanations sit in "Telemetry" dropdowns.

## Colour scheme: blueprint, option B (2026-09-26)

Dark blueprint blue (#0f2b47) with a fine 24px and a major 120px white grid.
Headings pure white (#ffffff), body soft white (#e6eef4), labels muted blueprint grey (#a7bdcd).
Accent is signal yellow (#ffd24a, F1 timing-graphics style): links, session-tag chips, ticker progress, telemetry toggles, focus ring, highlighter stroke, selection.
Line sketches are white like real blueprint drawings. Dark data screens (circuit, timing rows, car panel) keep ice blue (#9ad7f2) so data reads differently from the story.
Warm colours are reserved: red for #RS3 and stamps, purple for the qualifying personal best, gold for P1.
Polaroid photos stay white paper with dark captions. The earlier cream text was dropped because warm cream clashed with the cool blue.

## University-agnostic (user request, 2026-09-26)

No university or programme is named anywhere (no KMITL, no IoT Engineering), so the same site works for every application. Driver card uses "Focus: Networks · security · connected systems"; the last session is "Bigger systems. Same curiosity."

## Driver identity

- Driver tag **#RS3** (user's choice) remains a small personal signature on the driver card, the WordFlow data-path marker, notebook cover and footer. It no longer structures the main navigation or opening story.
- IGN **4rtem1sss** = the user's GitHub name: listed on the driver card and linked (github.com/4rtem1sss), plus GitHub in the team-radio contact panel alongside Email and Instagram (@thun._r3). As of 2026-09-26 the profile has 0 public repositories.

## Photos

Photo slots load from `dist/img/*.jpg` and show a labelled placeholder until the file exists. Do NOT use images from the application PDF (too blurry; user will supply originals). Slots: portrait, tctt, wordflow-game, wordflow-dashboard, zeitop, subtrack, docode.

## Scroll smoothing (2026-09-26, Claude Code)

User asked for scrolling to feel better; chose "smooth animations only, keep native scrolling" (no Lenis/page glide, no scroll snapping, no wheel interception).

- `dist/index.html` `tick()`: each scene keeps a *displayed* progress that approaches the real scroll progress with exponential damping, `alpha = 1 - exp(-dt / 0.07)` (70 ms time constant, frame-rate independent, dt clamped to 50 ms). The loop keeps requesting frames only while a scene is still settling (error > .001), then goes idle.
- Jumps larger than .25 of a scene (nav clicks, scrollbar drags) cut straight to the target instead of playing through. Resize, returning to a hidden tab, and mode switches snap to the true position.
- The opening's smoothed value is dispatched as `window` CustomEvent `portfolio:opening-frame` `{ progress }`. `src/pitwall3d.js` paints exactly that value in the same frame, so the 3D camera, bedroom reveal, captions and notebook remain synchronized.
- Navigation/ticker state still uses raw scroll geometry.

The shorter opening, shared damped timeline, continuous Hermite camera path, caption retiming and speed-line cap are implemented. Tests cover path bounds, continuity, reversibility and opening-state ordering.

## Mechanics & accessibility

The scroll engine uses `data-fx` with `data-at`/`data-out` windows plus the WordFlow data-path animation, project montage and result blocks. Read-as-page and reduced-motion modes show content statically. The final interactive 3D car loads only near the last chapter.
