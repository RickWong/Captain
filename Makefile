SHELL := /bin/bash
PATH  := node_modules/.bin:$(PATH)

build:
	electron-packager src/ Captain --platform=darwin --arch=x64 --version=0.36.12 --icon=resources/Icon.icns
start:
	electron src/
