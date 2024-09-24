/**
 * @import {Context, GithubTeam, TeamInfo} from '../util/types.js'
 */

import difference from 'arr-diff'
import chalk from 'chalk'
import pSeries from 'p-series'
import {find} from '../util/find.js'

/**
 * @param {{context: Context, structure: GithubTeam, team: TeamInfo, expectedParentId: string | undefined}} info
 * @returns {Promise<undefined>}
 */
export async function members(info) {
  const {structure, context, team} = info
  const {ghQuery, ghRequest, ghOrgs} = context
  const {owner} = ghOrgs
  const {name} = structure
  const {id} = team
  const maintainers = find(context, structure.maintainer)
  const members = difference(find(context, structure.member), maintainers)
  const expected = members.concat(maintainers)

  // To do: paginate.
  /** @type {{node: {members: {edges: Array<{role: string, node: {login: string}}>}, invitations: {nodes: Array<{invitee: {login: string}, role: string}>}}}} */
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

  const invitations = node.invitations.nodes.map(function ({invitee, role}) {
    return {
      ...invitee,
      role
    }
  })
  const actual = node.members.edges.map(function ({node, role}) {
    return {
      ...node,
      role: role.toLowerCase()
    }
  })

  // Warn on pending invites
  for (const {role, login} of invitations) {
    console.log(
      '  ' + chalk.blue('ℹ') + ' @%s should accept their invite for %s as %s',
      login,
      name,
      role
    )
  }

  // Remove
  const unexpected = actual.filter(function ({login}) {
    return !expected.includes(login)
  })

  for (const {login} of unexpected) {
    console.log(
      '  ' + chalk.red('✖') + ' @%s should not be in team %s',
      login,
      name
    )
  }

  // Current members with wrong roles.
  for (const {login, role} of actual) {
    // Remove: already warned about.
    if (!expected.includes(login)) {
      continue
    }

    const ex = maintainers.includes(login) ? 'maintainer' : 'member'

    // Core team members are always maintainers, regardless of what’s otherwise
    // expected.
    if (find(context, owner)) {
      continue
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
  }

  // Add missing humans.
  // Note that this will add pending humans again.
  await pSeries(
    expected
      .filter(function (name) {
        return !actual.some(function (y) {
          return y.login === name
        })
      })
      .filter(function (name) {
        return !invitations.some(function (y) {
          return y.login === name
        })
      })
      .map(function (name) {
        /**
         * @returns {Promise<undefined>}
         */
        return function () {
          const role = maintainers.includes(name) ? 'maintainer' : 'member'

          return ghRequest('PUT /orgs/:org/teams/:team/memberships/:username', {
            org: context.org,
            team: structure.name,
            username: name,
            role
          }).then(
            /**
             * @returns {undefined}
             */

            function () {
              console.log(
                '  ' + chalk.green('✔') + ' add @%s to %s as %s',
                name,
                structure.name,
                role
              )
            }
          )
        }
      })
  )
}
