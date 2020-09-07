let tiny = require('tiny-json-http')
let { apiBase, userAgent } = require('./constants')
let env = require('./env')
let client = require('./client')

/**
 * Common session (and session-related data) getter
 */
module.exports = function getSession (params, callback) {
  env(params,
  function go (err, auth) {
    if (err) callback(err)
    else {
      let { username, password, sessionID } = auth
      let {
        clientID,
        deviceID,
        appVersion,
      } = client(sessionID)
      let grant_type = 'password'

      let session = {
        auth,
        client: {
          clientID,
          deviceID,
          appVersion,
        }
      }

      // If a token was passed, just use that
      if (params.token) {
        session.token = {
          token: params.token,
          tokenType: 'Bearer'
        }
        callback(null, session)
      }
      // Otherwise, go grab one from the API
      else {
        tiny.post({
          url: `${apiBase}/api/token`,
          data: {
            grant_type,
            username,
            password,
            client_id: clientID,
            device_id: deviceID,
            app_version: appVersion,
          },
          headers: {
            'user-agent': userAgent
          }
        }, function (err, result) {
          if (err) callback(err)
          else if (!result || !result.body || !result.body.access_token || !result.body.token_type) {
            callback(Error('No access token returned, aborting'))
          }
          else {
            session.token = {
              token: result.body.access_token,
              tokenType: result.body.token_type
            }
            callback(null, session)
          }
        })
      }
    }
  })
}
