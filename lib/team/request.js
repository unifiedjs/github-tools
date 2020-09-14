'use strict'

module.exports = request

// Request a team.
async function request(info) {
  const {structure, ctx} = info
  const {name} = structure
  const {org, ghQuery} = ctx

  let request = await ghQuery(
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

  let expectedParentId = null

  if (structure.parent) {
    request = await ghQuery(
      `
        query($org: String!, $name: String!) {
          organization(login: $org) {
            team(slug: $name) { id }
          }
        }
      `,
      {org, name: structure.parent}
    )

    expectedParentId = (request.organization.team || {}).id
  }

  return {...info, team, expectedParentId}
}
