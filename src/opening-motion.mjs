// Monotone cubic Hermite paths preserve continuous velocity without overshooting
// the authored clearance points. No allocations in the per-frame sampler.
const stops = [
  { p: 0, pos: [.05, 1.36, 1.85], aim: [.05, 1.06, -.3] },
  { p: .18, pos: [.05, 1.36, 1.85], aim: [.05, 1.06, -.3] },
  { p: .42, pos: [-.3, 1.12, .6], aim: [-.5, .8, .02] },
  { p: .64, pos: [.02, 1.12, .5], aim: [0, 1.04, -.27] },
  { p: .79, pos: [.4, 1.18, .5], aim: [.43, .77, .1] },
  { p: .91, pos: [.43, 1.1, .15], aim: [.43, .765, .1] },
  { p: 1, pos: [.43, .87, .105], aim: [.43, .765, .1] }
];
function tangent(i, key, axis) {
  if (i === 0 || i === stops.length - 1) return 0;
  const a = stops[i - 1], b = stops[i], c = stops[i + 1];
  const left = (b[key][axis] - a[key][axis]) / (b.p - a.p);
  const right = (c[key][axis] - b[key][axis]) / (c.p - b.p);
  if (left * right <= 0) return 0;
  return Math.sign(left) * Math.min(Math.abs((left + right) / 2), 2 * Math.abs(left), 2 * Math.abs(right));
}
const curves = ['pos', 'aim'].map(key => stops.map((s, i) => ({
  p: s.p, value: s[key], slope: [0, 1, 2].map(axis => tangent(i, key, axis))
})));
function sample(curve, p, out) {
  let i = 0;
  while (i < curve.length - 2 && p > curve[i + 1].p) i++;
  const a = curve[i], b = curve[i + 1], span = b.p - a.p;
  const t = Math.max(0, Math.min(1, (p - a.p) / span)), t2 = t * t, t3 = t2 * t;
  const h0 = 2 * t3 - 3 * t2 + 1, h1 = t3 - 2 * t2 + t;
  const h2 = -2 * t3 + 3 * t2, h3 = t3 - t2;
  out.x = h0 * a.value[0] + h1 * span * a.slope[0] + h2 * b.value[0] + h3 * span * b.slope[0];
  out.y = h0 * a.value[1] + h1 * span * a.slope[1] + h2 * b.value[1] + h3 * span * b.slope[1];
  out.z = h0 * a.value[2] + h1 * span * a.slope[2] + h2 * b.value[2] + h3 * span * b.slope[2];
}
export function sampleOpeningCamera(p, position, target) {
  sample(curves[0], p, position);
  sample(curves[1], p, target);
}
