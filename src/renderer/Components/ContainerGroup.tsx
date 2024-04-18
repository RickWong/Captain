import * as React from "react";
import classnames from "classnames";
import { useEffect } from "react";
import { ipcRenderer } from "electron";
import { COMMANDS } from "../ipcCommands";

interface Props {
  groupName: string;
  containers: Record<string, any>;
  updateWindowHeight: () => void;
  keysPressed: Set<string>;
  children: React.ReactNode;
}

export const ContainerGroup = ({ groupName, containers, updateWindowHeight, children, keysPressed }: Props) => {
  const [closed, setClosed] = React.useState(false);

  const totalContainers = Object.keys(containers).length;
  const activeContainers = Object.values(containers).filter((c) => c.active).length;

  useEffect(() => updateWindowHeight); // Runs after every render.

  const ctrlIsDown = keysPressed.has("Control"),
    shiftIsDown = keysPressed.has("Shift"),
    altIsDown = keysPressed.has("Alt"),
    metaIsDown = keysPressed.has("Meta");

  const startable = !shiftIsDown && !ctrlIsDown && !altIsDown && metaIsDown;
  const stoppable = shiftIsDown && !ctrlIsDown && !altIsDown; // && !metaIsDown;
  const killable = !shiftIsDown && ctrlIsDown && !altIsDown && !metaIsDown;

  const onClick = () => {
    keysPressed.clear();

    if (startable) {
      for (const container of Object.values(containers)) {
        ipcRenderer.send(COMMANDS.CONTAINER_START, container);
      }
    } else if (stoppable) {
      for (const container of Object.values(containers)) {
        ipcRenderer.send(COMMANDS.CONTAINER_STOP, container);
      }
    } else if (killable) {
      for (const container of Object.values(containers)) {
        ipcRenderer.send(COMMANDS.CONTAINER_KILL, container);
      }
    } else {
      setClosed(!closed);
    }
  };

  if (totalContainers < 1) {
    return <></>;
  }

  return (
    <>
      <li
        className={classnames("group", { closed, startable, stoppable, killable })}
        onClick={onClick}
        onContextMenu={onClick}
      >
        {startable ? "Start " : stoppable ? "Stop " : killable ? "Kill " : ""}
        {`${groupName.replace(/^~/, "")}`}{" "}
        <small>
          ({activeContainers}/{totalContainers})
        </small>
      </li>
      {closed || children}
      <li className="separator"></li>
    </>
  );
};
