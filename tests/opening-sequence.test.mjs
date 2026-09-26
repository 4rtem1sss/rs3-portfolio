import test from 'node:test';
import assert from 'node:assert/strict';
import { openingState, shouldAnnounceChapter, PRELUDE, preludeProgress, storyProgress } from '../src/opening-sequence.mjs';

test('the desk waits behind blank space, then emerges before the notebook opens', () => {
  assert.deepEqual(openingState(0), { sceneReveal: 0, notebookOpen: 0, pageFade: 0 });
  assert.equal(openingState(.12).sceneReveal, 0);
  assert.ok(openingState(.3).sceneReveal > 0 && openingState(.3).sceneReveal < 1);
  assert.equal(openingState(.55).sceneReveal, 1);
  assert.equal(openingState(.7).notebookOpen, 0);
  assert.ok(openingState(.85).notebookOpen > 0 && openingState(.85).notebookOpen < 1);
  assert.equal(openingState(.94).notebookOpen, 1);
});

test('the opening stays visible until the final notebook transition', () => {
  assert.equal(openingState(.95).pageFade, 0);
  assert.ok(openingState(.98).pageFade > 0 && openingState(.98).pageFade < 1);
  assert.equal(openingState(1).pageFade, 1);
});

test('all state values clamp for direct navigation and reverse scrolling', () => {
  for (const p of [-1, 0, .1, .5, .9, 1, 2]) {
    for (const value of Object.values(openingState(p))) {
      assert.ok(Number.isFinite(value));
      assert.ok(value >= 0 && value <= 1);
    }
  }
  assert.deepEqual(openingState(-1), openingState(0));
  assert.deepEqual(openingState(2), openingState(1));
});

test('chapter progress never interrupts the opening or the final chapter', () => {
  assert.equal(shouldAnnounceChapter(0, 7, true), false);
  assert.equal(shouldAnnounceChapter(1, 7, true), true);
  assert.equal(shouldAnnounceChapter(6, 7, true), false);
  assert.equal(shouldAnnounceChapter(2, 7, false), false);
});

test('the questions play first, then the story starts from zero', () => {
  assert.equal(preludeProgress(0), 0);
  assert.equal(storyProgress(PRELUDE / 2), 0);
  assert.equal(preludeProgress(PRELUDE), 1);
  assert.equal(storyProgress(PRELUDE), 0);
  assert.ok(storyProgress((1 + PRELUDE) / 2) > .49 && storyProgress((1 + PRELUDE) / 2) < .51);
  assert.equal(storyProgress(1), 1);
  for (const raw of [-1, 2]) {
    assert.ok(preludeProgress(raw) >= 0 && preludeProgress(raw) <= 1);
    assert.ok(storyProgress(raw) >= 0 && storyProgress(raw) <= 1);
  }
});
