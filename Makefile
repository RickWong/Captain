SHELL := /bin/bash
PATH  := node_modules/.bin:$(PATH)

build:
	NODE_ENV=production electron-packager . Captain \
		--platform=darwin \
		--arch=x64 \
		--version=1.4.13 \
		--icon=resources/Icon.icns \
		--no-prune \
		--ignore=".idea" \
		--ignore=".gitignore" \
		--ignore="Makefile" \
		--overwrite

test:
	NODE_ENV=production electron .

start:
	NODE_ENV=development electron .
