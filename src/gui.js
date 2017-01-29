require("babel-polyfill");
require("babel-register")({
  presets: ["babel-preset-es2015", "babel-preset-stage-2"].map(require.resolve),
});

const {remote, shell} = require("electron");
const {clientStart, clientStop} = require("./client"); // Relative to the html file.
const Package = require("../../package.json"); // Relative to the html file.

const menuWindow = remote.getCurrentWindow();
menuWindow.setVibrancy("light");
menuWindow.setMovable(false);
menuWindow.setMinimizable(false);
menuWindow.setMaximizable(false);
menuWindow.setResizable(false);

if (process.env.NODE_ENV === 'development') {
  menuWindow.setResizable(true);
  menuWindow.openDevTools();
}

window.addEventListener("keydown", (event) => {
  if (String.fromCharCode(event.which).toUpperCase() !== "Q") {
    event.preventDefault();
  }
});

const checkForUpdates = () => {
  shell.openExternal(`http://getcaptain.co/?since=${Package.version.split(".")[0]}`);
};

const updateWindowHeight = ({width, height} = {}) => {
  menuWindow.setSize(
    width || menuWindow.getSize()[0],
    height || (document.body.firstChild.offsetHeight + 8)
  );
};

const updateStatus = (message) => {
  document.querySelector(".status").innerHTML = message;
};

clientStart(menuWindow);
