const fs = require('fs')
const path = require('path')
const https = require('https')

const base =
  'https://raw.githubusercontent.com/unifiedjs/collective/master/data/'
const files = ['humans.yml', 'teams.yml']

files.forEach((filename) => {
  https.get(base + filename, (response) => {
    response.pipe(
      fs.createWriteStream(path.join('config', 'unified-' + filename))
    )
  })
})
