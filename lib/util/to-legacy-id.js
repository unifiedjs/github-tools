'use strict'

const atob = require('atob')

module.exports = toLegacyId

// Alright, this is horrible…
// In v4 (GraphQL), node ids are used as ids.
// Whereas in v3 (Rest), ids are numeric.
// Now, v4 doesn’t support creating teams, but v3 doesn’t let you find a team
// (only to get all teams).
// This horrible code makes it work tho, but it’ll probably break in the future.
//
// More here:
// https://developer.github.com/v4/guides/using-global-node-ids/
function toLegacyId(id) {
  const value = atob(id)
  return parseInt(value.split(':')[1].replace(/\D+/, ''), 10)
}
