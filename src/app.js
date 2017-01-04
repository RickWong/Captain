require("babel-polyfill");
require("babel-register")({
	presets: ["babel-preset-es2015", "babel-preset-stage-2"].map(require.resolve),
});

const Menubar       = require("menubar");
const Path          = require("path");
const Package       = require(Path.join(__dirname, "../package.json"));
const {serverStart} = require("./app/server");

const menubar = Menubar({
	dir: __dirname,
	icon: Path.join(__dirname, "../resources/Icon.png"),
	index: `file://${Path.join(__dirname, "./gui/gui.html")}`,

	width: 256,
	height: 30,
	windowPosition: "trayLeft",
	tooltip: `Captain Docker ${Package.version}`,

	preloadWindow: true,
	alwaysOnTop: false,
});

menubar.on("ready", () => {
	serverStart(menubar);
});

menubar.on("focus-lost", () => {
	menubar.window.hide();
});
