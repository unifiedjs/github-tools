'use strict'

const chalk = require('chalk')
const tools = require('./lib')
const config = require('./config')

tools.run(
  {
    // Note: ghToken needs `admin:org` and `repo` scopes.
    ghToken: process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
    ...config
  },
  done
)

function done(err) {
  if (err) {
    console.log(chalk.red('✖') + ' error')
    console.error(err)
  } else {
    console.log(chalk.green('✓') + ' done')
  }
}
