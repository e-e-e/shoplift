/* global $ */

const defaultProduct = 'privilege'

$.ajax({
  type: 'GET',
  url: '/cart.js',
  dataType: 'json',
  success: gotCart,
  error: onFail
})

function gotCart (cart) {
  if (cart.items === 0) {
    addDefaultProduct()
  }
}

function onFail (error) {
  console.error('getting cart failed', error)
}

function addDefaultProduct () {
  $.getJSON('/products/' + defaultProduct + '.js', function (product) {
    // add to cart
    $.post('/card/add.js', {
      quantity: 1,
      id: product.id
    },
    function () {
      console.log('added product:', product.title, product.id)
    })
  })
}
