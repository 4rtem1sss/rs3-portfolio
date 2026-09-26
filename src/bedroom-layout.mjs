export const bedroomLayout = {
  bounds: { x: [-4.5, 4.5], y: [-.7, 3.5], z: [-4.5, 2] },
  desk: { x: 0, y: .74, z: -.3, width: 4.6, depth: 1.85 },
  anchors: {
    window: { x: -1.75, y: 2.08, z: -4.12 },
    bed: { x: -2.85, y: -.14, z: -2.1 },
    shelf: { x: 2.25, y: 2.28, z: -4.05 },
    lamp: { x: -1.83, y: .84, z: -.1 },
    notebook: { x: .77, y: .795, z: .24 },
  },
  monitors: [
    { id: 'main', x: -.35, z: -.95, angle: .05, width: 1.38, type: 'SYSTEM VIEW' },
    { id: 'side', x: 1.16, z: -.78, angle: -.32, width: .88, type: 'BUILD LOG' },
  ],
  clutter: [
    { id: 'opened-device', x: -1.38, y: .8, z: .22 },
    { id: 'screwdriver', x: -1.02, y: .81, z: .46 },
    { id: 'books', x: 1.72, y: .8, z: -.35 },
    { id: 'coffee', x: 1.72, y: .8, z: .18 },
    { id: 'sticky-notes', x: .15, y: .8, z: .46 },
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
