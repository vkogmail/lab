declare module 'react-bezier-spline-editor/core' {
  export interface Point {
    x: number;
    y: number;
  }
}

declare module 'react-bezier-spline-editor/react' {
  import { Point } from 'react-bezier-spline-editor/core';
  export interface BezierSplineEditorProps {
    points: Point[];
    onPointsChange: (points: Point[]) => void;
  }
  export function BezierSplineEditor(props: BezierSplineEditorProps): JSX.Element;
} 