'use strict'

const chalk = require('chalk')
const minimatch = require('minimatch')
const interpolate = require('../util/interpolate')

module.exports = collaborators

async function collaborators(info) {
  const {repo, ctx} = info
  const {collaborators, org, query} = ctx
  const {name, isArchived} = repo

  if (isArchived) {
    console.log('  ' + chalk.blue('ℹ') + ' repo %s is archived', name)
    return
  }

  const matches = collaborators.filter(x =>
    minimatch(
      org + '/' + name,
      interpolate(ctx, x.scope || x.repositories.scope),
      {dot: true}
    )
  )

  const outside = [].concat(...matches.map(x => Object.keys(x.collaborators)))

  const {repository} = await query(
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
  const ghDirect = repository.direct.edges.map(({permission, node}) => ({
    permission,
    ...node
  }))
  const ghOutside = repository.outside.edges.map(({permission, node}) => ({
    permission,
    ...node
  }))

  // Warn about missing expected outside collaborators.
  outside
    .filter(login => !ghOutside.find(y => login === y.login))
    .forEach(login => {
      console.log(
        '  ' +
          chalk.blue('ℹ') +
          ' @%s should be an outside collaborator for %s',
        login,
        name
      )
    })

  // Remove.
  ghOutside
    .filter(({login}) => !outside.includes(login))
    .forEach(({login}) => {
      console.log(
        '  ' +
          chalk.red('✖') +
          ' @%s should not be an outside collaborator for %s',
        login,
        name
      )
    })

  // Wrong permissions (not write).
  ghOutside
    // To do: don’t hardcode default WRITE permissions.
    .filter(({permission}) => permission !== 'WRITE')
    .forEach(({login, permission}) => {
      console.log(
        '  ' + chalk.red('✖') + ' @%s should have WRITE, not %s, rights for %s',
        login,
        permission,
        name
      )
    })

  // Team member and collaborator.
  ghDirect
    .filter(({login}) => !ghOutside.find(y => login === y.login))
    .forEach(({login, permission}) => {
      console.log(
        '  ' +
          chalk.red('✖') +
          ' @%s is a team member *and* an outside collaborator (%s) for %s',
        login,
        permission,
        name
      )
    })
}
