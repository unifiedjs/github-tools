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
          teams(query: $name, first: 1) {
            nodes {
              id
              description
              privacy
              parentTeam { id }
            }
          }
        }
      }
    `,
    {org, name}
  )

  const team = request.organization.teams.nodes[0] || {}
  let expectedParentId = null

  if (structure.parent) {
    request = await ghQuery(
      `
        query($org: String!, $name: String!) {
          org: organization(login: $org) {
            parent: teams(query: $name, first: 1) {
              nodes { id }
            }
          }
        }
      `,
      {org, name: structure.parent}
    )

    expectedParentId = (request.org.parent.nodes[0] || {}).id
  }

  return {...info, team, expectedParentId}
}
