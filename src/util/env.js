module.exports = function envcheck(params={}, callback) {
  let { config={} } = params

  let { SIMPLISAFE_EMAIL, SIMPLISAFE_PASSWORD, SIMPLISAFE_SESSION_ID } = process.env

  let errors = []
  let username  = SIMPLISAFE_EMAIL      || config.email
  let password  = SIMPLISAFE_PASSWORD   || config.password
  let sessionID = SIMPLISAFE_SESSION_ID || config.sessionID

  if (!username)
    errors.push(`Missing config.email or SIMPLISAFE_EMAIL env var`)
  if (!password)
    errors.push(`Missing config.password or SIMPLISAFE_PASSWORD env var`)
  if (!sessionID)
    errors.push(`Missing config.sessionID or SIMPLISAFE_SESSION_ID env var`)

  if (errors.length) callback(ReferenceError(`Config errors found:\n${errors.join('\n')}`))
  else {
    let auth = { username, password, sessionID }
    callback(null, auth)
  }
}
