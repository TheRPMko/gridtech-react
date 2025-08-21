# Simple Group Filtering

GridTech React now supports simple group filtering - widgets can be assigned a `groupId` and then shown/hidden as a group.

## Features

- **Group Assignment**: Assign widgets to groups using the `groupId` property
- **Show/Hide Groups**: Toggle visibility of entire groups
- **Simple API**: Just two methods: `setGroupVisible()` and `getVisibleGroups()`

## Types

```typescript
interface WidgetState {
  // ... existing properties
  groupId?: string;        // Optional group assignment
}

interface GroupFilter {
  groupId: string;
  visible: boolean;
}
```

## Usage

### Basic Setup

```tsx
import React, { useState, useRef } from 'react';
import { WidgetGrid, WidgetState, GroupFilter, WidgetGridRef } from 'gridtech-react';

function App() {
  const gridRef = useRef<WidgetGridRef>(null);
  const [widgets, setWidgets] = useState<WidgetState[]>([]);
  const [groupFilters, setGroupFilters] = useState<GroupFilter[]>([]);

  return (
    <WidgetGrid
      ref={gridRef}
      cols={24}
      rows={12}
      initialWidgets={widgets}
      onWidgetsChange={setWidgets}
      groupFilters={groupFilters}
      onGroupFiltersChange={setGroupFilters}
      widgetRenderers={widgetRenderers}
    />
  );
}
```

### Group Management

```tsx
// Hide a group
gridRef.current?.setGroupVisible('red-pixels', false);

// Show a group
gridRef.current?.setGroupVisible('red-pixels', true);

// Get all visible groups
const visibleGroups = gridRef.current?.getVisibleGroups();
```

### Widget Configuration with Groups

```tsx
const widgets: WidgetState[] = [
  {
    id: 'widget-1',
    type: 'chart',
    x: 0,
    y: 0,
    width: 4,
    height: 3,
    groupId: 'dashboard-charts',     // Assign to group
    props: { title: 'Sales Chart' }
  },
  {
    id: 'widget-2',
    type: 'metric',
    x: 4,
    y: 0,
    width: 2,
    height: 2,
    groupId: 'dashboard-charts',     // Same group
    props: { value: 1234, label: 'Total Sales' }
  }
];
```

## Pixel Art Example

Perfect for pixel art applications where each color is a group:

```tsx
// Assign color as groupId when painting
const handlePixelClick = (pixelId: string) => {
  setWidgets(prev => prev.map(widget => 
    widget.id === pixelId 
      ? { 
          ...widget, 
          props: { ...widget.props, color: selectedColor },
          groupId: selectedColor // Use color as group ID
        }
      : widget
  ));
};

// Toggle color visibility
const toggleColorGroup = (color: string) => {
  gridRef.current?.setGroupVisible(color, !isColorVisible);
};
```

## API Reference

### WidgetGridRef Methods

```typescript
interface WidgetGridRef {
  // ... existing methods
  
  // Simple group filtering
  setGroupVisible(groupId: string, visible: boolean): void;
  getVisibleGroups(): string[];
}
```

### WidgetGrid Props

```typescript
interface WidgetGridProps {
  // ... existing props

  // Group filters
  groupFilters?: GroupFilter[];
  onGroupFiltersChange?: (filters: GroupFilter[]) => void;
}
```

## How It Works

1. **Assign Groups**: Set `groupId` on widgets to group them
2. **Filter State**: Use `groupFilters` prop or internal state to track visibility
3. **Show/Hide**: Widgets are filtered out if their group is marked as not visible
4. **Simple Logic**: A widget is shown if:
   - It has no `groupId` (always visible)
   - Its `groupId` is not in any filter (visible by default)  
   - Its `groupId` has a filter with `visible: true`

## Use Cases

- **Pixel Art**: Group pixels by color for easy show/hide
- **Dashboard Categories**: Group widgets by type (charts, metrics, tables)
- **Layer Management**: Create layers of related widgets
- **User Preferences**: Let users customize which widget groups to see

## Migration from Complex Filters

If you were using the previous complex filter system, here's how to migrate:

**Before (Complex):**
```tsx
const filter = {
  name: 'Hide Red Pixels',
  enabled: true,
  type: 'hide',
  applyToGroup: 'red-pixels'
};
```

**After (Simple):**
```tsx
const groupFilter = {
  groupId: 'red-pixels',
  visible: false
};
```

The new approach is much simpler and covers 90% of use cases where you just want to show/hide groups of related widgets.
