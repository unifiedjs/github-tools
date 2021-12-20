import {promisify} from 'node:util'
import chalk from 'chalk'
import pSeries from 'p-series'
import {repo} from '../repo/index.js'

const run = promisify(repo.run)

export async function repos(ctx) {
  const {org, ghQuery} = ctx
  let done
  let cursor

  console.log(chalk.bold('repos') + ' for %s', org)
  ctx.repositories = []

  while (!done) {
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

    ctx.repositories = ctx.repositories.concat(
      repos.edges.map((edge) => edge.node)
    )

    cursor = repos.edges[repos.edges.length - 1].cursor
    done = !repos.pageInfo.hasNextPage
  }

  await pSeries(ctx.repositories.map((repo) => () => run({ctx, repo})))
}
