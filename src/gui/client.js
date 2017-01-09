import {clipboard, shell} from "electron";
import ElectronClient from "electron-rpc/client";
import {COMMANDS} from "../rpc";

const client = new ElectronClient();
let vibrancy = "light";
let altIsDown = false;
let ctrlIsDown = false;
let metaIsDown = false;
let shiftIsDown = false;
const closedGroups = new Set;
let cachedGroups = {};

export const clientStart = async (menuWindow) => {
	client.on(COMMANDS.VERSION, (error, {vibrancy, version}) => {
		if (version) {
			updateStatus(`Using Docker ${version}`);
		} else {
			updateStatus("Docker not available");
		}

		menuWindow.setVibrancy(vibrancy);
		document.querySelector(".menu").className = `menu ${vibrancy}`;
	});

	client.on(COMMANDS.CONTAINER_GROUPS, (error, body) => {
		renderContainerGroups(cachedGroups = body.groups);
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
		if (event.target &&
			event.target.nodeName === "LI" &&
			event.target.className.indexOf("container") >= 0 &&
			event.target.className.indexOf("active") >= 0) {
			event.target.onclick(event);
		}
	});

	updateWindowHeight({height: 3 * 22 + 18});
	updateStatus("Looking for Docker");
	client.request(COMMANDS.VERSION);
	client.request(COMMANDS.CONTAINER_GROUPS);
};

export const clientStop = () => {
	client.request(COMMANDS.APPLICATION_QUIT);
};

const renderContainerGroups = (groups) => {
	document
		.querySelectorAll(".containers .group, .containers .container, .containers .separator")
		.forEach((node) => node.remove());

	const listNode = document.querySelector(".containers");

	Object.keys(groups).forEach((groupName) => {
		renderContainerGroupName(listNode, groupName);

		if (!closedGroups.has(groupName)) {
			Object.keys(groups[groupName]).forEach((containerName) => {
				renderContainerGroupItem(listNode, groups[groupName][containerName]);
			});
		}

		renderContainerGroupSeparator(listNode);
	});

	document
		.querySelectorAll(".containers")
		.forEach((node) => {
			node.style.height = (listNode.childElementCount ? 'auto' : '0');
			node.style.visibility = (listNode.childElementCount ? 'visible' : 'hidden');
			node.style.margin = (listNode.childElementCount ? '' : '0px');
		});
};

const renderContainerGroupName = (listNode, groupName) => {
	const closed = closedGroups.has(groupName) ? "closed" : "";

	const li     = document.createElement("li");
	li.className = ` group ${closed} `;
	li.innerHTML = `${groupName.replace(/^~/, "")}`;
	li.onclick   = (event) => {
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
	const li     = document.createElement("li");
	li.className = "separator containers-separator";
	listNode.appendChild(li);
};

const renderContainerGroupItem = (listNode, item) => {
	const container = item;
	const port      = container.ports.indexOf("443") >= 0 ? "443" : (container.ports.indexOf("80") >= 0 ? "80" : container.ports[0]);
	const openable  = container.active && !container.paused && port && metaIsDown;
	const killable  = container.active && !container.paused && ctrlIsDown;
	const pauzeable = container.active && shiftIsDown;

	const li     = document.createElement("li");
	li.title     =
`Image: ${container.image}
Status: ${container.status}

Click to ${container.active ? "\Stop" : "Start"}`;

	li.className = `container ${container.active ? "active" : "inactive"}`;

	if (container.paused) {
		li.className += ' paused ';
	}
	if (killable) {
		li.className += ' killable ';
	}
	if (pauzeable) {
		li.className += ' pauzeable ';
	}

	if (altIsDown) {
		li.innerHTML = `Copy "${container.id}"`;
	} else if (openable) {
		li.innerHTML = `Open "${container.openInBrowser || `${container.hostname || "localhost"}:${port || 80}`}"`;
	} else if (killable) {
		li.innerHTML = `Kill ${container.shortName}`;
	} else if (pauzeable) {
		li.innerHTML = `${container.paused ? "Unpauze" : "Pauze"} ${container.shortName}`;
	} else {
		li.innerHTML = `${container.shortName} ${container.paused ? `(paused)` : (port ? `(${port})` : "")}`;
	}

	li.onclick = (event) => {
		event.preventDefault();

		// ⌃ Control.
		if (event.ctrlKey) {
			if (killable) {
				disableItem(event.target);
				ctrlIsDown = false;
				client.request(COMMANDS.CONTAINER_KILL, container);
			}
		}
		// ⌥ Option.
		else if (event.altKey) {
			clipboard.writeText(container.id);
			altIsDown = false;
			menuWindow.hide();
		}
		// ⌘ Command.
		else if (event.metaKey) {
			if (openable) {
				disableItem(event.target);
				metaIsDown = false;
				shell.openExternal(container.openInBrowser || `http${port == 443 ? "s" : ""}://localhost:${port || 80}`);
				menuWindow.hide();
			}
		}
		// ⇧ Shift.
		else if (event.shiftKey) {
			if (container.active) {
				disableItem(event.target);
				shiftIsDown = false;
				container.paused ?
					client.request(COMMANDS.CONTAINER_UNPAUSE, container) :
					client.request(COMMANDS.CONTAINER_PAUSE, container);
			}
		}
		// Default.
		else {
			if (!container.paused) {
				disableItem(event.target);
				container.active ?
					client.request(COMMANDS.CONTAINER_STOP, container) :
					client.request(COMMANDS.CONTAINER_START, container);
			} else {
				disableItem(event.target);
				client.request(COMMANDS.CONTAINER_UNPAUSE, container);
			}
		}
	};

	listNode.appendChild(li);
};

const disableItem = (node) => {
	node.style.color = '#777';
	node.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
	node.onclick = () => {};
};
