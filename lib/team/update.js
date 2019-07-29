'use strict'

const chalk = require('chalk')
const interpolate = require('../util/interpolate')
const legacyId = require('../util/to-legacy-id')

module.exports = update

// Patch a team
// To do: check if we can fix parent ids?
async function update(info) {
  const {ctx, structure, team} = info
  const {name} = structure
  const {request} = ctx
  const description = interpolate(ctx, structure.description)
  let changes

  if (team.description !== description) {
    changes = {description}
  }

  if (team.privacy === 'SECRET') {
    changes = {...changes, privacy: 'closed'}
  }

  if (!changes) {
    return
  }

  await request('PATCH /teams/:team', {...changes, team: legacyId(team.id)})

  if (changes.description) {
    console.log('  ' + chalk.green('✓') + ' fixed description for %s', name)
  }

  if (changes.privacy) {
    console.log('  ' + chalk.green('✓') + ' fixed privacy for %s', name)
  }
}
