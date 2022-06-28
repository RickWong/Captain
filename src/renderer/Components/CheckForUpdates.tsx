import * as React from "react";
import { ipcRenderer } from "electron";
import * as remote from "@electron/remote";
import { COMMANDS } from "../ipcCommands";

export const CheckForUpdates = () => {
  const onClick = () => {
    ipcRenderer.send(COMMANDS.CHECK_FOR_UPDATES);
    remote.getCurrentWindow().hide();
  };

  return (
    <li className="action" onClick={onClick}>
      Check for Updates...
    </li>
  );
};
