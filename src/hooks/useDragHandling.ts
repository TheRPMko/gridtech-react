// GridTech drag handling hook
import { useState, useCallback } from 'react';
import type { DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import type { WidgetState, PreviewState } from '../types';
import { checkCollision } from '../utils/grid/gridCollision';
import { reflowWidgets } from '../utils/gridUtils';

export interface UseDragHandlingProps {
  widgets: WidgetState[];
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  onWidgetMove: (id: string, x: number, y: number) => void;
}

export function useDragHandling({
  widgets,
  cols,
  rows,
  cellWidth,
  cellHeight,
  onWidgetMove
}: UseDragHandlingProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [hasMoved, setHasMoved] = useState(false);

  const calculateReflow = useCallback((movedWidget: WidgetState) => {
    const overlapping = widgets.filter(w =>
      w.id !== movedWidget.id && checkCollision(movedWidget, w)
    );
    if (overlapping.length === 0) {
      return { isValid: true, reflowPreviews: [] };
    }
    
    const testWidgets = [
      movedWidget,
      ...overlapping,
      ...widgets.filter(w =>
        w.id !== movedWidget.id && !overlapping.find(o => o.id === w.id)
      )
    ];
    
    const reflowed = reflowWidgets(testWidgets, cols, rows, true, movedWidget.id);
    const reflowPreviews = reflowed
      .filter(w => {
        const original = widgets.find(ow => ow.id === w.id);
        return original &&
          w.id !== movedWidget.id &&
          (original.x !== w.x || original.y !== w.y);
      })
      .map(w => ({
        id: w.id,
        x: w.x,
        y: w.y,
        width: w.width,
        height: w.height
      }));
    return { isValid: true, reflowPreviews };
  }, [widgets, cols, rows]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggedId(String(event.active.id));
    setHasMoved(false);
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { active, delta } = event;
    if (!active) {
      setPreview(null);
      return;
    }

    setHasMoved(true);
    const widget = widgets.find(w => w.id === active.id);
    if (!widget) {
      setPreview(null);
      return;
    }

    const deltaX = Math.round(delta.x / cellWidth);
    const deltaY = Math.round(delta.y / cellHeight);

    const previewWidget = {
      ...widget,
      x: Math.max(0, Math.min(cols - widget.width, widget.x + deltaX)),
      y: Math.max(0, Math.min(rows - widget.height, widget.y + deltaY))
    };

    if (preview && preview.x === previewWidget.x && preview.y === previewWidget.y) {
      return;
    }

    try {
      const { reflowPreviews } = calculateReflow(previewWidget);
      setPreview({ ...previewWidget, isValid: true, reflowPreviews });
    } catch (error) {
      setPreview({ ...previewWidget, isValid: false, reflowPreviews: [] });
    }
  }, [widgets, cols, rows, cellWidth, cellHeight, preview, calculateReflow]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active } = event;
    
    setDraggedId(null);
    setPreview(null);
    setHasMoved(false);

    if (!active || !preview || !hasMoved) {
      return;
    }

    if (preview.isValid) {
      onWidgetMove(String(active.id), preview.x, preview.y);
    }
  }, [preview, hasMoved, onWidgetMove]);

  const handleDragCancel = useCallback(() => {
    setPreview(null);
    setDraggedId(null);
    setHasMoved(false);
  }, []);

  return {
    draggedId,
    preview,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel
  };
}
