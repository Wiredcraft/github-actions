# github-actions

A collection for the various Github actions used in Wiredcraft.

## Workflows

### Docker build

| Params                      | Describe                                                                                                 | Required |
| ---                         | ---                                                                                                      | ---      |
| `inputs.project`            | the project name on Harbor for this image                                                                | Yes      |
| `inputs.component`          | the component name e.g. `oms`, it's usually the image name, by default it's github.event.repository.name | No       |
| `inputs.node_env`           | the node env when build nodejs app, default `production`                                                 | No       |
| `inputs.push`               | push to remote registry or not ,default `true`                                                           | No       |
| `inputs.docker_context`     | path for docker build to execute, default `./`                                                           | No       |
| `inputs.docker_file`        | the Dockefile, default `./Dockerfile`                                                                    | No       |
| `inputs.runner`             | runner to run the docker build. default `cn`                                                             | No       |
| `secrets.REGISTRY_USERNAME` | remote Harbor registry user                                                                              | Yes      |
| `secrets.REGISTRY_PASSWORD` | remote Harbor registry password                                                                          | Yes      |
| `secrets.NPM_TOKEN`         | npm token to pull legacy npm private packages                                                            | No       |
| `outputs.docker_tags`       | tags from https://github.com/docker/metadata-action#outputs                                              | -        |
| `outputs.runner`            | the Github Runner to run this build                                                                      | -        |

Simple build:

```yaml
name: Build Docker image
on: [push]
jobs:
  build:
    uses: Wiredcraft/github-actions/.github/workflows/docker_build.yml@master
    with:
      project: internal
    secrets:
      REGISTRY_USERNAME: ${{ secrets.REGISTRY_USERNAME }}
      REGISTRY_PASSWORD: ${{ secrets.REGISTRY_PASSWORD }}
```

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

### Vulnerability Scannning
We use Trivy to scan the vulnerability in CI build pipelines. The enabled scan scope:
- secret
- vulnerability

| Params               | Describe                                                                                | Required |
|----------------------|-----------------------------------------------------------------------------------------|----------|
| `inputs.docker_tags` | the meta tags from [metadata-action](https://github.com/docker/metadata-action#outputs) | Yes      |
| `inputs.runner`      | which runner to run this workflow                                                       | Yes      |

```yaml
name: Build Docker image
on: [push]
jobs:
  build:
    uses: Wiredcraft/github-actions/.github/workflows/docker_build.yml@master
    with:
      project: internal
    secrets:
      REGISTRY_USERNAME: ${{ secrets.REGISTRY_USERNAME }}
      REGISTRY_PASSWORD: ${{ secrets.REGISTRY_PASSWORD }}
  security:
    needs: [build]
      name: scan vulnerabilities
      uses: Wiredcraft/github-actions/.github/workflows/vulnerability_scanning.yml@master
      with:
        runner: ${{ needs.build.outputs.runner }}
        docker_tags: ${{ needs.build.outputs.docker_tags }}
```

### Check Github user permission
| Params            | Describe                                                                | Requred |
|-------------------|-------------------------------------------------------------------------|---------|
| `inputs.token`    | Github Token with org member read only access                           | Yes     |
| `inputs.org`      | Gitub org for the team, by default it's `Wiredcraft`                    | No      |
| `inputs.team`     | Github team slug                                                        | Yes     |
| `inputs.username` | Github user, suggest to use `github.triggering_actor` or `github.actor` | Yes     |


```yaml
name: Send msg to Slack
on: [push]
jobs:
  check-permission:
    runs-on: ubuntu-latest
    outputs:
      allow: ${{ steps.check-github-permission.outputs.is_member }}
    steps:
      - id: check-github-permission
        uses: Wiredcraft/github-actions/check-github-user-permission@master
        with:
          token: ${{ secrets.GITHUB_ORG_TOKEN }}
          team: devops
          username: ${{ github.triggering_actor || github.actor }}


  slack-notify:
    uses: Wiredcraft/github-actions/.github/workflows/slack_status_notify.yml@master
    needs: [check-permission]
    if: needs.check-permission.outputs.allow == 'true'
    with:
      slack_channel_id: "Cxxxxxx" #
      msg: "Hello this is a msg from Github Action"
    secrets:
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

