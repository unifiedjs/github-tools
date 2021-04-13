import {promisify} from 'util'
import pSeries from 'p-series'
import {org} from '../org/index.js'

const run = promisify(org.run)

export async function orgs(ctx) {
  const {ghOrgs} = ctx

  await pSeries(
    ghOrgs.orgs.map((info) => () =>
      run({
        org: info.github,
        orgTeam: info.unified,
        orgLabelsNext: info.labels === 'next',
        ...ctx
      })
    )
  )
}
