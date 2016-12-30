const exec = require('child_process').exec;
const path = require('path');
const ElectronServer = require('electron-rpc/server');
const Menubar = require('menubar');
const package = require(path.join(__dirname, '../package.json'));
const Docker = require('./docker');

const server = new ElectronServer();

const menu = Menubar({
	dir: __dirname,
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
		refresh(server);
	});
});

menu.on('after-create-window', () => {
	setTimeout(() => refresh(server), 300);
});

const refresh = (server) => {
	Docker.listContainers().then((containers) => {
		server.send('containers', { containers });
	});
};