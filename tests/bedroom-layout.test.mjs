import test from 'node:test';
import assert from 'node:assert/strict';
import { bedroomLayout, validateBedroomLayout } from '../src/bedroom-layout.mjs';

test('the approved bedroom layout keeps its anchors and clutter in plausible space', () => {
  assert.deepEqual(validateBedroomLayout(bedroomLayout), []);
  assert.equal(bedroomLayout.monitors.length, 2);
  assert.ok(bedroomLayout.clutter.some(item => item.id === 'opened-device'));
  assert.ok(bedroomLayout.clutter.some(item => item.id === 'screwdriver'));
});

test('layout validation catches room escapes and objects below the desk', () => {
  const invalid = structuredClone(bedroomLayout);
  invalid.anchors.window.x = 99;
  invalid.clutter[0].y = invalid.desk.y - 1;

  assert.deepEqual(validateBedroomLayout(invalid), [
    'anchor window is outside the room',
    `${invalid.clutter[0].id} is below the desk surface`,
  ]);
});
