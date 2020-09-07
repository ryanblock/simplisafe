let tiny = require('tiny-json-http')
let waterfall = require('run-waterfall')
let session = require('./util/session')
let systems = require('./_systems')
let { apiBase, userAgent } = require('./util/constants')

module.exports = function armDisarm (action='arm', params={}, callback) {
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
      params.token = token
      let { options } = params

      let state = action === 'arm' ? 'away' : 'off'
      if (action === 'arm' && options && options.home) state = 'home'

      waterfall([
        function getSystems (callback) {
          systems(params, callback)
        },
        function getSystemID ({ subscriptions: subs }, callback) {
          if (subs.length === 1) {
            callback(null, subs[0].sid)
          }
          else {
            let systemID = params.systemID
            let system = subs.some(s => s.sid === systemID)
            if (!systemID) {
              callback(Error(`If you operate multiple systems, you must specify which system to ${action}.`))
            }
            else if (!system) {
              callback(Error(`Invalid systemID: ${systemID}`))
            }
            else callback(null, systemID)
          }
        },
        function doTheThing (systemID, callback) {
          tiny.post({
            url: `${apiBase}/ss3/subscriptions/${systemID}/state/${state}`,
            headers: {
              authorization: `Bearer ${token}`,
              'user-agent': userAgent
            }
          }, function (err, result) {
            if (err) callback(err)
            else callback(null, result.body)
          })
        }
      ], function done (err, result) {
        if (err) callback(err)
        else callback(null, { ...result, token })
      })
    }
  })

  return promise
}
