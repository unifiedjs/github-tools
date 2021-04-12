'use strict'

const {promisify} = require('util')
const chalk = require('chalk')
const pSeries = require('p-series')
const run = promisify(require('../team').run)

module.exports = teams

async function teams(ctx) {
  const {org, ghTeams} = ctx

  console.log(chalk.bold('teams') + ' for %s', org)

  const teamToParent = {}

  ghTeams.forEach((cur) => {
    teamToParent[cur.name] = cur.parent
  })

  // Sort teams as ancestors first, children last.
  const teams = ghTeams
    .map((team) => {
      let {parent} = team
      let count = 0
      while (parent in teamToParent) {
        count++
        parent = teamToParent[parent]
      }

      return {team, count}
    })
    .sort((a, b) => a.count - b.count)
    .map((x) => x.team)

  await pSeries(teams.map((structure) => () => run({ctx, structure})))
}
