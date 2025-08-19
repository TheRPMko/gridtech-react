// Grid collision and overlap helpers

export const checkCollision = (
  widget1: { x: number; y: number; width: number; height: number },
  widget2: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    widget1.x < widget2.x + widget2.width &&
    widget1.x + widget1.width > widget2.x &&
    widget1.y < widget2.y + widget2.height &&
    widget1.y + widget1.height > widget2.y
  );
};

export function hasCollision(
  widgets: Array<{ x: number; y: number; width: number; height: number }>,
  testWidget: { x: number; y: number; width: number; height: number }
): boolean {
  return widgets.some(w => checkCollision(w, testWidget));
}
