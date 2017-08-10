zip:
	zip Inhuman_Ads-`jq -r .version manifest.json`.zip `cat zip_files`
