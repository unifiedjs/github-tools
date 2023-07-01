import {scaleLinear} from 'd3-scale'
import {color as d3Color} from 'd3-color'
import sort from 'alpha-sort'
import {toLabelSlug} from '../util/to-label-slug.js'

export async function labels(ctx) {
  return {
    ...ctx,
    ghLabels: expand(ctx.ghLabels),
    ghLabelsNext: expand(ctx.ghLabelsNext)
  }

  function expand(labels) {
    const remove = (labels.remove || []).map((d) => toLabelSlug(d))
    const replace = {}
    const add = []

    for (const x of labels.add) {
      ;(x.labels ? addAll : addOne)(x)
    }

    return {remove, replace, add}

    function addOne({legacy = [], color, ...x}) {
      const slug = x.slug || toLabelSlug(x.name)

      add.push({
        ...x,
        color: d3Color(color).formatHex().slice(1),
        slug
      })

      for (const y of legacy) {
        replace[toLabelSlug(y)] = slug
      }
    }

    function addAll(group) {
      const {labels, color} = group
      let scale

      if (color.from && color.to) {
        scale = scaleLinear()
          .domain([0, labels.length])
          .range([color.from, color.to])
      }

      const all = labels
        .concat()
        .map((x) => ({...x, slug: toLabelSlug(x.name)}))
        .sort((a, b) => sort()(a.slug, b.slug))

      for (const [i, x] of all.entries()) {
        addOne({color: scale ? scale(i) : color, ...x})
      }
    }
  }
}
