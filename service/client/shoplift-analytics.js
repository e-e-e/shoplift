console.log('this is working ok')

$.ajax({
  type: 'GET',
  url: '/cart.js',
  dataType: 'json',
  success: gotCart,
  error: onFail
})

function gotCart (result) {
  console.log(result)
}

function onFail (error) {
  console.log('failed call =', error)
}
