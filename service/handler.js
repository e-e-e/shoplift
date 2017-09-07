'use strict'

const crypto = require('crypto')
const parallel = require('run-parallel')
const AWS = require('aws-sdk')
// var sns = new AWS.SNS()

const requestTrackingTable = new AWS.DynamoDB.DocumentClient({
  params: {
    TableName: process.env.DYNAMODB_REQTABLE
  }
})

const labourTrackingTable = new AWS.DynamoDB.DocumentClient({
  params: {
    TableName: process.env.DYNAMODB_LABOUR_TABLE
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
  if (!event.body || !validHmac(event)) {
    return notOk(401, 'Unauthorized')
  }
  // check if is already processed
  const topic = event.headers['X-Shopify-Topic']
  const requestId = constructEventId(event)
  const params = { Key: { requestId } }
  requestTrackingTable.get(params, (error, result) => {
    if (error) {
      return notOk(500, error)
    }
    // if nothing is returned dont process
    if (result.Item !== undefined) {
      return ok()
    }
    parallel([trackRequest, processHook], (error) => {
      if (error) return notOk(500, error)
      ok()
    })
  })

  function trackRequest (cb) {
    requestTrackingTable.put({
      Item: {
        requestId,
        ttl: Math.floor(Date.now() / 1000) + 60
      }
    }, cb)
  }

  function processHook (cb) {
    console.log('processing', topic)
    labourTrackingTable.update({
      Key: { topic },
      AttributeUpdates: {
        count: {
          Action: 'ADD',
          Value: 1
        }
      }
    }, cb)
  }

  function ok () {
    callback(null, { statusCode: 200 })
  }
  function notOk (code, reason) {
    console.log('not cool!', reason)
    callback(null, {
      statusCode: code,
      body: JSON.stringify({ error: reason }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
