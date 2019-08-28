'use strict'

const chalk = require('chalk')
const {childTeamAccept} = require('../util/constants')
const interpolate = require('../util/interpolate')
const legacyId = require('../util/to-legacy-id')

module.exports = create

// Create a team if it doesn’t already exist.
async function create(info) {
  const {structure, ctx, team} = info
  const {parent, name} = structure
  const {org, ghQuery, ghRequest} = ctx
  const description = interpolate(ctx, structure.description)
  let parentId

  // Exit if already exists.
  if (team.id) {
    console.log('  ' + chalk.blue('ℹ') + ' team %s already exists', name)
    return
  }

  // Get parent if requested.
  if (parent) {
    const {organization} = await ghQuery(
      `
        query($org: String!, $parent: String!) {
          organization(login: $org) {
            teams(query: $parent, first: 1) {
              nodes {
                id
              }
            }
          }
        }
      `,
      {org, parent}
    )

    parentId = (organization.teams.nodes[0] || {}).id

    if (!parentId) {
      throw new Error(
        'Could not find parent team `' + parent + '` for team `' + name + '`'
      )
    }
  }

  // Add the team.
  // To do: use GraphQL if team creation mutation exists.
  const req = await ghRequest('POST /orgs/:org/teams', {
    name,
    description,
    org,
    privacy: 'closed',
    parent_team_id: parentId ? legacyId(parentId) : undefined, // eslint-disable-line camelcase
    headers: {accept: childTeamAccept}
  })

  console.log('  ' + chalk.green('✓') + ' team %s created', name)

  return {
    ...info,
    // Note: `VISIBLE` is the v4 name for `closed` on v3.
    team: {
      id: req.data.node_id,
      description,
      privacy: 'VISIBLE',
      parentTeam: {id: parentId}
    }
  }
}
