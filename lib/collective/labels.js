/**
 * @typedef {import('../util/types.js').Context} Context
 * @typedef {import('../util/types.js').Label} Label
 * @typedef {import('../util/types.js').Labels} Labels
 */

/**
 * @typedef ColorRange
 * @property {string} from
 * @property {string} to
 *
 * @typedef LabelEntry
 * @property {string} name
 * @property {string} description
 * @property {Array<string>} [legacy]
 * @property {string} color
 * @property {string} [slug]
 *   Never used: to do: remove?
 *
 * @typedef LabelGroupEntry
 * @property {string} name
 * @property {string} description
 * @property {Array<string>} [legacy]
 * @property {string} [slug]
 *   Never used: to do: remove?
 *
 * @typedef LabelGroup
 * @property {ColorRange | string} color
 * @property {Array<LabelGroupEntry>} labels
 *
 * @typedef LabelData
 * @property {Array<string>} remove
 * @property {Array<LabelGroup | LabelEntry>} add
 */

import assert from 'node:assert/strict'
import {scaleLinear} from 'd3-scale'
import {color as d3Color} from 'd3-color'
import sort from 'alpha-sort'
import {toLabelSlug} from '../util/to-label-slug.js'

/**
 * @param {Context} ctx
 * @returns {Promise<Context>}
 */
export async function labels(ctx) {
  const rawOld = /** @type {LabelData} */ (ctx.ghLabels)
  const rawNext = /** @type {LabelData} */ (ctx.ghLabelsNext)

  return {
    ...ctx,
    // @ts-expect-error: to do: remove old style labels.
    ghLabels: expand(rawOld),
    ghLabelsNext: expand(rawNext)
  }

  /**
   *
   * @param {LabelData} labels
   * @returns {Labels}
   */
  function expand(labels) {
    /** @type {Array<string>} */
    const remove = (labels.remove || []).map((d) => toLabelSlug(d))
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
      /** @type {import('d3-scale').ScaleLinear<number, string, unknown> | undefined} */
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
        .map((x) => ({...x, slug: toLabelSlug(x.name)}))
        .sort((a, b) => sort()(a.slug, b.slug))

      for (const [i, x] of all.entries()) {
        const colorFormatted = /** @type {string} */ (scale ? scale(i) : color)
        addOne({color: colorFormatted, ...x})
      }
    }
  }
}
