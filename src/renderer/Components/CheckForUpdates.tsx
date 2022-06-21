import * as React from "react";
import { shell } from "electron";
import * as remote from "@electron/remote";

export const CheckForUpdates = () => (
  <li className="action" onClick={() => shell.openExternal(`https://getcaptain.co/?since=${remote.app.getVersion()}`)}>
    Check for Updates...
  </li>
);
