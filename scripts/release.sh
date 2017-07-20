#!/usr/bin/env bash

git fetch --tags

current=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

latestTag=$(git describe --tags `git rev-list --tags --max-count=1`)
DATE=`date +%Y-%m-%d`
data="{\"tag_name\":\"v$current\",\"target_commitish\":\"master\",\"name\":\"v$current\",\"body\":\"<a name=\\\"$current\\\"></a>\n## [$current](https://github.com/wavesplatform/WavesGUI/compare/$latestTag...v$current) ($DATE)\n### Bug Fixes\",\"draft\":true,\"prerelease\":true}"

echo "$data"

printf "Enter user name: "
read -r text

curl --user "$text" \
  --request POST \
  --data "$data" \
    https://api.github.com/repos/wavesplatform/WavesGUI/releases
