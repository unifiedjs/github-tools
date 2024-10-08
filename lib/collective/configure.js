/**
 * @import {graphql as GraphQl, GraphqlResponseError} from '@octokit/graphql'
 * @import {Context} from '../util/types.js'
 */

import {graphql} from '@octokit/graphql'
import {Octokit} from '@octokit/rest'

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
export async function configure(context) {
  const {ghToken} = context

  if (!ghToken) {
    throw new Error(
      'Missing GitHub token: expected `context.ghToken` to be set'
    )
  }

  const query = graphql.defaults({headers: {authorization: 'token ' + ghToken}})
  const {request, paginate} = new Octokit({auth: 'token ' + ghToken})

  return {
    ...context,
    ghQuery: wrap(query),
    ghRequest: request,
    ghPaginate: paginate
  }
}

/**
 *
 * @param {GraphQl} action
 * @returns {GraphQl}
 */
function wrap(action) {
  // @ts-expect-error: fine.
  return wrapped

  /**
   * @param {Parameters<GraphQl>} parameters
   * @returns {ReturnType<GraphQl>}
   */
  function wrapped(...parameters) {
    return attempt().catch(retry)

    /**
     * @returns {ReturnType<GraphQl>}
     */
    function attempt() {
      return action(...parameters)
    }

    /**
     * @param {unknown} error
     * @returns
     */
    function retry(error) {
      const exception = /** @type {GraphqlResponseError<unknown>} */ (error)
      console.log('wrap err:', exception)
      console.log('to do:', 'does `status` really not exist?')
      const after =
        // @ts-expect-error: does `status` really not exist?
        exception && exception.status === 403
          ? exception.headers['retry-after']
          : undefined

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
