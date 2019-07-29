'use strict'

module.exports = request

// Request a team.
async function request(info) {
  const {structure, ctx} = info
  const {name} = structure
  const {org, query} = ctx

  const {organization} = await query(
    `
      query($org: String!, $name: String!) {
        organization(login: $org) {
          teams(query: $name, first: 1) {
            nodes {
              id
              description
              privacy
            }
          }
        }
      }
    `,
    {org, name}
  )

  return {
    ...info,
    team: organization.teams.nodes[0] || {}
  }
}
