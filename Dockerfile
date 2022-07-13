FROM node:lts-alpine
LABEL org.opencontainers.image.title="extract-gtfs-pathways"
LABEL org.opencontainers.image.description="Command-line tool to extract pathways from a GTFS dataset."
LABEL org.opencontainers.image.authors="Jannis R <mail@jannisr.de>"
LABEL org.opencontainers.image.documentation="https://github.com/derhuerst/extract-gtfs-pathways"
LABEL org.opencontainers.image.source="https://github.com/derhuerst/extract-gtfs-pathways"
LABEL org.opencontainers.image.revision="2"
LABEL org.opencontainers.image.licenses="ISC"

WORKDIR /app
ENV NODE_ENV=production
ENV npm_config_update-notifier=false

ADD package.json /app/
RUN npm install --omit=dev && npm cache clean --force

ADD . /app

WORKDIR /gtfs
ENV NODE_ENV=production

ENTRYPOINT ["/app/cli.js"]
