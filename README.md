# github-actions

A collection for the various Github actions used in Wiredcraft.

## Workflows

### Slack Statuc Notify

You can use this workflow to post status updates to Slack channel.

The possiable status are:

- In Progress
- Success
- Failure
- Cancelled
- Skipped

e.g. ![image](https://user-images.githubusercontent.com/7939352/221105016-599a4760-8dbf-43f7-a3fb-74fa17e84790.png)

| Params                    | Describe                                                                                                             | Required |
|---------------------------|----------------------------------------------------------------------------------------------------------------------|----------|
| `inputs.status`           | one of `success`, `failure`, `cancelled`, `skipped`, it will be `In Progress` if no value given                      | No       |
| `inputs.slack_channel_id` | the channel id of the Slack channel, not the channel name                                                            | Yes      |
| `inputs.msg`              | the status message to Slack, you can use [mrkdwn](https://api.slack.com/reference/surfaces/formatting#basics) syntax | Yes      |
| `secrets.SLACK_BOT_TOKEN` | the OAuth app token of the Slack bot to send message in Slack                                                        | Yes      |



This is an example for how to use it in your workflow:

```yaml
name: Hello
run-name: hello

on:
  push:
    branches:
    - master

jobs:
  pre-slack-notify:
    uses: Wiredcraft/github-actions/.github/workflows/slack_status_notify.yml@master
    with:
      slack_channel_id: "CXXXXXXX"
      msg: "saying hello"
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.YOUR_SLACK_BOT_TOKEN }}

  greeting:
    runs-on: ubuntu-latest
    needs: [pre-slack-notify]
    steps:
    - name: Hello
      run: echo "Hello!"

  post-slack-notify:
    uses: Wiredcraft/github-actions/.github/workflows/slack_status_notify.yml@master
    needs: [greeting]
    if: ${{ always() }}
    with:
      status: ${{ needs.greeting.result }}
      slack_channel_id: "CXXXXXXXX"
      msg: "said hello"
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.YOUR_SLACK_BOT_TOKEN }}
```

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
## Code leak scan
The code leak scan is the default function which has been integration in this workflow. which is the first task and if the scan not passed, it will interrupt this process. utill you resovled these secret or vulnerability leak. the task name is

`- name: Run Trivy vulnerability scanner in repo mode`

Default enabled scan scope :
* secret
* vulnerability

Configuration reference [Trivy Action](https://github.com/aquasecurity/trivy-action#inputs)
