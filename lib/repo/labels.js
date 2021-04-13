import chalk from 'chalk'
import {toLabelSlug} from '../util/to-label-slug.js'
import {labelsPreviewAccept} from '../util/constants.js'

const own = {}.hasOwnProperty
const changeable = ['name', 'description', 'color']

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

  const previous = repository.labels.nodes.map((d) => ({
    ...d,
    slug: toLabelSlug(d.name)
  }))

  const unknown = []
  const remove = []
  const actual = []
  const toggle = []
  const change = []

  previous
    .filter((d) => !expected.some((expect) => d.slug === expect.slug))
    .forEach((d) => {
      if (own.call(replaceMap, d.slug)) {
        const name = replaceMap[d.slug]
        const replace = expected.find((expect) => expect.slug === name)
        const renameable =
          !previous.some((expect) => expect.slug === name) &&
          !change.some((expect) => expect.to.slug === name)
        const list = renameable ? change : toggle

        list.push({from: d, to: replace})
      } else if (labels.remove.includes(d.slug)) {
        remove.push(d)
      } else {
        unknown.push(d)
      }
    })

  // To do: add a scheme, e.g., `component/`, that’s free to use.
  unknown.forEach((d) => {
    console.log(
      '  ' + chalk.blue('ℹ') + ' unknown label ' + chalk.blue('%s'),
      d.name
    )
  })

  const add = expected
    // Not already existing.
    .filter((d) => !previous.some((expect) => d.slug === expect.slug))
    // Not marked for a change.
    .filter((d) => !change.some((expect) => d.slug === expect.to.slug))

  if (add.length > 0) {
    const response = await ghQuery(
      []
        .concat(
          'mutation {',
          add.map(
            (d, i) =>
              `  create${i}: createLabel(input: { repositoryId: "${repositoryId}", name: "${d.name}", description: "${d.description}", color: "${d.color}" }) {\n    label { id }\n  }`
          ),
          '}'
        )
        .join('\n'),
      {headers: {accept: labelsPreviewAccept}}
    )

    add.forEach((d, i) => {
      actual.push({...d, id: response['create' + i].label.id})

      console.log(
        '  ' + chalk.green('✓') + ' created label %s',
        chalk.blue(d.name)
      )
    })
  }

  previous
    // Not added above.
    .filter((d) => !add.some((expect) => d.slug === expect.slug))
    .forEach((ac) => {
      const ex = expected.find((expect) => ac.slug === expect.slug)

      // Ignore unexpected values.
      if (!ex) {
        return
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
    })

  if (change.length > 0) {
    await ghQuery(
      []
        .concat(
          'mutation {',
          change.map(
            (d, i) =>
              `  change${i}: updateLabel(input: { id: "${d.from.id}", name: "${d.to.name}", description: "${d.to.description}", color: "${d.to.color}" }) {\n    clientMutationId\n  }`
          ),
          '}'
        )
        .join('\n'),
      {headers: {accept: labelsPreviewAccept}}
    )

    change.forEach((d) => {
      const diff = {}

      changeable.forEach((p) => {
        if (d.from[p] !== d.to[p]) {
          diff[p] = d.to[p]
        }
      })

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
    })
  }

  const toggleMap = {}

  toggle.forEach((d) => {
    const to =
      actual.find((expect) => expect.slug === d.to.slug) ||
      previous.find((expect) => expect.slug === d.to.slug)

    toggleMap[d.from.id] = to.id
  })

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
    {org, name, labels: toggle.map((d) => d.from.name)}
  )

  const mutations = []

  body.repository.issues.nodes
    .concat(body.repository.pullRequests.nodes)
    .forEach((d) => {
      const labels = d.labels.nodes.map((expect) => expect.id)
      const add = labels
        .filter((d) => own.call(toggleMap, d) && !labels.includes(toggleMap[d]))
        .map((d) => toggleMap[d])

      if (add.length > 0) {
        mutations.push({issue: d.id, title: d.title, labels: add})
      }
    })

  if (mutations.length > 0) {
    await ghQuery(
      []
        .concat(
          'mutation {',
          mutations.map((d, i) => {
            return `  mut${i}: addLabelsToLabelable(input: { labelableId: ${JSON.stringify(
              d.issue
            )}, labelIds: ${JSON.stringify(d.labels)} }) { clientMutationId }`
          }),
          '}'
        )
        .join('\n')
    )

    mutations.forEach((d) => {
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
    })
  }

  // Add the toggled labels to the remove list.
  toggle.forEach((d) => {
    remove.push(d.from)
  })

  if (remove.length > 0) {
    await ghQuery(
      []
        .concat(
          'mutation {',
          remove.map(
            (d, i) =>
              `  remove${i}: deleteLabel(input: { id: "${d.id}" }) { clientMutationId }`
          ),
          '}'
        )
        .join('\n'),
      {headers: {accept: labelsPreviewAccept}}
    )

    remove.forEach((d) => {
      console.log(
        '  ' + chalk.green('✓') + ' removed label ' + chalk.blue('%s'),
        d.name
      )
    })
  }
}
