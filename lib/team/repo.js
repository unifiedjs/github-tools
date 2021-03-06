import chalk from 'chalk'
import pSeries from 'p-series'
import minimatch from 'minimatch'
import {interpolate} from '../util/interpolate.js'

// Add repositories to the team with the correct permissions.
export async function repo(info) {
  const {ctx, structure} = info
  const {org, ghQuery, ghRequest, repositories} = ctx
  const {scope, permission} = structure
  const match = new minimatch.Minimatch(interpolate(ctx, scope), {dot: true})
  let teamRepositories = []
  let done
  let cursor

  const teamPermission = {
    WRITE: 'push',
    ADMIN: 'admin',
    MAINTAIN: 'maintain',
    TRIAGE: 'triage'
  }[permission]

  while (!done) {
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

    teamRepositories = teamRepositories.concat(
      repos.edges.map(({node, permission}) => ({
        ...node,
        permission
      }))
    )

    cursor = repos.edges[repos.edges.length - 1].cursor

    done = !repos.pageInfo.hasNextPage
  }

  const expected = repositories.filter(({nameWithOwner}) =>
    match.match(nameWithOwner)
  )

  // Remove.
  teamRepositories
    .filter((x) => !expected.some((y) => y.name === x.name))
    .forEach((x) => {
      console.log(
        '  ' + chalk.red('✖') + ' %s should not be governed by %s',
        x.name,
        structure.name
      )
    })

  const incorrect = [].concat(
    // Current repos with wrong permissions.
    teamRepositories.filter((x) => x.permission !== permission),
    // Missing repos.
    expected.filter((x) => !teamRepositories.some((y) => y.name === x.name))
  )

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
