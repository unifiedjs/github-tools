import {Octokit} from '@octokit/rest'
import {graphql} from '@octokit/graphql'

export async function configure(ctx) {
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

    function retry(error) {
      console.log('wrap err:', error)
      const after =
        error && error.status === 403 ? error.headers['retry-after'] : null

      if (!after) {
        throw error
      }

      return new Promise(executor)

      function executor(resolve, reject) {
        setTimeout(delayed, Number.parseInt(after, 10) * 1000)

        function delayed() {
          attempt().then(resolve, reject)
        }
      }
    }
  }
}
