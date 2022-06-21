import classnames from "classnames";
import * as React from "react";
import { useEffect, useMemo } from "react";
import { ipcRenderer, shell } from "electron";
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
}

export const Container = (container: Props) => {
  const [disabled, setDisabled] = React.useState(false);
  const { id, name, shortName, hostname, image, status, ports, openInBrowser, active, paused } = container;

  const ctrlIsDown = false,
    shiftIsDown = false,
    altIsDown = false,
    metaIsDown = false;

  const port = ports.indexOf("443") >= 0 ? 443 : ports.indexOf("80") >= 0 ? 80 : parseInt(ports[0]);
  const openable = active && !paused && port && !ctrlIsDown && !altIsDown && metaIsDown;
  const killable = active && !paused && ctrlIsDown && !altIsDown && !metaIsDown;
  const stoppable = !paused && active;
  const startable = !active;
  const unpauseable = paused && active;
  const removeable = !paused && !active && ctrlIsDown && altIsDown && metaIsDown;
  const pauseable = active && shiftIsDown && !ctrlIsDown && !altIsDown && !metaIsDown;
  const copyable = !ctrlIsDown && altIsDown && !metaIsDown;

  useEffect(() => {
    setDisabled(false);
  }, [status, ports, openInBrowser, active, paused]);

  const __html = removeable
    ? `Remove ${shortName}`
    : copyable
    ? `Copy "${id}"`
    : openable
    ? `Open "${openInBrowser || `${hostname || "localhost"}:${port || 80}`}"`
    : killable
    ? `Kill ${shortName}`
    : pauseable
    ? `${paused ? "Unpause" : "Pause"} ${shortName}`
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
      dangerouslySetInnerHTML={{ __html }}
      onClick={() => {
        if (disabled) {
          return;
        } else if (openable) {
          shell
            .openExternal(container.openInBrowser || `http${port === 443 ? "s" : ""}://localhost:${port || 80}`)
            .catch((error: Error) => console.error(error));
          remote.getCurrentWindow().hide();
        } else if (killable) {
          ipcRenderer.send(COMMANDS.CONTAINER_KILL, container);
        } else if (stoppable) {
          ipcRenderer.send(COMMANDS.CONTAINER_STOP, container);
        } else if (pauseable) {
          ipcRenderer.send(COMMANDS.CONTAINER_PAUSE, container);
        } else if (unpauseable) {
          ipcRenderer.send(COMMANDS.CONTAINER_UNPAUSE, container);
        } else if (startable) {
          ipcRenderer.send(COMMANDS.CONTAINER_START, container);
        }

        setDisabled(true);
      }}
    ></li>
  );
};
