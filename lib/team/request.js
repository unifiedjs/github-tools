/**
 * @import {Context, GithubTeam, TeamInfo} from '../util/types.js'
 */

// Request a team.

/**
 * @param {{context: Context, structure: GithubTeam}} info
 * @returns {Promise<{context: Context, structure: GithubTeam, team: TeamInfo, expectedParentId: string | undefined}>}
 */
export async function request(info) {
  const {structure, context} = info
  const {name} = structure
  const {org, ghQuery} = context

  /** @type {{organization: {team: TeamInfo}}} */
  const request = await ghQuery(
    `
      query($org: String!, $name: String!) {
        organization(login: $org) {
          team(slug: $name) {
            description
            id
            privacy
            parentTeam { id }
          }
        }
      }
    `,
    {org, name}
  )

  const team = request.organization.team

  /** @type {string | undefined} */
  let expectedParentId

  if (structure.parent) {
    /** @type {{organization: {team: {id: string}}}} */
    const parentRequest = await ghQuery(
      `
        query($org: String!, $name: String!) {
          organization(login: $org) {
            team(slug: $name) { id }
          }
        }
      `,
      {org, name: structure.parent}
    )

    expectedParentId = (parentRequest.organization.team || {}).id
  }

  return {...info, team, expectedParentId}
}
