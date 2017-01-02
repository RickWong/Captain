SHELL := /bin/bash
PATH  := node_modules/.bin:$(PATH)

build:
	NODE_ENV=production electron-packager \src/app.js \
		Captain \
		--platform=darwin \
		--arch=x64 \
		--version=1.3.13 \
		--icon=resources/Icon.icns \
		--overwrite

test:
	NODE_ENV=production electron src/app.js

start:
	NODE_ENV=development electron src/app.js
