// GridTech React - Main Export File
import './styles.css';

export { WidgetGrid } from './WidgetGrid';
export type { WidgetGridRef, GridConfig } from './WidgetGrid';
export { DraggableItem } from './DraggableItem/DraggableItem';

// Export types
export type { 
  WidgetState, 
  PreviewState,
  GroupFilter,
  InteractionModes,
  AvailableWidget,
  WidgetPlacementState
} from './types';

// Export hooks for advanced usage
export { useWidgetActions } from './hooks/useWidgetActions';
export { useDragHandling } from './hooks/useDragHandling';
export { useResponsiveGrid } from './hooks/useResponsiveGrid';

// Export utilities
export * from './utils/gridUtils';
export * from './utils/grid/gridCollision';
export * from './utils/grid/gridMath';
export * from './utils/grid/gridPlacement';
