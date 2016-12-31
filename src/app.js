const path = require('path');
const ElectronServer = require('electron-rpc/server');
const Menubar = require('menubar');
const package = require(path.join(__dirname, '../package.json'));
const Docker = require('./app/docker');

const server = new ElectronServer();

const menu = Menubar({
	dir: __dirname,
	index: 'file://' + path.join(__dirname, './gui/gui.html'),
	icon: path.join(__dirname, '../resources/IconTemplate.png'),
	tooltip: `Captain Docker ${package.version}`,
	width: 240,
	height: 128,
	windowPosition: 'trayLeft',
	preloadWindow: true,
});

menu.on('ready', () => {
	console.log('app is ready');

	server.configure(menu.window.webContents);

	server.on('quit', (event) => {
		menu.app.quit();
	});

	server.on('refresh', (event) => {
		refresh();
	});
});

menu.on('after-create-window', () => {
	setTimeout(() => refresh(), 300);
});

menu.on('show', () => {
	refresh();
});

const refresh = () => {
	Docker.listContainers().then((containers) => {
		const groups = {};

		for (const container of containers) {
			const nameParts     = container.name.split('_');
			const groupName     = (nameParts.length < 2 ? 'nogroup' : nameParts[0]);
			const containerName = (nameParts.length < 2 ? container.name : container.name.substr(nameParts[0].length + 1));

			container.active = container.status.indexOf('Up') >= 0;
			container.ports  = ((container.port || '').match(/>([0-9]+)\//) || []).slice(1);

			groups[groupName] = Object.assign(
				groups[groupName] || {}, 
				{
					[containerName]: container,
				}
			);
		}

		server.send('containers', { groups });
	}).catch((error) => {
		console.error(error);
	});
};
