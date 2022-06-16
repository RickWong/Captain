// @ts-ignore
import AutoLaunch from "auto-launch-patched";
import debug from "debug";
import { app } from "electron";

const autoLauncher = new AutoLaunch({
  name: "Captain",
  mac: {
    useLaunchAgent: false,
  },
  isHidden: true, // Launch without active window.
});

export const toggleAutoLaunch = async () => {
  if (!app.isPackaged) {
    return;
  }

  try {
    const isEnabled = await autoLauncher.isEnabled();

    if (isEnabled) {
      debug("captain-auto-launch")("Disable auto launch");
      await autoLauncher.disable();
    } else {
      debug("captain-auto-launch")("Enable auto launch");
      await autoLauncher.enable();
    }
  } catch (error) {
    debug("captain-auto-launch")("Failed to toggle auto launch");
  }
};

export const autoLaunchEnabled = async () => {
  try {
    return await autoLauncher.isEnabled();
  } catch (error) {
    return false;
  }
};
