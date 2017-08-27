module.exports.analytics = (event, context, callback) => {
  const js = "alert('working');"
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'max-age=31536000',
      ETag: '686897696a7c876b7e'
    },
    body: js
  }
  // callback is sending JS back
  callback(null, response)
}
