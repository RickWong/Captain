import * as React from "react";
import classnames from "classnames";
import { useEffect, useRef, useState } from "react";
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
  const [hoverRef, isHovered] = useHover<HTMLDivElement>();

  const totalContainers = Object.keys(containers).length;
  const activeContainers = Object.values(containers).filter((c) => c.active).length;

  useEffect(() => updateWindowHeight); // Runs after every render.

  const ctrlIsDown = keysPressed.has("Control"),
    shiftIsDown = keysPressed.has("Shift"),
    altIsDown = keysPressed.has("Alt"),
    metaIsDown = keysPressed.has("Meta");

  const startable = isHovered && !shiftIsDown && !ctrlIsDown && !altIsDown && metaIsDown;
  const stoppable = isHovered && shiftIsDown && !ctrlIsDown && !altIsDown; // && !metaIsDown;
  const killable = isHovered && !shiftIsDown && ctrlIsDown && !altIsDown && !metaIsDown;

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
        ref={hoverRef}
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

// Hook
// T - could be any type of HTML element like: HTMLDivElement, HTMLParagraphElement and etc.
// hook returns tuple(array) with type [any, boolean]
function useHover<T>() {
  const [value, setValue] = useState<boolean>(false);
  const ref: any = useRef<T | null>(null);
  const handleMouseOver = (): void => setValue(true);
  const handleMouseOut = (): void => setValue(false);
  useEffect(
    () => {
      const node: any = ref.current;
      if (node) {
        node.addEventListener("mouseover", handleMouseOver);
        node.addEventListener("mouseout", handleMouseOut);
        return () => {
          node.removeEventListener("mouseover", handleMouseOver);
          node.removeEventListener("mouseout", handleMouseOut);
        };
      }
    },
    [ref.current], // Recall only if ref changes
  );
  return [ref, value];
}
