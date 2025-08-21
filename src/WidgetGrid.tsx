import { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { DndContext } from '@dnd-kit/core';
import { DraggableItem } from './DraggableItem/DraggableItem';
import type { WidgetState, GroupFilter } from './types';
import { useWidgetActions } from './hooks/useWidgetActions';
import { useDragHandling } from './hooks/useDragHandling';
import { useResponsiveGrid } from './hooks/useResponsiveGrid';

export interface GridConfig {
  cols: number;
  rows: number;
  cellWidth?: number;
  cellHeight?: number;
  preventOverlap?: boolean;
  defaultWidgetSize?: { w: number; h: number };
  defaultSizeLimits?: {
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  className?: string;
  style?: React.CSSProperties;
}

interface WidgetGridProps extends GridConfig {
  initialWidgets?: WidgetState[];
  defaultEditMode?: boolean;
  onWidgetsChange?: (widgets: WidgetState[]) => void;
  onWidgetAdd?: (widget: WidgetState) => void;
  onWidgetMove?: (widget: WidgetState) => void;
  onWidgetResize?: (widget: WidgetState) => void;
  onEditModeChange?: (isEditing: boolean) => void;
  onWidgetDelete?: (widgetId: string) => void;
  widgetRenderers?: { [type: string]: React.ComponentType<any> };
  showControls?: boolean;
  // Enhanced API for streamlined widget adding
  addWidgetTrigger?: {
    type: string;
    props?: Record<string, any>;
    size?: { w: number; h: number };
  } | null;
  // Simple group filters
  groupFilters?: GroupFilter[];
  onGroupFiltersChange?: (filters: GroupFilter[]) => void;
}

export interface WidgetGridRef {
  addWidget: (type?: string, props?: Record<string, any>, size?: { w: number; h: number }) => void;
  toggleEditMode: () => void;
  setEditMode: (enabled: boolean) => void;
  getEditMode: () => boolean;
  clearAllWidgets: () => void;
  // Simple group filtering
  setGroupVisible: (groupId: string, visible: boolean) => void;
  getVisibleGroups: () => string[];
}

const getCSSVariable = (name: string, fallback: number): number => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value ? parseInt(value) : fallback;
};

const DEFAULT_CONFIG: Required<GridConfig> = {
  cols: 24,
  rows: 12,
  cellWidth: 50,
  cellHeight: 50,
  preventOverlap: false,
  defaultWidgetSize: { w: 3, h: 2 },
  defaultSizeLimits: { minW: 2, minH: 2, maxW: 12, maxH: 8 },
  className: '',
  style: {}
};

export const WidgetGrid = forwardRef<WidgetGridRef, WidgetGridProps>(({
  cols = DEFAULT_CONFIG.cols,
  rows = DEFAULT_CONFIG.rows,
  preventOverlap = DEFAULT_CONFIG.preventOverlap,
  defaultWidgetSize = DEFAULT_CONFIG.defaultWidgetSize,
  defaultSizeLimits = DEFAULT_CONFIG.defaultSizeLimits,
  className = DEFAULT_CONFIG.className,
  style = DEFAULT_CONFIG.style,
  initialWidgets: externalWidgets = [],
  defaultEditMode = false,
  onWidgetsChange,
  onWidgetAdd,
  onWidgetMove,
  onWidgetResize,
  onEditModeChange,
  onWidgetDelete,
  widgetRenderers,
  showControls = false,
  addWidgetTrigger,
  groupFilters = [],
  onGroupFiltersChange,
}, ref) => {
  const [isEditing, setIsEditing] = useState(defaultEditMode);
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());

  // Create a map of group visibility for quick lookup
  const groupVisibility = useMemo(() => {
    const visibility = new Map<string, boolean>();
    groupFilters.forEach(filter => {
      visibility.set(filter.groupId, filter.visible);
    });
    return visibility;
  }, [groupFilters]);

  // Widget management hook
  const {
    widgets: internalWidgets,
    addWidget,
    moveWidget,
    resizeWidget,
    deleteWidget,
    setInitialWidgets
  } = useWidgetActions({
    cols,
    rows,
    preventOverlap,
    defaultWidgetSize,
    initialWidgets: externalWidgets,
    onWidgetAdd,
    onWidgetMove,
    onWidgetResize,
    onWidgetDelete,
    onWidgetsChange,
  });

  // Responsive grid hook
  const { cellWidth, cellHeight, gridWidth, gridHeight } = useResponsiveGrid({
    cols,
    rows
  });

  // Use external widgets if provided, otherwise use internal state
  const displayWidgets = externalWidgets.length > 0 ? externalWidgets : internalWidgets;

  // Filter widgets based on group visibility
  const filteredWidgets = useMemo(() => {
    return displayWidgets.filter(widget => {
      // If widget has a groupId, check if that group is visible
      if (widget.groupId) {
        // Check groupFilters for visibility
        const groupFilter = groupFilters.find(f => f.groupId === widget.groupId);
        if (groupFilter) {
          return groupFilter.visible;
        }
        // If no filter specified, check hiddenGroups set
        return !hiddenGroups.has(widget.groupId);
      }
      // If no groupId, always show the widget
      return true;
    });
  }, [displayWidgets, groupFilters, hiddenGroups]);

  // Drag handling hook
  const {
    draggedId,
    preview,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel
  } = useDragHandling({
    widgets: filteredWidgets,
    cols,
    rows,
    cellWidth,
    cellHeight,
    onWidgetMove: moveWidget
  });

  // Initialize widgets from props
  useEffect(() => {
    if (externalWidgets.length > 0) {
      setInitialWidgets(externalWidgets);
    }
  }, [externalWidgets, setInitialWidgets]);

  // Clear preview when edit mode changes
  useEffect(() => {
    if (!isEditing) {
      handleDragCancel();
    }
  }, [isEditing, handleDragCancel]);

  // Handle addWidgetTrigger prop
  useEffect(() => {
    if (addWidgetTrigger) {
      addWidget(addWidgetTrigger.type, addWidgetTrigger.props || {});
    }
  }, [addWidgetTrigger, addWidget]);

  const toggleEditMode = () => {
    const newEditMode = !isEditing;
    setIsEditing(newEditMode);
    onEditModeChange?.(newEditMode);
  };

  // Enhanced addWidget with custom size support
  const addWidgetWithOptions = useCallback((type: string = "default", props: Record<string, any> = {}, size?: { w: number; h: number }) => {
    const widgetSize = size || defaultWidgetSize;
    addWidget(type, props); // Uses the existing addWidget with default size
    // Note: For custom sizes, we'd need to enhance the internal addWidget function
  }, [addWidget, defaultWidgetSize]);

  // Simple group visibility functions
  const setGroupVisible = useCallback((groupId: string, visible: boolean) => {
    if (visible) {
      setHiddenGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    } else {
      setHiddenGroups(prev => new Set(prev).add(groupId));
    }

    // Also update groupFilters if callback provided
    if (onGroupFiltersChange) {
      const updatedFilters = groupFilters.map(filter => 
        filter.groupId === groupId 
          ? { ...filter, visible }
          : filter
      );
      
      // Add new filter if it doesn't exist
      if (!groupFilters.some(f => f.groupId === groupId)) {
        updatedFilters.push({ groupId, visible });
      }
      
      onGroupFiltersChange(updatedFilters);
    }
  }, [groupFilters, onGroupFiltersChange]);

  const getVisibleGroups = useCallback((): string[] => {
    const visibleGroups: string[] = [];
    
    // Get all unique group IDs from widgets
    const allGroupIds = new Set(displayWidgets.map(w => w.groupId).filter(Boolean) as string[]);
    
    allGroupIds.forEach(groupId => {
      const groupFilter = groupFilters.find(f => f.groupId === groupId);
      if (groupFilter) {
        if (groupFilter.visible) visibleGroups.push(groupId);
      } else if (!hiddenGroups.has(groupId)) {
        visibleGroups.push(groupId);
      }
    });
    
    return visibleGroups;
  }, [displayWidgets, groupFilters, hiddenGroups]);

  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    addWidget: addWidgetWithOptions,
    toggleEditMode,
    setEditMode: (enabled: boolean) => {
      setIsEditing(enabled);
      onEditModeChange?.(enabled);
    },
    getEditMode: () => isEditing,
    clearAllWidgets: () => {
      setInitialWidgets([]);
      onWidgetsChange?.([]);
    },
    // Simple group filtering
    setGroupVisible,
    getVisibleGroups,
  }), [addWidgetWithOptions, toggleEditMode, isEditing, onEditModeChange, onWidgetsChange,
      setGroupVisible, getVisibleGroups]);

  const gridStyle: CSSProperties = {
    ...style,
    width: `${gridWidth}px`,
    height: `${gridHeight}px`,
    backgroundSize: `${cellWidth}px ${cellHeight}px`
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={`grid-container ${className} ${isEditing ? 'edit-mode' : ''}`}>
        {showControls && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button className="add-widget-button" onClick={() => addWidget()}>
              Add Widget
            </button>
            <button className="toggle-edit-button" onClick={toggleEditMode}>
              {isEditing ? 'View Mode' : 'Edit Mode'}
            </button>
          </div>
        )}
        <div className={`grid-inner ${isEditing ? 'edit-mode' : ''}`} style={gridStyle}>
          {filteredWidgets.map((widget: WidgetState) => {
            const Renderer = widgetRenderers?.[widget.type];
            return (
              <DraggableItem
                key={widget.id}
                id={widget.id}
                x={widget.x}
                y={widget.y}
                w={widget.width}
                h={widget.height}
                minW={widget.minW ?? defaultSizeLimits.minW}
                minH={widget.minH ?? defaultSizeLimits.minH}
                maxW={widget.maxW ?? defaultSizeLimits.maxW}
                maxH={widget.maxH ?? defaultSizeLimits.maxH}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                onResize={resizeWidget}
                showPreview={draggedId === widget.id}
                previewState={preview && preview.id === widget.id ? preview : undefined}
                isEditing={isEditing}
                onDelete={deleteWidget}
              >
                {Renderer ? <Renderer {...(widget.props || {})} /> : <div style={{ padding: '1rem' }}>Widget {widget.id}</div>}
              </DraggableItem>
            );
          })}
          {preview && isEditing && (
            <>
              <div
                className={`widget-preview active`}
                style={{
                  position: 'absolute',
                  left: `${preview.x * cellWidth}px`,
                  top: `${preview.y * cellHeight}px`,
                  width: `${preview.width * cellWidth - 1}px`,
                  height: `${preview.height * cellWidth - 1}px`,
                  pointerEvents: 'none',
                  transition: 'all 0.1s ease'
                }}
              />
              {Array.isArray(preview.reflowPreviews) && preview.reflowPreviews.map((reflowPreview: any) => (
                <div
                  key={reflowPreview.id}
                  className="widget-preview reflow"
                  style={{
                    position: 'absolute',
                    left: `${reflowPreview.x * cellWidth}px`,
                    top: `${reflowPreview.y * cellHeight}px`,
                    width: `${reflowPreview.width * cellWidth - 1}px`,
                    height: `${reflowPreview.height * cellHeight - 1}px`,
                    pointerEvents: 'none',
                    transition: 'all 0.1s ease'
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </DndContext>
  );
});

// Add display name for debugging
WidgetGrid.displayName = 'WidgetGrid';
