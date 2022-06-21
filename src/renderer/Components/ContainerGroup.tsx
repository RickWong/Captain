import * as React from "react";
import classnames from "classnames";
import { useEffect } from "react";

interface Props {
  groupName: string;
  containers: Record<string, any>;
  updateWindowHeight: () => void;
  children: React.ReactNode;
}

export const ContainerGroup = ({ groupName, containers, updateWindowHeight, children }: Props) => {
  const [closed, setClosed] = React.useState(false);

  const totalContainers = Object.keys(containers).length;
  const activeContainers = Object.values(containers).filter((c) => c.active).length;

  useEffect(() => updateWindowHeight); // Runs after every render.

  return (
    <>
      <li className={classnames("group", { closed })} onClick={() => setClosed(!closed)}>
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
