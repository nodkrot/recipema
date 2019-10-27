#!/bin/bash

rm -rf ./dist
NODE_ENV=production parcel build app/index.html --no-source-maps --no-cache
# https://github.com/rafrex/spa-github-pages
cp ./app/404.html ./dist
echo 'recipema.appletreelabs.com' > ./dist/CNAME
gh-pages -d ./dist
