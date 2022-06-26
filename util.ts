export function dbg<T>(x: T): T {
  console.trace(x);
  return x;
}

export function dist(
  src: cytoscape.Position,
  dest: cytoscape.Position
): number {
  return Math.sqrt(Math.pow(src.x - dest.x, 2) + Math.pow(src.y - dest.y, 2));
}
