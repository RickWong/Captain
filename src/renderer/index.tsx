import electron from "electron";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./Components/App";
import { clientStart } from "./rpcClient";
import "./index.css";

const remote = process.type === "browser" ? electron : require("@electron/remote");
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

const reactRoot = createRoot(document.querySelector("#App")!);
reactRoot.render(<App />);
