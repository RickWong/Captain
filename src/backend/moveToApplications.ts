import debug from "debug";
import { app, dialog, BrowserWindow } from "electron";

export const moveToApplications = async (currentWindow: BrowserWindow) => {
  if (process.title && process.title.indexOf("Electron.app") >= 0) {
    return;
  }

  const buttonId = dialog.showMessageBoxSync(currentWindow, {
    message: "Move Captain to Applications folder?",
    buttons: ["Move", "Cancel"],
  });

  if (buttonId == 1) {
    return;
  }

  try {
    app.moveToApplicationsFolder();

    // Electron will restart Captain after moving to Applications folder.
  } catch (error) {
    debug("captain-electron")("Failed to move app");
  }
};
