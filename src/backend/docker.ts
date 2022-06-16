import { exec } from "child_process";
import debug from "debug";
import { escapeShell } from "./escapeShell";

// Fix environment PATH to find the "docker" binary.
process.env.PATH = process.env.PATH + ":/usr/local/bin";

export const containerCommand = async (command: string, id?: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    exec(`$(which docker) ${command} ${id ? escapeShell(id) : ""}`, { encoding: "utf-8" }, (stderr, stdout) => {
      if (stderr) {
        debug("captain-docker")(stderr);
        return reject([]);
      }

      resolve(stdout.split("\n"));
    });
  });
};

export const version = async () => {
  try {
    return (await containerCommand("version"))
      .filter((line) => line.match(/Version:\s+(.*)/))
      .map((version) => (version.match(/Version:\s+(.*)/) || [])[1])
      .shift();
  } catch (error) {
    debug("captain-docker")(error);
    return undefined;
  }
};

export const containerList = async () => {
  try {
    const list: Record<string, any> = {};

    (await containerCommand("container ps -a"))
      .slice(1)
      .filter((line) => line.length > 0)
      .forEach((item) => {
        let [id, image, command, created, status, _ports, name] = item.split(/\s{3,}/g);

        if (!name) {
          name = _ports;
          _ports = undefined;
        }

        let ports: string[] = [];
        if (_ports) {
          ports = (_ports.match(/:([0-9]+)->/g) || []).map((s) => s.replace(/[^0-9]+/g, ""));
        } else {
          ports = [];
        }

        list[id] = { id, image, command, created, status, ports, name };
      });

    await Promise.all(
      Object.keys(list)
        .filter((id) => list[id].ports.length > 0)
        .map((id) =>
          Promise.resolve().then(async () => {
            const lines = await containerCommand(`exec ${escapeShell(id)} sh -c 'echo $OPEN_IN_BROWSER'`);
            list[id].openInBrowser = lines ? lines[0] : undefined;
          }),
        ),
    );

    return Object.values(list);
  } catch (error) {
    debug("captain-docker")(error);
    return [];
  }
};
