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
import debug from "debug";
import path from "path";
import { app } from "electron";
import { menubar } from "menubar";
import { serverStart } from "./rpcServer";

require("@electron/remote/main").initialize();

const captainMenubar = menubar({
  dir: __dirname,
  icon: path.join(__dirname, "../public/iconTemplate.png"),
  index: app.isPackaged ? "file://" + path.join(__dirname, "./index.html") : "http://localhost:9999/index.html",
  browserWindow: {
    width: 240,
    height: 240,
    transparent: true,
    vibrancy: "under-window",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
  },
  windowPosition: "trayLeft",
  tooltip: `Captain ${app.getVersion()}`,
  preloadWindow: true,
  showDockIcon: false,
});

captainMenubar.on("before-load", () => require("@electron/remote/main").enable(captainMenubar.window!.webContents));

captainMenubar.on("focus-lost", () => captainMenubar.window!.hide());

captainMenubar.on("after-create-window", async () => {
  try {
    serverStart(captainMenubar).catch((error) => console.error(error));
  } catch (e) {
    debug("captain")(e.stack || e);
  }
});
