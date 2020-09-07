let authorize = require('./_authorize')
let armDisarm = require('./_arm_disarm')
let status = require('./_status')
let systems = require('./_systems')
let logout = require('./_logout')

module.exports = {
  authorize,
  arm: armDisarm.bind({}, 'arm'),
  disarm: armDisarm.bind({}, 'disarm'),
  status,
  systems,
  logout,
}
