'use strict'

const {promisify} = require('util')
const pSeries = require('p-series')
const run = promisify(require('../org').run)

module.exports = orgs

async function orgs(ctx) {
  const {ghOrgs} = ctx

  await pSeries(
    ghOrgs.orgs.map(info => () =>
      run({org: info.github, orgTeam: info.unified, ...ctx})
    )
  )
}
