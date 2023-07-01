import {promisify} from 'node:util'
import chalk from 'chalk'
import pSeries from 'p-series'
import {team} from '../team/index.js'

const run = promisify(team.run)

export async function teams(ctx) {
  const {org, ghTeams} = ctx

  console.log(chalk.bold('teams') + ' for %s', org)

  const teamToParent = {}

  for (const cur of ghTeams) {
    teamToParent[cur.name] = cur.parent
  }

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
