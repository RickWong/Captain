const {clipboard, remote, shell} = require('electron');
const ElectronClient = require('electron-rpc/client');

const menuWindow = remote.getCurrentWindow();
menuWindow.setVibrancy('titlebar');
menuWindow.setResizable(true);
menuWindow.setMovable(false);
menuWindow.setMinimizable(false);
menuWindow.setMaximizable(false);
menuWindow.openDevTools();

const client = new ElectronClient();
client.on('containers', (err, body) => {
	console.log(body);

	for (let c of document.querySelectorAll('.containers .group, .containers .container')) {
		c.remove();
	}

	const containers = document.querySelectorAll('.containers')[0];

	Object.keys(body.groups).forEach((groupName) => {
		const li     = document.createElement('li');
		li.className = 'group';
		li.innerHTML = groupName;
		containers.appendChild(li);

		Object.keys(body.groups[groupName]).forEach((containerName) => {
			const container = body.groups[groupName][containerName];
			const port = (container.ports||[])[0];

			const li     = document.createElement('li');
			li.className = 'container ' + (container.active ? 'active' : 'inactive');
			li.innerHTML = containerName + (port ? ` (${port})` : '');
			if (container.active) {
				li.onclick   = (event) => {
					if (event.metaKey) {
						shell.openExternal(`http${port==443?'s':''}://localhost:${port}`);
					} else {
						clipboard.writeText(`localhost:${port}`);
					}
					menuWindow.hide();
				};
				li.title = `Copy / Hold ⌘ to Open`;
			}
			containers.appendChild(li);
		});
	});

	var win = remote.getCurrentWindow();
	win.setSize(menuWindow.getSize()[0], document.body.parentNode.offsetHeight);
});

const appQuit = () => {
	client.request('quit');
};

const checkForUpdates = () => {
	shell.openExternal('http://getcaptain.co/#changes');
};
