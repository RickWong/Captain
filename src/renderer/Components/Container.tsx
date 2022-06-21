import * as React from "react";
import { useEffect, useState } from "react";
import classnames from "classnames";
import { clipboard, ipcRenderer, shell } from "electron";
import { COMMANDS } from "../rpcCommands";

const remote = process.type === "browser" ? require("electron") : require("@electron/remote");

interface Props {
  id: string;
  name: string;
  shortName: string;
  hostname: string;
  image: string;
  status: string;
  ports: string[];
  openInBrowser: string;
  active: boolean;
  paused: boolean;
  keysPressed: Set<string>;
}

export const Container = (props: Props) => {
  const [disabled, setDisabled] = useState(false);
  const { id, name, shortName, hostname, image, status, ports, openInBrowser, active, paused, keysPressed } = props;

  useEffect(() => {
    setDisabled(false);
  }, [status, ports, openInBrowser, active, paused]);

  const ctrlIsDown = keysPressed.has("Control"),
    shiftIsDown = keysPressed.has("Shift"),
    altIsDown = keysPressed.has("Alt"),
    metaIsDown = keysPressed.has("Meta");

  const port = ports.indexOf("443") >= 0 ? 443 : ports.indexOf("80") >= 0 ? 80 : parseInt(ports[0]);
  const openable = active && !paused && port && !ctrlIsDown && !altIsDown && metaIsDown;
  const killable = active && !paused && ctrlIsDown && !altIsDown && !metaIsDown;
  const stoppable = !paused && active && !shiftIsDown && !ctrlIsDown && !altIsDown && !metaIsDown;
  const startable = !active && !shiftIsDown && !ctrlIsDown && !altIsDown && !metaIsDown;
  const unpauseable = paused && !ctrlIsDown && !altIsDown && !metaIsDown;
  const removeable = !paused && !active && ctrlIsDown && altIsDown && metaIsDown;
  const pauseable = !paused && active && shiftIsDown && !ctrlIsDown && !altIsDown && !metaIsDown;
  const copyable = !ctrlIsDown && altIsDown && !metaIsDown;

  const __html = removeable
    ? `Remove ${shortName}`
    : copyable
    ? `Copy "${id}"`
    : openable
    ? `Open "${openInBrowser || `${hostname || "localhost"}:${port || 80}`}"`
    : killable
    ? `Kill ${shortName}`
    : pauseable
    ? `Pause ${shortName}`
    : `${shortName} <small>${paused ? `(paused)` : port ? `(${port})` : ""}</small>`;

  return (
    <li
      title={`Name: ${name}
Image: ${image}
Status: ${status}`}
      className={classnames("container", {
        active,
        inactive: !active,
        paused,
        openable,
        killable,
        stoppable,
        removeable,
        pauseable,
        copyable,
        disabled,
      })}
      onContextMenu={() => {
        if (!disabled) {
          ipcRenderer.send(COMMANDS.CONTAINER_KILL, props);
          setDisabled(true);
        }
      }}
      onClick={() => {
        if (disabled) {
          return;
        } else if (openable) {
          shell
            .openExternal(props.openInBrowser || `http${port === 443 ? "s" : ""}://localhost:${port || 80}`)
            .catch((error: Error) => console.error(error));
          remote.getCurrentWindow().hide();
          keysPressed.clear();
        } else if (killable) {
          // Control + OnClick = OnContextMenu, see above.
        } else if (stoppable) {
          ipcRenderer.send(COMMANDS.CONTAINER_STOP, props);
        } else if (pauseable) {
          ipcRenderer.send(COMMANDS.CONTAINER_PAUSE, props);
        } else if (unpauseable) {
          ipcRenderer.send(COMMANDS.CONTAINER_UNPAUSE, props);
        } else if (startable) {
          ipcRenderer.send(COMMANDS.CONTAINER_START, props);
        } else if (copyable) {
          clipboard.writeText(id);
          remote.getCurrentWindow().hide();
          keysPressed.clear();
        }

        setDisabled(true);
      }}
      dangerouslySetInnerHTML={{ __html }}
    ></li>
  );
};
