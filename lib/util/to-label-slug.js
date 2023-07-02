/**
 * @param {string} value
 * @returns {string}
 */
export function toLabelSlug(value) {
  return (
    value
      // Remove Gemoji shortcodes
      .replace(/:[^:]+:/g, '')
      // Remove non-ASCII
      // eslint-disable-next-line no-control-regex
      .replace(/[^\u0000-\u007F]/g, '')
      // Replace dash and underscore with a space.
      .replace(/[-_]/g, ' ')
      // Replace multiple spaces
      .replace(/\s/g, ' ')
      // Trim.
      .trim()
  )
}
