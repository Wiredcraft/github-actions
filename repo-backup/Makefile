FLAGS :=

DOCKER := docker
IMAGE := wcl-backup
TAG := latest

-include local.mk

default: run

build:
	go build -o bin/backup cmd/backup/main.go

run: build
	bin/backup ${FLAGS}

container-build:
	$(DOCKER) build -t $(IMAGE):$(TAG) .
