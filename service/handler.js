'use strict'

const crypto = require('crypto')
const AWS = require('aws-sdk')

const dynamoDb = new AWS.DynamoDB.DocumentClient({
  params: {
    TableName: process.env.DYNAMODB_REQTABLE
  }
})

function validHmac (event) {
  const calculatedHash = crypto
    .createHmac('sha256', process.env.SHOPIFY_SECRET)
    .update(Buffer.from(event.body))
    .digest('base64')
  // reject the message if the hash doesn't match
  return event.headers['X-Shopify-Hmac-Sha256'] === calculatedHash
}

function constructEventId (event) {
  return `${event.headers['X-Shopify-Topic']}-${event.headers['X-Shopify-Hmac-Sha256']}`
}

module.exports.shopifyWebhook = (event, context, callback) => {
  if (!validHmac(event)) {
    return notOk(401, 'Unauthorized')
  };
  // check if is already processed
  const requestId = constructEventId(event)
  const params = { Key: { requestId } }
  dynamoDb.get(params, (error, result) => {
    if (error) {
      return notOk(500, error)
    }
    // if nothing is returned dont process
    if (result.Item !== undefined) {
      return ok()
    }
    dynamoDb.put({
      Item: {
        requestId,
        ttl: Math.floor(Date.now() / 1000) + 60
      }
    }, (error) => {
      if (error) return notOk(500, error)
      // process the item
      console.log('process item')
      ok()
    })
  })

  function ok () {
    callback(null, { statusCode: 200 })
  }
  function notOk (code, reason) {
    callback(null, {
      statusCode: code,
      body: JSON.stringify({ error: reason }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
