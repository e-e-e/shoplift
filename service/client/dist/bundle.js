(function ($) {
'use strict';

$ = $ && $.hasOwnProperty('default') ? $['default'] : $;

var addDefaultProduct = function () {
  var defaultProduct = 'privilege';

  $.ajax({
    type: 'GET',
    url: '/cart.js',
    dataType: 'json',
    success: gotCart,
    error: onFail
  });

  function gotCart (cart) {
    if (cart.items.length === 0) {
      addDefaultProduct();
    }
  }

  function onFail (error) {
    console.error('getting cart failed', error);
  }

  function addDefaultProduct () {
    var productUrl = '/products/' + defaultProduct + '.js';
    console.log('attempting to add product', productUrl);
    $.getJSON(productUrl, function (product) {
      // add to cart
      var varientId = product.variants.length ? product.variants[0].id : product.id;
      console.log('got product', product.title, varientId);
      $.post('/cart/add.js', {
        quantity: 1,
        id: varientId
      },
      function (results) {
        console.log('added product:', product.title, varientId);
        console.log('results', results);
      });
    });
  }
};

var boringBlockquotes = function () {
  var minWidth = 320;
  var maxWidth = 1024;
  var minFontSize = 24;
  var maxFontSize = 38;
  var cachedFontSize;
  var cachedWidth;

  function processText (text) {
    return text.replace(/^(\s*<p>)?([\S\s]+?\.)/gi, '$1<span style="color:rgb(250, 118, 106);">$2</span>').replace(/{([\S\s]+?)}/gi, '<span style="color:rgb(250, 118, 106);">{$1}</span>')
  }

  function getFontSize () {
    var width = $(window).width();
    if (!cachedFontSize || cachedWidth !== width) {
      cachedWidth = width;
      var ratio = ((width - minWidth) / (maxWidth - minWidth));
      if (ratio > 1) ratio = 1;
      if (ratio < 0) ratio = 0;
      cachedFontSize = minFontSize + ((maxFontSize - minFontSize) * ratio);
    }
    return cachedFontSize
  }
  // var letterSpacing = 8
  // var padding = 5
  var blockquotes = $('blockquote');
  if (blockquotes.length) {
    var container = $('<div>', {
      id: 'shoplift-container',
      css: {
        zIndex: 9999999,
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        fontFamily: 'Montserrat, HelveticaNeue, \'Helvetica Neue\', sans-serif',
        color: 'white',
        overflowY: 'scroll',
        padding: '1rem',
        letterSpacing: '2px',
        topPadding: '3rem',
        background: 'rgba(64, 71, 82, 0.9)'
      }
    });
    container.hide();
    blockquotes.appendTo(container);
    blockquotes.each(function (index, element) {
      var children = element.childNodes;
      var hasTextNode = false;
      for (var i = 0; i < children.length; i++) {
        if (children[i] && children[i].nodeType === 3) {
          // children[i].nodeValue = processText(children[i].nodeValue)
          if (children[i].nodeValue.trim()) hasTextNode = true;
        }
      }
      var block = $(element);
      var content = processText(block.html());
      if (hasTextNode) {
        block.html('<p style="color:white;margin:0;font-size:' + getFontSize() + 'px;line-height:' + getFontSize() + 'px;">' + content + '</p>');
      } else {
        block.html(content).find('*:not(span)')
          .css('color', 'white')
          .css('fontSize', getFontSize() + 'px')
          .css('lineHeight', getFontSize() + 'px')
          .css('margin', 0);
      }
    });
    $('body').append(container);
    container.fadeIn(1500);
    container.click(function () {
      container.fadeOut(1500);
    });
  }
};

addDefaultProduct();
boringBlockquotes();

}($));
