/**
 * @import {FlatXoConfig} from 'xo'
 */

/** @type {FlatXoConfig} */
const xoConfig = [
  {
    name: 'default',
    prettier: true,
    rules: {
      complexity: 'off',
      'no-await-in-loop': 'off',
      'promise/prefer-await-to-then': 'off',
      'unicorn/prefer-at': 'off',
      'unicorn/prefer-string-replace-all': 'off'
    },
    space: true
  }
]

export default xoConfig
