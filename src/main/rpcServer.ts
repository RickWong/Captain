import debug from "debug";
import { ipcMain } from "electron";
import { COMMANDS } from "../renderer/rpcCommands";
import * as Docker from "./docker";
import { toggleAutoLaunch, autoLaunchEnabled } from "./toggleAutoLaunch";
import { Menubar } from "menubar/lib/Menubar";
import { moveToApplications } from "./moveToApplications";

export const serverStart = async (menubar: Menubar) => {
  require("@electron/remote/main").enable(menubar.window!.webContents);

  let cachedContainerGroups: Record<string, any> = {};
  let lastCacheMicrotime = Date.now();
  let updateInterval: NodeJS.Timer;
  const serverTrigger = (command: string, body?: any) => {
    lastCacheMicrotime = 0;
    setTimeout(() => ipcMain.emit(command, body, 1));
  };

  menubar.on("show", async () => {
    debug("captain-rpc-server")("Show");

    clearInterval(updateInterval);
    updateInterval = setInterval(() => serverTrigger(COMMANDS.CONTAINER_GROUPS), 5 * 1000);

    serverTrigger(COMMANDS.VERSION);
    serverTrigger(COMMANDS.CONTAINER_GROUPS);
  });

  menubar.on("hide", () => {
    debug("captain-rpc-server")("Hide");

    clearInterval(updateInterval);
    updateInterval = setInterval(() => serverTrigger(COMMANDS.CONTAINER_GROUPS), 60 * 1000);
  });

  ipcMain.on(COMMANDS.APPLICATION_QUIT, async () => {
    debug("captain-rpc-server")("Quit");

    await moveToApplications(menubar.window!);
    menubar.app.quit();
  });

  ipcMain.on(COMMANDS.VERSION, async () => {
    debug("captain-rpc-server")("Version");

    menubar.window!.webContents.send(COMMANDS.VERSION, {
      version: process.env.npm_package_version,
      dockerVersion: await Docker.version(),
      autoLaunch: await autoLaunchEnabled(),
    });
  });

  ipcMain.on(COMMANDS.TOGGLE_AUTO_LAUNCH, async () => {
    debug("captain-rpc-server")("Toggle auto launch");

    await toggleAutoLaunch();
    await moveToApplications(menubar.window!);
    serverTrigger(COMMANDS.VERSION);
  });

  ipcMain.on(COMMANDS.CONTAINER_KILL, async (_event, body) => {
    debug("captain-rpc-server")("Container kill");
    await Docker.containerCommand("kill", body.id);
    serverTrigger(COMMANDS.CONTAINER_GROUPS);
  });

  ipcMain.on(COMMANDS.CONTAINER_STOP, async (event, body) => {
    debug("captain-rpc-server")("Container stop", event, body);
    await Docker.containerCommand("stop", body.id);
    serverTrigger(COMMANDS.CONTAINER_GROUPS);
  });

  ipcMain.on(COMMANDS.CONTAINER_START, async (_event, body) => {
    debug("captain-rpc-server")("Container start");
    await Docker.containerCommand("start", body.id);

    setTimeout(() => {
      serverTrigger(COMMANDS.CONTAINER_GROUPS);
    }, 333);
  });

  ipcMain.on(COMMANDS.CONTAINER_PAUSE, async (_event, body) => {
    debug("captain-rpc-server")("Container pause");
    await Docker.containerCommand("pause", body.id);
    serverTrigger(COMMANDS.CONTAINER_GROUPS);
  });

  ipcMain.on(COMMANDS.CONTAINER_UNPAUSE, async (_event, body) => {
    debug("captain-rpc-server")("Container unpause");
    await Docker.containerCommand("unpause", body.id);
    serverTrigger(COMMANDS.CONTAINER_GROUPS);
  });

  ipcMain.on(COMMANDS.CONTAINER_REMOVE, async (_event, body) => {
    debug("captain-rpc-server")("Container remove");

    await Docker.containerCommand("rm", body.id);
    serverTrigger(COMMANDS.CONTAINER_GROUPS);
  });

  ipcMain.on(COMMANDS.CONTAINER_GROUPS, async () => {
    if (cachedContainerGroups && Date.now() < lastCacheMicrotime + 1000) {
      debug("captain-rpc-server")("Using microcache");

      menubar.window!.webContents.send(COMMANDS.CONTAINER_GROUPS, {
        groups: cachedContainerGroups,
      });
      return;
    }

    const containers = await Docker.containerList();
    const composeContainers = await Docker.composeContainerList();
    const groups: Record<string, any> = {};

    for (const container of containers) {
      let groupName = "~others";
      let containerName = container.name;

      const composeContainerNames = composeContainers.filter((name: string) => container.name.startsWith(name))
        .map((name: string) => ({
          composeGroupName: name,
          composeContainerName: container.name.replace(name, "")
            .replace(/^[-_+]/, ""),
        })).shift();

      if (composeContainerNames) {
        groupName = composeContainerNames.composeGroupName;
        containerName = composeContainerNames.composeContainerName;
      } else {
        const imageParts = container.image.split("_");
        const nameParts = container.name.split("_");

        if (nameParts.length >= 3) {
          groupName = nameParts[0];
        containerName = nameParts.slice(1).join("_");
        } else if (imageParts.length >= 2) {
          groupName = imageParts[0];
          containerName = imageParts.slice(1).join("_");
        }
      }

      container.active = container.status.indexOf("Up") >= 0;
      container.paused = container.status.indexOf("Paused") >= 0;
      container.shortName = containerName.replace(/^_+/, "");

      groups[groupName] = Object.assign(groups[groupName] || {}, {
        [containerName]: container,
      });
    }

    cachedContainerGroups = Object.assign({}, groups);
    lastCacheMicrotime = Date.now();
    menubar.window!.webContents.send(COMMANDS.CONTAINER_GROUPS, { groups });
  });
};
