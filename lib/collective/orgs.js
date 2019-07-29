'use strict'

const {promisify} = require('util')
const pSeries = require('p-series')
const rest = require('@octokit/rest')
const graphql = require('@octokit/graphql')
const run = promisify(require('../org').run)

module.exports = orgs

async function orgs(ctx) {
  const {orgs, ghToken} = ctx

  if (!ghToken) {
    throw new Error('Missing GitHub token: expected `ctx.ghToken` to be set')
  }

  const query = graphql.defaults({headers: {authorization: 'token ' + ghToken}})
  const {request, paginate} = rest({auth: 'token ' + ghToken})

  await pSeries(
    orgs.map(org => () =>
      run({
        org,
        query: wrap(query),
        request: wrap(request),
        paginate: wrap(paginate),
        ...ctx
      })
    )
  )
}

function wrap(fn) {
  return wrapped

  function wrapped(...args) {
    return attempt().catch(retry)

    function attempt() {
      return fn(...args)
    }

    function retry(err) {
      console.log('wrap err:', err)
      const after =
        err && err.status === 403 ? err.headers['retry-after'] : null

      if (!after) {
        throw err
      }

      return new Promise(executor)

      function executor(resolve, reject) {
        setTimeout(delayed, parseInt(after, 10) * 1000)

        function delayed() {
          attempt().then(resolve, reject)
        }
      }
    }
  }
}
