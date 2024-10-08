/**
 * @import {ScaleLinear} from 'd3-scale'
 * @import {Context, Labels, Label} from '../util/types.js'
 */

/**
 * @typedef ColorRange
 * @property {string} from
 * @property {string} to
 *
 * @typedef LabelEntry
 * @property {string} name
 * @property {string} description
 * @property {Array<string> | undefined} [legacy]
 * @property {string} color
 * @property {string | undefined} [slug]
 *
 * @typedef LabelGroupEntry
 * @property {string} name
 * @property {string} description
 * @property {Array<string> | undefined} [legacy]
 *
 * @typedef LabelGroup
 * @property {ColorRange | string} color
 * @property {Array<LabelGroupEntry>} labels
 *
 * @typedef LabelData
 * @property {Array<string>} remove
 * @property {Array<LabelEntry | LabelGroup>} add
 */

import assert from 'node:assert/strict'
import alphaSort from 'alpha-sort'
import {color as d3Color} from 'd3-color'
import {scaleLinear} from 'd3-scale'
import {toLabelSlug} from '../util/to-label-slug.js'

const comparator = alphaSort()

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
export async function labels(context) {
  const rawNext = /** @type {LabelData} */ (context.ghLabels)

  return {
    ...context,
    ghLabels: expand(rawNext)
  }

  /**
   *
   * @param {LabelData} labels
   * @returns {Labels}
   */
  function expand(labels) {
    /** @type {Array<string>} */
    const remove = (labels.remove || []).map(function (d) {
      return toLabelSlug(d)
    })
    /** @type {Record<string, string>} */
    const replace = {}
    /** @type {Array<Label>} */
    const add = []

    for (const x of labels.add) {
      if ('labels' in x) {
        addAll(x)
      } else {
        addOne(x)
      }
    }

    return {remove, replace, add}

    /**
     *
     * @param {LabelEntry} d
     */
    function addOne(d) {
      const {legacy = [], color, ...x} = d
      const slug = x.slug || toLabelSlug(x.name)

      const colorObject = d3Color(color)
      assert(colorObject, 'could not parse color `' + color + '`')

      add.push({
        ...x,
        color: colorObject.formatHex().slice(1),
        slug
      })

      for (const y of legacy) {
        replace[toLabelSlug(y)] = slug
      }
    }

    /**
     *
     * @param {LabelGroup} group
     */
    function addAll(group) {
      const {labels, color} = group
      /** @type {ScaleLinear<number, string, unknown> | undefined} */
      let scale

      if (typeof color !== 'string' && color.from && color.to) {
        // @ts-expect-error: scale is fine?
        scale = scaleLinear()
          .domain([0, labels.length])
          // @ts-expect-error: colors are fine.
          .range([color.from, color.to])
      }

      const all = labels
        .concat()
        .map(function (x) {
          return {...x, slug: toLabelSlug(x.name)}
        })
        .sort(function (a, b) {
          return comparator(a.slug, b.slug)
        })

      for (const [i, x] of all.entries()) {
        const colorFormatted = /** @type {string} */ (scale ? scale(i) : color)
        addOne({color: colorFormatted, ...x})
      }
    }
  }
}
