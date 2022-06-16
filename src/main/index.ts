import debug from "debug";
import { menubar } from "menubar";
import path from "path";
import { moveToApplications } from "./moveToApplications";
import { serverStart } from "./rpcServer";
import { getAssetURL } from "electron-snowpack";

require("@electron/remote/main").initialize();

const captainMenubar = menubar({
  dir: __dirname,
  icon: path.join(__dirname, "../../public/iconTemplate.png"),
  index: getAssetURL("index.html"),
  browserWindow: {
    width: 500,
    height: 500,
    transparent: true,
    vibrancy: "under-window",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      // preload: path.join(__dirname, "preload.js"),
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
