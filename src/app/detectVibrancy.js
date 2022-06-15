import { execSync } from "child_process";

export const detectVibrancy = async () => {
  try {
    execSync("defaults read -g AppleInterfaceStyle");
    return "ultra-dark";
  } catch (e) {
    return "light";
  }
};
