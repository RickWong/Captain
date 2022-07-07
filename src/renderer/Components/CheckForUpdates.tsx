import * as React from "react";
import { ipcRenderer } from "electron";
import * as remote from "@electron/remote";
import { COMMANDS } from "../ipcCommands";

export const CheckForUpdates = () => {
  const onClick = () => {
    remote.getCurrentWindow().hide();
    ipcRenderer.send(COMMANDS.CHECK_FOR_UPDATES);
  };

  return (
    <li className="action" onClick={onClick}>
      Check for Updates...
    </li>
  );
};
