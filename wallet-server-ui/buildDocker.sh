#!/bin/bash

# Need to build from bitcoin-s-ts/
cd ..

docker build . -f wallet-server-ui/Dockerfile -t bitcoinscala/wallet-server-ui:latest
#docker tag bitcoinscala/wallet-server-ui localhost:5000/bitcoinscala/wallet-server-ui
#docker push localhost:5000/bitcoinscala/wallet-server-ui
docker tag bitcoinscala/wallet-server-ui my-registry:5000/bitcoinscala/wallet-server-ui
docker push my-registry:5000/bitcoinscala/wallet-server-ui

