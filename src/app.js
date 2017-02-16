require("babel-polyfill");
require("babel-register")({
  presets: ["babel-preset-es2015", "babel-preset-stage-2"].map(require.resolve),
});

require("./app/index");

/**
  @todo Display active/inactive counter for hidden groups
  @todo Add `CONTAINER_GROUP` environment variable
  @todo Clean up rpcClient.js and open-source to GitHub
  @todo Detect Homebrew Docker
  @todo Minimize binary size
  @todo Implement remove container
*/
