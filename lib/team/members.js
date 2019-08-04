'use strict'

const chalk = require('chalk')
const pSeries = require('p-series')
const difference = require('arr-diff')
const find = require('../util/find')
const legacyId = require('../util/to-legacy-id')

module.exports = members

async function members(info) {
  const {structure, ctx, team} = info
  const {ghQuery, ghRequest, ghOrgs} = ctx
  const {owner} = ghOrgs
  const {name} = structure
  const {id} = team
  const maintainers = find(ctx, structure.maintainer)
  const members = difference(find(ctx, structure.member), maintainers)
  const expected = members.concat(maintainers)

  // To do: paginate.
  const {node} = await ghQuery(
    `
      query($id: ID!) {
        node(id: $id) {
          ... on Team {
            members(first: 100, membership: IMMEDIATE) {
              edges {
                role
                node {
                  login
                }
              }
            }
            invitations(first: 100) {
              nodes {
                invitee {
                  login
                }
                role
              }
            }
          }
        }
      }
    `,
    {id}
  )

  const invitations = node.invitations.nodes.map(({invitee, role}) => ({
    ...invitee,
    role
  }))
  const actual = node.members.edges.map(({node, role}) => ({
    ...node,
    role: role.toLowerCase()
  }))

  // Warn on pending invites
  invitations.forEach(({role, login}) => {
    console.log(
      '  ' + chalk.blue('ℹ') + ' @%s should accept their invite for %s as %s',
      login,
      name,
      role
    )
  })

  // Remove
  actual
    .filter(({login}) => !expected.find(y => y === login))
    .forEach(({login}) => {
      console.log(
        '  ' + chalk.red('✖') + ' @%s should not be in team %s',
        login,
        name
      )
    })

  // Current members with wrong roles.
  actual.forEach(({login, role}) => {
    // Remove: already warned about.
    if (!expected.find(y => y === login)) {
      return
    }

    const ex = maintainers.includes(login) ? 'maintainer' : 'member'

    // Core team members are always maintainers, regardless of what’s otherwise
    // expected.
    if (find(ctx, owner)) {
      return
    }

    if (ex !== role) {
      console.log(
        '  ' + chalk.red('✖') + ' @%s should have role %s instead of %s in %s',
        login,
        ex,
        role,
        name
      )
    }
  })

  // Add missing humans.
  // Note that this will add pending humans again.
  await pSeries(
    expected
      .filter(name => !actual.find(y => y.login === name))
      .filter(name => !invitations.find(y => y.login === name))
      .map(name => () => {
        const role = maintainers.includes(name) ? 'maintainer' : 'member'
        return ghRequest('PUT /teams/:team/memberships/:name', {
          name,
          team: legacyId(id),
          role
        }).then(() => {
          console.log(
            '  ' + chalk.green('✔') + ' add @%s to %s as %s',
            name,
            structure.name,
            role
          )
        })
      })
  )
}
