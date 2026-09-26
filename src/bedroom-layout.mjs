// Real-world scale (metres). Floor is y = 0, the back wall is z = -0.46 and the visitor sits at +z.
export const bedroomLayout = {
  bounds: { x: [-2.2, 2.6], y: [0, 2.8], z: [-.46, 2.2] },
  desk: { x: -.02, y: .75, z: -.08, width: 1.7, depth: .72 },
  anchors: {
    window: { x: -1.05, y: 1.58, z: -.45 },
    bed: { x: 1.95, y: .45, z: .55 },
    shelf: { x: .55, y: 1.5, z: -.35 },
    lamp: { x: -.72, y: .87, z: -.3 },
    notebook: { x: .43, y: .75, z: .1 },
  },
  monitors: [
    { id: 'main', x: -.04, z: -.27, angle: 0, width: .62, type: 'SYSTEM VIEW' },
    { id: 'side', x: .62, z: -.16, angle: -.5, width: .32, type: 'BUILD LOG' },
  ],
  clutter: [
    { id: 'opened-device', x: -.5, y: .755, z: .03 },
    { id: 'screwdriver', x: -.3, y: .761, z: .18 },
    { id: 'breadboard', x: -.36, y: .755, z: -.15 },
    { id: 'books', x: -.72, y: .75, z: -.3 },
    { id: 'coffee', x: .73, y: .75, z: .12 },
    { id: 'sticky-notes', x: -.28, y: .93, z: -.25 },
  ],
};

const inside = (value, range) => value >= range[0] && value <= range[1];

export function validateBedroomLayout(layout) {
  const issues = [];
  for (const [id, point] of Object.entries(layout.anchors)) {
    if (!inside(point.x, layout.bounds.x) || !inside(point.y, layout.bounds.y) || !inside(point.z, layout.bounds.z)) {
      issues.push(`anchor ${id} is outside the room`);
    }
  }
  for (const item of layout.clutter) {
    if (item.y < layout.desk.y) issues.push(`${item.id} is below the desk surface`);
  }
  return issues;
}
