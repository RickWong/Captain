import * as React from "react";
import { ipcRenderer } from "electron";
import { COMMANDS } from "../rpcCommands";

export const QuitCaptain = () => (
  <li className="action" onClick={() => ipcRenderer.send(COMMANDS.APPLICATION_QUIT)}>
    Quit Captain <span className="shortcut">⌘Q</span>
  </li>
);
