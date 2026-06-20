import React from "react";
import PropTypes from "prop-types";
import BezierComponent from "./BezierComponent";
import Grid from "./Grid";
import Handle from "./Handle";
import Progress from "./Progress";
import Curve from "./Curve";

class BezierEditor extends BezierComponent {
  constructor(props) {
    super(props);
    this.state = {
      down: 0,
      hover: 0
    };
    this.rootRef = React.createRef();
  }

  static propTypes = {
    value: PropTypes.array.isRequired,
    onChange: PropTypes.func,
    width: PropTypes.number,
    height: PropTypes.number,
    padding: PropTypes.array,
    handleRadius: PropTypes.number,
    style: PropTypes.object,
    className: PropTypes.string,
    progress: PropTypes.number,
    handleStroke: PropTypes.number,
    background: PropTypes.string,
    gridColor: PropTypes.string,
    curveColor: PropTypes.string,
    curveWidth: PropTypes.number,
    handleColor: PropTypes.string,
    progressColor: PropTypes.string,
    textStyle: PropTypes.object,
    readOnly: PropTypes.bool
  };

  static defaultProps = {
    width: 300,
    height: 300,
    padding: [25, 5, 25, 35],
    handleRadius: 6,
    handleStroke: 2,
    background: "#fff",
    gridColor: "rgba(0,0,0,0.1)",
    curveColor: "#000",
    curveWidth: 2,
    handleColor: "#000",
    progressColor: "rgba(0,0,0,0.2)",
    textStyle: {},
    readOnly: false
  };

  onEnterHandle = (h) => {
    if (!this.state.down) {
      this.setState({ hover: h });
    }
  };

  onLeaveHandle = () => {
    if (!this.state.down) {
      this.setState({ hover: null });
    }
  };

  onDownHandle = (h, e) => {
    e.preventDefault();
    this.setState({
      hover: null,
      down: h
    });
  };

  onDownLeave = (e) => {
    if (this.state.down) {
      this.onDownMove(e);
      this.setState({ down: null });
    }
  };

  onDownMove = (e) => {
    if (this.state.down) {
      e.preventDefault();
      const i = 2 * (this.state.down - 1);
      const value = [...this.props.value];
      const [x, y] = this.positionForEvent(e);
      value[i] = this.inversex(x);
      value[i + 1] = this.inversey(y);
      if (this.props.onChange) {
        this.props.onChange(value);
      }
    }
  };

  onDownUp = () => {
    this.setState({ down: 0 });
  };

  positionForEvent = (e) => {
    const rect = this.rootRef.current.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  x = value => {
    const padding = this.props.padding;
    const w = this.props.width - padding[1] - padding[3];
    return Math.round(padding[3] + value * w);
  };

  y = value => {
    const padding = this.props.padding;
    const h = this.props.height - padding[0] - padding[2];
    return Math.round(padding[0] + (1 - value) * h);
  };

  inversex = x => {
    const padding = this.props.padding;
    const w = this.props.width - padding[1] - padding[3];
    return Math.max(0, Math.min((x - padding[3]) / w, 1));
  };

  inversey = y => {
    const { height, handleRadius, padding } = this.props;
    const clampMargin = 2 * handleRadius;
    const h = height - padding[0] - padding[2];
    y = Math.max(clampMargin, Math.min(y, height - clampMargin));
    return 1 - (y - padding[0]) / h;
  };

  render() {
    const {
      value,
      width,
      height,
      handleRadius,
      style,
      className,
      progress,
      handleStroke,
      background,
      gridColor,
      curveColor,
      curveWidth,
      handleColor,
      textStyle,
      progressColor,
      readOnly,
      children
    } = this.props;

    const { down, hover } = this.state;

    const sharedProps = {
      xFrom: this.x(0),
      yFrom: this.y(0),
      xTo: this.x(1),
      yTo: this.y(1)
    };

    const styles = {
      background,
      cursor: down ? "grabbing" : hover ? "grab" : "default",
      userSelect: "none",
      WebkitUserSelect: "none",
      MozUserSelect: "none",
      ...style
    };

    const containerEvents = readOnly || !down ? {} : {
      onMouseMove: this.onDownMove,
      onMouseUp: this.onDownUp,
      onMouseLeave: this.onDownLeave
    };

    const handle1Events = readOnly || down ? {} : {
      onMouseDown: (e) => this.onDownHandle(1, e),
      onMouseEnter: () => this.onEnterHandle(1),
      onMouseLeave: this.onLeaveHandle
    };

    const handle2Events = readOnly || down ? {} : {
      onMouseDown: (e) => this.onDownHandle(2, e),
      onMouseEnter: () => this.onEnterHandle(2),
      onMouseLeave: this.onLeaveHandle
    };

    return (
      <svg
        ref={this.rootRef}
        className={className}
        style={styles}
        width={width}
        height={height}
        {...containerEvents}
      >
        <Grid
          {...sharedProps}
          background={background}
          gridColor={gridColor}
          textStyle={{ ...BezierEditor.defaultProps.textStyle, ...textStyle }}
        />
        <Progress
          {...sharedProps}
          value={value}
          progress={progress}
          progressColor={progressColor}
        />
        <Curve
          {...sharedProps}
          value={value}
          curveColor={curveColor}
          curveWidth={curveWidth}
        />
        {children}
        {!readOnly && (
          <g>
            <Handle
              {...sharedProps}
              {...handle1Events}
              index={0}
              xval={value[0]}
              yval={value[1]}
              handleRadius={handleRadius}
              handleColor={handleColor}
              down={down === 1}
              hover={hover === 1}
              handleStroke={handleStroke}
              background={background}
            />
            <Handle
              {...sharedProps}
              {...handle2Events}
              index={1}
              xval={value[2]}
              yval={value[3]}
              handleRadius={handleRadius}
              handleColor={handleColor}
              down={down === 2}
              hover={hover === 2}
              handleStroke={handleStroke}
              background={background}
            />
          </g>
        )}
      </svg>
    );
  }
}

export default BezierEditor;
