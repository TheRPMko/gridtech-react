import { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { DndContext } from '@dnd-kit/core';
import { DraggableItem } from './DraggableItem/DraggableItem';
import type { WidgetState, GroupFilter, InteractionModes, AvailableWidget, WidgetPlacementState } from './types';
import { useWidgetActions } from './hooks/useWidgetActions';
import { useDragHandling } from './hooks/useDragHandling';
import { useResponsiveGrid } from './hooks/useResponsiveGrid';
import { validateWidgetPosition } from './utils/gridUtils';

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
  
  // Interaction mode controls
  /** Control which interactions are enabled (editable, draggable, resizable, viewMode) */
  interactionModes?: InteractionModes;
  
  // Hover-to-add widget functionality
  /** Enable hover-to-add widget functionality in edit mode */
  enableHoverToAdd?: boolean;
  /** Available widget types that can be added via hover-to-add */
  availableWidgets?: AvailableWidget[];
}

export interface WidgetGridRef {
  addWidget: (type?: string, props?: Record<string, any>) => void;
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
  interactionModes = {},
  enableHoverToAdd = false,
  availableWidgets = [],
}, ref) => {
  const [isEditing, setIsEditing] = useState(defaultEditMode);
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());
  
  // Hover-to-add state
  const [hoverCell, setHoverCell] = useState<{x: number, y: number} | null>(null);
  const [showWidgetSelector, setShowWidgetSelector] = useState<{x: number, y: number} | null>(null);
  const [placementMode, setPlacementMode] = useState<WidgetPlacementState | null>(null);

  // Compute effective interaction modes
  const effectiveInteractionModes = useMemo(() => {
    const {
      editable = true,
      draggable = true,
      resizable = true,
      viewMode = false,
    } = interactionModes;

    // viewMode overrides everything to read-only (except draggable if explicitly enabled)
    if (viewMode) {
      return {
        editable: false,
        draggable: draggable, // Allow drag even in view mode if explicitly enabled
        resizable: false,
        viewMode: true,
      };
    }

    return { editable, draggable, resizable, viewMode };
  }, [interactionModes]);

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
  addWidgetFromExternal,
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
    handleDragStart: baseDragStart,
    handleDragMove: baseDragMove,
    handleDragEnd: baseHandleDragEnd,
    handleDragCancel: baseDragCancel
  } = useDragHandling({
    widgets: filteredWidgets,
    cols,
    rows,
    cellWidth,
    cellHeight,
    onWidgetMove: effectiveInteractionModes.draggable ? moveWidget : () => {}
  });

  // Simple drag handlers
  const handleDragStart = (event: any) => {
    if (!effectiveInteractionModes.draggable) return;
    baseDragStart(event);
  };

  const handleDragMove = (event: any) => {
    if (!effectiveInteractionModes.draggable) return;
    baseDragMove(event);
  };

  const handleDragEnd = (event: any) => {
    if (!effectiveInteractionModes.draggable) return;
    baseHandleDragEnd(event);
  };

  const handleDragCancel = () => {
    baseDragCancel();
  };

  // Hover-to-add functionality
  const checkIsEmptyCell = useCallback((x: number, y: number) => {
    return !filteredWidgets.some(w => 
      x >= w.x && x < w.x + w.width && 
      y >= w.y && y < w.y + w.height
    );
  }, [filteredWidgets]);

  const handleGridMouseMove = useCallback((e: React.MouseEvent) => {
    if (!enableHoverToAdd || !isEditing || !effectiveInteractionModes.editable || placementMode) {
      setHoverCell(null);
      return;
    }
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellWidth);
    const y = Math.floor((e.clientY - rect.top) / cellHeight);
    
    // Check bounds and if cell is empty
    if (x >= 0 && x < cols && y >= 0 && y < rows && checkIsEmptyCell(x, y)) {
      setHoverCell({ x, y });
    } else {
      setHoverCell(null);
    }
  }, [enableHoverToAdd, isEditing, effectiveInteractionModes.editable, placementMode, cellWidth, cellHeight, cols, rows, checkIsEmptyCell]);

  const handleGridMouseLeave = useCallback(() => {
    setHoverCell(null);
  }, []);

  const handleAddWidgetClick = useCallback((cell: {x: number, y: number}) => {
    if (availableWidgets.length === 0) return;
    setShowWidgetSelector(cell);
    setHoverCell(null);
  }, [availableWidgets]);

  const startWidgetPlacement = useCallback((widgetType: AvailableWidget, startCell: {x: number, y: number}) => {
    setShowWidgetSelector(null);
    
    // Respect minimum size constraints with proper fallbacks
    const defaultW = widgetType.defaultSize?.w ?? 2;
    const defaultH = widgetType.defaultSize?.h ?? 2;
    const minW = widgetType.minSize?.w ?? defaultSizeLimits?.minW ?? 2;
    const minH = widgetType.minSize?.h ?? defaultSizeLimits?.minH ?? 2;
    
    setPlacementMode({
      type: widgetType.type,
      startX: startCell.x,
      startY: startCell.y,
      currentW: Math.max(minW, defaultW),
      currentH: Math.max(minH, defaultH)
    });
  }, [defaultSizeLimits]);

  const handlePlacementMouseMove = useCallback((e: React.MouseEvent) => {
    if (!placementMode) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const endX = Math.floor((e.clientX - rect.left) / cellWidth);
    const endY = Math.floor((e.clientY - rect.top) / cellHeight);
    
    // Find the widget type configuration to get minimum size with proper fallbacks
    const widgetType = availableWidgets.find(w => w.type === placementMode.type);
    const minW = widgetType?.minSize?.w ?? defaultSizeLimits?.minW ?? 2;
    const minH = widgetType?.minSize?.h ?? defaultSizeLimits?.minH ?? 2;
    
    setPlacementMode(prev => prev ? {
      ...prev,
      currentW: Math.max(minW, Math.min(cols - prev.startX, endX - prev.startX + 1)),
      currentH: Math.max(minH, Math.min(rows - prev.startY, endY - prev.startY + 1))
    } : null);
  }, [placementMode, cellWidth, cellHeight, cols, rows, availableWidgets, defaultSizeLimits]);

  const handlePlacementClick = useCallback(() => {
    if (!placementMode) return;
    
    // Create widget with specific position and size
    const newWidget: WidgetState = {
      id: `${placementMode.type}-${Date.now()}`,
      x: placementMode.startX,
      y: placementMode.startY,
      width: placementMode.currentW,
      height: placementMode.currentH,
      type: placementMode.type
    };
    
    // Check for collisions with existing widgets
    const hasCollision = displayWidgets.some(existingWidget => 
      newWidget.x < existingWidget.x + existingWidget.width &&
      newWidget.x + newWidget.width > existingWidget.x &&
      newWidget.y < existingWidget.y + existingWidget.height &&
      newWidget.y + newWidget.height > existingWidget.y
    );
    
    if (hasCollision && preventOverlap) {
      // If collision detected and preventOverlap is enabled, try to find a new position
      const { isValid, suggestedPosition } = validateWidgetPosition(
        newWidget,
        displayWidgets,
        cols,
        rows,
        true
      );
      
      if (!isValid && suggestedPosition) {
        newWidget.x = suggestedPosition.x;
        newWidget.y = suggestedPosition.y;
      } else if (!isValid) {
        // Can't place widget anywhere, cancel placement
        setPlacementMode(null);
        return;
      }
    }
    
    // Add the widget (with potential position adjustment)
    const updatedWidgets = [...displayWidgets, newWidget];
    setInitialWidgets(updatedWidgets);
    onWidgetsChange?.(updatedWidgets);
    onWidgetAdd?.(newWidget);
    
    setPlacementMode(null);
  }, [placementMode, displayWidgets, setInitialWidgets, onWidgetsChange, onWidgetAdd, preventOverlap, cols, rows]);

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setShowWidgetSelector(null);
    setPlacementMode(null);
    setHoverCell(null);
  }, []);

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
    getVisibleGroups
  }), [addWidgetWithOptions, toggleEditMode, isEditing, onEditModeChange, onWidgetsChange,
      setGroupVisible, getVisibleGroups, setInitialWidgets]);

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
      <GridContent />
    </DndContext>
  );

  function GridContent() {
    return (
      <div className={`grid-container ${className} ${isEditing && effectiveInteractionModes.editable ? 'edit-mode' : ''}`}>
        {showControls && effectiveInteractionModes.editable && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button className="add-widget-button" onClick={() => addWidget()}>
              Add Widget
            </button>
            <button className="toggle-edit-button" onClick={toggleEditMode}>
              {isEditing ? 'View Mode' : 'Edit Mode'}
            </button>
          </div>
        )}
        <div 
          className={`grid-inner ${isEditing && effectiveInteractionModes.editable ? 'edit-mode' : ''}`} 
          style={gridStyle}
          onMouseMove={placementMode ? handlePlacementMouseMove : handleGridMouseMove}
          onMouseLeave={handleGridMouseLeave}
          onClick={placementMode ? handlePlacementClick : undefined}
          onContextMenu={handleRightClick}
        >
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
                onResize={effectiveInteractionModes.resizable ? resizeWidget : () => {}}
                showPreview={draggedId === widget.id}
                previewState={preview && preview.id === widget.id ? preview : undefined}
                isEditing={isEditing && effectiveInteractionModes.editable}
                onDelete={effectiveInteractionModes.editable ? deleteWidget : undefined}
                isDraggable={effectiveInteractionModes.draggable}
              >
                {Renderer ? <Renderer {...(widget.props || {})} /> : <div style={{ padding: '1rem' }}>Widget {widget.id}</div>}
              </DraggableItem>
            );
          })}
          
          {/* Hover-to-add: Show "+" button on empty cells */}
          {enableHoverToAdd && hoverCell && isEditing && effectiveInteractionModes.editable && !placementMode && !draggedId && (
            <div 
              className="add-widget-placeholder"
              style={{
                position: 'absolute',
                left: hoverCell.x * cellWidth,
                top: hoverCell.y * cellHeight,
                width: cellWidth - 2, // Account for gaps/borders
                height: cellHeight - 2, // Account for gaps/borders
                border: '2px dashed #2196f3',
                background: 'rgba(33, 150, 243, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '24px',
                color: '#2196f3',
                zIndex: 999,
                borderRadius: '4px'
              }}
              onClick={() => handleAddWidgetClick(hoverCell)}
            >
              +
            </div>
          )}
          
          {/* Widget type selector */}
          {showWidgetSelector && (
            <div 
              className="widget-selector"
              style={{
                position: 'absolute',
                left: Math.min(showWidgetSelector.x * cellWidth, gridWidth - 200),
                top: Math.min(showWidgetSelector.y * cellHeight, gridHeight - 100),
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '180px'
              }}
            >
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>
                Choose Widget Type:
              </div>
              {availableWidgets.map(widget => (
                <div
                  key={widget.type}
                  className="widget-option"
                  onClick={() => startWidgetPlacement(widget, showWidgetSelector)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '18px' }}>{widget.icon || '📦'}</span>
                  <span style={{ fontSize: '14px' }}>{widget.name}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #eee', marginTop: '4px', paddingTop: '4px' }}>
                <div style={{ fontSize: '11px', color: '#999', textAlign: 'center' }}>
                  Right-click to cancel
                </div>
              </div>
            </div>
          )}
          
          {/* Widget placement preview */}
          {placementMode && (
            (() => {
              // Check if placement would cause collision
              const tempWidget = {
                x: placementMode.startX,
                y: placementMode.startY,
                width: placementMode.currentW,
                height: placementMode.currentH
              };
              
              const hasCollision = displayWidgets.some(existingWidget => 
                tempWidget.x < existingWidget.x + existingWidget.width &&
                tempWidget.x + tempWidget.width > existingWidget.x &&
                tempWidget.y < existingWidget.y + existingWidget.height &&
                tempWidget.y + tempWidget.height > existingWidget.y
              );
              
              return (
                <div
                  className="widget-placement-preview"
                  style={{
                    position: 'absolute',
                    left: placementMode.startX * cellWidth,
                    top: placementMode.startY * cellHeight,
                    width: placementMode.currentW * cellWidth - 2,
                    height: placementMode.currentH * cellHeight - 2,
                    border: `2px solid ${hasCollision ? '#f44336' : '#4caf50'}`,
                    background: hasCollision ? 'rgba(244, 67, 54, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    zIndex: 998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: hasCollision ? '#c62828' : '#2e7d32',
                    fontWeight: 'bold'
                  }}
                >
                  {placementMode.currentW} × {placementMode.currentH}
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '4px', 
                    right: '4px', 
                    fontSize: '10px', 
                    opacity: 0.7 
                  }}>
                    {hasCollision ? (preventOverlap ? 'Will reposition' : 'Overlapping') : 'Click to place'}
                  </div>
                </div>
              );
            })()
          )}
          
          {preview && isEditing && effectiveInteractionModes.editable && (
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
    );
  }
});

// Add display name for debugging
WidgetGrid.displayName = 'WidgetGrid';
