import debug from "debug";
import path from "path";
import { app } from "electron";
import { menubar } from "menubar";
import { moveToApplications } from "./moveToApplications";
import { serverStart } from "./rpcServer";

require("@electron/remote/main").initialize();

const isPackaged = app.isPackaged;

const captainMenubar = menubar({
  dir: __dirname,
  icon: path.join(__dirname, "../../public/iconTemplate.png"),
  index: isPackaged ? "file://" + path.join(__dirname, "../index.html") : "http://localhost:9999/index.html",
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
  tooltip: `Captain ${app.getVersion()}`,
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
