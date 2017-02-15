SHELL := /bin/bash
PATH  := node_modules/.bin:$(PATH)

build:
	npm prune
	rm -rf ./Captain-darwin-x64/
	NODE_ENV=production electron-packager . Captain \
		--platform=darwin \
		--arch=x64 \
		--electron-version=1.5.0 \
		--icon=resources/Icon.icns \
		--no-prune \
		--ignore=".editorconfig" \
		--ignore=".idea" \
		--ignore=".gitignore" \
		--ignore="dmg.json" \
		--ignore="Makefile" \
		--overwrite

package:
	electron-osx-sign ./Captain-darwin-x64/Captain.app
	rm -rf ./Captain-darwin-x64/Captain.dmg
	NODE_ENV=production appdmg ./dmg.json ./Captain-darwin-x64/Captain.dmg

test:
	NODE_ENV=production electron .

start:
	NODE_ENV=development DEBUG=captain* electron .
