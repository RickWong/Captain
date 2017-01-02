import {shell} from "electron";
import ElectronClient from "electron-rpc/client";
import {COMMANDS} from "../rpc";

const client = new ElectronClient();

export const clientStart = async () => {
	client.on(COMMANDS.VERSION, (error, {version}) => {
		if (version) {
			updateStatus(`Runnin' Docker ${version}`);
		} else {
			updateStatus(`Aaargh whar's ye Docker ay?`);
		}
	});

	client.on(COMMANDS.CONTAINER_GROUPS, (error, body) => {
		document
			.querySelectorAll(".containers .group, .containers .container, .containers .separator")
			.forEach((node) => node.remove());

		const listNode = document.querySelector(".containers");

		renderContainerGroups(listNode, body.groups);

		document
			.querySelectorAll(".containers")
			.forEach((node) => {
				node.style.height = (listNode.childElementCount ? 'auto' : '0');
				node.style.visibility = (listNode.childElementCount ? 'visible' : 'hidden');
				node.style.margin = (listNode.childElementCount ? '' : '0px');
			});

		updateWindowHeight();
	});

	updateWindowHeight({height: 3 * 22 + 18});
	updateStatus("Ahoy! Findin' ye Docker...");
	client.request(COMMANDS.VERSION);
	client.request(COMMANDS.CONTAINER_GROUPS);
};

export const clientStop = () => {
	client.request(COMMANDS.APPLICATION_QUIT);
};

const renderContainerGroups = (listNode, groups) => {
	Object.keys(groups).forEach((groupName) => {
		renderContainerGroupName(listNode, groupName);

		Object.keys(groups[groupName]).forEach((containerName) => {
			renderContainerGroupItem(listNode, groups[groupName][containerName]);
		});

		renderContainerGroupSeparator(listNode);
	});
};

const renderContainerGroupName = (listNode, groupName) => {
	if (groupName === "nogroup") {
		return;
	}

	const li     = document.createElement("li");
	li.className = "group";
	li.innerHTML = groupName;
	listNode.appendChild(li);
};

const renderContainerGroupSeparator = (listNode) => {
	const li     = document.createElement("li");
	li.className = "separator containers-separator";
	listNode.appendChild(li);
};

const renderContainerGroupItem = (listNode, item) => {
	const container = item;
	const port      = (container.ports || [])[0];

	const li     = document.createElement("li");
	li.title     = `${container.active ? "\Stop" : "Start"} Container\n\n⌘ Open in Browser${container.active && !container.paused ? "\n⌥ Kill Now" : ""}`;
	li.className = "container " + (container.active ? (container.paused ? "paused" : "active") : "inactive");
	li.innerHTML = container.shortName + (container.paused ? ` (paused)` : (port ? ` (${port})` : ""));

	li.onclick = (event) => {
		event.preventDefault();

		// ⌥
		if (event.altKey) {
			if (container.active && !container.paused) {
				disableItem(event.target);
				client.request(COMMANDS.CONTAINER_KILL, container);
			}
		}
		// ⌘
		else if (event.metaKey) {
			shell.openExternal(`http${port == 443 ? "s" : ""}://localhost:${port || 80}`);
		}
		// ⇧
		else if (event.shiftKey) {
			if (container.active) {
				disableItem(event.target);
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
