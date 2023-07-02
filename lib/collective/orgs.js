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
    ghOrgs.orgs.map(
      (info) => () =>
        // @ts-expect-error: `trough` types need to improve.
        run({
          ...ctx,
          org: info.github,
          orgTeam: info.unified,
          orgLabelsNext: info.labels === 'next'
        })
    )
  )
}
