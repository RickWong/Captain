import {exec} from "child_process";

// Fix PATH to find "docker" binary.
process.env.PATH = process.env.PATH + ":/usr/local/bin";

const escapeShell = (arg) => `'${arg.replace(/(["\s'$\`\\])/g, "\\$1")}'`;

const execPromise = (command) => {
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

export const version = async () => {
	try {
		return (await containerCommand("-v"))
			.map((version) => (version.match(/version\s+(.*),/) || [])[1])
			.shift();
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			console.error(error);
		}

		return undefined;
	}
};

export const containerList = async () => {
	try {
		return (await containerCommand("ps -a"))
			.slice(1).filter((line) => line.length > 0)
			.map((item) => {
				let [id, image, command, created, status, port, name] = item.split(/\s{3,}/g);

				if (!name) {
					name = port;
					port = undefined;
				}

				return {id, image, command, created, status, port, name};
			});
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			console.error(error);
		}

		return [];
	}
};
