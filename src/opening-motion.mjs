// Monotone cubic Hermite paths preserve continuous velocity without overshooting
// the authored clearance points. No allocations in the per-frame sampler.
const stops = [
  { p: 0, pos: [0, 1.5, 1.6], aim: [0, 1.18, -.8] },
  { p: .18, pos: [0, 1.5, 1.6], aim: [0, 1.18, -.8] },
  { p: .42, pos: [-.48, 1.48, 1.43], aim: [-.55, 1, -.1] },
  { p: .64, pos: [.05, 1.43, 1.3], aim: [.62, .9, .18] },
  { p: .79, pos: [.76, 1.68, .94], aim: [.77, .81, .24] },
  { p: .91, pos: [.77, 1.43, .34], aim: [.77, .81, .24] },
  { p: 1, pos: [.77, .96, .26], aim: [.77, .81, .24] }
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
