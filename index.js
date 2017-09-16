const Shopify = require('shopify-api-node')
const config = require('./config.json')
const shopify = new Shopify(config)

const serverGateway = 'https://ync3rsvhm6.execute-api.us-east-1.amazonaws.com/dev/'
const webhooks = [
  'carts/create', 'carts/update',
  'checkouts/create', 'checkouts/delete', 'checkouts/update',
  'collections/create', 'collections/delete', 'collections/update',
  'collection_listings/add', 'collection_listings/remove', 'collection_listings/update',
  'customers/create', 'customers/delete', 'customers/disable', 'customers/enable', 'customers/update',
  'customer_groups/create', 'customer_groups/delete', 'customer_groups/update',
  // 'draft_orders/create', 'draft_orders/delete', 'draft_orders/update',
  // 'fulfillments/create', 'fulfillments/update',
  // 'fulfillment_events/create', 'fulfillment_events/delete',
  'orders/cancelled', 'orders/create', 'orders/delete', 'orders/fulfilled', 'orders/paid', 'orders/partially_fulfilled', 'orders/updated',
  'order_transactions/create',
  'products/create', 'products/delete', 'products/update',
  'product_listings/add', 'product_listings/remove', 'product_listings/update',
  'refunds/create',
  'app/uninstalled', 'shop/update'
  // 'themes/create', 'themes/delete', 'themes/publish', 'themes/update'
]

installWebhooks(webhooks)
  .then(() => installScripts())

function installWebhooks (webhooksToInstall) {
  return shopify.webhook.list()
    .then((hooks) => {
      const toInstall = webhooksToInstall.map((webhook) => {
        const address = `${serverGateway}webhook`
        const existing = hooks.find(hook => hook.topic === webhook)
        if (existing) {
          console.log('need to update', existing.topic)
          return null
        }
        const options = {
          format: 'json',
          topic: webhook,
          address
        }
        console.log('creating', options)
        return shopify.webhook.create(options).catch(() => {
          console.log('failed', webhook)
        })
      })
      return Promise.all(toInstall)
    })
}

function installScripts () {
  return shopify.scriptTag.list()
    .then((scripts) => {
      let s = scripts.find(script => /shoplift-analytics\.js$/.test(script.src))
      const analytics = `${serverGateway}shoplift-analytics.js`
      console.log('trying to install', analytics)
      if (s) {
        console.log('already installed', s.src)
      } else {
        return shopify.scriptTag.create({
          event: 'onload',
          src: analytics
        })
      }

      // const d3 = `https://d3js.org/d3.v4.min.js`
      // s = scripts.find(script => /d3\.v4\.min\.js$/.test(script.src))
      // console.log('trying to install', d3)
      // if (s) {
      //   console.log('already installed', s.src)
      // } else {
      //   return shopify.scriptTag.create({
      //     event: 'onload',
      //     src: d3
      //   })
      // }
    })
}
