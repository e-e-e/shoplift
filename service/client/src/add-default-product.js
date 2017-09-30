import $ from 'jquery'

export default function () {
  var defaultProduct = 'privilege'

  $.ajax({
    type: 'GET',
    url: '/cart.js',
    dataType: 'json',
    success: gotCart,
    error: onFail
  })

  function gotCart (cart) {
    if (cart.items.length === 0) {
      addDefaultProduct()
    }
  }

  function onFail (error) {
    console.error('getting cart failed', error)
  }

  function addDefaultProduct () {
    var productUrl = '/products/' + defaultProduct + '.js'
    console.log('attempting to add product', productUrl)
    $.getJSON(productUrl, function (product) {
      // add to cart
      var varientId = product.variants.length ? product.variants[0].id : product.id
      console.log('got product', product.title, varientId)
      $.post('/cart/add.js', {
        quantity: 1,
        id: varientId
      },
      function (results) {
        console.log('added product:', product.title, varientId)
        console.log('results', results)
      })
    })
  }
};
