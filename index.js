const Shopify = require('shopify-api-node')
const config = require('./config.json')
const shopify = new Shopify(config)

const serverGateway = 'https://ync3rsvhm6.execute-api.us-east-1.amazonaws.com/dev/'
const webhooks = [
  {
    topic: 'products/create',
    url: 'webhook'
  },
  {
    topic: 'products/update',
    url: 'webhook'
  }
]

installWebhooks(webhooks)
  .then(() => installScripts())

function installWebhooks (webhooksToInstall) {
  return shopify.webhook.list()
    .then((hooks) => {
      const toInstall = webhooksToInstall.map((webhook) => {
        const address = `${serverGateway}${webhook.url}`
        const existing = hooks.find(hook => hook.topic === webhook.topic)
        if (existing) {
          console.log('need to update', existing)
          return null
        }
        const options = {
          format: 'json',
          topic: webhook.topic,
          address
        }
        console.log('creating', options)
        return shopify.webhook.create(options).catch(console.error)
      })
      return Promise.all(toInstall)
    })
}

function installScripts () {
  return shopify.scriptTag.list()
    .then((scripts) => {
      const s = scripts.find(script => /shoplift-analytics\.js$/.test(script.src))
      if (s) {
        console.log('already installed', s.src)
      } else {
        return shopify.scriptTag.create({
          event: 'onload',
          src: `${serverGateway}shoplift-analytics.js`
        })
      }
    })
}
