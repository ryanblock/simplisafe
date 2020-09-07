let waterfall = require('run-waterfall')
let session = require('./util/session')
let systems = require('./_systems')

module.exports = function alarmStatus (params={}, callback) {
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

      waterfall([
        function getSystems (callback) {
          systems(params, callback)
        },
        function getStatus ({ subscriptions: subs }, callback) {
          if (subs.length === 1) {
            callback(null, subs[0].location.system.alarmState.toLowerCase())
          }
          else {
            let systemID = params.systemID
            let system = subs.some(s => s.sid === systemID)
            if (!systemID) {
              callback(Error(`If you operate multiple systems, you must specify which system to get the status of.`))
            }
            else if (!system) {
              callback(Error(`Invalid systemID: ${systemID}`))
            }
            else {
              let status = system.location.system.alarmState.toLowerCase()
              callback(null, status)
            }
          }
        }
      ], function done (err, status) {
        if (err) callback(err)
        else callback(null, { status, token })
      })
    }
  })

  return promise
}
