/**
 * @import {Context, Repo} from '../util/types.js'
 */

import chalk from 'chalk'
import {minimatch} from 'minimatch'
import {interpolate} from '../util/interpolate.js'

/**
 * @param {{context: Context, repo: Repo}} info
 * @returns {Promise<undefined>}
 */
export async function collaborators(info) {
  const {repo, context} = info
  const {ghHumans, org, ghQuery} = context
  const {permission, outsideCollaborators} = ghHumans
  const {name, isArchived} = repo

  if (isArchived) {
    console.log('  ' + chalk.blue('ℹ') + ' repo %s is archived', name)
    return
  }

  const matches = outsideCollaborators.filter(function (x) {
    return minimatch(org + '/' + name, interpolate(context, x.scope), {
      dot: true
    })
  })

  const outside = matches.flatMap(function (m) {
    return m.collaborators.map(function (c) {
      return c.github
    })
  })

  /** @type {{repository: {direct: {edges: Array<{permission: string, node: {login: string}}>}, outside: {edges: Array<{permission: string, node: {login: string}}>}}}} */
  const {repository} = await ghQuery(
    `
      query($org: String!, $name: String!) {
        repository(owner: $org, name: $name) {
          direct: collaborators(first: 100, affiliation: DIRECT) {
            edges {
              permission
              node {
                login
              }
            }
          }
          outside: collaborators(first: 100, affiliation: OUTSIDE) {
            edges {
              permission
              node {
                login
              }
            }
          }
        }
      }
    `,
    {org, name}
  )

  // Direct is a list of people with specific rights set on the repo.
  // Even if they’re also on a team.
  // Outside is a list of people also in `direct`, but specifically not in the org.
  const ghDirect = repository.direct.edges.map(function ({permission, node}) {
    return {permission, ...node}
  })
  const ghOutside = repository.outside.edges.map(function ({permission, node}) {
    return {permission, ...node}
  })

  // Warn about missing expected outside collaborators.
  const missing = outside.filter(function (login) {
    return !ghOutside.some(function (y) {
      return login === y.login
    })
  })

  for (const login of missing) {
    console.log(
      '  ' + chalk.blue('ℹ') + ' @%s should be an outside collaborator for %s',
      login,
      name
    )
  }

  // Remove.
  const unexpected = ghOutside.filter(function ({login}) {
    return !outside.includes(login)
  })

  for (const {login} of unexpected) {
    console.log(
      '  ' +
        chalk.red('✖') +
        ' @%s should not be an outside collaborator for %s',
      login,
      name
    )
  }

  // Wrong permissions.
  const wrong = ghOutside.filter(function (x) {
    return x.permission !== permission
  })

  for (const x of wrong) {
    console.log(
      '  ' + chalk.red('✖') + ' @%s should have %s, not %s, rights for %s',
      x.login,
      permission,
      x.permission,
      name
    )
  }

  // Team member and collaborator.
  const both = ghDirect.filter(function ({login}) {
    return !ghOutside.some(function (y) {
      return login === y.login
    })
  })

  for (const x of both) {
    console.log(
      '  ' +
        chalk.red('✖') +
        ' @%s is a team member *and* an outside collaborator (%s) for %s',
      x.login,
      x.permission,
      name
    )
  }
}
