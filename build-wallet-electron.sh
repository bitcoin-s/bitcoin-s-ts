#!/bin/bash

OS="`uname`"
case $OS in
  'Linux')
   OS='Linux'
   alias ls='ls --color=auto'
    ;;
  'FreeBSD')
    OS='FreeBSD'
    alias ls='ls -G'
    ;;
  'WindowsNT')
    OS='Windows'
    ;;
  'Darwin') 
    OS='Mac'
    ;;
  'arm64')
    OS='Mac'
    ;;
  'SunOS')
    OS='Solaris'
    ;;
  'AIX') ;;
  *) ;;
esac

cd wallet-electron-ts

if [[ $OS == 'Mac' ]]; then 
	curl -O -L https://github.com/bitcoin-s/bitcoin-s/releases/download/1.9.2/bitcoin-s-server-mac.os.x-1.9.2.zip
elif [[ $OS == 'Windows' ]]; then
	curl -O -L https://github.com/bitcoin-s/bitcoin-s/releases/download/1.9.2/bitcoin-s-server-windows.server.2019-1.9.2.zip
elif [[ $OS == 'Linux' ]]; then
	curl -O -L https://github.com/bitcoin-s/bitcoin-s/releases/download/1.9.2/bitcoin-s-server-linux-1.9.2.zip
else 
	echo "not supported OS"
fi

for name in *bitcoin-s-server*; do
	if [ -f "$name" ]; then 
		cd ..
		npm i && npm run build 
		cd wallet-electron-ts 
		npm i && npm run build 
		echo "Want to start the server in dev mode? Run cd wallet-electron-ts && npm run start"
	else 
		cd..
		echo "
		Retrieve bitcoin-s-server file from https://github.com/bitcoin-s/bitcoin-s releases/tag/1.9.2 need to put bitcoin-s-server.zip file in ~/bitcoin-s-ts/wallet-electron-ts. 
		For Mac m1 if not on the github then need to generate it like so
		go to your bitcoin-s node and inside it Run sbt appServer/universal:packageBin
		then Run cd app/server/target/universal 
		then Run cp bitcoin-s-server-1.9.1-87-f210d9d9-SNAPSHOT.zip ~/bitcoin-s-ts/wallet-electron-ts"

	fi
done