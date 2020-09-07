let tiny = require('tiny-json-http')
let waterfall = require('run-waterfall')
let session = require('./util/session')
let { apiBase, userAgent } = require('./util/constants')

module.exports = function systems (params={}, callback) {
  if (!callback && typeof params === 'function') {
    callback = params
    params = {}
  }

  let promise
  if (!callback) {
    promise = new Promise((res, rej) => {
      callback = (err, result) => {
        err ? rej(err) : res(result)
      }
    })
  }

  session(params,
  function _getSystems (err, session) {
    if (err) callback(err)
    else {
      let { token } = session.token

      waterfall([
        function getUserID (callback) {
          tiny.get({
            url: `${apiBase}/api/authCheck`,
            headers: {
              authorization: `Bearer ${token}`,
              'user-agent': userAgent
            }
          }, function (err, result) {
            if (err) callback(err)
            else callback(null, result.body.userId)
          })
        },
        function getSubs (userID, callback) {
          tiny.get({
            url: `${apiBase}/users/${userID}/subscriptions`,
            headers: {
              authorization: `Bearer ${token}`,
              'user-agent': userAgent
            }
          }, function (err, result) {
            if (err) callback(err)
            else if (result.body.subscriptions) {
              callback(null, { subscriptions: result.body.subscriptions, token })
            }
            else {
              let msg = `Got unknown response: ${JSON.stringify(result, null, 2)}`
              callback(Error(msg))
            }
          })
        }
      ], callback)
    }
  })

  return promise
}
