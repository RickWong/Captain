import debug from "debug";
import { ipcMain } from "electron";
import { COMMANDS } from "../renderer/ipcCommands";
import * as Docker from "./docker";
import { toggleAutoLaunch, autoLaunchEnabled } from "./toggleAutoLaunch";
import { Menubar } from "menubar/lib/Menubar";
import { moveToApplications } from "./moveToApplications";
import { checkForUpdates } from "./checkForUpdates";

export const addIpcListeners = async (menubar: Menubar) => {
  require("@electron/remote/main").enable(menubar.window!.webContents);

  /**
   * Sends message to Electron's renderer process over IPC.
   */
  const sendToRenderer = (channel: string, ...args: any[]) => menubar.window!.webContents.send(channel, ...args);

  /**
   * Triggers IPC listener in main process.
   */
  let lastCacheMicrotime = Date.now();
  const triggerListener = (command: string, body?: any, delayMs = 1) => {
    lastCacheMicrotime = 0;
    setTimeout(() => ipcMain.emit(command, body), delayMs); // Run on next tick.
  };

  let queryContainersInterval: NodeJS.Timeout;
  menubar.on("show", async () => {
    debug("captain-rpc-server")("Show");

    // When popup menu is visible, query docker containers every 5 seconds.
    clearInterval(queryContainersInterval);
    queryContainersInterval = setInterval(() => triggerListener(COMMANDS.CONTAINER_GROUPS), 5_000);

    triggerListener(COMMANDS.VERSION);
    triggerListener(COMMANDS.CONTAINER_GROUPS);
  });

  menubar.on("hide", () => {
    debug("captain-rpc-server")("Hide");

    // When popup menu is hidden, query docker containers every 60 seconds.
    clearInterval(queryContainersInterval);
    queryContainersInterval = setInterval(() => triggerListener(COMMANDS.CONTAINER_GROUPS), 60_000);
  });

  ipcMain.on(COMMANDS.APPLICATION_QUIT, async () => {
    debug("captain-rpc-server")("Quit");

    menubar.app.quit();
  });

  ipcMain.on(COMMANDS.VERSION, async () => {
    debug("captain-rpc-server")("Version");

    sendToRenderer(COMMANDS.VERSION, {
      version: process.env.npm_package_version,
      dockerVersion: await Docker.version(),
      autoLaunch: await autoLaunchEnabled(),
    });
  });

  ipcMain.on(COMMANDS.TOGGLE_AUTO_LAUNCH, async () => {
    debug("captain-rpc-server")("Toggle auto launch");
    await toggleAutoLaunch();

    // While not necessary for auto launch to function properly, this is a
    // great moment to ask to move Captain to the Applications folder.
    await moveToApplications(menubar.window!);

    triggerListener(COMMANDS.VERSION);
  });

  ipcMain.on(COMMANDS.CHECK_FOR_UPDATES, async () => {
    debug("captain-rpc-server")("Check for updates");

    await checkForUpdates().catch((error) => debug("captain-rpc-server")(error));
  });

  ipcMain.on(COMMANDS.CONTAINER_KILL, async (_event, body) => {
    debug("captain-rpc-server")("Container kill", body);
    await Docker.containerCommand("kill", body.id);

    triggerListener(COMMANDS.CONTAINER_GROUPS);
  });

  ipcMain.on(COMMANDS.CONTAINER_STOP, async (_event, body) => {
    debug("captain-rpc-server")("Container stop", body);
    await Docker.containerCommand("stop", body.id);

    triggerListener(COMMANDS.CONTAINER_GROUPS);
  });

  ipcMain.on(COMMANDS.CONTAINER_START, async (_event, body) => {
    debug("captain-rpc-server")("Container start", body);
    await Docker.containerCommand("start", body.id);

    triggerListener(COMMANDS.CONTAINER_GROUPS, undefined, 500);
  });

  ipcMain.on(COMMANDS.CONTAINER_PAUSE, async (_event, body) => {
    debug("captain-rpc-server")("Container pause", body);
    await Docker.containerCommand("pause", body.id);

    triggerListener(COMMANDS.CONTAINER_GROUPS);
  });

  ipcMain.on(COMMANDS.CONTAINER_UNPAUSE, async (_event, body) => {
    debug("captain-rpc-server")("Container unpause", body);
    await Docker.containerCommand("unpause", body.id);

    triggerListener(COMMANDS.CONTAINER_GROUPS);
  });

  ipcMain.on(COMMANDS.CONTAINER_REMOVE, async (_event, body) => {
    debug("captain-rpc-server")("Container remove", body);
    await Docker.containerCommand("rm", body.id);

    triggerListener(COMMANDS.CONTAINER_GROUPS);
  });

  // Holds cached container info.
  let cachedContainerGroups: Record<string, any> = {};

  ipcMain.on(COMMANDS.CONTAINER_GROUPS, async () => {
    /**
     * Send from cache.
     */
    if (cachedContainerGroups && Date.now() < lastCacheMicrotime + 1000) {
      debug("captain-rpc-server")("Using microcache");

      sendToRenderer(COMMANDS.CONTAINER_GROUPS, {
        groups: cachedContainerGroups,
      });
      return;
    }

    const containers = await Docker.containerList();
    const composeProjects = await Docker.composeProjectsList();
    const groups: Record<string, any> = { "~others": {} }; // Make sure ~others exist as first group.

    for (const container of containers) {
      let groupName = "~others";
      let containerName = container.name;

      // Prefer using Compose project name as group name.
      const composeProject = composeProjects.find((projectName: string) => container.name.startsWith(projectName));
      if (composeProject) {
        groupName = composeProject;
        containerName = container.name.replace(composeProject, "").replace(/^[-_+]/, "");
      } else {
        // If there's no Compose project name, parse the container name, or the image name.
        const nameParts = container.name.split("_");
        const imageParts = container.image.split("_");

        if (nameParts.length >= 3) {
          groupName = nameParts[0];
          containerName = nameParts.slice(1).join("_");
        } else if (imageParts.length >= 2) {
          groupName = imageParts[0];
          containerName = imageParts.slice(1).join("_");
        }
      }

      container.shortName = containerName.replace(/^_+/, "");

      groups[groupName] = Object.assign(groups[groupName] || {}, {
        [containerName]: container,
      });
    }

    cachedContainerGroups = Object.assign({}, groups);
    lastCacheMicrotime = Date.now();
    sendToRenderer(COMMANDS.CONTAINER_GROUPS, { groups });
  });
};
