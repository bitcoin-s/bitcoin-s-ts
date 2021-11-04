FROM node:16-buster-slim AS builder

WORKDIR /build
COPY . .
RUN apt-get update && apt-get install -y git python3 build-essential
WORKDIR /build/oracle-server-ui
RUN npm i && npm run build
WORKDIR /build/oracle-server-ui-proxy
RUN npm i && npm run build

FROM node:16-buster-slim
USER 1000
WORKDIR /build
COPY --from=builder /build .
EXPOSE 3001
WORKDIR oracle-server-ui-proxy
CMD ["npm", "run", "start"]
