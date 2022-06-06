#!/bin/bash

# Preconditions
# Need to run `npm run build` on monorepo root
# Need to run ./buildDependencies.sh
# bitcoin-s-server.zip is in wallet-electron/

# Delete old /bin
rm -rf bin

# Make /bin
mkdir -p bin

# Copy oracle-server-ui
mkdir -p bin/oracle-server-ui
cp -a ../oracle-server-ui/dist/oracle-server-ui/. bin/oracle-server-ui

# Copy oracle-server-proxy
mkdir -p bin/oracle-server-ui-proxy
cp -a ../oracle-server-ui-proxy/dist/cjs/build.json . # for `npm run start`
cp -a ../oracle-server-ui-proxy/dist/cjs/build.json bin/oracle-server-ui-proxy
cp -a ../oracle-server-ui-proxy/dist/bundle-static.js bin/oracle-server-ui-proxy
# Replace config.json
cp -a proxy-config.json bin/oracle-server-ui-proxy/config.json

# Expand bitcoin-s-oracle-server* zip if it's available, otherwise look for folder
file="bitcoin-s-oracle-server"
if ls ${file}*.zip 1> /dev/null 2>&1; then
  echo "${file}*.zip exists, expanding into /bin"
  mkdir -p bin/${file}
  unzip ${file}*.zip -d bin/${file}
  # Take care of extra folder level that embeds metadata like 'bitcoin-s-oracle-server-1.9.1-13-f5940c93-20220422-1030-SNAPSHOT'
  cd bin/${file}
  mv ${file}*/* .
  rm -rf ${file}*
  chmod +x bin/${file}
elif ls ${file} 1> /dev/null 2>&1; then
  echo "${file} folder exists. copying into /bin"
  cp -R ${file} bin/${file}
  cd bin/${file}
  chmod +x bin/${file}
else
  echo "No source for ${file} found"
fi
