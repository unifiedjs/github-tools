'use strict'

const chalk = require('chalk')
const pSeries = require('p-series')
const {Minimatch} = require('minimatch')
const {childTeamAccept} = require('../util/constants')
const interpolate = require('../util/interpolate')
const legacyId = require('../util/to-legacy-id')

module.exports = repositories

// Add repositories to the team with the correct permissions.
async function repositories(info) {
  const {ctx, structure, team} = info
  const {org, ghQuery, ghRequest} = ctx
  const {id} = team
  const {scope, permission} = structure
  const match = new Minimatch(interpolate(ctx, scope), {dot: true})

  // To do: load org repositories only once, not for every team.
  // To do: paginate.
  const {organization, node} = await ghQuery(
    `
      query($org: String!, $id: ID!) {
        node(id: $id) {
          ... on Team {
            repositories(first: 100) {
              edges {
                permission
                node {
                  nameWithOwner
                  name
                }
              }
            }
          }
        }
        organization(login: $org) {
          repositories(first: 100) {
            nodes {
              nameWithOwner
              name
            }
          }
        }
      }
    `,
    {id, org}
  )

  const ghRepos = organization.repositories.nodes
  const actual = node.repositories.edges.map(({permission, node}) => ({
    ...node,
    permission
  }))

  const expected = ghRepos.filter(({nameWithOwner}) =>
    match.match(nameWithOwner)
  )

  // Remove
  actual
    .filter(x => !expected.find(y => y.name === x.name))
    .forEach(x => {
      console.log(
        '  ' + chalk.red('✖') + ' %s should not be governed by %s',
        x.name,
        structure.name
      )
    })

  const incorrect = [].concat(
    // Current repos with wrong permissions.
    actual.filter(x => x.permission !== permission),
    // Missing repos
    expected.filter(x => !actual.find(y => y.name === x.name))
  )

  await pSeries(
    incorrect.map(({nameWithOwner}) => () => {
      ghRequest('PUT /teams/:team/repos/:nameWithOwner', {
        team: legacyId(id),
        nameWithOwner,
        permission,
        headers: {accept: childTeamAccept}
      }).then(() => {
        console.log(
          '  ' + chalk.green('✔') + ' set permissions for %s on %s to %s',
          structure.name,
          nameWithOwner,
          permission
        )
      })
    })
  )
}
