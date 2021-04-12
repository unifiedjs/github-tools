'use strict'

const chalk = require('chalk')
const pSeries = require('p-series')
const find = require('../util/find')

module.exports = people

async function people(ctx) {
  const {ghOrgs, ghTeams, org, ghQuery, ghRequest} = ctx
  const ghOwners = find(ctx, ghOrgs.owner)
  const expected = [
    ...new Set(
      ghOwners.concat(
        ...ghTeams.map((team) => [
          ...find(ctx, team.member),
          ...find(ctx, team.maintainer)
        ])
      )
    )
  ].map((login) => ({
    login,
    role: ghOwners.includes(login) ? 'ADMIN' : 'MEMBER'
  }))

  console.log(chalk.bold('people') + ' for %s', org)

  // To do: paginate.
  const {organization} = await ghQuery(
    `
      query($org: String!) {
        organization(login: $org) {
          membersWithRole(first: 100) {
            edges {
              role
              node {
                login
              }
            }
          }
        }
      }
    `,
    {org}
  )

  const actual = organization.membersWithRole.edges.map(({node, role}) => ({
    ...node,
    role
  }))

  // Remove
  actual
    .filter((x) => !expected.some((y) => x.login === y.login))
    .forEach(({login, role}) => {
      console.log(
        '  ' + chalk.red('✖') + ' @%s should not be in %s as %s',
        login,
        org,
        role
      )
    })

  // Add or update humans with missing or unexpected roles.
  // Note that this will add pending humans again.
  // To do: ignore pending humans.
  await pSeries(
    expected
      .filter((x) => {
        const ac = actual.find((y) => x.login === y.login)
        return !ac || ac.role !== x.role
      })
      .map(({login, role}) => () => {
        return ghRequest('PUT /orgs/:org/memberships/:login', {
          login,
          org,
          // Note: `ADMIN` is v4 (uppercase), `admin` is v3 (lowercase).
          role: role.toLowerCase()
        }).then(() => {
          console.log(
            '  ' + chalk.green('✔') + ' add @%s to %s as %s',
            login,
            org,
            role
          )
        })
      })
  )
}
