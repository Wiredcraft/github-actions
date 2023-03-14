import * as core from '@actions/core';
import * as httpclient from '@actions/http-client';
import * as path from 'path';

interface Annotation {
  time?: number;
  timeEnd?: number;
  dashboardId?: number;
  pannelId?: number;
  tags?: string[];
  text: string;
}

interface AnnotationResponse {
  id: number;
  message: string;
}

async function createGrafanaAnnotation(host: string, token: string, annotation: Annotation): Promise<AnnotationResponse> {
  const client = new httpclient.HttpClient();
  const apiUrl = path.join(host, '/api/annotations');
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const body = annotation;

  core.info(`Creating annotation ${JSON.stringify(body)} on Grafana...`);
  const resp = await client.postJson(apiUrl, body, headers);
  if (resp.statusCode != 200) {
    throw new Error(`Got ${resp.statusCode} ${resp.result} from POST ${apiUrl}`);
  }

  core.info(`Created annotation ${JSON.stringify(resp.result)} on Grafana successfully!`);
  return resp.result as AnnotationResponse;
}

async function run(): Promise<void> {

  const grafanaToken = core.getInput('token');
  const grafanaHost = core.getInput('host');
  const annotationText = core.getInput('text', { required: true });
  const annotationTime = core.getInput('time');
  const annotationTimeEnd = core.getInput('time_end');
  const annotationDashboardId = core.getInput('dashboard_id');
  const annotationPanelId = core.getInput('panel_id');
  const annotationTags = core.getInput('tags');

  const annotation: Annotation = {
    text: annotationText
  };

  if (annotationTime) {
    annotation.time = parseInt(annotationTime);
  } else {
    annotation.time = Date.now();
  }

  if (annotationTimeEnd) {
    annotation.timeEnd = parseInt(annotationTimeEnd);
  }

  if (annotationDashboardId) {
    annotation.dashboardId = parseInt(annotationDashboardId);
  }

  if (annotationPanelId) {
    annotation.pannelId = parseInt(annotationPanelId);
  }

  if (annotationTags) {
    annotation.tags = annotationTags.split(',');
  }

  const resp = await createGrafanaAnnotation(grafanaHost, grafanaToken, annotation);
  core.setOutput('annotation_id', resp.id);
}

run().catch(core.setFailed);
