'use strict'

const chalk = require('chalk')
const pSeries = require('p-series')
const find = require('../util/find')

module.exports = members

const {concat} = []

async function members(ctx) {
  const {org, query, request, structure} = ctx
  // To do: don’t hardcode this.
  const admins = find(ctx, 'core/!emeritus')
  const defs = structure.map(({humans}) => [humans.member, humans.maintainer])
  const groups = concat.apply([], concat.apply([], defs).map(x => find(ctx, x)))
  const members = [...new Set(groups)].map(login => ({
    login,
    role: admins.includes(login) ? 'ADMIN' : 'MEMBER'
  }))

  console.log(chalk.bold('members') + ' for %s', org)

  // To do: paginate.
  const {organization} = await query(
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

  const ghMembers = organization.membersWithRole.edges.map(({node, role}) => ({
    ...node,
    role
  }))

  // Remove
  ghMembers
    .filter(x => !members.find(y => x.login === y.login))
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
    members
      .filter(x => {
        const ghMember = ghMembers.find(y => x.login === y.login)
        return !ghMember || ghMember.role !== x.role
      })
      .map(({login, role}) => () => {
        return request('PUT /orgs/:org/memberships/:login', {
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
