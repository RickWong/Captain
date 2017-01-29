import Menubar from "menubar";
import Path from "path";
import Package from "../../package.json";
import { moveToApplications } from "./moveToApplications";
import { serverStart } from "./rpcServer";

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

menubar.on("focus-lost", () => menubar.window.hide());

menubar.on("ready", async () => {
  await moveToApplications();
  serverStart(menubar);
});
