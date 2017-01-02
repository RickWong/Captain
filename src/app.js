require("babel-polyfill");
require("babel-register")({
	"presets": ["es2015", "stage-2"],
});

const Menubar       = require("menubar");
const Path          = require("path");
const Package       = require(Path.join(__dirname, "../package.json"));
const {serverStart} = require("./app/server");

const menubar = Menubar({
	dir: __dirname,
	icon: Path.join(__dirname, "../resources/IconTemplate.png"),
	index: `file://${Path.join(__dirname, "./gui/gui.html")}`,

	width: 240,
	height: 30,
	windowPosition: "trayLeft",
	tooltip: `Captain Docker ${Package.version}`,

	preloadWindow: true,
});

menubar.on("ready", () => {
	serverStart(menubar);
});
