declare module 'bezier-easing-editor' {
  import { ComponentType, ForwardRefExoticComponent, RefAttributes } from 'react';

  interface BezierEditorProps {
    value: [number, number, number, number];
    onChange?: (value: [number, number, number, number]) => void;
    width?: number;
    height?: number;
    padding?: [number, number, number, number];
    handleRadius?: number;
    style?: React.CSSProperties;
    className?: string;
    progress?: number;
    handleStroke?: number;
    background?: string;
    gridColor?: string;
    curveColor?: string;
    curveWidth?: number;
    handleColor?: string;
    progressColor?: string;
    textStyle?: React.CSSProperties;
  }

  const BezierEditor: ForwardRefExoticComponent<BezierEditorProps & RefAttributes<any>>;
  export default BezierEditor;
} 