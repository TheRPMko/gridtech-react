import React, { useState, useRef } from 'react';
import { WidgetGrid, WidgetState, GroupFilter, WidgetGridRef } from '../src';

// Simple pixel widget
const PixelWidget = ({ color, onClick }: { color: string; onClick?: () => void }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      backgroundColor: color || '#ffffff',
      border: '1px solid #ddd',
      cursor: 'pointer'
    }}
    onClick={onClick}
  />
);

const SimplePixelArtExample: React.FC = () => {
  const gridRef = useRef<WidgetGridRef>(null);
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  
  // Create initial pixel grid (16x16)
  const createPixelGrid = (): WidgetState[] => {
    const pixels: WidgetState[] = [];
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        pixels.push({
          id: `pixel-${x}-${y}`,
          type: 'pixel',
          x,
          y,
          width: 1,
          height: 1,
          props: { 
            color: '#ffffff',
            onClick: () => handlePixelClick(`pixel-${x}-${y}`)
          }
        });
      }
    }
    return pixels;
  };

  const [widgets, setWidgets] = useState<WidgetState[]>(createPixelGrid());
  const [groupFilters, setGroupFilters] = useState<GroupFilter[]>([]);

  const handlePixelClick = (pixelId: string) => {
    setWidgets(prev => {
      return prev.map(widget => {
        if (widget.id === pixelId) {
          // Assign the current color as groupId
          return { 
            ...widget, 
            props: { ...widget.props, color: selectedColor },
            groupId: selectedColor // Use color as group ID
          };
        }
        return widget;
      });
    });
  };

  const widgetRenderers = {
    pixel: PixelWidget,
  };

  // Get unique colors used as groups
  const getUsedColors = (): string[] => {
    const colors = new Set<string>();
    widgets.forEach(widget => {
      if (widget.groupId && widget.groupId !== '#ffffff') {
        colors.add(widget.groupId);
      }
    });
    return Array.from(colors);
  };

  // Toggle visibility of a color group
  const toggleColorGroup = (color: string) => {
    const currentFilter = groupFilters.find(f => f.groupId === color);
    const newVisible = currentFilter ? !currentFilter.visible : false;
    
    const updatedFilters = groupFilters.filter(f => f.groupId !== color);
    updatedFilters.push({ groupId: color, visible: newVisible });
    
    setGroupFilters(updatedFilters);
    gridRef.current?.setGroupVisible(color, newVisible);
  };

  // Clear all pixels
  const clearCanvas = () => {
    setWidgets(prev => prev.map(widget => ({
      ...widget,
      props: { ...widget.props, color: '#ffffff' },
      groupId: undefined
    })));
    setGroupFilters([]);
  };

  const usedColors = getUsedColors();

  return (
    <div style={{ padding: '20px' }}>
      <h2>Simple Pixel Art with Group Filtering</h2>
      <p>Click pixels to paint, then use color buttons to show/hide groups.</p>
      
      {/* Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <label>Paint Color: </label>
          <input 
            type="color" 
            value={selectedColor} 
            onChange={(e) => setSelectedColor(e.target.value)}
            style={{ marginLeft: '5px' }}
          />
        </div>
        
        <button onClick={clearCanvas}>Clear Canvas</button>
        
        {/* Color group toggles */}
        {usedColors.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <span>Show/Hide Colors:</span>
            {usedColors.map(color => {
              const filter = groupFilters.find(f => f.groupId === color);
              const isVisible = filter ? filter.visible : true;
              
              return (
                <button
                  key={color}
                  onClick={() => toggleColorGroup(color)}
                  style={{
                    backgroundColor: color,
                    border: `2px solid ${isVisible ? '#000' : '#ccc'}`,
                    width: '30px',
                    height: '30px',
                    cursor: 'pointer',
                    opacity: isVisible ? 1 : 0.5
                  }}
                  title={`${isVisible ? 'Hide' : 'Show'} ${color} pixels`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Info */}
      {usedColors.length > 0 && (
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
          <p>Active Colors: {usedColors.length} | 
             Visible Groups: {gridRef.current?.getVisibleGroups().length || 0}
          </p>
        </div>
      )}

      {/* Pixel Grid */}
      <WidgetGrid
        ref={gridRef}
        cols={16}
        rows={16}
        initialWidgets={widgets}
        onWidgetsChange={setWidgets}
        groupFilters={groupFilters}
        onGroupFiltersChange={setGroupFilters}
        widgetRenderers={widgetRenderers}
        preventOverlap={false}
        defaultEditMode={false}
        showControls={false}
      />
    </div>
  );
};

export default SimplePixelArtExample;
