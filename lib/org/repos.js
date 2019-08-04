'use strict'

const {promisify} = require('util')
const chalk = require('chalk')
const pSeries = require('p-series')
const run = promisify(require('../repo').run)

module.exports = repos

async function repos(ctx) {
  const {org, ghQuery} = ctx

  console.log(chalk.bold('repos') + ' for %s', org)

  // To do: paginate.
  const {organization} = await ghQuery(
    `
      query($org: String!) {
        organization(login: $org) {
          repositories(first: 100) {
            nodes {
              isArchived
              name
            }
          }
        }
      }
    `,
    {org}
  )

  const repositories = organization.repositories.nodes

  await pSeries(repositories.map(repo => () => run({ctx, repo})))
}
