/**
 * @typedef {import('../util/types.js').Context} Context
 * @typedef {import('../util/types.js').GithubTeam} GithubTeam
 * @typedef {import('../util/types.js').TeamInfo} TeamInfo
 */

// Request a team.

/**
 * @param {{ctx: Context, structure: GithubTeam}} info
 * @returns {Promise<{ctx: Context, structure: GithubTeam, team: TeamInfo, expectedParentId: string | undefined}>}
 */
export async function request(info) {
  const {structure, ctx} = info
  const {name} = structure
  const {org, ghQuery} = ctx

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
