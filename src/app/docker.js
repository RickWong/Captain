import { execPromise, escapeShell } from "./exec";
import debug from "debug";

// Fix environment PATH to find the "docker" binary.
process.env.PATH = process.env.PATH + ":/usr/local/bin";

// Execute a single Docker command.
export const containerCommand = async (command, id) => {
  try {
    return await execPromise(`docker ${command} ${id ? escapeShell(id) : ""}`);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return [];
  }
};

// Retrieve Docker version.
export const version = async () => {
  try {
    return (await containerCommand("version"))
      .filter((line) => line.match(/Version:\s+(.*)/))
      .map((version) => (version.match(/Version:\s+(.*)/) || [])[1])
      .shift();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return undefined;
  }
};

// Retrieve Docker containers.
export const containerList = async () => {
  try {
    const list = {};

    // Retrieve and parse container ids, names, statuses and ports.
    (await containerCommand("ps -a"))
      .slice(1)
      .filter((line) => line.length > 0)
      .forEach((item) => {
        let [id, image, command, created, status, ports, name] = item.split(/\s{3,}/g);

        if (!name) {
          name = ports;
          ports = undefined;
        }

        if (ports) {
          ports = (ports.match(/:([0-9]+)->/g) || []).map(s => s.replace(/[^0-9]+/g, ""));
        } else {
          ports = [];
        }

        list[id] = { id, image, command, created, status, ports, name };
      });

    // Asynchronously find out containers' OPEN_IN_BROWSER env variables.
    await Promise.all(
      Object.keys(list)
        .filter((id) => list[id].ports.length > 0)
        .map((id) => {
          return containerCommand(
            `exec ${escapeShell(id)} sh -c 'echo $OPEN_IN_BROWSER'`
          ).then((lines) => {
            list[id].openInBrowser = lines[0] || undefined;
          }).catch((error) => {
            return [];
          })
        })
    );

    return Object.values(list);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return [];
  }
};
