import { clipboard, shell, screen } from "electron";
import ElectronClient from "electron-rpc/client";
import { COMMANDS } from "../rpcCommands";
import Package from "../../package.json";

const client = new ElectronClient();
let vibrancy = "light";
let altIsDown = false;
let ctrlIsDown = false;
let metaIsDown = false;
let shiftIsDown = false;
const closedGroups = new Set();
let cachedGroups = {};

export const clientStart = async (menuWindow) => {
  const autoLaunchLi = document.querySelector(".autoLaunch");

  window.clientStop = () => {
    client.request(COMMANDS.APPLICATION_QUIT);
  };

  window.toggleAutoLaunch = () => {
    disableItem(autoLaunchLi);
    client.request(COMMANDS.TOGGLE_AUTO_LAUNCH);
  };

  window.checkForUpdates = () => {
    shell.openExternal(`http://getcaptain.co/?since=${Package.version.split(".")[0]}`);
  };

  window.updateWindowHeight = ({ width, height } = {}) => {
    menuWindow.setSize(width || menuWindow.getSize()[0], height || document.body.firstChild.offsetHeight + 8);

    document.querySelectorAll(".containers").forEach((node) => {
      const { height } = screen.getPrimaryDisplay().workArea;
      node.style.maxHeight = `${height - 150}px`;
    });
  };

  window.hideWindow = () => {
    menuWindow.hide();
  };

  client.on(COMMANDS.VERSION, (error, { vibrancy, version, autoLaunch }) => {
    if (version) {
      updateStatus(`Using Docker ${version}`);
    } else {
      updateStatus("Docker not available", true);
    }

    menuWindow.setVibrancy(vibrancy);
    document.querySelector(".menu").className = `menu ${vibrancy}`;

    autoLaunchLi.classList.toggle("checked", autoLaunch);
    enableItem(autoLaunchLi);
  });

  client.on(COMMANDS.CONTAINER_GROUPS, (error, body) => {
    renderContainerGroups((cachedGroups = body.groups));
    updateWindowHeight();
  });

  // Keep track of ⌥ Option and ⌃ Control keys.
  let watchModifierKeys = (event) => {
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
    updateWindowHeight();
  };
  window.addEventListener("keydown", watchModifierKeys);
  window.addEventListener("keyup", watchModifierKeys);

  // Manually propagate ⌃ Control clicks, or rather rightclicks.
  window.addEventListener("contextmenu", (event) => {
    if (
      event.target &&
      event.target.nodeName === "LI" &&
      event.target.className.indexOf("container") >= 0 &&
      event.target.className.indexOf("active") >= 0
    ) {
      event.target.onclick(event);
    }
  });

  updateStatus("Looking for Docker", true);
  client.request(COMMANDS.VERSION);
  client.request(COMMANDS.CONTAINER_GROUPS);
};

const updateStatus = (message, hideSeparator) => {
  document.querySelector(".status").innerHTML = message;
  document.querySelector(".status ~ .separator").style.display = document.querySelector(".containers").childElementCount
    ? "block"
    : "none";
  updateWindowHeight();
};

const renderContainerGroups = (groups) => {
  document
    .querySelectorAll(".containers .group, .containers .container, .containers .separator")
    .forEach((node) => node.remove());

  const listNode = document.querySelector(".containers");

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

  document.querySelectorAll(".containers").forEach((node) => {
    node.style.height = listNode.childElementCount ? "auto" : "0";
    node.style.visibility = listNode.childElementCount ? "visible" : "hidden";
    node.style.margin = listNode.childElementCount ? "" : "0px";
  });
};

const renderContainerGroupName = (listNode, groupName, group) => {
  const closed = closedGroups.has(groupName) ? "closed" : "";
  const countAll = Object.keys(group).length;
  const countActive = Object.keys(group).filter((containerName) => group[containerName].active).length;
  const countHTML = `<small>(${countActive}/${countAll})</small>`;

  const li = document.createElement("li");
  li.className = ` group ${closed} `;
  li.innerHTML = `${groupName.replace(/^~/, "")} ${countHTML}`;
  li.onclick = (event) => {
    if (closed) {
      closedGroups.delete(groupName);
    } else {
      closedGroups.add(groupName);
    }

    renderContainerGroups(cachedGroups);
    updateWindowHeight();
  };

  listNode.appendChild(li);
};

const renderContainerGroupSeparator = (listNode) => {
  const li = document.createElement("li");
  li.className = "separator containers-separator";
  listNode.appendChild(li);
};

const renderContainerGroupItem = (listNode, item) => {
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
        setTimeout(() => client.request(COMMANDS.CONTAINER_REMOVE, container), 100);
      }
    }
    // ⌃ Control.
    else if (event.ctrlKey) {
      if (killable) {
        disableItem(event.target);
        ctrlIsDown = false;
        setTimeout(() => client.request(COMMANDS.CONTAINER_KILL, container), 100);
      }
    }
    // ⌥ Option.
    else if (event.altKey) {
      clipboard.writeText(container.id);
      altIsDown = false;
      hideWindow();
    }
    // ⌘ Command.
    else if (event.metaKey) {
      if (openable) {
        disableItem(event.target);
        metaIsDown = false;
        shell.openExternal(container.openInBrowser || `http${port == 443 ? "s" : ""}://localhost:${port || 80}`);
        hideWindow();
      }
    }
    // ⇧ Shift.
    else if (event.shiftKey) {
      if (container.active) {
        disableItem(event.target);
        shiftIsDown = false;
        setTimeout(() => {
          container.paused
            ? client.request(COMMANDS.CONTAINER_UNPAUSE, container)
            : client.request(COMMANDS.CONTAINER_PAUSE, container);
        }, 100);
      }
    }
    // Default.
    else {
      if (!container.paused) {
        disableItem(event.target);
        setTimeout(() => {
          container.active
            ? client.request(COMMANDS.CONTAINER_STOP, container)
            : client.request(COMMANDS.CONTAINER_START, container);
        }, 100);
      } else {
        disableItem(event.target);
        setTimeout(() => client.request(COMMANDS.CONTAINER_UNPAUSE, container), 100);
      }
    }
  };

  listNode.appendChild(li);
};

const disableItem = (node) => {
  node.style.color = "#777";
  node.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
  node.oldonclick = node.onclick;
  node.onclick = () => {};
};

const enableItem = (node) => {
  node.style.color = "";
  node.style.backgroundColor = "";
  if (node.oldonclick) {
    node.onclick = node.oldonclick;
  }
};
