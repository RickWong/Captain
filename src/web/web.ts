const remote = require("@electron/remote");
import { clientStart } from "./rpcClient";

const menuWindow = remote.getCurrentWindow();

menuWindow.setMovable(false);
menuWindow.setMinimizable(false);
menuWindow.setMaximizable(false);
menuWindow.setResizable(false);

if (process.env.NODE_ENV === "development") {
  menuWindow.setResizable(true);
  menuWindow.openDevTools();
}

// Allow Cmd+Q.
window.addEventListener("keydown", (event) => {
  if (String.fromCharCode(event.which).toUpperCase() !== "Q") {
    event.preventDefault();
  }
});

clientStart(menuWindow).catch((error) => console.error(error));
