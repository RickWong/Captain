import { remote } from "electron";
import { clientStart } from "./client";

const menuWindow = remote.getCurrentWindow();
menuWindow.setVibrancy("light");
menuWindow.setMovable(false);
menuWindow.setMinimizable(false);
menuWindow.setMaximizable(false);
menuWindow.setResizable(false);

if (process.env.NODE_ENV === 'development') {
  menuWindow.setResizable(true);
  menuWindow.openDevTools();
}

window.addEventListener("keydown", (event) => {
  if (String.fromCharCode(event.which).toUpperCase() !== "Q") {
    event.preventDefault();
  }
});

clientStart(menuWindow);
