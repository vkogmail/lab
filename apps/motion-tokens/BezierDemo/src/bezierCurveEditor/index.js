import React, { useState, useEffect } from "react";
import styles from "./index.module.scss";
import classNames from "classnames";

const defaultStateValue = {
  value: [0.4, 0, 1, 0.6], // easeIn
  startValue: [0.4, 0, 1, 0.6],
  movingStartHandle: false,
  movingStartHandleStart: { x: 0, y: 0 },
  movingEndHandle: false,
  movingEndHandleStart: { x: 0, y: 0 }
};

const BezierCurveEditor = ({
  size = 200,
  outerAreaSize = 50,
  strokeWidth = 2,
  handleLineStrokeWidth = 1,
  borderRadiusContainer = 0,
  axisColor = styles.colorDark,
  outerAreaColor,
  fixedHandleColor,
  curveLineColor,
  handleLineColor,
  startHandleColor,
  endHandleColor,
  className,
  startHandleClassName,
  startHandleActiveClassName,
  endHandleClassName,
  endHandleActiveClassName,
  value,
  onChange,
  background
}) => {
  const [state, setState] = useState({
    ...defaultStateValue,
    value: value || defaultStateValue.value
  });

  const width = size;
  const height = width;
  const startCoordinate = [0, height];
  const endCoordinate = [width, 0];
  const startBezierHandle = [
    width * state.value[0],
    height * (1 - state.value[1])
  ];
  const endBezierHandle = [
    width * state.value[2],
    height * (1 - state.value[3])
  ];

  const svgWidth = width + strokeWidth * 2;
  const svgHeight = height + strokeWidth * 2 + outerAreaSize * 2;

  const stopMovingAll = () => {
    setState({
      ...state,
      movingStartHandle: false,
      movingEndHandle: false
    });
  };

  const moveHandles = (x, y) => {
    const { startValue, movingStartHandle, movingEndHandle } = state;
    const relevantStart = movingStartHandle
      ? state.movingStartHandleStart
      : movingEndHandle
      ? state.movingEndHandleStart
      : undefined;

    if (movingStartHandle || movingEndHandle) {
      const relXMoved = (x - relevantStart.x) / width;
      const relYMoved = (y - relevantStart.y) / height;
      const nextValue = [...startValue];

      if (movingStartHandle) {
        nextValue[0] = nextValue[0] + relXMoved;
        nextValue[1] = nextValue[1] - relYMoved;
      }

      if (movingEndHandle) {
        nextValue[2] = nextValue[2] + relXMoved;
        nextValue[3] = nextValue[3] - relYMoved;
      }

      const clampedValue = clampValue(nextValue);
      if (onChange) onChange(clampedValue);

      setState({
        ...state,
        value: clampedValue
      });
    }
  };

  const clampValue = (value) => {
    const allowedOuterValue = outerAreaSize / height;
    const nextValue = [...value];
    nextValue[0] = Math.max(0, Math.min(1, nextValue[0]));
    nextValue[2] = Math.max(0, Math.min(1, nextValue[2]));
    nextValue[1] = Math.max(
      -allowedOuterValue,
      Math.min(1 + allowedOuterValue, nextValue[1])
    );
    nextValue[3] = Math.max(
      -allowedOuterValue,
      Math.min(1 + allowedOuterValue, nextValue[3])
    );
    return nextValue;
  };

  const handleStartHandleStartMoving = (event) => {
    const { value, movingStartHandle } = state;
    if (!movingStartHandle) {
      event.preventDefault();

      let startX = 0;
      let startY = 0;
      if (event.type === "touchstart") {
        startX = event.touches[0].screenX;
        startY = event.touches[0].screenY;
      } else if (event.type === "mousedown") {
        startX = event.screenX;
        startY = event.screenY;
      }

      setState({
        ...state,
        startValue: [...value],
        movingStartHandle: true,
        movingStartHandleStart: { x: startX, y: startY }
      });
    }
  };

  const handleEndHandleStartMoving = (event) => {
    const { value, movingEndHandle } = state;
    if (!movingEndHandle) {
      event.preventDefault();

      let startX = 0;
      let startY = 0;
      if (event.type === "touchstart") {
        startX = event.touches[0].screenX;
        startY = event.touches[0].screenY;
      } else if (event.type === "mousedown") {
        startX = event.screenX;
        startY = event.screenY;
      }

      setState({
        ...state,
        startValue: [...value],
        movingEndHandle: true,
        movingEndHandleStart: { x: startX, y: startY }
      });
    }
  };

  const handleWindowTouchMove = (event) => {
    const { movingStartHandle, movingEndHandle } = state;
    if (movingStartHandle || movingEndHandle) {
      const x = event.touches[0].screenX;
      const y = event.touches[0].screenY;
      moveHandles(x, y);
    }
  };

  const handleWindowMouseMove = (event) => {
    const { movingStartHandle, movingEndHandle } = state;
    if (movingStartHandle || movingEndHandle) {
      const x = event.screenX;
      const y = event.screenY;
      moveHandles(x, y);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("touchmove", handleWindowTouchMove);

    window.addEventListener("mouseup", stopMovingAll);
    window.addEventListener("touchend", stopMovingAll);
    window.addEventListener("mouseleave", stopMovingAll);
    window.addEventListener("touchcancel", stopMovingAll);

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("touchmove", handleWindowTouchMove);

      window.removeEventListener("mouseup", stopMovingAll);
      window.removeEventListener("touchend", stopMovingAll);
      window.removeEventListener("mouseleave", stopMovingAll);
      window.removeEventListener("touchcancel", stopMovingAll);
    };
  });

  return (
    <div
      className={classNames({
        [styles.rootContainer]: true,
        [className]: !!className
      })}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: `${borderRadiusContainer}px`,
        background: `${outerAreaColor}`
      }}
    >
      <div className={styles.wrap}>
        <div
          className={styles.bg}
          style={{
            left: `${strokeWidth}px`,
            width: `${width - strokeWidth}px`,
            backgroundColor: outerAreaColor
          }}
        />
        <div
          className={styles.plane}
          style={{
            top: `-8px`,
            left: `-8px`,
            width: `${width + 16}px`,
            height: `${height + 16}px`,
            borderLeft: `0px solid ${axisColor}`,
            borderBottom: `0px solid ${axisColor}`
          }}
        >
          {background && (
            <img
              className={styles.imageBackground}
              src={background}
              alt="bezier-editor-bg"
            />
          )}
        </div>
        <svg
          className={styles.curve}
          fill="none"
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          <g
            transform={`translate(${strokeWidth}, ${
              outerAreaSize + strokeWidth
            })`}
          >
            <line
              stroke={handleLineColor || styles.colorHandleLine}
              strokeWidth={handleLineStrokeWidth}
              strokeLinecap="round"
              x1={startCoordinate[0]}
              y1={startCoordinate[1]}
              x2={startBezierHandle[0]}
              y2={startBezierHandle[1]}
            />
            <line
              stroke={handleLineColor || styles.colorHandleLine}
              strokeWidth={handleLineStrokeWidth}
              strokeLinecap="round"
              x1={endCoordinate[0]}
              y1={endCoordinate[1]}
              x2={endBezierHandle[0]}
              y2={endBezierHandle[1]}
            />
            <path
              stroke={curveLineColor || styles.colorCurveLine}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              d={`M${startCoordinate} C${startBezierHandle} ${endBezierHandle} ${endCoordinate}`}
            />
          </g>
        </svg>
        <span
          className={styles.connectionPoint}
          style={{
            top: `${startCoordinate[1] + outerAreaSize + strokeWidth}px`,
            left: `${startCoordinate[0] + strokeWidth}px`,
            borderColor: handleLineColor,
            backgroundColor: fixedHandleColor
          }}
        />
        <span
          className={styles.connectionPoint}
          style={{
            top: `${endCoordinate[1] + outerAreaSize + strokeWidth}px`,
            left: `${endCoordinate[0] + strokeWidth}px`,
            borderColor: handleLineColor,
            backgroundColor: fixedHandleColor
          }}
        />
        <button
          type="button"
          className={classNames({
            [styles.handle]: true,
            [styles.start]: true,
            [startHandleClassName]: !!startHandleClassName,
            [styles.active]: state.movingStartHandle,
            [startHandleActiveClassName]:
              !!startHandleActiveClassName && state.movingStartHandle
          })}
          style={{
            top: `${startBezierHandle[1] + outerAreaSize + strokeWidth}px`,
            left: `${startBezierHandle[0] + strokeWidth}px`,
            color: startHandleColor,
            backgroundColor: startHandleColor
          }}
          onMouseDown={handleStartHandleStartMoving}
          onTouchStart={handleStartHandleStartMoving}
        />
        <button
          type="button"
          className={classNames({
            [styles.handle]: true,
            [styles.end]: true,
            [endHandleClassName]: !!endHandleClassName,
            [styles.active]: state.movingEndHandle,
            [endHandleActiveClassName]:
              !!endHandleActiveClassName && state.movingEndHandle
          })}
          style={{
            top: `${endBezierHandle[1] + outerAreaSize + strokeWidth}px`,
            left: `${endBezierHandle[0] + strokeWidth}px`,
            color: endHandleColor,
            backgroundColor: endHandleColor
          }}
          onMouseDown={handleEndHandleStartMoving}
          onTouchStart={handleEndHandleStartMoving}
        />
      </div>
    </div>
  );
};

export default BezierCurveEditor;
