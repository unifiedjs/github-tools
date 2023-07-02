/**
 * @typedef {import('../util/types.js').Context} Context
 * @typedef {import('../util/types.js').GraphQl} GraphQl
 * @typedef {import('@octokit/graphql').GraphqlResponseError<unknown>} GraphqlResponseError
 */

import {Octokit} from '@octokit/rest'
import {graphql} from '@octokit/graphql'

/**
 * @param {Context} ctx
 * @returns {Promise<Context>}
 */
export async function configure(ctx) {
  const {ghToken} = ctx

  if (!ghToken) {
    throw new Error('Missing GitHub token: expected `ctx.ghToken` to be set')
  }

  const query = graphql.defaults({headers: {authorization: 'token ' + ghToken}})
  const {request, paginate} = new Octokit({auth: 'token ' + ghToken})

  return {
    ...ctx,
    ghQuery: wrap(query),
    ghRequest: request,
    ghPaginate: paginate
  }
}

/**
 *
 * @param {GraphQl} fn
 * @returns {GraphQl}
 */
function wrap(fn) {
  // @ts-expect-error: fine.
  return wrapped

  /**
   * @param {Parameters<GraphQl>} args
   * @returns {ReturnType<GraphQl>}
   */
  function wrapped(...args) {
    return attempt().catch(retry)

    /**
     * @returns {ReturnType<GraphQl>}
     */
    function attempt() {
      return fn(...args)
    }

    /**
     * @param {unknown} error
     * @returns
     */
    function retry(error) {
      const exception = /** @type {GraphqlResponseError} */ (error)
      console.log('wrap err:', exception)
      console.log('to do:', 'does `status` really not exist?')
      const after =
        // @ts-expect-error: does `status` really not exist?
        exception && exception.status === 403
          ? exception.headers['retry-after']
          : null

      if (!after) {
        throw exception
      }

      return new Promise(function (resolve, reject) {
        setTimeout(delayed, Number.parseInt(String(after), 10) * 1000)

        function delayed() {
          attempt().then(resolve, reject)
        }
      })
    }
  }
}
