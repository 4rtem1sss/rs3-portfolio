# Engineering notebook portfolio

A portfolio template for Rapeepat Sawek combining a paper notebook with an interactive bedroom study scene. Personal projects and achievements remain blank.

Open `dist/index.html` in a browser. It works without installing anything or an internet connection.

## The 3D opening

The opening is a real-time Three.js scene of a bedroom study desk at night that the camera moves into until it lands on the notebook's first page. It is bundled into `dist/pitwall3d.js`; if a browser has no WebGL, an illustrated version shows instead. (The earlier interactive F1 car, `src/car3d.js`, is no longer on the page or in the build.)

The scene's source is `src/pitwall3d.js`. After editing it, rebuild with:

```
npm install
npm run build
```

## Make it yours

- The name uses the confirmed PDF spelling: Rapeepat Sawek.
- Replace the square-bracketed text with your own details.
- Projects live on setup sheets in the Work section. Replace the placeholders, or duplicate an `article.sheet` for more. The dashed "Slot 03" can be swapped for a real sheet.
- About entries are the three `article.nb-entry` pages in the notebook. Add more entries together with a matching tab button.
- Turn the contact placeholders into real links when your public contact details are ready.
- Adjust the colors in `:root` near the top of the file.

The only personal prose added is the confirmed interest in F1 engineering inside the folded note. Other biography, project, and contact copy stays editable placeholder text. The component explanations link to the official F1 glossary for further reading.

The template includes responsive layouts, visible keyboard focus, a skip link, descriptive navigation, and a custom favicon.

## Adding your photos

Put these files in `dist/img/` (JPG, landscape unless noted). Each slot shows a labelled placeholder until its file exists; no code changes needed.

| File | Where it appears |
|---|---|
| `portrait.jpg` (portrait, 4:5) | Driver card after "Lights out" |
| `tctt.jpg` | Qualifying (Thailand Cyber Top Talent) |
| `wordflow-game.jpg` | Race: the WordFlow game |
| `wordflow-dashboard.jpg` | Race: the clinician dashboard |
| `zeitop.jpg`, `subtrack.jpg`, `docode.jpg` | Pit wall stops |

## Live site (Vercel)

- Production: https://rs3-portfolio.vercel.app (Vercel project `rs3-portfolio`, account `4rtem1sss`).
- The `dist/` folder is linked to that project (`dist/.vercel/`). To publish changes, rebuild if the 3D sources changed (`npm run build`), then from `dist/` run:
  - preview: `npx vercel@latest deploy`
  - production: `npx vercel@latest deploy --prod`
- `vercel link` also writes a `.env.local` token into `dist/`; it isn't needed for this static site and was deleted. Vercel does not serve dotfiles (`.env*`, `.gitignore`, `.vercel/` all return 404).
