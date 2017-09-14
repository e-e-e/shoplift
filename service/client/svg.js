/* global $ d3 */
$(document).ready(start)

function start () {
  var svgRoot
  var maskRect
  var padding = 5

  buildSvg()
  $('blockquote').each(extractBlockquotes)

  function buildSvg () {
    if (!svgRoot) {
      svgRoot = d3.select('body').append('svg')

      var mask = svgRoot
        .append('defs')
        .append('mask')
        .attr('id', 'textMask')

      maskRect = mask.append('rect')
        .attr('class', 'maskAlpha')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('x', 0)
        .attr('y', 0)
        .style('fill', '#000')

      mask.append('text')
        .attr('id', 'shoplift-text')
        .attr('x', padding + '%')
        .attr('y', '20%')
        .text('Why Are We Leaving Facebook?')
        .style('font-family', 'sans-serif')
        // .style('letter-spacing', '8px') // d3 does not factor this into word wrap
        .style('font-size', '5.2em')
        .style('font-weight', '900')
        .style('text-transform', 'uppercase')

      svgRoot
        .style('width', '100%')
        .style('height', '100%')
        .style('position', 'fixed')
        .style('top', '0')
        .style('left', '0')
        .style('display', 'none')

      svgRoot.append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('x', 0)
        .attr('y', 0)
        .attr('mask', 'url(#textMask)')
        .style('fill', '#000')
    }
  }

  function extractBlockquotes (index, blockquote) {
    var quotes = []
    $(blockquote).children()
      .each(function (i, child) {
        quotes.push($(child).html())
      })
      .parent()
      .remove()
    console.log(quotes)
    // start animation loop with extracted block quotes
    // window.requestAnimationFrame(loop)
    fadeIn()
  }

  function fadeIn () {
    svgRoot.style('display', 'initial')
    wrap(calcTextWidth())
    maskRect
      .transition()
      .duration(1250)
      .ease(d3.easePolyOut)
      .style('fill', '#FFF')
  }

  // function loop (timestamp) {
  //   if (!start) start = timestamp
  //   else {
  //     svgRoot.style('display', 'initial')
  //     maskRect.style('fill', 'rgb(0,0,0)')
  //   }
  //   var progress = timestamp - start
  //   console.log(progress);
  //   // element.style.left = Math.min(progress / 10, 200) + 'px'
  //   var fade = Math.floor(Math.min(progress / 4, 255))
  //   console.log('fad', fade)
  //   maskRect.style('fill', 'rgb(' + fade + ',' + fade + ',' + fade + ')')
  //   if (fade < 255) {
  //     window.requestAnimationFrame(loop)
  //   }
  // }

  function calcTextWidth () {
    return $(window).width() * ((100 - (padding * 2)) / 100)
  }

  function wrap (width) {
    var text = d3.select('#shoplift-text')
    var words = text.text().split(/\s+/).reverse()
    var word = words.pop()
    var line = []
    var lineNumber = 0
    var lineHeight = 0.9 // ems
    var y = text.attr('y')
    var x = text.attr('x')
    var dy = parseFloat(text.attr('dy')) || 0
    var tspan = text
      .text(null)
      .append('tspan')
      .attr('x', x)
      .attr('y', y)
      .attr('dy', dy + 'em')
    while (word) {
      line.push(word)
      tspan.text(line.join(' '))
      var computedLength = tspan.node().getComputedTextLength()
      console.log(computedLength, width)
      if (computedLength > width) {
        line.pop()
        tspan.text(line.join(' '))
        line = [word]
        lineNumber++
        var newOffset = (lineHeight * lineNumber) + dy
        tspan = text.append('tspan')
          .attr('x', x)
          .attr('y', y)
          .attr('dy', newOffset + 'em')
          .text(word)
      }
      word = words.pop()
    }
  }
}
