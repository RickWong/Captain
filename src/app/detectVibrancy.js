import { execSync } from "child_process";

export const detectVibrancy = () => {
  try {
    execSync("defaults read -g AppleInterfaceStyle");
    return "ultra-dark";
  } catch (e) {
    return "light";
  }
}
