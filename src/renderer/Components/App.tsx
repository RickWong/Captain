import * as React from "react";
import { Container } from "./Container";
import { Status } from "./Status";
import { ipcRenderer, IpcRendererEvent } from "electron";
import { COMMANDS } from "../rpcCommands";
import { CheckForUpdates } from "./CheckForUpdates";
import { QuitCaptain } from "./QuitCaptain";
import { StartAtLogin } from "./StartAtLogin";

export const App = () => {
  const [serverVersion, setServerVersion] = React.useState("");
  const [dockerVersion, setDockerVersion] = React.useState<string | undefined>(undefined);
  const [autoLaunch, setAutoLaunch] = React.useState(false);
  const [groups, setGroups] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    const onVersion = (event: IpcRendererEvent, { version, dockerVersion, autoLaunch }: any) => {
      setServerVersion(version);
      setDockerVersion(dockerVersion || "");
      setAutoLaunch(autoLaunch);
    };

    const onGroups = (event: IpcRendererEvent, { groups }: any) => {
      setGroups(groups);
      console.log(groups);
    };

    ipcRenderer.on(COMMANDS.VERSION, onVersion);
    ipcRenderer.on(COMMANDS.CONTAINER_GROUPS, onGroups);

    return () => {
      ipcRenderer.off(COMMANDS.VERSION, onVersion);
      ipcRenderer.off(COMMANDS.CONTAINER_GROUPS, onGroups);
    };
  });

  return (
    <ul className="menu">
      <Status dockerVersion={dockerVersion} />
      <li className="separator"></li>
      <li>
        <ul className="containers">
          {Object.keys(groups).map((groupName) => (
            <React.Fragment key={groupName}>
              <li className="group">
                {`${groupName.replace(/^~/, "")}`} <small>(0/1)</small>
              </li>
              {Object.keys(groups[groupName]).map((containerName) => (
                <Container key={containerName} {...groups[groupName][containerName]} />
              ))}
              <li className="separator"></li>
            </React.Fragment>
          ))}
        </ul>
      </li>
      <StartAtLogin autoLaunch={autoLaunch} />
      <CheckForUpdates serverVersion={serverVersion} />
      <QuitCaptain />
    </ul>
  );
};
