import debug from "debug";
import { exec } from "child_process";

// Fix environment PATH to find the "docker" binary.
process.env.PATH = process.env.PATH + ":/usr/local/bin";

/**
 * Returns escaped command line parameter for safe usage in exec().
 */
const escapeShell = (arg: string) => `'${arg.replace(/(["\s'$`\\])/g, "\\$1")}'`;

/**
 * Executes a docker command, returns stderr >& stdout.
 */
export const containerCommand = async (command: string, id?: string): Promise<string> => {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    exec(`$(which docker) ${command} ${id ? escapeShell(id) : ""} 2>&1`, { encoding: "utf-8" }, (err, stdout) => {
      debug("captain-docker")(`command "${command}" finished in ${Date.now() - start}ms`);

      if (err) {
        debug("captain-docker")(err);
        return reject(stdout);
      }

      resolve(stdout);
    });
  });
};

/**
 * Executes a docker compose command.
 */
export const composeContainerCommand = async (command: string, id?: string): Promise<string> => {
  return containerCommand(`compose ${command}`, id);
};

/**
 * Queries the docker version, returns semver string.
 */
export const version = async (): Promise<string | undefined> => {
  try {
    return (await containerCommand("version"))
      .split("\n")
      .filter((line) => line.match(/Version:\s+(.*)/))
      .map((version) => (version.match(/Version:\s+(.*)/) || [])[1])
      .shift();
  } catch (error) {
    debug("captain-docker")(error);
    return undefined;
  }
};

/**
 * Queries the docker compose project list, returns array of project names.
 */
export const composeProjectsList = async (): Promise<string[]> => {
  try {
    const list: Record<string, any> = {};
    (await composeContainerCommand("ls -a"))
      .split("\n")
      .slice(1)
      .filter((line) => line.length > 0)
      .forEach((item) => {
        let [name] = item.split(/\s{3,}/g);
        list[name] = name;
      });

    return Object.values(list);
  } catch (error) {
    debug("captain-docker-compose")(error);
    return [];
  }
};

interface Container {
  id: string;
  image: string;
  command: string;
  created: string;
  status: string;
  ports: string[];
  name: string;
  active: boolean;
  paused: boolean;
  shortName: string;
  logs?: string;
  openInBrowser?: string;
}

/**
 * Queries the docker container list, returns array of Containers.
 */
export const containerList = async (): Promise<Container[] | undefined> => {
  try {
    const list: Record<string, Container> = {};

    (await containerCommand("container ps -a"))
      .split("\n")
      .slice(1)
      .filter((line) => line.length > 0)
      .forEach((item) => {
        let [id, image, command, created, status, _ports, name] = item.split(/\s{3,}/g);

        if (!name) {
          name = _ports;
          _ports = "";
        }

        let ports: string[];
        if (_ports.length) {
          ports = (_ports.match(/:([0-9]+)->/g) || []).map((s) => s.replace(/[^0-9]+/g, ""));
        } else {
          ports = [];
        }

        const active = status.indexOf("Up") >= 0;
        const paused = status.indexOf("Paused") >= 0;
        const shortName = name;

        list[id] = { id, image, command, created, status, ports, name, shortName, active, paused };
      });

    await Promise.allSettled(
      Object.keys(list).map((id) =>
        Promise.allSettled([
          // Enrich with openInBrowser.
          list[id].ports.length > 0 ? containerOpenInBrowser(id).then(([url]) => (list[id].openInBrowser = url)) : true,
          // Enrich with last log.
          containerLogs(id).then(([logs]) => (list[id].logs = logs)),
        ]),
      ),
    );

    return Object.values(list).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    debug("captain-docker")(error);
    return undefined;
  }
};

export const containerOpenInBrowser = async (id: string): Promise<[string?, string?]> => {
  try {
    const lines = await containerCommand(`exec ${escapeShell(id)} sh -c 'echo $OPEN_IN_BROWSER'`);
    return [lines.trim(), undefined];
  } catch (err) {
    debug("captain-docker")(err);
    return [undefined, err];
  }
};

export const containerLogs = async (id: string): Promise<[string?, string?]> => {
  try {
    const lines = await containerCommand(`logs '${id}' --tail 10`);
    return [lines, undefined];
  } catch (err) {
    debug("captain-docker")(err);
    return [undefined, err];
  }
};

export const containerStart = async (id: string): Promise<[string?, string?]> => {
  try {
    const lines = await containerCommand(`start '${id}'`);
    return [lines, undefined];
  } catch (err) {
    debug("captain-docker")(err);
    return [undefined, err];
  }
};
