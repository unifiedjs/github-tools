/**
 * @import {Context, GithubTeam, TeamInfo} from '../util/types.js'
 */

import chalk from 'chalk'
import {interpolate} from '../util/interpolate.js'
import {toLegacyId} from '../util/to-legacy-id.js'

// Patch a team
// To do: check if we can fix parent ids?

/**
 * @param {{context: Context, structure: GithubTeam, team: TeamInfo, expectedParentId: string | undefined}} info
 * @returns {Promise<undefined>}
 */
export async function update(info) {
  const {context, structure, team, expectedParentId} = info
  const {name} = structure
  const {ghRequest} = context
  const description = interpolate(context, structure.description)
  const parentId = (team.parentTeam || {}).id || undefined
  /** @type {{description?: string, privacy?: string, parent_team_id?: number | undefined} | undefined} */
  let changes

  if (team.description !== description) {
    changes = {description}
  }

  if (team.privacy === 'SECRET') {
    changes = {...changes, privacy: 'closed'}
  }

  if (parentId !== expectedParentId) {
    changes = {
      ...changes,
      // eslint-disable-next-line camelcase
      parent_team_id: expectedParentId
        ? toLegacyId(expectedParentId)
        : undefined
    }
  }

  if (!changes) {
    return
  }

  await ghRequest('PATCH /orgs/:org/teams/:team', {
    ...changes,
    org: context.org,
    team: structure.name
  })

  if (changes.description) {
    console.log('  ' + chalk.green('✓') + ' fixed description for %s', name)
  }

  if (changes.parent_team_id) {
    console.log('  ' + chalk.green('✓') + ' fixed parent for %s', name)
  }

  if (changes.privacy) {
    console.log('  ' + chalk.green('✓') + ' fixed privacy for %s', name)
  }
}
