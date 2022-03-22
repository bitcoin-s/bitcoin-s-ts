#!/bin/bash

# Build monorepo
cd ..
npm run clean
npm run build

# Build wallet-server-ui
cd wallet-server-ui
npm run build

# Build wallet-server-ui-proxy
cd ../wallet-server-ui-proxy
npm run build
