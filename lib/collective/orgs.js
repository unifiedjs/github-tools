/**
 * @typedef {import('../util/types.js').Context} Context
 */

import {promisify} from 'node:util'
import pSeries from 'p-series'
import {org} from '../org/index.js'

const run = promisify(org.run)

/**
 * @param {Context} context
 * @returns {Promise<undefined>}
 */
export async function orgs(context) {
  const {ghOrgs} = context

  await pSeries(
    ghOrgs.orgs.map(function (info) {
      /**
       * @returns {Promise<undefined>}
       */
      return function () {
        // @ts-expect-error: `trough` types need to improve.
        return run({
          ...context,
          org: info.github,
          orgTeam: info.unified
        })
      }
    })
  )
}
