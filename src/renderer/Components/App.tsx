import * as React from "react";
import { Container } from "./Container";
import { Status } from "./Status";
import { ipcRenderer } from "electron";
import { COMMANDS } from "../rpcCommands";

export const App = () => {
  const [dockerVersion, setDockerVersion] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    ipcRenderer.on(COMMANDS.VERSION, (error, { dockerVersion }) => {
      if (dockerVersion) {
        setDockerVersion(dockerVersion);
      } else {
        setDockerVersion("");
      }
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
      <li
        className="action autoLaunch"
        onClick={
          // @ts-ignore
          () => window.toggleAutoLaunch()
        }
      >
        Start Captain at Login
      </li>
      <li
        className="action"
        onClick={
          // @ts-ignore
          () => window.checkForUpdates()
        }
      >
        Check for Updates...
      </li>
      <li
        className="action"
        onClick={
          // @ts-ignore
          () => window.clientStop()
        }
      >
        Quit Captain <span className="shortcut">⌘Q</span>
      </li>
    </ul>
  );
};
