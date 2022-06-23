#!/bin/bash


cd wallet-electron-ts
curl -O -L https://github.com/bitcoin-s/bitcoin-s/releases/download/1.9.2/bitcoin-s-server-mac.os.x-1.9.2.zip

for name in *bitcoin-s-server*; do
	if [ -f "$name" ]; then 
		cd ..
		npm i && npm run build 
		cd wallet-electron-ts 
		npm i && npm run build 
		echo "Want to start the server in dev mode? Run cd wallet-electron-ts && npm run start"
	else 
		cd..
		echo "need to put bitcoin-s-server.zip file in ~/bitcoin-s-ts/wallet-electron-ts. 
		To do so go to your bitcoin-s node and inside it Run sbt appServer/universal:packageBin
		then Run cd app/server/target/universal 
		then Run cp bitcoin-s-server-1.9.1-87-f210d9d9-SNAPSHOT.zip ~/bitcoin-s-ts/wallet-electron-ts"

	fi
done