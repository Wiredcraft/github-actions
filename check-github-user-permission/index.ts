import * as core from "@actions/core";
import { getOctokit } from "@actions/github";

async function isUserInGithubTeam(token: string, orgName: string, teamSlug: string, username: string): Promise<boolean> {
    const octokit = getOctokit(token);

    try {
        const teamResponse = await octokit.request('GET /orgs/{org}/teams/{team_slug}', {
            org: orgName,
            team_slug: teamSlug,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        core.debug(`Find team ${teamResponse.data.name} in org ${teamResponse.data.organization}`)
    } catch (e: any) {
        if (e.status == 404) {
            throw new Error(`Team ${teamSlug} not found in ${orgName}`);
        }
        throw new Error(`Got ${e.status} ${e.response} to check team ${teamSlug} in ${orgName}`);
    }

    try {
        const membershipResponse = await octokit.request('GET /orgs/{org}/teams/{team_slug}/memberships/{username}', {
            org: orgName,
            team_slug: teamSlug,
            username: username,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        return membershipResponse.status === 200;

    } catch (e: any) {
        if (e.status == 404) {
             throw new Error(`Github user ${username} is not a member of team ${orgName}/${teamSlug}`);
        }
        throw new Error(`Got ${e.status} ${e.response} to check member ${username} in ${teamSlug}`);
    }
}

async function run(): Promise<void> {
    const ghToken = core.getInput('token');
    const ghOrg = core.getInput('org');
    const ghTeam = core.getInput('team');
    const ghUsername = core.getInput('username');

    core.debug(`Checking if ${ghUsername} in ${ghOrg}/${ghTeam}`)
    const isMember = await isUserInGithubTeam(ghToken, ghOrg, ghTeam, ghUsername);
    core.info(`Github user ${ghUsername} is${isMember ? '' : ' not'} a member of team ${ghOrg}/${ghTeam}`);
    core.setOutput('is_member', isMember);
}

run().catch(core.setFailed);
