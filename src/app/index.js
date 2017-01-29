import LetsMove from 'electron-lets-move';
import Menubar from "menubar";
import Path from "path";
import Package from "../../package.json";
import { serverStart } from "./server";

const menubar = Menubar({
  dir: __dirname,
  icon: Path.join(__dirname, "../../resources/iconTemplate.png"),
  index: `file://${Path.join(__dirname, "../gui/gui.html")}`,
  width: 256,
  height: 30,
  windowPosition: "trayLeft",
  tooltip: `Captain ${Package.version}`,
  preloadWindow: true,
});

menubar.on("ready", async () => {
  if (!process.title ||
    process.title.indexOf("Electron.app") < 0) {
    try {
      await LetsMove.moveToApplications();
    } catch (error) {
      console.error("Failed to move app");
    }
  }

  serverStart(menubar);
});

menubar.on("focus-lost", () => menubar.window.hide());
