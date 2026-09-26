import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleOpeningCamera } from '../src/opening-motion.mjs';

function sample(p) {
  const position = {}, target = {};
  sampleOpeningCamera(p, position, target);
  return [...Object.values(position), ...Object.values(target)];
}
const knots = [0, .18, .42, .64, .79, .91, 1];

test('journey begins at the desk and ends inside the notebook', () => {
  assert.deepEqual(sample(0), [0, 1.5, 1.6, 0, 1.18, -.8]);
  assert.deepEqual(sample(.18), sample(0));
  assert.deepEqual(sample(1), [.77, .96, .26, .77, .81, .24]);
});

test('path stays within each segment bounds, with a safe camera/target separation', () => {
  for (let segment = 0; segment < knots.length - 1; segment++) {
    const start = knots[segment], end = knots[segment + 1];
    const a = sample(start), b = sample(end);
    for (let i = 0; i <= 100; i++) {
      const values = sample(start + (end - start) * i / 100);
      values.forEach((value, axis) => {
        assert.ok(Number.isFinite(value));
        assert.ok(value >= Math.min(a[axis], b[axis]) - 1e-10);
        assert.ok(value <= Math.max(a[axis], b[axis]) + 1e-10);
      });
      assert.ok(Math.hypot(...values.slice(0, 3).map((v, j) => v - values[j + 3])) > .1);
      assert.ok(values[1] >= .96 - 1e-10, 'camera remains above desk');
    }
  }
});

test('velocity remains continuous at camera waypoints', () => {
  const h = 1e-6;
  for (const p of knots.slice(1, -1)) {
    const before = sample(p - h), at = sample(p), after = sample(p + h);
    at.forEach((value, axis) => {
      const left = (value - before[axis]) / h, right = (after[axis] - value) / h;
      assert.ok(Math.abs(left - right) < .01, `velocity discontinuity at ${p}, axis ${axis}`);
    });
  }
  const before = sample(.64 - h), after = sample(.64 + h);
  assert.ok(Math.hypot(...after.slice(0, 3).map((v, i) => (v - before[i]) / (2 * h))) > .1);
});

test('reversing input retraces exactly, and out-of-range progress clamps', () => {
  const forward = Array.from({ length: 101 }, (_, i) => sample(i / 100));
  for (let i = 100; i >= 0; i--) assert.deepEqual(sample(i / 100), forward[i]);
  assert.deepEqual(sample(-1), sample(0));
  assert.deepEqual(sample(2), sample(1));
});
