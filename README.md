# github-actions

A collection for the various Github actions used in Wiredcraft.

## How to use

### docker build

Create a action file in your repo: `.github/workflows/build.yaml`

Edit the `build.yaml` as those content:

```
name: Build Docker image
on: [push]
jobs:
  build:
    uses: Wiredcraft/github-actions/.github/workflows/docker_build.yml@master
    with:
      project: internal
      component: componet
      docker_context: ./
    secrets:
      REGISTRY_USERNAME: ${{ secrets.REGISTRY_USERNAME }}
      REGISTRY_PASSWORD: ${{ secrets.REGISTRY_PASSWORD }}
      REGISTRY: ${{ secrets.REGISTRY }}
```

If you want to only push image for master branch, you can do something like this:
```
name: Build Docker image
on:
  push:
    branches:
      - master
    paths:
      - ./**
  pull_request:
    paths:
      - ./**
jobs:
  build:
    uses: Wiredcraft/github-actions/.github/workflows/docker_build.yml@master
    with:
      project: internal
      component: component
      docker_context: ./
      push: ${{ github.event_name != 'pull_request' }}

    secrets:
      REGISTRY_USERNAME: ${{ secrets.REGISTRY_USERNAME }}
      REGISTRY_PASSWORD: ${{ secrets.REGISTRY_PASSWORD }}
      REGISTRY: ${{ secrets.REGISTRY }}
```
## Hardcoded secret scan 
The hardcoded secret leak scan is the default function which has been integration in this workflow. which is the first task and if the scan not passed, it will interrupt this process. util you resovled these secret leak. the task config is 
```
#Trivy as our code scan tool
      - name: Run Trivy vulnerability scanner in repo mode
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          security-checks: secret
          format: 'table'
          severity: 'CRITICAL'
          exit-code: '1'
```
Configuration explain [Trivy Action](https://github.com/aquasecurity/trivy-action#inputs)
