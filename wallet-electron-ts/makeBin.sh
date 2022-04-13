#!/bin/bash

# Preconditions
# Need to run `npm run build` on monorepo root
# Need to run ./buildDependencies.sh
# bitcoin-s-server.zip is in wallet-electron/

# Delete old /bin
rm -rf bin

# Make /bin
mkdir -p bin

# Copy common-ts
#mkdir -p bin/common-ts
#cp -a ../common-ts/dist/cjs/. bin/common-ts

# Copy wallet-ts
#mkdir -p bin/wallet-ts
#cp -a ../wallet-ts/dist/cjs/. bin/wallet-ts

# Copy wallet-server-ui
mkdir -p bin/wallet-server-ui
cp -a ../wallet-server-ui/dist/wallet-server-ui/. bin/wallet-server-ui

# Copy wallet-server-proxy
mkdir -p bin/wallet-server-ui-proxy
cp -a ../wallet-server-ui-proxy/dist/cjs/build.json . # for `npm run start`
cp -a ../wallet-server-ui-proxy/dist/cjs/build.json bin/wallet-server-ui-proxy
cp -a ../wallet-server-ui-proxy/dist/bundle-static.js bin/wallet-server-ui-proxy
# Replace config.json
cp -a proxy-config.json bin/wallet-server-ui-proxy/config.json

# Expand bitcoin-s-server zip
echo "TODO : Pull down bitcoin-s-server.zip"
mkdir -p bin/bitcoin-s-server
unzip bitcoin-s-server.zip -d bin/bitcoin-s-server
chmod +x bin/bitcoin-s-server/bin/bitcoin-s-server
