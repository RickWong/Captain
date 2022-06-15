import LetsMove from "electron-lets-move";
import debug from "debug";

export const moveToApplications = async () => {
  if (process.title && process.title.indexOf("Electron.app") >= 0) {
    return;
  }

  try {
    await LetsMove.moveToApplications();
  } catch (error) {
    debug("captain-lets-move")("Failed to move app");
  }
};
