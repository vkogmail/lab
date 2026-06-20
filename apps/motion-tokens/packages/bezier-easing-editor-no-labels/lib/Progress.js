"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _BezierComponent2 = require("./BezierComponent");

var _BezierComponent3 = _interopRequireDefault(_BezierComponent2);

var _bezierEasing = require("bezier-easing");

var _bezierEasing2 = _interopRequireDefault(_bezierEasing);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Progress = function (_BezierComponent) {
  _inherits(Progress, _BezierComponent);

  function Progress(props) {
    _classCallCheck(this, Progress);

    var _this = _possibleConstructorReturn(this, (Progress.__proto__ || Object.getPrototypeOf(Progress)).call(this, props));

    _this.state = {
      path: _this.computePath(props)
    };
    return _this;
  }

  _createClass(Progress, [{
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps, nextState) {
      return _get(Progress.prototype.__proto__ || Object.getPrototypeOf(Progress.prototype), "shouldComponentUpdate", this).call(this, nextProps) || nextProps.value !== this.props.value || nextProps.progress !== this.props.progress || nextProps.progressColor !== this.props.progressColor || nextState.path !== this.state.path;
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps) {
      if (prevProps.value !== this.props.value || prevProps.progress !== this.props.progress) {
        this.setState({
          path: this.computePath(this.props)
        });
      }
    }
  }, {
    key: "computePath",
    value: function computePath(props) {
      var value = props.value,
          progress = props.progress;

      if (!progress) return "";
      var easing = _bezierEasing2.default.apply(null, value);
      var p = Math.max(0, Math.min(progress, 1));
      var x = this.x(p);
      var y = this.y(easing(p));
      return ["M", this.x(0), this.y(0), "L", x, y].join(" ");
    }
  }, {
    key: "render",
    value: function render() {
      var progressColor = this.props.progressColor;
      var path = this.state.path;

      return path ? _react2.default.createElement("path", {
        d: path,
        strokeWidth: 1,
        stroke: progressColor,
        fill: "none"
      }) : null;
    }
  }]);

  return Progress;
}(_BezierComponent3.default);

Progress.propTypes = {
  progress: _propTypes2.default.number,
  value: _propTypes2.default.array.isRequired,
  progressColor: _propTypes2.default.string.isRequired,
  xFrom: _propTypes2.default.number.isRequired,
  yFrom: _propTypes2.default.number.isRequired,
  xTo: _propTypes2.default.number.isRequired,
  yTo: _propTypes2.default.number.isRequired
};
exports.default = Progress;
//# sourceMappingURL=Progress.js.map