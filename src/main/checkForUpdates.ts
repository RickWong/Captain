import { autoUpdater } from "electron-updater";
import { app, dialog } from "electron";
import debug from "debug";
import path from "path";

autoUpdater.on("error", (event, error) => {
  debug("captain-check-for-update")(error);
});

autoUpdater.on("update-not-available", (info) => {
  debug("captain-check-for-update")("Already up to date", info);

  dialog
    .showMessageBox({
      type: "info",
      message: "Captain is up to date",
      detail: "It looks like you're already rocking the latest version!",
    })
    .catch(debug("captain-check-for-update"));
});

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

if (process.env.NODE_ENV === "development") {
  Object.defineProperty(autoUpdater, "currentVersion", { value: "0.0.1" });
  autoUpdater.updateConfigPath = path.join(__dirname, "../public/app-update.yml");
}

export const checkForUpdates = async () => {
  const oldValue = app.isPackaged;
  Object.defineProperty(app, "isPackaged", { value: true });
  await autoUpdater.checkForUpdates();
  Object.defineProperty(app, "isPackaged", { value: oldValue });
};
