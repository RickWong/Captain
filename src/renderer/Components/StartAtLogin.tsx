import * as React from "react";
import { ipcRenderer } from "electron";
import { COMMANDS } from "../rpcCommands";

interface Props {
  autoLaunch: boolean;
}

export const StartAtLogin = ({ autoLaunch }: Props) => (
  <li
    className={`action checked autoLaunch ${autoLaunch ? "checked" : ""}`}
    onClick={() => ipcRenderer.send(COMMANDS.TOGGLE_AUTO_LAUNCH)}
  >
    Start Captain at Login
  </li>
);
