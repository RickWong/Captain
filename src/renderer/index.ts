const electron = require("electron");
const remote = process.type === "browser" ? electron : require("@electron/remote");
import { clientStart } from "./rpcClient";
import "_public/index.css";

const menuWindow = remote.getCurrentWindow();

menuWindow.setMovable(false);
menuWindow.setMinimizable(false);
menuWindow.setMaximizable(false);
menuWindow.setResizable(false);

if (!remote.app.isPackaged) {
  menuWindow.setResizable(true);
  // @ts-ignore
  menuWindow.openDevTools();
}

// Allow Cmd+Q.
window.addEventListener("keydown", (event) => {
  if (String.fromCharCode(event.which).toUpperCase() !== "Q") {
    event.preventDefault();
  }
});

clientStart(menuWindow).catch((error) => console.error(error));

// Webpack hot reloading
if (module.hot) {
  module.hot.accept((err) => {
    console.error(err);
    alert(1);
  });
}
