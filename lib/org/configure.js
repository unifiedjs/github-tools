'use strict'

module.exports = configure

function configure(ctx) {
  const {org, teams} = ctx

  const team = teams.find(x => {
    return x.scope.split('/')[0] === org
  })

  if (!team) {
    throw new Error('Could not find team belonging to `' + org + '`')
  }

  return {orgTeam: team.name, ...ctx}
}
