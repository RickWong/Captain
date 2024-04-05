/**
 * Commands for Inter-Process Communication (IPC) between Electron's main and renderer processes.
 *
 * @TODO Add typing for command parameters.
 */
export const COMMANDS = {
  APPLICATION_QUIT: "applicationQuit",
  VERSION: "version",
  CHECK_FOR_UPDATES: "checkForUpdates",
  TOGGLE_AUTO_LAUNCH: "toggleAutoLaunch",
  CONTAINER_GROUPS: "containerGroups",
  CONTAINER_KILL: "containerKill",
  CONTAINER_STOP: "containerStop",
  CONTAINER_START: "containerStart",
  CONTAINER_PAUSE: "containerPause",
  CONTAINER_UNPAUSE: "containerUnpause",
  CONTAINER_REMOVE: "containerRemove",
  CONTAINER_ERROR: "containerError",
};
