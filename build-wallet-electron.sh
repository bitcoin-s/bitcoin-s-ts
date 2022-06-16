#!/bin/bash

npm i && npm run build; 
cd wallet-electron-ts; 
npm i && npm run build; 
npm run start; 
npm run make