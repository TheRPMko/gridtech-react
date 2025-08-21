# GridTech React

A responsive, drag-and-drop widget grid component for React applications.

## Features

- 🎯 **Responsive Grid**: Automatically scales to fit any screen size
- 🖱️ **Drag & Drop**: Intuitive widget positioning with collision detection
- 🧩 **Custom Widgets**: Easy integration of any React component
- 📐 **Flexible Layout**: Configurable grid dimensions and widget sizes
- 🎨 **Themeable**: Customizable styling with CSS variables
- ⚡ **Performance**: Optimized for smooth interactions
- 🔍 **Group Filtering**: Show/hide groups of widgets

## Requirements

- React 18.0+ or React 19.0+
- TypeScript 5.0+ (optional but recommended)

## Installation

```bash
npm install gridtech-react
```

## Quick Start

```tsx
import React, { useState } from 'react';
import { WidgetGrid, WidgetState } from 'gridtech-react';
import 'gridtech-react/dist/index.css';

// Define your custom widgets
const MyWidget = ({ title }: { title: string }) => (
  <div style={{ padding: '1rem' }}>
    <h3>{title}</h3>
    <p>This is a custom widget!</p>
  </div>
);

const widgetRenderers = {
  custom: MyWidget,
};

function App() {
  const [widgets, setWidgets] = useState<WidgetState[]>([
    {
      id: 'widget-1',
      type: 'custom',
      x: 0,
      y: 0,
      width: 4,
      height: 3,
      props: { title: 'Hello World' }
    }
  ]);

  return (
    <WidgetGrid
      cols={24}
      rows={12}
      initialWidgets={widgets}
      onWidgetsChange={setWidgets}
      widgetRenderers={widgetRenderers}
      preventOverlap={true}
      defaultEditMode={true}
    />
  );
}

export default App;
```

## API Reference

### WidgetGrid Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cols` | `number` | `24` | Number of grid columns |
| `rows` | `number` | `12` | Number of grid rows |
| `initialWidgets` | `WidgetState[]` | `[]` | Array of widget configurations |
| `onWidgetsChange` | `(widgets: WidgetState[]) => void` | - | Callback when widgets change |
| `widgetRenderers` | `{ [type: string]: ComponentType }` | - | Map of widget types to components |
| `preventOverlap` | `boolean` | `false` | Prevent widgets from overlapping |
| `defaultEditMode` | `boolean` | `false` | Start in edit mode |
| `groupFilters` | `GroupFilter[]` | `[]` | Array of group visibility filters |
| `onGroupFiltersChange` | `(filters: GroupFilter[]) => void` | - | Callback when group filters change |

### WidgetState Interface

```typescript
interface WidgetState {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props?: Record<string, any>;
  groupId?: string;  // Optional group assignment for filtering
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}
```

### GroupFilter Interface

```typescript
interface GroupFilter {
  groupId: string;
  visible: boolean;
}
```

## Advanced Usage

### Custom Hooks

```tsx
import { useWidgetActions, useResponsiveGrid } from 'gridtech-react';

const MyCustomGrid = () => {
  const { widgets, addWidget, moveWidget } = useWidgetActions({
    cols: 24,
    rows: 12,
    preventOverlap: true,
    defaultWidgetSize: { w: 4, h: 3 }
  });

  const { cellWidth, cellHeight } = useResponsiveGrid({
    cols: 24,
    rows: 12
  });

  return (
    <div>
      <button onClick={() => addWidget('custom', { title: 'New Widget' })}>
        Add Widget
      </button>
      {/* Your custom grid implementation */}
    </div>
  );
};
```

## Group Filtering

GridTech React supports simple group filtering - perfect for organizing widgets by category:

```tsx
import React, { useState, useRef } from 'react';
import { WidgetGrid, WidgetState, GroupFilter, WidgetGridRef } from 'gridtech-react';

function App() {
  const gridRef = useRef<WidgetGridRef>(null);
  const [widgets, setWidgets] = useState<WidgetState[]>([
    {
      id: 'chart-1',
      type: 'chart',
      x: 0, y: 0, width: 4, height: 3,
      groupId: 'analytics',  // Assign to group
      props: { title: 'Sales Chart' }
    },
    {
      id: 'metric-1', 
      type: 'metric',
      x: 4, y: 0, width: 2, height: 2,
      groupId: 'kpi', // Different group
      props: { value: 1234, label: 'Total Sales' }
    }
  ]);
  
  const [groupFilters, setGroupFilters] = useState<GroupFilter[]>([]);

  // Hide/show groups
  const toggleGroup = (groupId: string, visible: boolean) => {
    gridRef.current?.setGroupVisible(groupId, visible);
  };

  return (
    <div>
      <button onClick={() => toggleGroup('analytics', false)}>
        Hide Analytics
      </button>
      <button onClick={() => toggleGroup('kpi', false)}>
        Hide KPIs  
      </button>
      
      <WidgetGrid
        ref={gridRef}
        cols={24} rows={12}
        initialWidgets={widgets}
        onWidgetsChange={setWidgets}
        groupFilters={groupFilters}
        onGroupFiltersChange={setGroupFilters}
        widgetRenderers={widgetRenderers}
      />
    </div>
  );
}
```

[📖 **Full Group Filtering Documentation**](docs/SIMPLE_GROUP_FILTERING.md)

### Styling

GridTech uses CSS custom properties for easy theming:

```css
:root {
  --grid-background: #f5f5f5;
  --grid-border: #e0e0e0;
  --widget-background: white;
  --widget-border: #ddd;
  --widget-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

## License

MIT
