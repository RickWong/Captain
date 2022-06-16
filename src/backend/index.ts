import debug from "debug";
import { menubar } from "menubar";
import Path from "path";
import { moveToApplications } from "./moveToApplications";
import { serverStart } from "./rpcServer";
import { app } from "electron";

app.commandLine.appendSwitch("remote-debugging-port", "9222");

require("@electron/remote/main").initialize();

const captainMenubar = menubar({
  dir: __dirname,
  icon: Path.join(__dirname, "../../resources/iconTemplate.png"),
  index: `file://${Path.join(__dirname, "../../build/web/index.html")}`,
  browserWindow: {
    width: 256,
    height: 256,
    transparent: true,
    vibrancy: "under-window",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
  },
  windowPosition: "trayLeft",
  tooltip: `Captain ${process.env.npm_package_version}`,
  preloadWindow: true,
  showDockIcon: false,
});

captainMenubar.on("before-load", () => require("@electron/remote/main").enable(captainMenubar.window.webContents));

captainMenubar.on("focus-lost", () => captainMenubar.window.hide());

captainMenubar.on("ready", async () => {
  try {
    await moveToApplications(captainMenubar.window);
    serverStart(captainMenubar).catch((error) => console.error(error));
  } catch (e) {
    debug("captain")(e.stack || e);
  }
});
