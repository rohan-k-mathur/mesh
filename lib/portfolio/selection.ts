export function getBoundingRect(
  ids: string[],
  elements: Map<string, { x: number; y: number; width: number; height: number }>,
) {
  const rects = ids
    .map((id) => elements.get(id))
    .filter((el): el is { x: number; y: number; width: number; height: number } => !!el);
  if (!rects.length) return null;
  const left = Math.min(...rects.map((r) => r.x));
  const top = Math.min(...rects.map((r) => r.y));
  const right = Math.max(...rects.map((r) => r.x + r.width));
  const bottom = Math.max(...rects.map((r) => r.y + r.height));
  return { left, top, width: right - left, height: bottom - top };
}
