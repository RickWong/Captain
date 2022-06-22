import debug from "debug";
import { app, dialog, BrowserWindow } from "electron";

export const moveToApplications = async (currentWindow: BrowserWindow) => {
  if (!app.isPackaged || app.isInApplicationsFolder()) {
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
    debug("captain-move-app")("Moved to Applications");

    // Electron will restart Captain after moving to Applications folder.
    app.moveToApplicationsFolder();
  } catch (error) {
    debug("captain-move-app")("Failed to move app");
  }
};
