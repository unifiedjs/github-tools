/**
 * @typedef {import('../util/types.js').Context} Context
 * @typedef {import('../util/types.js').GithubTeam} GithubTeam
 * @typedef {import('../util/types.js').TeamInfo} TeamInfo
 */

import chalk from 'chalk'
import {interpolate} from '../util/interpolate.js'
import {toLegacyId} from '../util/to-legacy-id.js'

// Create a team if it doesn’t already exist.

/**
 * @param {{ctx: Context, structure: GithubTeam, team: TeamInfo, expectedParentId: string | undefined}} info
 * @returns {Promise<{ctx: Context, structure: GithubTeam, team: TeamInfo, expectedParentId: string | undefined}>}
 */
export async function create(info) {
  const {structure, ctx, team, expectedParentId} = info
  const {parent, name} = structure
  const {org, ghRequest} = ctx
  const description = interpolate(ctx, structure.description)

  // Exit if already exists.
  if (team.id) {
    console.log('  ' + chalk.blue('ℹ') + ' team %s already exists', name)
    return info
  }

  // Get parent if requested.
  if (parent && !expectedParentId) {
    throw new Error(
      'Could not find parent team `' + parent + '` for team `' + name + '`'
    )
  }

  // Add the team.
  // To do: use GraphQL if team creation mutation exists.
  /** @type {{data: {node_id: string}}} */
  const response = await ghRequest('POST /orgs/:org/teams', {
    name,
    description,
    org,
    privacy: 'closed',
    parent_team_id: expectedParentId ? toLegacyId(expectedParentId) : undefined // eslint-disable-line camelcase
  })

  console.log('  ' + chalk.green('✓') + ' team %s created', name)

  return {
    ...info,
    // Note: `VISIBLE` is the v4 name for `closed` on v3.
    team: {
      id: response.data.node_id,
      description,
      privacy: 'VISIBLE',
      parentTeam: {id: expectedParentId}
    }
  }
}
