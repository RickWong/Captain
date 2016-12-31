const exec = require('child_process').exec;
const path = require('path');

const escapeShell = (cmd) => '"' + cmd.replace(/(["\s'$`\\])/g,'\\$1') + '"';

const listContainers = () => {
	return new Promise((resolve, reject) => {
		exec('docker container ls -a', (error, stdout, stderr) => {
			if (error) {
				reject(error);
			}

			if (stderr) {
				reject(new Error(stderr))
			}

			if (stdout) {
				const lines = stdout.split("\n").slice(1).filter(line => line.length > 0);

				const containers = lines.map(line => {
					let [id, image, command, created, status, port, name] = line.split(/\s{3,}/g);

					if (!name) {
						name = port;
						port = undefined;
					}

					return { id, image, command, created, status, port, name };
				});

				resolve(containers);
			}
		});
	});
};

const commandContainer = (command, id) => {
	return new Promise((resolve, reject) => {
		exec('docker container ' + escapeShell(command) + ' ' + escapeShell(id), (error, stdout, stderr) => {
			if (error) {
				reject(error);
			}

			if (stderr) {
				reject(new Error(stderr))
			}

			if (stdout) {
				resolve(true);
			}
		});
	});
};

module.exports = {
	listContainers,
	commandContainer,
};
