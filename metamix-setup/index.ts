import {ok} from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import * as httpclient from '@actions/http-client';

const toolName = 'metamix';

function _getCacheDirectory(): string {
  const cacheDirectory = process.env['RUNNER_TOOL_CACHE'] || ''
  ok(cacheDirectory, 'Expected RUNNER_TOOL_CACHE to be defined')
  return cacheDirectory
}

async function _downloadFile(url: string, outputFile: string): Promise<void> {
  const client = new httpclient.HttpClient();
  const response = await client.get(url);
  if (response.message.statusCode !== 200) {
    throw new Error(`unexpected HTTP response: ${response.message.statusCode}`);
  }

  const fileStream = fs.createWriteStream(outputFile);
  return new Promise((resolve, reject) => {
    response.message.pipe(fileStream);
    response.message.on('end', () => {
      fileStream.close();
      core.info(`downloaded ${url} to ${outputFile}`);
      fs.chmodSync(outputFile, 0o755);
      core.info(`chmod 755 for ${outputFile}`);
      resolve();
    });
    response.message.on('error', err => {
      fs.unlink(outputFile, () => {});
      reject(err);
    })
  });
}

async function run(): Promise<void> {
  const binaryDownloadURL = core.getInput('binary_download_url');
  core.info(`downloading binary from ${binaryDownloadURL}`);
  const cachepath = _getCacheDirectory();
  const _path = path.join(cachepath, toolName);
  core.debug(`metamix path: ${_path}`);
  core.info(`installing metamix ...`);

  fs.mkdirSync(_path, { recursive: true });
  await _downloadFile(binaryDownloadURL, `${_path}/${toolName}`);

  core.addPath(`${_path}`);
}

run().catch(core.setFailed);
