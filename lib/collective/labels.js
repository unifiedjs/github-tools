import {scaleLinear} from 'd3-scale'
import d3Color from 'd3-color'
import sort from 'alpha-sort'
import {toLabelSlug} from '../util/to-label-slug.js'

export async function labels(ctx) {
  const {ghLabels} = ctx
  const remove = (ghLabels.remove || []).map((d) => toLabelSlug(d))
  const replace = {}
  const add = []

  ghLabels.add.forEach((x) => (x.labels ? addAll : addOne)(x))

  return {...ctx, ghLabels: {remove, replace, add}}

  function addOne({legacy = [], color, ...x}) {
    const slug = x.slug || toLabelSlug(x.name)

    add.push({
      ...x,
      color: d3Color.color(color).formatHex().slice(1),
      slug
    })

    legacy.forEach((y) => {
      replace[toLabelSlug(y)] = slug
    })
  }

  function addAll(group) {
    const {labels, color} = group
    let scale

    if (color.from && color.to) {
      scale = scaleLinear()
        .domain([0, labels.length])
        .range([color.from, color.to])
    }

    labels
      .concat()
      .map((x) => ({...x, slug: toLabelSlug(x.name)}))
      .sort((a, b) => sort()(a.slug, b.slug))
      .forEach((x, i) => {
        addOne({color: scale ? scale(i) : color, ...x})
      })
  }
}
