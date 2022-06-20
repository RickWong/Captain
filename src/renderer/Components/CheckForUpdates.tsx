import * as React from "react";
import { shell } from "electron";

interface Props {
  serverVersion: string;
}

export const CheckForUpdates = ({ serverVersion }: Props) => (
  <li className="action" onClick={() => shell.openExternal(`https://getcaptain.co/?since=${serverVersion}`)}>
    Check for Updates...
  </li>
);
