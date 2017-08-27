'use strict'

const AWS = require('aws-sdk')
const series = require('run-series')

const sqs = new AWS.SQS()
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  params: {
    TableName: process.env.DYNAMODB_QUEUE_TABLE
  }
})

// const promisify = (fn, context) => args => new Promise((resolve, reject) => {
//   const func = context ? fn.bind(context) : fn
//   return func(args, (error, result) => {
//     if (error) return reject(error)
//     return resolve(result)
//   })
// })

// const dbGet = promisify(dynamoDb.get, dynamoDb)
// const dbPut = promisify(dynamoDb.put, dynamoDb)
// const sqsReceive = promisify(sqs.receiveMessage, sqs)
// const sqsDelete = promisify(sqs.receiveMessage, sqs)

const workingFlag = { Key: { id: 'working' } }

module.exports.addTestMessages = (event, context, callback) => {
  sqs.getQueueUrl({ QueueName: process.env.SQS_QUEUE }, (error, data) => {
    if (error) return callback(null, { statusCode: 500, body: error })
    sendMessages(30, data.QueueUrl)
  })

  function sendMessages (i, url) {
    const params = {
      QueueUrl: url,
      MessageBody: `TestMessage ${i} - nah`, /* required */
      MessageGroupId: 'test_messages'
      // MessageAttributes: {
      //   '<String>': {
      //     DataType: 'STRING_VALUE', /* required */
      //     BinaryListValues: [
      //       new Buffer('...') || 'STRING_VALUE'
      //       /* more items */
      //     ],
      //     BinaryValue: new Buffer('...') || 'STRING_VALUE',
      //     StringListValues: [
      //       'STRING_VALUE'
      //       /* more items */
      //     ],
      //     StringValue: 'STRING_VALUE'
      //   }
      //   /* '<String>': ... */
      // }
    }
    sqs.sendMessage(params, (error, data) => {
      if (error) return callback(null, { statusCode: 500, body: error })
      console.log('added test message', i)
      if (i > 0) sendMessages(i - 1, url)
      else callback(null, { statusCode: 200, body: data })
    })
  }
}

module.exports.clearWorkingFlag = (event, context, callback) => {
  dynamoDb.delete(workingFlag, (error, data) => {
    if (error) return callback(null, { statusCode: 500, body: error })
    return callback(null, { statusCode: 200, body: data })
  })
}

module.exports.worker = (event, context, callback) => {
  dynamoDb.get(workingFlag, checkIfAlreadyWorking)

  function checkIfAlreadyWorking (error, result) {
    if (error) return notOk(500, error)
    // everything is ok, but the worker is already working
    if (result.Item) return ok()
    // flag the db that we are working
    console.log('start working')
    dynamoDb.put({ Item: { id: 'working' } }, startWorking)
  }

  function startWorking (error, result) {
    if (error) return notOkAndClearWorking(500, error)
    // start to process SQS
    sqs.getQueueUrl({ QueueName: process.env.SQS_QUEUE }, (error, data) => {
      if (error) return notOkAndClearWorking(500, error)
      processQueue(data.QueueUrl)
    })
  }

  function processQueue (queueUrl) {
    const recieveParams = {
      AttributeNames: [
        'SentTimestamp'
      ],
      MaxNumberOfMessages: 10,
      MessageAttributeNames: [
        'All'
      ],
      QueueUrl: queueUrl,
      VisibilityTimeout: 10,
      WaitTimeSeconds: 0
    }
    console.log('recieving messages')
    sqs.receiveMessage(recieveParams, (error, data) => {
      if (error) return notOkAndClearWorking(500, error)
      if (!data.Messages || data.Messages.length === 0) {
        return stopWorking(ok)
      }
      const toProcess = data.Messages.map(msg => cb => processMessage(msg, queueUrl, cb))
      series(toProcess, (error, results) => {
        if (error) return notOkAndClearWorking(500, error)
        // should this function stop?
        console.log('remaining:', context.getRemainingTimeInMillis())
        if (context.getRemainingTimeInMillis() > 1000) processQueue(queueUrl)
        else stopWorking(ok)
      })
    })
  }

  function processMessage (message, queueUrl, cb) {
    // handle message
    console.log('processing', message)
    // remove message from queue
    var deleteParams = {
      QueueUrl: queueUrl,
      ReceiptHandle: message.ReceiptHandle
    }
    sqs.deleteMessage(deleteParams, cb)
  }

  function stopWorking (cb) {
    dynamoDb.delete(workingFlag, (error) => {
      if (error) return notOk(500, error)
      console.log('stop working')
      return cb()
    })
  }

  function notOkAndClearWorking (code, reason) {
    stopWorking(() => notOk(code, reason))
  }

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
