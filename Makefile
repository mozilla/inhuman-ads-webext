zip:
	zip Inhuman_Ads-`jq -r .version manifest.json`.zip `cat zip_files`

test:
	web-ext run --firefox=/Applications/FirefoxDeveloperEdition.app/Contents/MacOS/firefox-bin --verbose

all: zip
