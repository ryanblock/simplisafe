/**
 * Simplisafe has some secondary unique value called the SSID
 * During testing it proved not to be really necessary but hey, let's really emulate production
 */
module.exports = function getSSID (uuid) {
  let b64 = Buffer.from(uuid).toString('base64')
  // Simplisafe ommitted these chars from their own SSID generator as of mid-2020
  b64 = b64.replace(/[IOlo]/g,'')
  return `${b64.substring(0, 5)}-${b64.substring(5, 10)}`
}
