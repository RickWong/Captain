import * as React from "react";
import { useEffect, useState } from "react";
import classnames from "classnames";
import { clipboard, ipcRenderer, shell } from "electron";
import { COMMANDS } from "../ipcCommands";

const remote = process.type === "browser" ? require("electron") : require("@electron/remote");

interface Props {
  id: string;
  name: string;
  shortName: string;
  hostname: string;
  image: string;
  status: string;
  ports: string[];
  logs?: string;
  openInBrowser: string;
  active: boolean;
  paused: boolean;
  keysPressed: Set<string>;
}

const logsNeedsAttention = (logs?: string) => {
  logs = logs?.toLowerCase() ?? "";
  return (
    logs.includes("exited") ||
    logs.includes("failed") ||
    logs.includes("crashed") ||
    logs.includes("terminated") ||
    logs.includes("killed") ||
    logs.includes("error") ||
    logs.includes("exception") ||
    logs.includes("...")
  );
};
export const Container = (props: Props) => {
  const [disabled, setDisabled] = useState(false);
  const { id, name, shortName, hostname, image, status, ports, logs, openInBrowser, active, paused, keysPressed } =
    props;
  // Container is active but needs attention.
  const attention = active && !paused && logsNeedsAttention(logs);

  useEffect(() => {
    setDisabled(false);
  }, [status, ports, openInBrowser, active, paused]);

  const ctrlIsDown = keysPressed.has("Control"),
    shiftIsDown = keysPressed.has("Shift"),
    altIsDown = keysPressed.has("Alt"),
    metaIsDown = keysPressed.has("Meta");

  const port = ports.indexOf("443") >= 0 ? 443 : ports.indexOf("80") >= 0 ? 80 : parseInt(ports[0]);
  const openable = active && !paused && port && !ctrlIsDown && metaIsDown;
  const killable = active && !paused && ctrlIsDown && !altIsDown && !metaIsDown;
  const stoppable = !paused && active && !shiftIsDown && !ctrlIsDown && !altIsDown && !metaIsDown;
  const startable = !active && !shiftIsDown && !ctrlIsDown && !altIsDown && !metaIsDown;
  const unpausable = paused && !ctrlIsDown && !altIsDown && !metaIsDown;
  const removable = !paused && !active && ctrlIsDown && altIsDown && metaIsDown;
  const pausable = !paused && active && shiftIsDown && !ctrlIsDown && !altIsDown && !metaIsDown;
  const copyable = !ctrlIsDown && altIsDown;

  const onClick = () => {
    const browserUrl = props.openInBrowser || `http${port === 443 ? "s" : ""}://localhost:${port || 80}`;

    if (disabled) {
      return;
    } else if (copyable) {
      clipboard.writeText(openable ? browserUrl : shiftIsDown ? name : id);
      remote.getCurrentWindow().hide();
      keysPressed.clear();
    } else if (openable) {
      shell.openExternal(browserUrl).catch((error: Error) => console.error(error));
      remote.getCurrentWindow().hide();
      keysPressed.clear();
    } else if (killable) {
      ipcRenderer.send(COMMANDS.CONTAINER_KILL, props);
      setDisabled(true);
    } else if (removable) {
      ipcRenderer.send(COMMANDS.CONTAINER_REMOVE, props);
      setDisabled(true);
    } else if (stoppable) {
      ipcRenderer.send(COMMANDS.CONTAINER_STOP, props);
      setDisabled(true);
    } else if (pausable) {
      ipcRenderer.send(COMMANDS.CONTAINER_PAUSE, props);
      setDisabled(true);
    } else if (unpausable) {
      ipcRenderer.send(COMMANDS.CONTAINER_UNPAUSE, props);
      setDisabled(true);
    } else if (startable) {
      ipcRenderer.send(COMMANDS.CONTAINER_START, props);
      setDisabled(true);
    }
  };

  const browserUrl: string = openInBrowser || `${hostname || "localhost"}:${port || 80}`;

  const __html = removable
    ? `Remove ${shortName}`
    : copyable && openable
    ? `Copy "${browserUrl}"`
    : copyable && shiftIsDown
    ? `Copy "${name}"`
    : copyable
    ? `Copy "${id}"`
    : openable
    ? `Open "${browserUrl}"`
    : killable
    ? `Kill ${shortName}`
    : pausable
    ? `Pause ${shortName}`
    : `${shortName} <small>${paused ? `(paused)` : port ? `(${port})` : ""}</small>`;

  const hoverTitle = copyable
    ? "Click to copy"
    : openable
    ? browserUrl
    : `Name: ${name}\nImage: ${image}\nStatus: ${status}${ports.length ? `\nPorts: ${ports.join(", ")}` : ""}${
        logs ? `\n\n${logs}` : ""
      }`;

  return (
    <li
      title={hoverTitle}
      className={classnames("container", {
        active,
        inactive: !active,
        attention,
        paused,
        openable,
        killable,
        stoppable,
        removable,
        pausable,
        copyable,
        disabled,
      })}
      onContextMenu={onClick}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html }}
    ></li>
  );
};
