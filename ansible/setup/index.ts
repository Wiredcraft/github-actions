import os from 'os';

import {ok} from 'assert';
import * as path from 'path';
import * as core from '@actions/core';
import * as httpclient from '@actions/http-client';
import {exec, getExecOutput} from '@actions/exec';

interface Input {
  version: string;
  pipmirror: string;
  pypimirror: string;
}

function getInput(): Input {
  const version = core.getInput('version');
  const pipmirror = core.getInput('pipmirror');
  const pypimirror = core.getInput('pypimirror');

  if (version === '') {
    return {
      version,
      pipmirror,
      pypimirror,
    }
  }
  if (version.startsWith('v')) {
    throw new Error("'version' input should not be prefixed with 'v'");
  }
  const versionRegex =
    /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/i;

  if (!versionRegex.test(version)) {
    throw new Error(
      "incorrect 'version' specified, it should include all parts of the version e.g 11.0.1"
    );
  }

  return {
    version,
    pipmirror,
    pypimirror,
  };
}

const toolName = 'ansible';

function _getCacheDirectory(): string {
  const cacheDirectory = process.env['RUNNER_TOOL_CACHE'] || ''
  ok(cacheDirectory, 'Expected RUNNER_TOOL_CACHE to be defined')
  return cacheDirectory
}

async function run(): Promise<void> {
  const input = getInput();
  let version = input.version;
  const pipmirror = input.pipmirror;
  const pypimirror = input.pypimirror;
  const cachepath = _getCacheDirectory();
  const _path = path.join(cachepath, toolName, version);
  core.debug(`tool path: ${_path}`);

  core.info(`Checking for Python3 executable...`);
  await exec(`/bin/sh -c "command -v python3"`);

  if (version === '') {
    core.info(`Version not specified, query for latest...`)

    const client = new httpclient.HttpClient();
    const url = path.join(pypimirror, toolName, 'json');
    const resp = await client.get(url);
    const body = await resp.readBody();
    const pi = JSON.parse(body);
    version = pi.info.version;
    core.info(`Got latest ${toolName} version: ${version}`);
  }

  const key = `tool-${toolName}-${version}`;

  core.info(`Creating virtualenv ...`);
  await exec(`python3 -m venv ${_path}`);
  core.info(`Installing ${toolName} ${version} ...`);
  await exec(`${_path}/bin/pip install -i ${pipmirror} ansible==${version}`);

  core.addPath(`${_path}/bin`);
}

run().catch(core.setFailed);
