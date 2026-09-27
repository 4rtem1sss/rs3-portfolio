const clamp = value => Math.max(0, Math.min(1, value));
const smoothstep = value => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const beat = (progress, start, end) => smoothstep((clamp(progress) - start) / (end - start));

// The opening starts as empty thought-space. The desk arrives before the
// notebook moves, so the environment supports the story instead of competing
// with its first word.
// The first part of the opening scroll belongs to the questions that add up to "curiosity,".
// Everything after it (desk, camera, notebook) runs on story progress, 0..1.
export const PRELUDE = .36;
export function preludeProgress(raw) {
  return clamp(clamp(raw) / PRELUDE);
}
export function storyProgress(raw) {
  return clamp((clamp(raw) - PRELUDE) / (1 - PRELUDE));
}

export function openingState(progress) {
  const p = clamp(progress);
  return {
    sceneReveal: beat(p, .12, .5),
    notebookOpen: beat(p, .8, .92),
    pageFade: beat(p, .96, 1)
  };
}
