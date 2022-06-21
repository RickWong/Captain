import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./Components/App";
import { clientStart } from "./rpcClient";
import "./index.css";

const remote = process.type === "browser" ? require("electron") : require("@electron/remote");
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

clientStart(menuWindow).catch((error) => console.error(error));

createRoot(document.querySelector("#App")!).render(<App />);

// Only allow Cmd+Q.
window.addEventListener("keydown", (event) => {
  if (event.key !== "q") {
    event.preventDefault();
  }
});
