// Grid math and scaling helpers

export function getCellSize(
  containerWidth: number,
  containerHeight: number,
  gridCols: number,
  gridRows: number
): { cellWidth: number; cellHeight: number } {
  return {
    cellWidth: containerWidth / gridCols,
    cellHeight: containerHeight / gridRows,
  };
}

export function clampGridPosition(
  x: number,
  y: number,
  gridCols: number,
  gridRows: number,
  widgetWidth: number,
  widgetHeight: number
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(x, gridCols - widgetWidth)),
    y: Math.max(0, Math.min(y, gridRows - widgetHeight)),
  };
}
