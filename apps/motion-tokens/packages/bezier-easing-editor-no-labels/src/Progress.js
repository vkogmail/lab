import React from "react";
import PropTypes from "prop-types";
import BezierComponent from "./BezierComponent";
import bezierEasing from "bezier-easing";

class Progress extends BezierComponent {
  constructor(props) {
    super(props);
    this.state = {
      path: this.computePath(props)
    };
  }

  static propTypes = {
    progress: PropTypes.number,
    value: PropTypes.array.isRequired,
    progressColor: PropTypes.string.isRequired,
    xFrom: PropTypes.number.isRequired,
    yFrom: PropTypes.number.isRequired,
    xTo: PropTypes.number.isRequired,
    yTo: PropTypes.number.isRequired
  };

  shouldComponentUpdate(nextProps, nextState) {
    return (
      super.shouldComponentUpdate(nextProps) ||
      nextProps.value !== this.props.value ||
      nextProps.progress !== this.props.progress ||
      nextProps.progressColor !== this.props.progressColor ||
      nextState.path !== this.state.path
    );
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value || prevProps.progress !== this.props.progress) {
      this.setState({
        path: this.computePath(this.props)
      });
    }
  }

  computePath(props) {
    const { value, progress } = props;
    if (!progress) return "";
    const easing = bezierEasing.apply(null, value);
    const p = Math.max(0, Math.min(progress, 1));
    const x = this.x(p);
    const y = this.y(easing(p));
    return ["M", this.x(0), this.y(0), "L", x, y].join(" ");
  }

  render() {
    const { progressColor } = this.props;
    const { path } = this.state;
    return path ? (
      <path
        d={path}
        strokeWidth={1}
        stroke={progressColor}
        fill="none"
      />
    ) : null;
  }
}

export default Progress;
