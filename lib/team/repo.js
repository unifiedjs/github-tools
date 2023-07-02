/**
 * @typedef {import('../util/types.js').Context} Context
 * @typedef {import('../util/types.js').GithubTeam} GithubTeam
 * @typedef {import('../util/types.js').TeamInfo} TeamInfo
 */

import assert from 'node:assert/strict'
import chalk from 'chalk'
import pSeries from 'p-series'
import {Minimatch} from 'minimatch'
import {interpolate} from '../util/interpolate.js'

// Add repositories to the team with the correct permissions.

/**
 * @param {{ctx: Context, structure: GithubTeam, team: TeamInfo, expectedParentId: string | undefined}} info
 * @returns {Promise<undefined>}
 */
export async function repo(info) {
  const {ctx, structure} = info
  const {org, ghQuery, ghRequest, repositories} = ctx
  const {scope, permission} = structure
  const match = new Minimatch(interpolate(ctx, scope), {dot: true})
  /** @type {Array<{name: string, nameWithOwner: string, permission: string}>} */
  const teamRepositories = []
  /** @type {boolean} */
  let done = false
  /** @type {string | undefined} */
  let cursor

  const teamPermission = {
    WRITE: 'push',
    ADMIN: 'admin',
    MAINTAIN: 'maintain',
    TRIAGE: 'triage'
  }[permission]

  while (!done) {
    /** @type {{organization: {team: {repositories: {edges: Array<{cursor: string, permission: string, node: {name: string, nameWithOwner: string}}>, pageInfo: {hasNextPage: boolean}}}}}} */
    const data = await ghQuery(
      `
        query($org: String!, $name: String!, $cursor: String) {
          organization(login: $org) {
            team(slug: $name) {
              repositories(first: 100, after: $cursor) {
                edges {
                  cursor
                  permission
                  node {
                    name
                    nameWithOwner
                  }
                }
                pageInfo { hasNextPage }
              }
            }
          }
        }
      `,
      {org, name: structure.name, cursor}
    )

    const repos = data.organization.team.repositories

    teamRepositories.push(
      ...repos.edges.map(({node, permission}) => ({
        ...node,
        permission
      }))
    )

    cursor = repos.edges[repos.edges.length - 1].cursor

    done = !repos.pageInfo.hasNextPage
  }

  assert(repositories, 'repositories')
  const expected = repositories.filter(({nameWithOwner}) =>
    match.match(nameWithOwner)
  )

  // Remove.
  const unexpected = teamRepositories.filter(
    (x) => !expected.some((y) => y.name === x.name)
  )

  for (const x of unexpected) {
    console.log(
      '  ' + chalk.red('✖') + ' %s should not be governed by %s',
      x.name,
      structure.name
    )
  }

  const incorrect = [
    // Current repos with wrong permissions.
    ...teamRepositories.filter((x) => x.permission !== permission),
    // Missing repos.
    ...expected.filter((x) => !teamRepositories.some((y) => y.name === x.name))
  ]

  await pSeries(
    incorrect.map(({name}) => () => {
      return ghRequest('PUT /orgs/:org/teams/:team/repos/:org/:name', {
        org,
        team: structure.name,
        name,
        permission: teamPermission
      }).then(() => {
        console.log(
          '  ' + chalk.green('✔') + ' set permissions for %s on %s to %s',
          structure.name,
          name,
          teamPermission
        )
      })
    })
  )
}
