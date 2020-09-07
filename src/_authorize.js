let tiny = require('tiny-json-http')
let series = require('run-series')
let env = require('./util/env')
let client = require('./util/client')
let createUUID = require('./util/uuid')
let session = require('./util/session')
let { apiBase, userAgent } = require('./util/constants')

module.exports = function authorize (params, callback) {
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

  // Simplisafe params
  let mfa_token
  let oob_code

  // Pulled from session
  let auth
  let clientData

  // Skip steps on re-runs
  let skipMFA

  // Ensure we've got a session ID, or nothing will work
  let config = params && params.config
  let sessionID = process.env.SIMPLISAFE_SESSION_ID || (config && config.sessionID)
  if (!sessionID) {
    sessionID = createUUID()
    console.log(`Created new sessionID, add this to your config or SIMPLISAFE_SESSION_ID env var: ${sessionID}`)
  }

  series([
    // Upon first run session will error before returning auth / client data
    // So get it here for subsequent requests
    function getClient (callback) {
      env(params,
      function go (err, result) {
        if (err) callback(err)
        else {
          auth = result
          let { sessionID } = auth
          clientData = client(sessionID)
          callback()
        }
      })
    },
    function getMFAToken (callback) {
      session(params, function (err, result) {
        if (err) {
          let { statusCode, body } = err
          if (statusCode === 403 && body.error === 'mfa_required') {
            mfa_token = body.mfa_token
            callback()
          }
          else callback(err)
        }
        else {
          let { token, tokenType } = result.token
          if (!token || tokenType !== 'Bearer') {
            let err = ReferenceError(`Invalid token receved from MFA challenge: ${token}`)
            callback(err)
          }
          else {
            skipMFA = true
            console.log(`App already has a valid session, add this sessionID to your config or SIMPLISAFE_SESSION_ID env var: ${auth.sessionID}`)
            callback()
          }
        }
      })
    },
    function MFAChallenge (callback) {
      if (skipMFA) callback()
      else {
        let { clientID: client_id } = clientData
        tiny.post({
          url: `${apiBase}/api/mfa/challenge`,
          data: {
            challenge_type: 'oob',
            client_id,
            mfa_token
          },
          headers: {
            'user-agent': userAgent
          }
        }, function (err, result) {
          if (err) callback(err)
          else {
            let { body } = result
            if (!body || !body.oob_code) {
              let err = ReferenceError(`Authorization failure: did not receive OOB code`)
              callback(err)
            }
            else {
              oob_code = body.oob_code
              callback()
            }
          }
        })
      }
    },
    function completeMFAchallenge (callback) {
      if (skipMFA) callback()
      else {
        let { username, password } = auth
        let {
          clientID: client_id,
          deviceID: device_id,
          appVersion: app_version
        } = clientData

        tiny.post({
          url: `${apiBase}/api/token`,
          data: {
            grant_type: 'http://simplisafe.com/oauth/grant-type/mfa-oob',
            username,
            password,
            client_id,
            device_id,
            app_version,
            mfa_token,
            oob_code
          },
          headers: {
            'user-agent': userAgent
          }
        }, function (err, result) {
          if (err) callback(err)
          else if (result.body && result.body.error === 'authorization_pending') {
            console.log(`Check ${username} for your verification email`)
            callback()
          }
          else callback()
        })
      }
    }
  ], function done (err) {
    if (err) callback(err)
    else callback(null, sessionID)
  })

  return promise
}
