/**
 * @typedef {import('../util/types.js').Context} Context
 */

import {promisify} from 'node:util'
import pSeries from 'p-series'
import {org} from '../org/index.js'

const run = promisify(org.run)

/**
 * @param {Context} ctx
 * @returns {Promise<undefined>}
 */
export async function orgs(ctx) {
  const {ghOrgs} = ctx

  await pSeries(
    ghOrgs.orgs.map(function (info) {
      /**
       * @returns {Promise<undefined>}
       */
      return function () {
        // @ts-expect-error: `trough` types need to improve.
        return run({
          ...ctx,
          org: info.github,
          orgTeam: info.unified
        })
      }
    })
  )
}
