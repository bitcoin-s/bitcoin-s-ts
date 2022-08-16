FROM node:16.15-buster-slim AS builder

RUN apt-get update && apt-get install -y git python3 build-essential
WORKDIR /build
COPY . .
RUN npm ci
# Just in case it's been built locally
RUN npm run clean
RUN npm run build
WORKDIR /build/wallet-server-ui
RUN npm run build
WORKDIR /build/wallet-server-ui-proxy
RUN npm run build

FROM node:16.15-buster-slim
# defaulting to local first uid
USER 1000
WORKDIR /build
COPY --from=builder /build .
EXPOSE 3002
WORKDIR wallet-server-ui-proxy
CMD ["npm", "run", "start"]
