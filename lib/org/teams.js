/**
 * @typedef {import('../util/types.js').Context} Context
 */

import {promisify} from 'node:util'
import chalk from 'chalk'
import pSeries from 'p-series'
import {team} from '../team/index.js'

const run = promisify(team.run)

/**
 * @param {Context} context
 * @returns {Promise<undefined>}
 */
export async function teams(context) {
  const {org, ghTeams} = context

  console.log(chalk.bold('teams') + ' for %s', org)

  /** @type {Record<string, string | undefined>} */
  const teamToParent = {}

  for (const current of ghTeams) {
    teamToParent[current.name] = current.parent
  }

  // Sort teams as ancestors first, children last.
  const teams = ghTeams
    .map(function (team) {
      let {parent} = team
      let count = 0
      while (parent && parent in teamToParent) {
        count++
        parent = teamToParent[parent]
      }

      return {team, count}
    })
    .sort(function (a, b) {
      return a.count - b.count
    })
    .map(function (x) {
      return x.team
    })

  await pSeries(
    teams.map(function (structure) {
      /**
       * @returns {Promise<undefined>}
       */
      return () => {
        // @ts-expect-error: `trough` types need to improve.
        return run({context, structure})
      }
    })
  )
}
