import * as React from "react";
import { Container } from "./Container";
import { Status } from "./Status";
import { ipcRenderer, IpcRendererEvent } from "electron";
import { COMMANDS } from "../ipcCommands";
import { CheckForUpdates } from "./CheckForUpdates";
import { QuitCaptain } from "./QuitCaptain";
import { StartAtLogin } from "./StartAtLogin";
import { useEffect, useState } from "react";
import { ContainerGroup } from "./ContainerGroup";
import * as remote from "@electron/remote";

/**
 * Resizes the popup menu based on its content's height.
 */
const updateWindowHeight = () => {
  const menubar = remote.getCurrentWindow();
  menubar.setSize(menubar.getSize()[0], (document.querySelectorAll(".menu")[0] as HTMLElement).offsetHeight + 10);

  document.querySelectorAll(".containers").forEach((node: HTMLElement) => {
    const { height } = remote.screen.getPrimaryDisplay().workArea;
    node.style.maxHeight = `${height - 150}px`;
  });
};

export const App = () => {
  const [dockerVersion, setDockerVersion] = React.useState<string | undefined>(undefined);
  const [autoLaunch, setAutoLaunch] = React.useState(false);
  const [groups, setGroups] = React.useState<Record<string, any>>({});
  const [keysPressed, setKeyPressed] = useState(new Set<string>([]));

  /**
   * Keeps track of which modifier keys are held down currently.
   */
  const trackModifierKeys = (event: KeyboardEvent) => {
    setKeyPressed((keysPressed) => {
      if (!event.altKey) {
        keysPressed.delete("Alt");
      }
      if (!event.ctrlKey) {
        keysPressed.delete("Control");
      }
      if (!event.metaKey) {
        keysPressed.delete("Meta");
      }
      if (!event.shiftKey) {
        keysPressed.delete("Shift");
      }

      if (event.type === "keydown") {
        keysPressed.add(event.key);
      } else if (event.type === "keyup") {
        keysPressed.delete(event.key);
      }

      return new Set([...keysPressed]);
    });
  };

  const onVersion = (event: IpcRendererEvent, { dockerVersion, autoLaunch }: any) => {
    setDockerVersion(dockerVersion || "");
    setAutoLaunch(autoLaunch);
  };

  const onGroups = (event: IpcRendererEvent, { groups }: any) => {
    setGroups(groups);
  };

  useEffect(() => {
    window.addEventListener("keydown", trackModifierKeys);
    window.addEventListener("keyup", trackModifierKeys);

    ipcRenderer.on(COMMANDS.VERSION, onVersion);
    ipcRenderer.on(COMMANDS.CONTAINER_GROUPS, onGroups);

    ipcRenderer.send(COMMANDS.VERSION);
    ipcRenderer.send(COMMANDS.CONTAINER_GROUPS);

    return () => {
      ipcRenderer.off(COMMANDS.VERSION, onVersion);
      ipcRenderer.off(COMMANDS.CONTAINER_GROUPS, onGroups);

      window.removeEventListener("keydown", trackModifierKeys);
      window.removeEventListener("keyup", trackModifierKeys);
    };
  }, []);

  useEffect(() => {
    updateWindowHeight();
  }); // Runs after every render.

  return (
    <ul className="menu">
      <Status dockerVersion={dockerVersion} />
      <li>
        <ul className="containers">
          {Object.keys(groups).map((groupName) => (
            <ContainerGroup
              key={groupName}
              groupName={groupName}
              containers={groups[groupName]}
              updateWindowHeight={updateWindowHeight}
            >
              {Object.keys(groups[groupName]).map((containerName) => (
                <Container key={containerName} {...groups[groupName][containerName]} keysPressed={keysPressed} />
              ))}
            </ContainerGroup>
          ))}
        </ul>
      </li>
      <StartAtLogin autoLaunch={autoLaunch} />
      <CheckForUpdates />
      <QuitCaptain />
    </ul>
  );
};
