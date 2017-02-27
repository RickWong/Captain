global.Promise = require("bluebird");

require("babel-polyfill");
require("babel-register")({
  presets: ["babel-preset-es2015", "babel-preset-stage-2"].map(require.resolve),
});

require("./index"); // Relative to `gui.html`.
