# Engineering portfolio: curiosity in motion

The portfolio is a story about how Rapeepat's curiosity developed into persistence, collaboration and useful engineering. Formula 1 remains a visual influence and personal interest, not the narrative structure.

Desktop narrative and visual direction are being finalized first. Mobile-specific polish is deliberately deferred until the desktop story is approved.

## Opening: bedroom desk → notebook (2026-09-26)

A Three.js opening begins in near-empty blue space with one word, “curiosity,” then reveals a slightly messy bedroom study desk at night and moves into the notebook. Warm lamplight, cool monitor light, an opened device, tools, books, notes, a bed edge, curtains and shelves make the room feel lived in. A small F1 model sits on a shelf as one personal interest. Scene source: `src/pitwall3d.js`; layout contract: `src/bedroom-layout.mjs`; story-state source: `src/opening-sequence.mjs`; build with `npm run build`. The CSS bedroom illustration remains as the WebGL fallback.

**Redrawn 2026-09-26 (Claude Code) at real-world scale** (metres; floor y = 0, back wall z = -0.46): 1.7 m desk, 27" monitor, laptop, 44 cm keyboard. Rounded geometry, a RoomEnvironment for faint reflections, a warm lamp spotlight (on a stack of books) pooling over the teardown, moonlight entering only through a real window opening in the wall, and spotlights for screen spill (area lights were dropped: their lookup tables cost ~250 KB). Story props, each placed for a caption: opened device + lid + screws + screwdriver ("look closer"), System View screen whose nodes light up in sequence ("parts become one working system"), breadboard whose LED switches on ("build one myself"), notebook with #RS3 sticker whose first page uses the site's own navy grid and "P.01 ABOUT ME" tag so the landing dissolves straight into p.01. Room cues: moonlit city window, circuit-study poster, bed corner, pushed-back chair, shelf with books, a medal and a small F1 model. The opening word "curiosity," is poster scale (clamp 64–200px).

**Prelude (added 2026-09-26):** the first 36% of the opening's scroll (`PRELUDE` in `src/opening-sequence.mjs`) plays four questions before the word: "why?", "how does it work?", "what's inside?", "what if I change this?". Each arrives alone in the centre, then steps aside and dims when the next arrives, so they pile up; then all of them pull into the centre, blurring out, as "CURIOSITY," settles from 118% to full size. Every line types itself letter by letter (time-based, human rhythm) once its scroll step lands, with a yellow cursor on the newest line: questions stay lowercase and quiet, the payoff word is typed in capitals, slower, and keeps its comma (the captions that follow finish the sentence) with the cursor blinking after it. Letters are laid out in advance and only revealed, so centred lines never shift; scrolling back un-types. The scene is 420vh so the desk story keeps its original scroll distance. Beats below are *story* progress, i.e. `storyProgress(raw)`, which also drives the 3D camera.

| Beat (scene progress) | What happens |
|---|---|
| 0–.12 | Blank deep-blue space holds “curiosity,” with only a quiet scroll cue. |
| .12–.50 | The blank layer recedes and the bedroom desk emerges. The text continues: looking closer, understanding connected parts, and wanting to build. |
| .18–.42 | Camera leans into the lamp-lit teardown. |
| .42–.64 | Camera turns to the System View screen as its parts connect; the breadboard LED lights. |
| .64–.79 | Camera approaches the engineering notebook. |
| .78–.92 | The physical notebook cover opens around its spine. |
| .96–1 | The notebook page fills the view and dissolves into page 01. |

Then p.01 introduces Rapeepat. Every chapter keeps a notebook page number. The opening exists only in Story mode; Read-as-page starts at p.01. Three.js renders on scroll/resize rather than continuously, stops offscreen and in hidden tabs, and caps device pixel ratio at 1.75. Reduced motion uses Read-as-page.

| Session | Answers | What plays as you scroll |
|---|---|---|
| CURIOSITY · Opening + p.01 | Who is this? | A quiet question becomes his bedroom desk and notebook, then the personal introduction. |
| ORIGIN | Where did it start? | Take things apart → meet the computer → write the code. |
| GROWTH | How do they respond to difficulty? | A big "Thailand Cyber Top Talent" header and one line on what a CTF is, then TCTT P62 becomes P8; one more scroll lays a notebook note over the scoreboard listing what he did on the team. |
| STARTUP | Can a teenager run a business? | DoCode on its own page: "18, and already getting paid." Earnings count up to ฿10,000 from paying clients and get stamped PAID (tick, coin, stamp sounds). |
| PURPOSE | Why build? | First page: "Building something people need.", the WordFlow name, what it is and who it is for (1 in 14 Thai children, from the NSC report), the island map, and "How one spell works" in three steps (images cropped from the NSC report's game screenshots: wf-islands, wf-build, wf-cast). Then WordFlow drawn as a circuit that fills the screen. One scroll per turn: the car stops at T1 Game app, T2 Speech model, T3 Backend API, T4 Database, T5 Dashboard, then the finish (funded at NSC 28); at each stop the map dims and a large image card with that part pops up beside the turn. |
| TEAM | How do they work with others? | Project cards: ZeiTop, SubTrack, Gimme ur Place (HamsterHub GameJamX, online, no award: stamped Shipped in 3 days) and RoV Cup 2026 (S.A.A.T provincial qualifier, senior staff and head referee, ~20 teams; stamped Flawless). Facts come from the user's portfolio text and messages only; hovering a card, or its "What is it?" button, turns the text side to a short "in short" description. The chapter length, holds and counter follow the number of cards. |
| PROOF | What supports the story? | The podium is the only picture; +54 and the workbench are plain type under one hairline, no boxes inside boxes. |
| FUTURE | Where does this lead, and how do I reach him? | Connected systems, what he does for fun, and the contact card. |

## HUD and energy (each has a job)

- Header (rebuilt 2026-09-27, "notebook tabs"): the seven chapter names as plain text tabs. Passed chapters bright, the current one white with a yellow underline that fills through it, upcoming ones dim; clicking jumps. A 2px yellow line along the header bottom shows progress through the whole site. During the opening the header is transparent with only the name and the view switch ("Page view" / "Story view"); the full header fades in on p.01.
- “Chapter complete” toast provides progress feedback.
- Speed lines react to how fast the visitor scrolls.
- Less text: one big line per beat; longer explanations sit in "Telemetry" dropdowns.

## Colour scheme: blueprint, option B (2026-09-26)

Dark blueprint blue (#0f2b47) with a fine 24px and a major 120px white grid.
Headings pure white (#ffffff), body soft white (#e6eef4), labels muted blueprint grey (#a7bdcd).
Accent is signal yellow (#ffd24a, F1 timing-graphics style): links, session-tag chips, ticker progress, telemetry toggles, focus ring, highlighter stroke, selection.
Line sketches are white like real blueprint drawings. Dark data screens (circuit, timing rows) keep ice blue (#9ad7f2) so data reads differently from the story.
Warm colours are reserved: red for #RS3 and stamps, purple for the qualifying personal best, gold for P1.
Polaroid photos stay white paper with dark captions. The earlier cream text was dropped because warm cream clashed with the cool blue.

## WordFlow circuit (2026-09-27)

Stops live in `wfStops` (scene progress 0, .16 … .96) and double as the stepper's beats for #race (440vh). Each turn's stop point is the nearest track point to its drawn marker. Cards sit on the side away from their turn (T1, T2 and Finish on the right; T3–T5 on the left) and scale up from the edge facing the turn. Images (user-supplied 2026-09-27, fitted to 16:10 by padding in their own background or cropping to the relevant panel, never cutting content; built by scratchpad imgtool/wf.cjs): wf-game.jpg (four game screens), wf-speech.jpg (the sound-confusion analysis, showing the IPA model's output), wf-backend.jpg (architecture diagram), wf-database.jpg (Firestore collections), wf-dashboard.jpg (doctor portal progress), wordflow-game.jpg (NSC presentation). Card images open full size on click. Read-as-page shows the static map followed by all six cards in a grid.

## Fewer scrolls, chapters that build themselves (2026-09-27)

- The notebook opens in one move: "this is where the questions led." now sits before the cover starts opening (story .74), and the next stop ("I'm the one who kept asking.", story .92) has it fully open. The breadboard LED lights with "to build one myself".
- Origin, Growth and Proof are one scroll each (150vh). Arriving builds the chapter time-based (`arrivals` in index.html) and leaving resets it: Origin plays 01 → 02 → 03 with the timeline drawing and each sketch drawing itself; Growth shows the 2025 row, then an F1-style timing tower whose rows roll past as the team row climbs P62 → P8 with the big number (the other rows are anonymous bars), then "▲ +54", the 2026 row and the note; Proof raises P1, P2, P3, their awards, the +54 and the workbench.
- WordFlow arrives straight at T1 (6 stops). The finish is a near full-screen photo (fixed, up to 1180 px wide) with the chequered-flag kicker and description over the photo; the heading and map fade behind it, and it fades with the chapter so it never lingers.
- Team: the white flash between projects is gone (motion blur only).
- Stops overall: 32 → 24.

## Hover, only where it informs (2026-09-27)

Nothing essential is hover-only (touch readers lose nothing). Taped photos straighten (an individual `rotate` cancels their tilt), lift and show a "click to enlarge" tag, so the lightbox is discoverable; chapters that animate photos in keep their entrance delays with 0s delays for the hover transitions. In the Proof workbench, hovering a tool lights every tool from the same project, dims the rest and shows e.g. "WordFlow · 6 of 12 tools" beside the heading.

## Contact card (2026-09-27)

The interactive F1 car was removed from the last page (it did not answer a reader question there; F1 stays as one line in the interests list). The last page's right column is an F1 broadcast-style **team radio** panel in light blue (#9ad7f2, like the other dark data screens; user request): #RS3 number block, TEAM RADIO label, name, and a pulsing red "channel open" light; a yellow scrolling voice meter driven by a speech envelope (each word becomes syllable bursts, with gaps between words and longer pauses at punctuation, plus jitter) while the message transmits word by word the first time the panel is on screen; each word lights up as its sound starts; the channels as CH 1 Email (clicking the address copies it; a hint reads "click to copy" then "copied ✓"), CH 2 GitHub, CH 3 Instagram, then Base. Reduced motion shows the message at once with a still snapshot of its voice shape. The whole page fits one screen with the footer.

## University-agnostic (user request, 2026-09-26)

No university or programme is named anywhere (no KMITL, no IoT Engineering), so the same site works for every application. Driver card uses "Focus: Networks · security · connected systems"; the last session is "Bigger systems. Same curiosity."

## Driver identity

- Driver tag **#RS3** (user's choice) remains a small personal signature on the driver card, the WordFlow data-path marker, notebook cover and footer. It no longer structures the main navigation or opening story.
- IGN **4rtem1sss** = the user's GitHub name. It is set into the portrait itself (`dist/img/portrait-ign.jpg`): the studio backdrop was extended upward, the name set in yellow Bahnschrift behind him with three fading outline echoes, and the background-removed figure composited on top so his hair overlaps the word. Built by `scratchpad imgtool/ign.cjs` (sharp + @imgly/background-removal-node). It is no longer a row in the info list; GitHub stays in the contact panel alongside Email and Instagram (@thun._r3).
- Header brand reads "Rapeepat S." (user request). As of 2026-09-26 the profile has 0 public repositories.

## Photos

Photo slots load from `dist/img/*.jpg` and show a labelled placeholder until the file exists. Do NOT use images from the application PDF (too blurry; user will supply originals). Click any photo to open it full size (native `<dialog>`). Slots: portrait-ign, tctt, wordflow-game, wordflow-dashboard, zeitop, subtrack, docode.

## One scroll, one move (2026-09-26, user request)

In Story mode each wheel gesture, swipe, Arrow/Page key or Space glides once (650–1300 ms, cubic ease-in-out, longer for longer distances) to the next resting point, replacing the earlier native free scrolling. Resting points are where a beat has fully arrived: each prelude question, "curiosity,", each held caption, the top of p.01, each Origin step, Growth's 2025 row / photo / count to P8 / note, each turn of the WordFlow circuit, each Team project, Proof's podium and workbench, then viewport-sized steps through Future to the page end (`stepper` in `dist/index.html`; `window.portfolioStops()` lists them). Wheel events during a glide are swallowed, and a new move needs a 220 ms pause or a much harder flick, so trackpad momentum cannot skip beats. Scrollbar drags, ticker links and Home/End still work; Read-as-page and reduced motion keep native scrolling. **Opening flow (latest, 2026-09-27):** the questions autoplay to "CURIOSITY," (first visit / logo); the reader scrolls once; the desk captions then autoplay (short holds, 0.76 s glides) and stop on "this is where the questions led." with the notebook whole and closed (notebookOpen now .80–.92). Scrolling forward there only nudges; the notebook is a button (`.pw-open`, positioned from the 3D projection of the notebook) with a pulsing outline and a small "click to open" tag, and the cover lifts slightly on hover. Clicking opens it in a slow 1.7 s move to "I'm the one who kept asking."; the rest is scrolled by hand. **WordFlow finish:** two chequered flags swoosh in over the card, wave, and whip away (1.5 s, rippling cloth), then the trophy moment: a double gold frame sweeps around the card, the card glows gold, a trophy badge drops in, and confetti and a shine play. TCTT is labelled as the national qualifier. **Opening autoplay (revised 2026-09-27):** it now stops on "CURIOSITY," and the desk is scrolled by hand; "scroll to explore" returns under the word and leaves on the first scroll. The notebook-opening scroll glides slower (1.7 s). At the WordFlow finish a victory plays each time it lands: confetti bursts from the photo's bottom corners (site colours plus chequered black and white), a chequered flag waves in the corner and a shine sweeps the photo. Earlier notes: on the first visit in a session (sessionStorage `openingPlayed`), starting at the top in Story mode, the whole opening plays by itself: the four questions, "CURIOSITY,", then the desk captions with ~1 s camera glides, each held just long enough to finish typing and be read (snappy by request), and it stops once it lands on p.01 (about 22–25 s); any wheel, key, touch or click stops it at once and acts as the reader's own move. Nothing after the opening ever auto-advances. Clicking the header logo (Story mode) jumps to the very top, wipes the typed lines and replays the whole opening. **Bridge to p.01:** after "this is where the questions led." the line "I'm the one who kept asking." resolves on the notebook page word by word out of a blur, a yellow highlighter then swipes under "kept asking." (sound: a riser under the words, a kick per word building like a heartbeat, a deep boom with a bright open chord on the last word, then a marker swipe), fades, and the page then dissolves in place into the profile: in Story mode #driver is pulled up 100vh under the opening's final screen (the opening sits above it with pointer-events off), so p.01 never slides up as a new page. Once the page has dissolved, p.01 **builds itself** (time-based, ~1 s): the taped photo drops in, then the P.01 tag, "Rapeepat", "Sawek.", the #RS3 stamp, the one-liner and the three detail rows (`data-in` with `--d` delays; `#driver.in`). It clears when the reader is back in the opening, so it builds again next time.

## Scroll smoothing (2026-09-26, Claude Code)

User asked for scrolling to feel better; chose "smooth animations only, keep native scrolling" (no Lenis/page glide, no scroll snapping, no wheel interception).

- `dist/index.html` `tick()`: each scene keeps a *displayed* progress that approaches the real scroll progress with exponential damping, `alpha = 1 - exp(-dt / 0.07)` (70 ms time constant, frame-rate independent, dt clamped to 50 ms). The loop keeps requesting frames only while a scene is still settling (error > .001), then goes idle.
- Jumps larger than .25 of a scene (nav clicks, scrollbar drags) cut straight to the target instead of playing through. Resize, returning to a hidden tab, and mode switches snap to the true position.
- The opening's smoothed value is dispatched as `window` CustomEvent `portfolio:opening-frame` `{ progress }`. `src/pitwall3d.js` paints exactly that value in the same frame, so the 3D camera, bedroom reveal, captions and notebook remain synchronized.
- Navigation/ticker state still uses raw scroll geometry.

The shorter opening, shared damped timeline, continuous Hermite camera path, caption retiming and speed-line cap are implemented. Tests cover path bounds, continuity, reversibility and opening-state ordering.

## Mechanics & accessibility

The scroll engine uses `data-fx` with `data-at`/`data-out` windows plus the WordFlow data-path animation, project montage and result blocks. Read-as-page and reduced-motion modes show content statically. The final interactive 3D car loads only near the last chapter.

No "chapter complete" toast (user request, 2026-09-27): the header tab's progress line already shows where the reader is. A chapter tab can span two scenes with `data-through` (Purpose: #wf-intro through #race).
