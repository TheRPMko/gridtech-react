import type { WidgetState } from '../types';
import { checkCollision } from './grid/gridCollision';
import { clampGridPosition } from './grid/gridMath';
import { getNextAvailablePosition } from './grid/gridPlacement';

export function validateWidgetPosition(
  widget: WidgetState,
  allWidgets: WidgetState[],
  gridCols: number,
  gridRows: number,
  preventOverlap: boolean = false
): { isValid: boolean; suggestedPosition?: { x: number; y: number } } {
  // Use clampGridPosition for bounds
  if (
    widget.x < 0 ||
    widget.y < 0 ||
    widget.x + widget.width > gridCols ||
    widget.y + widget.height > gridRows
  ) {
    return {
      isValid: false,
      suggestedPosition: clampGridPosition(
        widget.x,
        widget.y,
        gridCols,
        gridRows,
        widget.width,
        widget.height
      ),
    };
  }

  if (preventOverlap) {
    // Use checkCollision from gridCollision
    const collision = allWidgets.some(
      (other) => other.id !== widget.id && checkCollision(widget, other)
    );
    if (collision) {
      // Use getNextAvailablePosition from gridPlacement
      const freeSpace = getNextAvailablePosition(
        allWidgets.map(w => ({ x: w.x, y: w.y, width: w.width, height: w.height })),
        gridCols,
        gridRows,
        widget.width,
        widget.height
      );
      return { isValid: false, suggestedPosition: freeSpace || { x: 0, y: 0 } };
    }
  }
  return { isValid: true };
}

export function reflowWidgets(
  widgets: WidgetState[],
  gridCols: number,
  gridRows: number,
  preventOverlap: boolean = false,
  activeWidgetId?: string
): WidgetState[] {
  if (!preventOverlap) {
    return widgets.map((widget) => ({
      ...widget,
      ...clampGridPosition(
        widget.x,
        widget.y,
        gridCols,
        gridRows,
        widget.width,
        widget.height
      ),
    }));
  }

  // Sort widgets to process active widget first, then left-to-right, top-to-bottom
  const orderedWidgets = [...widgets].sort((a, b) => {
    if (activeWidgetId) {
      if (a.id === activeWidgetId) return -1;
      if (b.id === activeWidgetId) return 1;
    }
    if (a.y === b.y) return a.x - b.x;
    return a.y - b.y;
  });

  // Use a grid occupancy map for collision detection
  const gridMap: { [key: string]: string } = {};

  // Helper to check if a widget can be placed at a position
  const canPlaceWidget = (widget: WidgetState, x: number, y: number) => {
    if (
      x < 0 ||
      y < 0 ||
      x + widget.width > gridCols ||
      y + widget.height > gridRows
    ) {
      return false;
    }
    for (let dy = 0; dy < widget.height; dy++) {
      for (let dx = 0; dx < widget.width; dx++) {
        const key = `${x + dx},${y + dy}`;
        if (gridMap[key] && gridMap[key] !== widget.id) {
          return false;
        }
      }
    }
    return true;
  };

  // Helper to mark widget cells as occupied
  const occupyCells = (widget: WidgetState, x: number, y: number) => {
    for (let dy = 0; dy < widget.height; dy++) {
      for (let dx = 0; dx < widget.width; dx++) {
        gridMap[`${x + dx},${y + dy}`] = widget.id;
      }
    }
  };

  // Find next available position for a widget
  const findNextPosition = (widget: WidgetState): { x: number; y: number } => {
    // Try original position first
    if (canPlaceWidget(widget, widget.x, widget.y)) {
      return { x: widget.x, y: widget.y };
    }
    // Use already placed widgets for collision checking
    const placedWidgets = result.map(w => ({ 
      x: w.x, 
      y: w.y, 
      width: w.width, 
      height: w.height 
    }));

    const pos = getNextAvailablePosition(
      placedWidgets,
      gridCols,
      gridRows,
      widget.width,
      widget.height
    );
    return pos || { x: 0, y: 0 };
  };

  const result: WidgetState[] = [];
  for (const widget of orderedWidgets) {
    const pos = findNextPosition(widget);
    const finalWidget = { ...widget, ...pos };
    result.push(finalWidget);
    occupyCells(finalWidget, pos.x, pos.y);
  }
  return result;
}
