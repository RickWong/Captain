import debug from "debug";
import { app } from "electron";
import { menubar } from "menubar";
import path from "path";
import { moveToApplications } from "./moveToApplications";
import { serverStart } from "./rpcServer";

require("@electron/remote/main").initialize();

const isPackaged = app.isPackaged;

const captainMenubar = menubar({
  dir: __dirname,
  icon: path.join(__dirname, isPackaged ? "../public/iconTemplate.png" : "../../public/iconTemplate.png"),
  index: isPackaged ? "../public/index.html" : "http://localhost:9999/index.html",
  browserWindow: {
    width: 240,
    height: 240,
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

captainMenubar.on("before-load", () => require("@electron/remote/main").enable(captainMenubar.window!.webContents));

captainMenubar.on("focus-lost", () => captainMenubar.window!.hide());

captainMenubar.on("after-create-window", async () => {
  try {
    await moveToApplications(captainMenubar.window!);
    serverStart(captainMenubar).catch((error) => console.error(error));
  } catch (e) {
    debug("captain")(e.stack || e);
  }
});
