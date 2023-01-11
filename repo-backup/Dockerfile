FROM golang:alpine as build
COPY . /app
WORKDIR /app
RUN CGO_ENABLED=0 go build -o backup cmd/backup/main.go

FROM alpine:edge
COPY --from=build /app/backup /usr/local/bin/backup
COPY ./config.yaml /config/config.yaml
COPY ./entrypoint.sh /entrypoint.sh
RUN apk add git bash
ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]
