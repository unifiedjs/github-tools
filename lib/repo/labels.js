/**
 * @typedef {import('../util/types.js').Context} Context
 * @typedef {import('../util/types.js').Label} Label
 * @typedef {import('../util/types.js').Repo} Repo
 */

import assert from 'node:assert/strict'
import chalk from 'chalk'
import {labelsPreviewAccept} from '../util/constants.js'
import {toLabelSlug} from '../util/to-label-slug.js'

const own = {}.hasOwnProperty
const changeable = /** @type {const} */ (['name', 'description', 'color'])

/**
 * @param {{ctx: Context, repo: Repo}} info
 * @returns {Promise<undefined>}
 */
export async function labels(info) {
  const {repo, ctx} = info
  const {ghLabels, ghLabelsNext, orgLabelsNext, org, ghQuery} = ctx
  const {name, isArchived} = repo
  const labels = orgLabelsNext ? ghLabelsNext : ghLabels
  const replaceMap = {...labels.replace}

  if (isArchived) {
    return
  }

  console.log(chalk.bold('labels') + ' for %s', name)

  const expected = labels.add

  /** @type {{repository: {id: string, labels: {nodes: Array<{id: string, name: string, description: string, color: string}>}}}} */
  const {repository} = await ghQuery(
    `
      query($org: String!, $name: String!) {
        repository(owner: $org, name: $name) {
          id
          labels(first: 100) {
            nodes {
              id
              name
              description
              color
            }
          }
        }
      }
    `,
    {org, name}
  )

  const repositoryId = repository.id

  const previous = repository.labels.nodes.map(function (d) {
    return {...d, slug: toLabelSlug(d.name)}
  })

  /** @type {Array<Label>} */
  const unknown = []
  /** @type {Array<Label & {id: string}>} */
  const remove = []
  /** @type {Array<Label & {id: string}>} */
  const actual = []
  /** @type {Array<{from: Label & {id: string}, to: Label}>} */
  const toggle = []
  /** @type {Array<{from: Label & {id: string}, to: Label}>} */
  const change = []

  const unexpected = previous.filter(function (d) {
    return !expected.some(function (expect) {
      return d.slug === expect.slug
    })
  })

  for (const d of unexpected) {
    if (own.call(replaceMap, d.slug)) {
      const name = replaceMap[d.slug]
      const replace = expected.find(function (expect) {
        return expect.slug === name
      })
      const renameable =
        !previous.some(function (expect) {
          return expect.slug === name
        }) &&
        !change.some(function (expect) {
          return expect.to.slug === name
        })
      const list = renameable ? change : toggle

      assert(replace, 'expected to find replacement for ' + d.slug)

      list.push({from: d, to: replace})
    } else if (labels.remove.includes(d.slug)) {
      remove.push(d)
    } else {
      unknown.push(d)
    }
  }

  // To do: add a scheme, e.g., `component/`, that’s free to use.
  for (const d of unknown) {
    console.log(
      '  ' + chalk.blue('ℹ') + ' unknown label ' + chalk.blue('%s'),
      d.name
    )
  }

  const add = expected
    // Not already existing.
    .filter(function (d) {
      return !previous.some(function (expect) {
        return d.slug === expect.slug
      })
    })
    // Not marked for a change.
    .filter(function (d) {
      return !change.some(function (expect) {
        return d.slug === expect.to.slug
      })
    })

  if (add.length > 0) {
    /** @type {{[key: string]: {label: {id: string}}}} */
    const response = await ghQuery(
      [
        'mutation {',
        ...add.map(function (d, i) {
          return `  create${i}: createLabel(input: { repositoryId: "${repositoryId}", name: "${d.name}", description: "${d.description}", color: "${d.color}" }) {\n    label { id }\n  }`
        }),
        '}'
      ].join('\n'),
      {headers: {accept: labelsPreviewAccept}}
    )

    for (const [i, d] of add.entries()) {
      actual.push({...d, id: response['create' + i].label.id})

      console.log(
        '  ' + chalk.green('✓') + ' created label %s',
        chalk.blue(d.name)
      )
    }
  }

  const notAdded = previous
    // Not added above.
    .filter(function (d) {
      return !add.some(function (expect) {
        return d.slug === expect.slug
      })
    })

  for (const ac of notAdded) {
    const ex = expected.find(function (expect) {
      return ac.slug === expect.slug
    })

    // Ignore unexpected values.
    if (!ex) {
      continue
    }

    if (
      ac.name === ex.name &&
      ac.description === ex.description &&
      ac.color === ex.color
    ) {
      actual.push(ac)
    } else {
      change.push({from: ac, to: ex})
    }
  }

  if (change.length > 0) {
    await ghQuery(
      [
        'mutation {',
        ...change.map(function (d, i) {
          return `  change${i}: updateLabel(input: { id: "${d.from.id}", name: "${d.to.name}", description: "${d.to.description}", color: "${d.to.color}" }) {\n    clientMutationId\n  }`
        }),
        '}'
      ].join('\n'),
      {headers: {accept: labelsPreviewAccept}}
    )

    for (const d of change) {
      /** @type {{name?: string, description?: string, color?: string}} */
      const diff = {}

      for (const p of changeable) {
        if (d.from[p] !== d.to[p]) {
          diff[p] = d.to[p]
        }
      }

      actual.push({...d.to, id: d.from.id})

      console.log(
        '  ' +
          chalk.green('✓') +
          ' changed %s of label %s' +
          (diff.name ? ' (now %s)' : ''),
        Object.keys(diff).join(', '),
        chalk.blue(d.from.name),
        chalk.blue(d.to.name)
      )
    }
  }

  /** @type {Record<string, string>} */
  const toggleMap = {}

  for (const d of toggle) {
    const to =
      actual.find(function (expect) {
        return expect.slug === d.to.slug
      }) ||
      previous.find(function (expect) {
        return expect.slug === d.to.slug
      })

    assert(to, 'expected to find label ' + d.to.slug)
    toggleMap[d.from.id] = to.id
  }

  /**
   * @typedef IssueOrPullRequest
   * @property {string} id
   * @property {string} title
   * @property {{nodes: Array<{id: string}>}} labels
   */

  /** @type {{repository: {issues: {nodes: Array<IssueOrPullRequest>}, pullRequests: {nodes: Array<IssueOrPullRequest>}}}} */
  const body = await ghQuery(
    `
      query($org: String!, $name: String!, $labels: [String!]) {
        repository(owner: $org, name: $name) {
          issues(labels: $labels, first: 100) {
            nodes {
              id
              title
              labels(first: 100) { nodes { id } }
            }
          }
          pullRequests(labels: $labels, first: 100) {
            nodes {
              id
              title
              labels(first: 100) { nodes { id } }
            }
          }
        }
      }
    `,
    {
      org,
      name,
      labels: toggle.map(function (d) {
        return d.from.name
      })
    }
  )

  /** @type {Array<{issue: string, title: string, labels: Array<string>}>} */
  const mutations = []
  const nodes = body.repository.issues.nodes.concat(
    body.repository.pullRequests.nodes
  )

  for (const d of nodes) {
    const labels = d.labels.nodes.map(function (expect) {
      return expect.id
    })
    const add = labels
      .filter(function (d) {
        return own.call(toggleMap, d) && !labels.includes(toggleMap[d])
      })
      .map(function (d) {
        return toggleMap[d]
      })

    if (add.length > 0) {
      mutations.push({issue: d.id, title: d.title, labels: add})
    }
  }

  if (mutations.length > 0) {
    await ghQuery(
      [
        'mutation {',
        ...mutations.map(function (d, i) {
          return `  mut${i}: addLabelsToLabelable(input: { labelableId: ${JSON.stringify(d.issue)}, labelIds: ${JSON.stringify(d.labels)} }) { clientMutationId }`
        }),
        '}'
      ].join('\n')
    )

    for (const d of mutations) {
      console.log(
        '  ' +
          chalk.green('✓') +
          ' added ' +
          d.labels.length +
          ' label' +
          (d.labels.length === 1 ? '' : 's') +
          ' to ' +
          chalk.blue('%s'),
        d.title
      )
    }
  }

  // Add the toggled labels to the remove list.
  for (const d of toggle) {
    remove.push(d.from)
  }

  if (remove.length > 0) {
    await ghQuery(
      [
        'mutation {',
        ...remove.map(function (d, i) {
          return `  remove${i}: deleteLabel(input: { id: "${d.id}" }) { clientMutationId }`
        }),
        '}'
      ].join('\n'),
      {headers: {accept: labelsPreviewAccept}}
    )

    for (const d of remove) {
      console.log(
        '  ' + chalk.green('✓') + ' removed label ' + chalk.blue('%s'),
        d.name
      )
    }
  }
}
