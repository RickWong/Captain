import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./Components/App";
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

createRoot(document.querySelector("#App")!).render(<App />);

window.addEventListener("keydown", (event) => {
  // Only allow cmd+q and alt+cmd+i.
  if (!["q", "i"].includes(event.key)) {
    event.preventDefault();
  }
});
