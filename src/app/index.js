import debug from "debug";
import { menubar } from "menubar";
import Path from "path";
import Package from "../../package.json";
import { moveToApplications } from "./moveToApplications";
import { serverStart } from "./rpcServer";

require("@electron/remote/main").initialize();

const captainMenubar = menubar({
  dir: __dirname,
  icon: Path.join(__dirname, "../../resources/iconTemplate.png"),
  index: `file://${Path.join(__dirname, "../gui/gui.html")}`,
  browserWindow: {
    width: 256,
    height: 30,
    transparent: true,
    vibrancy:'under-window',
    backgroundColor:'#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      transparent: true,
    },
  },
  windowPosition: "trayLeft",
  tooltip: `Captain ${Package.version}`,
  preloadWindow: true,
  showDockIcon: false,
});

captainMenubar.on("before-load", () => require("@electron/remote/main").enable(captainMenubar.window.webContents));

captainMenubar.on("focus-lost", () => captainMenubar.window.hide());

captainMenubar.on("ready", async () => {
  try {
    await moveToApplications();
    serverStart(captainMenubar);
  } catch (e) {
    debug("captain")(e.stack || e);
  }
});
