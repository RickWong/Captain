const exec = require('child_process').exec;
const path = require('path');
const ElectronServer = require('electron-rpc/server');
const Menubar = require('menubar');
const package = require(path.join(__dirname, '../package.json'));
const docker = require('./docker');


const app = new ElectronServer();

const menu = Menubar({
	dir: __dirname,
	icon: path.join(__dirname, '../resources/IconTemplate.png'),
	tooltip: `Captain Docker ${package.version}`,
	width: 200,
	height: 8 + 2 * 28 + 1 * 10,
	windowPosition: 'trayLeft',
});

menu.on('ready', () => {
	console.log('app is ready');

	docker.listContainers().then(containers => {
		console.log(containers);
	});

	app.on('quit', event => {
		menu.app.quit();
	});
});
