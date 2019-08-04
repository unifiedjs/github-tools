'use strict'

const {promisify} = require('util')
const chalk = require('chalk')
const pSeries = require('p-series')
const run = promisify(require('../team').run)

module.exports = teams

async function teams(ctx) {
  const {org, ghTeams} = ctx

  console.log(chalk.bold('teams') + ' for %s', org)

  // Sort teams as ancestors first, children last.
  // To do: looks a bit funky but seems to work.
  const teams = ghTeams
    .concat()
    .sort(
      (a, b) =>
        (b.parent === a.name ? 1 : 0) - (a.parent === b.name ? 1 : 0) ||
        (b.parent ? 1 : 0) - (a.parent ? 1 : 0)
    )

  await pSeries(teams.map(structure => () => run({ctx, structure})))
}
