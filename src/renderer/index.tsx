/**
 *     Captain. Manage Docker containers. Instantly from the menu bar.
 *     Copyright (C) 2022 Rick Wong <tangos_erasure0x@icloud.com>
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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

/**
 * Open development tools for debugging.
 */
if (!remote.app.isPackaged) {
  menuWindow.setResizable(true);
  menuWindow.openDevTools();
}

/**
 * Prevent shortcuts like cmd+r.
 */
window.addEventListener("keydown", (event) => {
  // Only allow cmd+q and alt+cmd+i.
  if (!["q", "i"].includes(event.key)) {
    event.preventDefault();
  }
});

/**
 * Mount App and start the renderer process.
 */
createRoot(document.querySelector("#App")!).render(<App />);
