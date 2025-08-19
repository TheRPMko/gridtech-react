// Grid placement and mapping helpers

export function getNextAvailablePosition(
  widgets: Array<{ x: number; y: number; width: number; height: number }>,
  gridCols: number,
  gridRows: number,
  widgetWidth: number,
  widgetHeight: number
): { x: number; y: number } | null {
  for (let y = 0; y <= gridRows - widgetHeight; y++) {
    for (let x = 0; x <= gridCols - widgetWidth; x++) {
      if (!widgets.some(w =>
        w.x < x + widgetWidth &&
        w.x + w.width > x &&
        w.y < y + widgetHeight &&
        w.y + w.height > y
      )) {
        return { x, y };
      }
    }
  }
  return null;
}

export function mapGridToPixels(
  x: number,
  y: number,
  cellWidth: number,
  cellHeight: number
): { left: number; top: number } {
  return {
    left: x * cellWidth,
    top: y * cellHeight,
  };
}
