let tiny = require('tiny-json-http')
let session = require('./util/session')
let waterfall = require('run-waterfall')
let { apiBase, userAgent } = require('./util/constants')

module.exports = function logout (params={}, callback) {
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
      let { deviceID } = session.client

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
        function killToken (userID, callback) {
          tiny.del({
            url: `${apiBase}/users/${userID}/mobileDevices`,
            headers: {
              authorization: `Bearer ${token}`,
              'user-agent': userAgent
            },
            data: {
              deviceIds: [ deviceID ]
            }
          }, function done (err) {
            if (err) callback(err)
            else callback()
          })
        }
      ])
    }
  })

  return promise
}
