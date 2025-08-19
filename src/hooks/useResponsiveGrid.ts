// GridTech responsive calculations hook
import { useState, useEffect } from 'react';
import { getCellSize } from '../utils/grid/gridMath';

export interface UseResponsiveGridProps {
  cols: number;
  rows: number;
  maxWidth?: number;
  maxHeight?: number;
  minCellSize?: number;
}

export function useResponsiveGrid({
  cols,
  rows,
  maxWidth = 1200,
  maxHeight = 600,
  minCellSize = 20
}: UseResponsiveGridProps) {
  const [windowSize, setWindowSize] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculateDimensions = () => {
    const availableWidth = Math.min(windowSize.width - 80, maxWidth);
    const availableHeight = Math.min(windowSize.height - 200, maxHeight);
    
    const { cellWidth, cellHeight } = getCellSize(availableWidth, availableHeight, cols, rows);
    const responsiveCellSize = Math.min(cellWidth, cellHeight);

    return {
      cellWidth: Math.max(responsiveCellSize, minCellSize),
      cellHeight: Math.max(responsiveCellSize, minCellSize)
    };
  };

  const dimensions = calculateDimensions();

  return {
    cellWidth: dimensions.cellWidth,
    cellHeight: dimensions.cellHeight,
    gridWidth: cols * dimensions.cellWidth,
    gridHeight: rows * dimensions.cellHeight
  };
}
