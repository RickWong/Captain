import debug from "debug";
import { app, dialog, BrowserWindow } from "electron";

export const moveToApplications = async (currentWindow: BrowserWindow) => {
  if (app.isInApplicationsFolder()) {
    debug("captain-move-app")("Not necessary, already in Applications folder");
    return;
  }

  const buttonId = dialog.showMessageBoxSync(currentWindow, {
    message: "Move Captain to Applications folder? This is optional.",
    buttons: ["Move to Applications folder", "Maybe later"],
    defaultId: 0,
  });

  if (buttonId == 1) {
    // Maybe later
    return;
  }

  if (!app.isPackaged) {
    debug("captain-move-app")("Not moving because not packaged");
    return;
  }

  try {
    debug("captain-move-app")("Moved to Applications");

    // Electron will restart Captain after moving to Applications folder.
    app.moveToApplicationsFolder();
  } catch (error) {
    debug("captain-move-app")("Failed to move app");
  }
};
