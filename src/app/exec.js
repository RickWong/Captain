import {exec} from "child_process";

// Escape special shell characters.
export const escapeShell = (arg) => `'${arg.replace(/(["\s'$\`\\])/g, "\\$1")}'`;

// Promisified exec().
export const execPromise = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error || stderr) {
        reject(error || new Error(stderr));
      } else {
        resolve(stdout.split("\n"));
      }
    });
  });
};
