let getSSID = require('./ssid')

/**
 * Common client request parameters
 */
module.exports = function clientParams (sessionID) {
  let ssid = getSSID(sessionID)

  let clientID = `${sessionID}.WebApp.simplisafe.com`
  let deviceID =  `WebApp; useragent="Chrome 85.0 (SS-ID: ${ssid}) / macOS 10.15.6"; uuid="${sessionID}"; id="${ssid}"`
  let appVersion = '1.65.0'
  // let scope = ''

  return {
    clientID,
    deviceID,
    appVersion,
    // scope
  }
}
