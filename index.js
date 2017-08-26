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
// shopify.product.list({ limit: 5 })
//   .then(orders => console.log(orders))
//   .catch(err => console.error(err));
