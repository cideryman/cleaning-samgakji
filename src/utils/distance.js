export function distanceBetween(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

export function isNear(a, b, range) {
  return distanceBetween(a, b) < range;
}
