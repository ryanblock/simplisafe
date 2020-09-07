let { v4: uuidv4 } = require('uuid')

module.exports = function getIDs () {
  return uuidv4()
}
