import React, { useState } from 'react';
import { WidgetGrid } from '../src/WidgetGrid';
import type { WidgetState } from '../src/types';

// Sample widget renderers
const WidgetRenderers = {
  chart: ({ title = 'Chart', type = 'bar' }: { title?: string; type?: string }) => (
    <div style={{ padding: '8px', background: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px', height: '100%' }}>
      <strong>📊 {title}</strong>
      <div style={{ fontSize: '12px', color: '#666' }}>{type}</div>
    </div>
  ),
  table: ({ rows = 5 }: { rows?: number }) => (
    <div style={{ padding: '8px', background: '#f3e5f5', border: '1px solid #9c27b0', borderRadius: '4px', height: '100%' }}>
      <strong>📋 Table</strong>
      <div style={{ fontSize: '12px', color: '#666' }}>{rows} rows</div>
    </div>
  ),
  text: ({ content = 'Sample text' }: { content?: string }) => (
    <div style={{ padding: '8px', background: '#fff3e0', border: '1px solid #ff9800', borderRadius: '4px', height: '100%' }}>
      <strong>📝 Text</strong>
      <div style={{ fontSize: '12px', color: '#666' }}>{content}</div>
    </div>
  ),
  metric: ({ value = '42', label = 'Metric' }: { value?: string; label?: string }) => (
    <div style={{ padding: '8px', background: '#e8f5e8', border: '1px solid #4caf50', borderRadius: '4px', height: '100%', textAlign: 'center' }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#666' }}>{label}</div>
    </div>
  )
};

export default function SimpleHoverToAddExample() {
  const [widgets, setWidgets] = useState<WidgetState[]>([
    { id: 'demo-1', x: 1, y: 1, width: 3, height: 2, type: 'chart', props: { title: 'Sales Chart', type: 'line' } },
    { id: 'demo-2', x: 5, y: 1, width: 2, height: 2, type: 'metric', props: { value: '$1.2M', label: 'Revenue' } },
  ]);

  // Available widgets for hover-to-add with size constraints
  const availableWidgets = [
    { 
      type: 'chart', 
      name: 'Chart Widget', 
      icon: '📊', 
      defaultSize: { w: 3, h: 2 },
      minSize: { w: 3, h: 2 } 
    },
    { 
      type: 'table', 
      name: 'Table Widget', 
      icon: '📋', 
      defaultSize: { w: 4, h: 3 },
      minSize: { w: 4, h: 3 } 
    },
    { 
      type: 'text', 
      name: 'Text Widget', 
      icon: '📝', 
      defaultSize: { w: 3, h: 1 },
      minSize: { w: 2, h: 1 }  // Minimum 2x1 for text
    },
    { 
      type: 'metric', 
      name: 'Metric Widget', 
      icon: '🔢', 
      defaultSize: { w: 2, h: 2 },
      minSize: { w: 1, h: 1 }  // Can be very small
    }
  ];

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Hover-to-Add Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        💡 <strong>How to use:</strong> Toggle edit mode, then hover over empty space to see a "+" button. 
        Click it to choose a widget type, drag to resize (respects minimum sizes), then click to place!<br/>
        📏 <strong>Size constraints:</strong> Charts (min 2x2), Tables (min 3x2), Text (min 2x1), Metrics (min 1x1)
      </p>
      
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', background: '#fafafa' }}>
        <WidgetGrid
          cols={10}
          rows={8}
          cellWidth={60}
          cellHeight={60}
          initialWidgets={widgets}
          onWidgetsChange={setWidgets}
          widgetRenderers={WidgetRenderers}
          showControls={true}
          enableHoverToAdd={true}
          availableWidgets={availableWidgets}
          interactionModes={{
            editable: true,
            draggable: true,
            resizable: true,
            viewMode: false
          }}
        />
      </div>

      <div style={{ marginTop: '2rem', background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        <h3>✨ Features Demonstrated:</h3>
        <ul style={{ marginLeft: '1rem' }}>
          <li><strong>Hover-to-Add:</strong> Hover over empty space in edit mode to see "+" button</li>
          <li><strong>Widget Selection:</strong> Click "+" to see available widget types with icons</li>
          <li><strong>Resize-to-Place:</strong> Drag to set size, click to confirm placement</li>
          <li><strong>Right-Click Cancel:</strong> Right-click anywhere to cancel widget placement</li>
          <li><strong>Traditional Controls:</strong> Toggle edit mode and use standard resize/move/delete</li>
        </ul>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
        <strong>Current widgets:</strong> {widgets.length} | 
        <strong> Grid:</strong> 10×8 cells | 
        <strong> Cell size:</strong> 60×60px
      </div>
    </div>
  );
}
