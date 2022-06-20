import { clipboard, ipcRenderer, shell } from "electron";
import * as remote from "@electron/remote";
import { COMMANDS } from "./rpcCommands";

declare global {
  interface Window {
    updateWindowHeight: (dimensions?: any) => void;
    clientStop: () => void;
    clientStart: (window: any) => Promise<void>;
    toggleAutoLaunch: () => void;
    checkForUpdates: () => void;
    hideWindow: () => void;
  }
}

let altIsDown = false;
let ctrlIsDown = false;
let metaIsDown = false;
let shiftIsDown = false;
const closedGroups = new Set();
let cachedGroups = {};
let serverVersion = "";

export const clientStart = async (menuWindow: any) => {
  const autoLaunchLi = document.querySelector(".autoLaunch");

  window.clientStop = () => {
    ipcRenderer.send(COMMANDS.APPLICATION_QUIT);
  };

  window.toggleAutoLaunch = () => {
    disableItem(autoLaunchLi);
    ipcRenderer.send(COMMANDS.TOGGLE_AUTO_LAUNCH);
  };

  window.checkForUpdates = () => {
    shell.openExternal(`https://getcaptain.co/?since=${serverVersion}`);
  };

  window.updateWindowHeight = (dimensions: any = {}) => {
    menuWindow.setSize(
      dimensions.width || menuWindow.getSize()[0],
      dimensions.height || (document.querySelectorAll(".menu")[0] as HTMLElement).offsetHeight + 8,
    );

    document.querySelectorAll(".containers").forEach((node: HTMLElement) => {
      const { height } = remote.screen.getPrimaryDisplay().workArea;
      node.style.maxHeight = `${height - 150}px`;
    });
  };

  window.hideWindow = () => {
    menuWindow.hide();
  };

  ipcRenderer.on(COMMANDS.VERSION, (error, { version, dockerVersion, autoLaunch }) => {
    if (version) {
      serverVersion = version;
      updateStatus(`Using Docker ${dockerVersion}`);
    } else {
      updateStatus("Docker not available");
    }

    autoLaunchLi?.classList.toggle("checked", autoLaunch);
    enableItem(autoLaunchLi);
  });

  ipcRenderer.on(COMMANDS.CONTAINER_GROUPS, (error, body) => {
    renderContainerGroups((cachedGroups = body.groups));
    window.updateWindowHeight();
  });

  // Keep track of ⌥ Option and ⌃ Control keys.
  let watchModifierKeys = (event: KeyboardEvent) => {
    if (altIsDown !== event.altKey) {
      altIsDown = event.altKey;
    } else if (ctrlIsDown !== event.ctrlKey) {
      ctrlIsDown = event.ctrlKey;
    } else if (metaIsDown !== event.metaKey) {
      metaIsDown = event.metaKey;
    } else if (shiftIsDown !== event.shiftKey) {
      shiftIsDown = event.shiftKey;
    }

    renderContainerGroups(cachedGroups);
    window.updateWindowHeight();
  };
  window.addEventListener("keydown", watchModifierKeys);
  window.addEventListener("keyup", watchModifierKeys);

  // Manually propagate ⌃ Control clicks, or rather rightclicks.
  window.addEventListener("contextmenu", (event) => {
    const node = event.target as HTMLElement;
    if (
      node &&
      node.nodeName === "LI" &&
      node.className.indexOf("container") >= 0 &&
      node.className.indexOf("active") >= 0
    ) {
      node.onclick?.(event);
    }
  });

  updateStatus("Looking for Docker");
  ipcRenderer.send(COMMANDS.VERSION);
  ipcRenderer.send(COMMANDS.CONTAINER_GROUPS);
};

const updateStatus = (message: string) => {
  document.querySelector(".status")!.innerHTML = message;
  document.querySelector<HTMLElement>(".status ~ .separator")!.style.display = document.querySelector(".containers")!
    .childElementCount
    ? "block"
    : "none";
  window.updateWindowHeight();
};

const renderContainerGroups = (groups: Record<string, any>) => {
  document
    .querySelectorAll(".containers .group, .containers .container, .containers .separator")
    .forEach((node) => node.remove());

  const listNode = document.querySelector(".containers") as HTMLUListElement;

  const groupNames = Object.keys(groups);
  groupNames.forEach((groupName, index) => {
    renderContainerGroupName(listNode, groupName, groups[groupName]);

    if (!closedGroups.has(groupName)) {
      Object.keys(groups[groupName]).forEach((containerName) => {
        renderContainerGroupItem(listNode, groups[groupName][containerName]);
      });
    }

    if (index + 1 < groupNames.length) {
      renderContainerGroupSeparator(listNode);
    }
  });

  document.querySelectorAll(".containers").forEach((node: HTMLElement) => {
    node.style.height = listNode.childElementCount ? "auto" : "0";
    node.style.visibility = listNode.childElementCount ? "visible" : "hidden";
    node.style.margin = listNode.childElementCount ? "" : "0px";
  });
};

const renderContainerGroupName = (listNode: HTMLUListElement, groupName: string, group: Record<string, any>) => {
  const closed = closedGroups.has(groupName) ? "closed" : "";
  const countAll = Object.keys(group).length;
  const countActive = Object.keys(group).filter((containerName) => group[containerName].active).length;
  const countHTML = `<small>(${countActive}/${countAll})</small>`;

  const li = document.createElement("li");
  li.className = ` group ${closed} `;
  li.innerHTML = `${groupName.replace(/^~/, "")} ${countHTML}`;
  li.onclick = (_event) => {
    if (closed) {
      closedGroups.delete(groupName);
    } else {
      closedGroups.add(groupName);
    }

    renderContainerGroups(cachedGroups);
    window.updateWindowHeight();
  };

  listNode.appendChild(li);
};

const renderContainerGroupSeparator = (listNode: HTMLUListElement) => {
  const li = document.createElement("li");
  li.className = "separator containers-separator";
  listNode.appendChild(li);
};

const renderContainerGroupItem = (listNode: Element, item: any) => {
  const container = item;
  const port =
    container.ports.indexOf("443") >= 0 ? "443" : container.ports.indexOf("80") >= 0 ? "80" : container.ports[0];
  const openable = container.active && !container.paused && port && !ctrlIsDown && !altIsDown && metaIsDown;
  const killable = container.active && !container.paused && ctrlIsDown && !altIsDown && !metaIsDown;
  const removable = !container.paused && !container.active && ctrlIsDown && altIsDown && metaIsDown;
  const pauseable = container.active && shiftIsDown && !ctrlIsDown && !altIsDown && !metaIsDown;
  const copyable = !ctrlIsDown && altIsDown && !metaIsDown;

  const li = document.createElement("li");
  li.title = `Image: ${container.image}
Status: ${container.status}`;

  li.className = `container ${container.active ? "active" : "inactive"}`;

  if (container.paused) {
    li.className += " paused ";
  }
  if (removable) {
    li.className += " removable ";
  } else if (killable) {
    li.className += " killable ";
  } else if (pauseable) {
    li.className += " pauseable ";
  }

  if (removable) {
    li.innerHTML = `Remove ${container.shortName}`;
  } else if (copyable) {
    li.innerHTML = `Copy "${container.id}"`;
  } else if (openable) {
    li.innerHTML = `Open "${container.openInBrowser || `${container.hostname || "localhost"}:${port || 80}`}"`;
  } else if (killable) {
    li.innerHTML = `Kill ${container.shortName}`;
  } else if (pauseable) {
    li.innerHTML = `${container.paused ? "Unpause" : "Pause"} ${container.shortName}`;
  } else {
    li.innerHTML = `${container.shortName} <small>${container.paused ? `(paused)` : port ? `(${port})` : ""}</small>`;
  }

  li.onclick = (event) => {
    event.preventDefault();

    // ⌃ Control + ⌥ Option + ⌘ Command.
    if (event.ctrlKey && event.altKey && event.metaKey) {
      if (removable) {
        disableItem(event.target);
        ctrlIsDown = false;
        altIsDown = false;
        metaIsDown = false;
        setTimeout(() => ipcRenderer.send(COMMANDS.CONTAINER_REMOVE, container), 100);
      }
    }
    // ⌃ Control.
    else if (event.ctrlKey) {
      if (killable) {
        disableItem(event.target);
        ctrlIsDown = false;
        setTimeout(() => ipcRenderer.send(COMMANDS.CONTAINER_KILL, container), 100);
      }
    }
    // ⌥ Option.
    else if (event.altKey) {
      clipboard.writeText(container.id);
      altIsDown = false;
      window.hideWindow();
    }
    // ⌘ Command.
    else if (event.metaKey) {
      if (openable) {
        disableItem(event.target);
        metaIsDown = false;
        shell
          .openExternal(container.openInBrowser || `http${port == 443 ? "s" : ""}://localhost:${port || 80}`)
          .catch((error: Error) => console.error(error));
        window.hideWindow();
      }
    }
    // ⇧ Shift.
    else if (event.shiftKey) {
      if (container.active) {
        disableItem(event.target);
        shiftIsDown = false;
        setTimeout(() => {
          container.paused
            ? ipcRenderer.send(COMMANDS.CONTAINER_UNPAUSE, container)
            : ipcRenderer.send(COMMANDS.CONTAINER_PAUSE, container);
        }, 100);
      }
    }
    // Default.
    else {
      if (!container.paused) {
        disableItem(event.target);
        setTimeout(() => {
          container.active
            ? ipcRenderer.send(COMMANDS.CONTAINER_STOP, container)
            : ipcRenderer.send(COMMANDS.CONTAINER_START, container);
        }, 100);
      } else {
        disableItem(event.target);
        setTimeout(() => ipcRenderer.send(COMMANDS.CONTAINER_UNPAUSE, container), 100);
      }
    }
  };

  listNode.appendChild(li);
};

const disableItem = (node: any) => {
  node.style.color = "#777";
  node.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
  node.old_onclick = node.onclick;
  node.onclick = () => {};
};

const enableItem = (node: any) => {
  node.style.color = "";
  node.style.backgroundColor = "";
  if (node.old_onclick) {
    node.onclick = node.old_onclick;
  }
};
