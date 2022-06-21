#!/bin/bash

npm i && npm run build; 
cd wallet-electron-ts; 
npm i && npm run build; 
echo "Want to start the server in dev mode? Run cd wallet-electron-ts && npm run start"
