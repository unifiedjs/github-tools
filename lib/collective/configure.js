'use strict'

const {Octokit} = require('@octokit/rest')
const {graphql} = require('@octokit/graphql')

module.exports = configure

async function configure(ctx) {
  const {ghToken} = ctx

  if (!ghToken) {
    throw new Error('Missing GitHub token: expected `ctx.ghToken` to be set')
  }

  const query = graphql.defaults({headers: {authorization: 'token ' + ghToken}})
  const {request, paginate} = new Octokit({auth: 'token ' + ghToken})

  return {
    ghQuery: wrap(query),
    ghRequest: request,
    ghPaginate: paginate,
    ...ctx
  }
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
