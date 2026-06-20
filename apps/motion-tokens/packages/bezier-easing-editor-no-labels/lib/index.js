"use strict";

var BezierEditor = require("./BezierEditor");
var uncontrollable = require("uncontrollable");

module.exports = uncontrollable(BezierEditor.default || BezierEditor, {
  value: "onChange"
});
//# sourceMappingURL=index.js.map