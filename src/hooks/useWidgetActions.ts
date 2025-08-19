// GridTech widget management hook
import { useState, useCallback } from 'react';
import type { WidgetState } from '../types';
import { validateWidgetPosition, reflowWidgets } from '../utils/gridUtils';
import { checkCollision } from '../utils/grid/gridCollision';
import { getNextAvailablePosition } from '../utils/grid/gridPlacement';

export interface UseWidgetActionsProps {
  cols: number;
  rows: number;
  preventOverlap: boolean;
  defaultWidgetSize: { w: number; h: number };
  initialWidgets?: WidgetState[];
  onWidgetAdd?: (widget: WidgetState) => void;
  onWidgetMove?: (widget: WidgetState) => void;
  onWidgetResize?: (widget: WidgetState) => void;
  onWidgetDelete?: (widgetId: string) => void;
  onWidgetsChange?: (widgets: WidgetState[]) => void;
}

export function useWidgetActions({
  cols,
  rows,
  preventOverlap,
  defaultWidgetSize,
  initialWidgets = [],
  onWidgetAdd,
  onWidgetMove,
  onWidgetResize,
  onWidgetDelete,
  onWidgetsChange,
}: UseWidgetActionsProps) {
  const [widgets, setWidgets] = useState<WidgetState[]>(initialWidgets);

  const generateUniqueId = useCallback(() => {
    const existingIds = widgets
      .map(w => {
        const match = w.id.match(/widget-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => !isNaN(n));
    const highestId = Math.max(0, ...existingIds);
    const timestamp = Date.now();
    return `widget-${highestId + 1}-${timestamp}`;
  }, [widgets]);

  const addWidget = useCallback((type: string = "default", props: Record<string, any> = {}) => {
    const position = getNextAvailablePosition(
      widgets.map(w => ({ x: w.x, y: w.y, width: w.width, height: w.height })),
      cols,
      rows,
      defaultWidgetSize.w,
      defaultWidgetSize.h
    );
    
    if (!position) {
      alert('No more space available on the grid for new widgets!');
      return;
    }

    const newWidget: WidgetState = {
      id: generateUniqueId(),
      width: defaultWidgetSize.w,
      height: defaultWidgetSize.h,
      x: position.x,
      y: position.y,
      type,
      props,
    };

    const validation = validateWidgetPosition(newWidget, widgets, cols, rows, preventOverlap);
    const finalWidget = validation.isValid ? newWidget : {
      ...newWidget,
      ...(validation.suggestedPosition || { x: 0, y: 0 })
    };

    const updatedWidgets = [...widgets, finalWidget];
    setWidgets(updatedWidgets);
    onWidgetAdd?.(finalWidget);
    onWidgetsChange?.(updatedWidgets);
  }, [widgets, cols, rows, defaultWidgetSize, preventOverlap, generateUniqueId, onWidgetAdd, onWidgetsChange]);

  const moveWidget = useCallback((id: string, x: number, y: number) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;

    const movedWidget = { ...widget, x, y };
    let updatedWidgets = widgets.map(w => w.id === id ? movedWidget : w);

    if (preventOverlap) {
      try {
        updatedWidgets = reflowWidgets(updatedWidgets, cols, rows, true, id);
      } catch (error) {
        alert('Cannot move widget - not enough space available!');
        return;
      }
    }

    setWidgets(updatedWidgets);
    onWidgetMove?.(movedWidget);
    onWidgetsChange?.(updatedWidgets);
  }, [widgets, cols, rows, preventOverlap, onWidgetMove, onWidgetsChange]);

  const resizeWidget = useCallback((id: string, width: number, height: number) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;

    const resizedWidget = {
      ...widget,
      width: Math.max(1, Math.min(width, cols - widget.x)),
      height: Math.max(1, Math.min(height, rows - widget.y))
    };

    if (preventOverlap) {
      const hasCollision = widgets.some(otherWidget =>
        otherWidget.id !== id && checkCollision(resizedWidget, otherWidget)
      );

      if (hasCollision) {
        try {
          const allWidgets = [resizedWidget, ...widgets.filter(w => w.id !== id)];
          const updatedWidgets = reflowWidgets(allWidgets, cols, rows, true, id);
          setWidgets(updatedWidgets);
          onWidgetResize?.(resizedWidget);
          onWidgetsChange?.(updatedWidgets);
        } catch (error) {
          alert('Cannot resize widget - not enough space available!');
        }
        return;
      }
    }

    const updatedWidgets = widgets.map(w => w.id === id ? resizedWidget : w);
    setWidgets(updatedWidgets);
    onWidgetResize?.(resizedWidget);
    onWidgetsChange?.(updatedWidgets);
  }, [widgets, cols, rows, preventOverlap, onWidgetResize, onWidgetsChange]);

  const deleteWidget = useCallback((id: string) => {
    const updatedWidgets = widgets.filter(w => w.id !== id);
    setWidgets(updatedWidgets);
    onWidgetDelete?.(id);
    onWidgetsChange?.(updatedWidgets);
  }, [widgets, onWidgetDelete, onWidgetsChange]);

  const setInitialWidgets = useCallback((initialWidgets: WidgetState[]) => {
    const cleanWidgets = initialWidgets.map((widget, index) => {
      const seen = new Set<string>();
      if (seen.has(widget.id)) {
        const timestamp = Date.now();
        return {
          ...widget,
          id: `${widget.id}-${timestamp}-${index}`
        };
      }
      seen.add(widget.id);
      return widget;
    });
    setWidgets(cleanWidgets);
  }, []);

  return {
    widgets,
    addWidget,
    moveWidget,
    resizeWidget,
    deleteWidget,
    setInitialWidgets
  };
}
