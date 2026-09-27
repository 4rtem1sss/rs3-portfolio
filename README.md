# RS3 · Curiosity in motion

The personal portfolio of Rapeepat Sawek (#RS3, 4rtem1sss), written as an engineering notebook you scroll through one page at a time. It opens at a bedroom study desk at night, turns a few questions into one word, *curiosity*, and follows it through what he has built since.

**Live:** https://rs3-portfolio.vercel.app

The site is university-agnostic on purpose: no university or programme is named, so the same link can go with every application.

## The story

| Tab | Page | What it shows |
|---|---|---|
| Curiosity | Opening + p.01 | Typed questions become "CURIOSITY,", the camera moves into a 3D desk, the notebook opens, and the profile builds itself |
| Origin | p.02 | Take things apart → meet the computer → write the code |
| Growth | p.03 | Thailand Cyber Top Talent: from P62 to P8 on a live timing tower, then a notebook note on what he did on the team |
| Startup | p.04 | DoCode, the web and SEO studio he co-founded: ฿10,000 from paying clients, stamped PAID |
| Purpose | p.05 | What WordFlow is and who it is for, how one spell works, then its data path drawn as a race circuit (T1 game → T5 doctor's dashboard) and the NSC finish |
| Team | p.06 | ZeiTop, SubTrack, Gimme ur Place (game jam) and RoV Cup 2026; hover a card, or tap "What is it?", for the story behind it |
| Proof | p.07 | The podium of results and the tools he has actually used |
| Future | p.08 | Where curiosity leads, interests, and a team-radio contact card |

## How it behaves

- **Story view** (default): one scroll, one move. Each wheel turn, swipe or arrow key glides to the next resting point, so a chapter never lands half built. The opening plays by itself on the first visit; the header logo replays it.
- **Page view**: the same content as a normal scrolling page. Switch with the button in the header. Readers who prefer reduced motion get Page view automatically.
- **Sound**: synthesized with the Web Audio API (typewriter, stamps, the notebook, a cash register…), on by default after the first click or key press, and switchable from the header.
- **Responsive**: checked at every stop from 360 px phones to 2560 px wide screens, portrait and landscape.
- **No build needed to view**: `dist/` is plain HTML, CSS and JavaScript. Photos open full size on click.

## Project layout

```
dist/                  the site, exactly as deployed
  index.html           all pages, styles and page scripts (hand-edited)
  pitwall3d.js         bundled 3D desk scene (built from src/)
  opening-sequence.js  bundled opening timeline (built from src/)
  img/                 photos and screenshots
src/
  pitwall3d.js         Three.js desk scene; falls back to an illustration without WebGL
  opening-sequence.mjs the opening's scroll timeline (questions, captions, notebook)
  opening-motion.mjs   camera motion helpers
  bedroom-layout.mjs   where things sit on the desk
tests/                 node:test checks for the opening and the room layout
DESIGN.md              design decisions, chapter by chapter
PRODUCT.md             audience, purpose and privacy rules
```

## Working on it

View it locally with any static server, for example:

```bash
npx --yes serve dist
```

After changing anything in `src/`, rebuild the bundles:

```bash
npm install
npm run build
```

Run the tests:

```bash
node --test "tests/*.test.mjs"
```

Most content lives in `dist/index.html`, one `<section class="scene">` per chapter. Team cards are `<article class="stop">` elements; add or remove one and the chapter's length, stops and project counter adjust themselves.

## Photos

Files in `dist/img/` show a labelled placeholder until they exist.

| File | Where it appears |
|---|---|
| `portrait-ign.jpg` | p.01, the profile |
| `tctt.jpg` | Growth, the TCTT scoreboard |
| `docode.jpg` | Startup, a client site |
| `wf-islands.jpg`, `wf-build.jpg`, `wf-cast.jpg` | Purpose, "What is WordFlow?" (cropped from the NSC report) |
| `wf-game.jpg`, `wf-speech.jpg`, `wf-backend.jpg`, `wf-database.jpg`, `wf-dashboard.jpg` | Purpose, circuit turns T1–T5 |
| `wordflow-game.jpg` | Purpose, the NSC finish |
| `zeitop.jpg`, `subtrack.jpg`, `gamejam.webp`, `rov.jpg` | Team cards |

## Privacy

Only public, chosen details are on the site: name, email, GitHub, Instagram and city. ID numbers, phone numbers, home address, date of birth and family details from the application documents are deliberately left out. Keep it that way when editing.

## Deploying (Vercel)

`dist/` is linked to the Vercel project `rs3-portfolio`. Rebuild first if `src/` changed, then from `dist/`:

```bash
npx vercel@latest deploy --prod
```

Leave off `--prod` for a preview URL. Vercel does not serve dotfiles, so local tool state in `dist/` (`.vercel/`, `.env*`) never goes public, and `.gitignore` keeps it out of the repo.

## License

MIT © 2026 4rtem1sss
