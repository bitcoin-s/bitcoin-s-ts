#!/bin/bash

# Preconditions
# Need to run `npm install` and `npm run build` on monorepo root

# build UI /dist
cd ../wallet-server-ui
npm run build

# build proxy bundle-static.js
cd ../wallet-server-ui-proxy
npm run build
npm run webpack
