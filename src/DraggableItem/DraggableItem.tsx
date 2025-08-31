import React, { useRef, useState, memo } from "react";
import type { ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import "./DraggableItem.css";

export interface DraggableItemProps {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  cellWidth: number;
  cellHeight: number;
  children: ReactNode;
  showPreview?: boolean;
  previewState?: {
    x: number;
    y: number;
    width: number;
    height: number;
    isValid: boolean;
  };
  isEditing?: boolean;
  onResize: (id: string, newW: number, newH: number) => void;
  onDelete?: (id: string) => void;
  /** If true, dragging is enabled regardless of isEditing state */
  isDraggable?: boolean;
}

function DraggableItemComponent({
  id,
  x,
  y,
  w,
  h,
  minW,
  minH,
  maxW,
  maxH,
  cellWidth,
  cellHeight,
  children,
  showPreview,
  previewState,
  isEditing = true,
  onResize,
  onDelete,
  isDraggable,
}: DraggableItemProps) {
  const resizing = useRef(false);
  const resizeHandler = useRef<((e: Event) => void) | null>(null);
  const [resizeDims, setResizeDims] = useState<{ w: number; h: number } | null>(
    null
  );

  // Allow dragging if isDraggable is explicitly true, or if in editing mode
  const canDrag = isDraggable !== undefined ? isDraggable : isEditing;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled: !canDrag,
  });

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (resizeHandler.current) {
      document.removeEventListener("mousemove", resizeHandler.current);
    }

    resizing.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    setResizeDims({ w, h });

    const currentHandler = (event: Event) => {
      const e = event as MouseEvent;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newWidthPx = w * cellWidth + dx;
      const newHeightPx = h * cellHeight + dy;

      const newW = Math.max(
        minW ?? 1,
        Math.min(maxW ?? Infinity, Math.round(newWidthPx / cellWidth))
      );
      const newH = Math.max(
        minH ?? 1,
        Math.min(maxH ?? Infinity, Math.round(newHeightPx / cellHeight))
      );

      setResizeDims({ w: newW, h: newH });

      // Calculate preview but don't commit
      onResize(id, newW, newH);
    };

    resizeHandler.current = currentHandler;
    document.addEventListener("mousemove", currentHandler);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResizeEnd = () => {
    resizing.current = false;

    // Only send the resize event when we finish
    if (resizeDims) {
      onResize(id, resizeDims.w, resizeDims.h);
    }

    setResizeDims(null);

    if (resizeHandler.current) {
      document.removeEventListener("mousemove", resizeHandler.current);
      document.removeEventListener("mouseup", handleResizeEnd);
      resizeHandler.current = null;
    }
  };

  return (
    <>
      <div
        className={`draggable-item ${resizing.current ? "resizing" : ""} ${
          showPreview ? "dragging" : ""
        } ${isEditing ? "edit-mode" : ""}`}
        style={
          {
            ["--cell-x" as string]: x,
            ["--cell-y" as string]: y,
            ["--cell-w" as string]: resizeDims ? resizeDims.w : w,
            ["--cell-h" as string]: resizeDims ? resizeDims.h : h,
            ["--grid-cell-width" as string]: `${cellWidth}px`,
            ["--grid-cell-height" as string]: `${cellHeight}px`,
            transform: transform
              ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
              : undefined,
            touchAction: "none",
            opacity: showPreview ? 0.5 : 1,
          } as React.CSSProperties
        }
        ref={setNodeRef}
      >
        {/* Drag handle */}
        <div className="drag-handle" {...listeners} {...attributes} />

        {isEditing && onDelete && (
          <button
            className="delete-handle"
            onClick={() => onDelete(id)}
            data-no-dnd="true"
            aria-label="Delete widget"
          >
            <div className="delete-icon">×</div>
          </button>
        )}

        <div className="widget-content">
          {children}
        </div>

        <div
          className="resize-handle"
          onMouseDown={handleResizeStart}
          data-no-dnd="true"
        />
      </div>

      {previewState && (
        <div
          className={`widget-preview ${ 
            previewState.isValid ? "valid" : "invalid"
          }`}
          style={{
            position: "absolute",
            left: `${previewState.x * cellWidth}px`,
            top: `${previewState.y * cellHeight}px`,
            width: `${previewState.width * cellWidth}px`,
            height: `${previewState.height * cellHeight}px`,
            pointerEvents: "none",
            border: "2px dashed",
            borderColor: previewState.isValid ? "#4CAF50" : "#F44336",
            backgroundColor: previewState.isValid
              ? "rgba(76, 175, 80, 0.1)"
              : "rgba(244, 67, 54, 0.1)",
            transition: "all 0.1s ease",
            zIndex: 1000,
          }}
        />
      )}
    </>
  );
}

export const DraggableItem = memo(DraggableItemComponent);
