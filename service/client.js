const fs = require('fs')

module.exports.analytics = (event, context, callback) => {
  const js = fs.readFileSync(`${__dirname}/client/shoplift-analytics.js`)
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'max-age=360',
      ETag: '686897696a7c876b7e-one'
    },
    body: js.toString()
  }
  // callback is sending JS back
  callback(null, response)
}
