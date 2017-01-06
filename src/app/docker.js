import {execPromise, escapeShell} from "./exec";

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
