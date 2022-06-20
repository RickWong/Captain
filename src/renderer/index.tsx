import electron from "electron";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { clientStart } from "./rpcClient";
import "_public/index.css";

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

// Hot Module Replacement for App.
if (module.hot) {
  module.hot.accept("./App", () => {
    createRoot(document.body).render(<App />);
  });
}
