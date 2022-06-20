import * as React from "react";
import { Container } from "./Container";
import { Status } from "./Status";
import { ipcRenderer } from "electron";
import { COMMANDS } from "../rpcCommands";
import { CheckForUpdates } from "./CheckForUpdates";
import { QuitCaptain } from "./QuitCaptain";
import { StartAtLogin } from "./StartAtLogin";

export const App = () => {
  const [serverVersion, setServerVersion] = React.useState("");
  const [dockerVersion, setDockerVersion] = React.useState<string | undefined>(undefined);
  const [autoLaunch, setAutoLaunch] = React.useState(false);

  React.useEffect(() => {
    ipcRenderer.on(COMMANDS.VERSION, (error, { version, dockerVersion, autoLaunch }) => {
      setServerVersion(version);
      setDockerVersion(dockerVersion || "");
      setAutoLaunch(autoLaunch);
    });
  });

  return (
    <ul className="menu">
      <li className="status">&nbsp;</li>
      <Status dockerVersion={dockerVersion} />
      <li className="separator"></li>
      <li>
        <ul className="containers">
          {[0, 2].map(() => (
            <Container key={Math.random()} />
          ))}
        </ul>
      </li>
      <li className="separator"></li>
      <StartAtLogin autoLaunch={!autoLaunch} />
      <CheckForUpdates serverVersion={serverVersion} />
      <QuitCaptain />
    </ul>
  );
};
