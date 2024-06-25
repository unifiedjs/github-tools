import dlv from 'dlv'

/**
 * @param {object} context
 * @param {string} value
 * @returns {string}
 */
export function interpolate(context, value) {
  return value.replace(/:([\w$.]+)/g, replace)

  /**
   * @param {string} _
   * @param {string} $1
   * @returns {string}
   */
  function replace(_, $1) {
    return dlv(context, $1)
  }
}
