export type GridPosition = [number, number];

export interface Widget {
  id: string;
  w?: number;
  h?: number;
}

export interface WidgetSizeLimits {
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface WidgetState extends WidgetSizeLimits {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  props?: Record<string, any>;
}

export interface PreviewState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isValid: boolean;
  reflowPreviews?: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

export interface WidgetProps extends WidgetSizeLimits {
  id: string;
  onDragEnd: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  x: number;
  y: number;
  width: number;
  height: number;
  showPreview?: boolean;
  previewState?: PreviewState;
}
