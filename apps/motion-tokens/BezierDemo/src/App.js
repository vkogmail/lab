// import { BezierCurveEditor } from "react-bezier-curve-editor";
import BezierCurveEditor from "./bezierCurveEditor";
import "./styles.css";
import bezierEditorBg from "./bezierCurveEditor/bezierEditorBg.png";

export default function App() {
  return (
    <div className="App">
      <h1>Bezier Curve Editor</h1>
      <BezierCurveEditor
        size={208}
        outerAreaSize={0}
        handleLineStrokeWidth={2}
        borderRadiusContainer={8}
        background={bezierEditorBg}
        handleLineColor={"#64B5FF"}
        axisColor={"transparent"}
        outerAreaColor={"#fafafa"}
        onChange={(value) => console.log("value", value)}
      />
    </div>
  );
}
