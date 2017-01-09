import ElectronServer from "electron-rpc/server";
import * as Docker from "./docker";
import {COMMANDS} from "../rpc";
import {execPromise} from "./exec";

const server = new ElectronServer();


let cachedContainerGroups = undefined;
let lastCacheMicrotime = Date.now();
const serverTrigger = (command, body) => {
	lastCacheMicrotime = 0;
	server.methods[command]({body});
};

let updateInterval;
let vibrancy;

export const serverStart = async (menubar) => {
	server.configure(menubar.window.webContents);

	menubar.on("show", async () => {
		clearInterval(updateInterval);

		try {
			await execPromise("defaults read -g AppleInterfaceStyle");
			vibrancy = "ultra-dark";
		} catch (error) {
			vibrancy = "light";
		}

		serverTrigger(COMMANDS.VERSION);
		serverTrigger(COMMANDS.CONTAINER_GROUPS);

		updateInterval = setInterval(() => serverTrigger(COMMANDS.CONTAINER_GROUPS), 5*1000);
	});

	menubar.on("hide", () => {
		clearInterval(updateInterval);

		updateInterval = setInterval(() => serverTrigger(COMMANDS.CONTAINER_GROUPS), 15*1000);
	});

	server.on(COMMANDS.APPLICATION_QUIT, () => {
		menubar.app.quit();
	});

	server.on(COMMANDS.VERSION, async () => {
		server.send(COMMANDS.VERSION, {vibrancy, version: await Docker.version()});
	});

	server.on(COMMANDS.CONTAINER_KILL, async ({body}) => {
		await Docker.containerCommand("kill", body.id);
		serverTrigger(COMMANDS.CONTAINER_GROUPS);
	});

	server.on(COMMANDS.CONTAINER_STOP, async ({body}) => {
		await Docker.containerCommand("stop", body.id);
		serverTrigger(COMMANDS.CONTAINER_GROUPS);
	});

	server.on(COMMANDS.CONTAINER_START, async ({body}) => {
		await Docker.containerCommand("start", body.id);

		setTimeout(() => {
			serverTrigger(COMMANDS.CONTAINER_GROUPS);
		}, 333);
	});

	server.on(COMMANDS.CONTAINER_PAUSE, async ({body}) => {
		await Docker.containerCommand("pause", body.id);
		serverTrigger(COMMANDS.CONTAINER_GROUPS);
	});

	server.on(COMMANDS.CONTAINER_UNPAUSE, async ({body}) => {
		await Docker.containerCommand("unpause", body.id);
		serverTrigger(COMMANDS.CONTAINER_GROUPS);
	});

	server.on(COMMANDS.CONTAINER_GROUPS, async () => {
		if (cachedContainerGroups && Date.now() < lastCacheMicrotime + 2000) {
			if (process.env.NODE_ENV === 'development') {
				console.log("Using cache");
			}

			server.send(COMMANDS.CONTAINER_GROUPS, {groups: cachedContainerGroups});
			return;
		}

		const containers = await Docker.containerList();
		const groups     = {};

		for (const container of containers) {
			let groupName     = "~others";
			let containerName = container.name;

			const imageParts  = container.image.split("_");
			const nameParts   = container.name.split("_");

			if (nameParts.length >= 3) {
				groupName     = nameParts[0];
				containerName = nameParts.slice(1).join("_");
			} else if (imageParts.length >= 2) {
				groupName     = imageParts[0];
				containerName = imageParts.slice(1).join("_");
			}

			container.active    = container.status.indexOf("Up") >= 0;
			container.paused    = container.status.indexOf("Paused") >= 0;
			container.shortName = containerName;

			groups[groupName] = Object.assign(
				groups[groupName] || {},
				{
					[containerName]: container,
				}
			);
		}

		cachedContainerGroups = Object.assign({}, groups);
		lastCacheMicrotime = Date.now();
		server.send(COMMANDS.CONTAINER_GROUPS, {groups});
	})
};
