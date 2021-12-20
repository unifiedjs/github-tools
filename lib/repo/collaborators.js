import chalk from 'chalk'
import minimatch from 'minimatch'
import {interpolate} from '../util/interpolate.js'

export async function collaborators(info) {
  const {repo, ctx} = info
  const {ghHumans, org, ghQuery} = ctx
  const {permission, outsideCollaborators} = ghHumans
  const {name, isArchived} = repo

  if (isArchived) {
    console.log('  ' + chalk.blue('ℹ') + ' repo %s is archived', name)
    return
  }

  const matches = outsideCollaborators.filter((x) =>
    minimatch(org + '/' + name, interpolate(ctx, x.scope), {dot: true})
  )

  const outside = matches.flatMap((m) => m.collaborators.map((c) => c.github))

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
    .filter((login) => !ghOutside.some((y) => login === y.login))
    .forEach((login) => {
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

  // Wrong permissions.
  ghOutside
    .filter((x) => x.permission !== permission)
    .forEach((x) => {
      console.log(
        '  ' + chalk.red('✖') + ' @%s should have %s, not %s, rights for %s',
        x.login,
        permission,
        x.permission,
        name
      )
    })

  // Team member and collaborator.
  ghDirect
    .filter(({login}) => !ghOutside.some((y) => login === y.login))
    .forEach((x) => {
      console.log(
        '  ' +
          chalk.red('✖') +
          ' @%s is a team member *and* an outside collaborator (%s) for %s',
        x.login,
        x.permission,
        name
      )
    })
}
