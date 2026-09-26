const clamp = value => Math.max(0, Math.min(1, value));
const smoothstep = value => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const beat = (progress, start, end) => smoothstep((clamp(progress) - start) / (end - start));

// The opening starts as empty thought-space. The desk arrives before the
// notebook moves, so the environment supports the story instead of competing
// with its first word.
export function openingState(progress) {
  const p = clamp(progress);
  return {
    sceneReveal: beat(p, .12, .5),
    notebookOpen: beat(p, .78, .92),
    pageFade: beat(p, .96, 1)
  };
}

export function shouldAnnounceChapter(index, chapterCount, storyMode) {
  return Boolean(storyMode && index > 0 && index < chapterCount - 1);
}
