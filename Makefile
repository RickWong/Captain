SHELL := /bin/bash
PATH  := node_modules/.bin:$(PATH)

build:
	electron-packager src/app.js Captain --platform=darwin --arch=x64 --version=1.3.13 --icon=resources/Icon.icns --overwrite
start:
	electron src/app.js
