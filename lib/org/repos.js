/**
 * @typedef {import('../util/types.js').Context} Context
 * @typedef {import('../util/types.js').Repo} Repo
 */

import {promisify} from 'node:util'
import chalk from 'chalk'
import pSeries from 'p-series'
import {repo} from '../repo/index.js'

const run = promisify(repo.run)

/**
 * @param {Context} ctx
 * @returns {Promise<undefined>}
 */
export async function repos(ctx) {
  const {org, ghQuery} = ctx
  /** @type {boolean} */
  let done = false
  /** @type {string | undefined} */
  let cursor

  console.log(chalk.bold('repos') + ' for %s', org)
  /** @type {Array<Repo>} */
  const repositories = []

  while (!done) {
    /** @type {{organization: {repositories: {edges: Array<{cursor: string, node: {isArchived: boolean, name: string, nameWithOwner: string}}>, pageInfo: {hasNextPage: boolean}}}}} */
    const data = await ghQuery(
      `
        query($org: String!, $cursor: String) {
          organization(login: $org) {
            repositories(first: 100, after: $cursor) {
              edges {
                cursor
                node {
                  isArchived
                  name
                  nameWithOwner
                }
              }
              pageInfo { hasNextPage }
            }
          }
        }
      `,
      {org, cursor}
    )

    const repos = data.organization.repositories
    const results = repos.edges.map(function (edge) {
      return edge.node
    })

    repositories.push(...results)

    cursor = repos.edges[repos.edges.length - 1].cursor
    done = !repos.pageInfo.hasNextPage
  }

  ctx.repositories = repositories

  await pSeries(
    repositories.map(function (repo) {
      /**
       * @returns {Promise<undefined>}
       */
      return function () {
        // @ts-expect-error: `trough` types need to improve.
        return run({ctx, repo})
      }
    })
  )
}
