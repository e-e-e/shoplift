import * as d3 from 'd3'
import $ from 'jquery'

export default function () {
  var svgRoot
  var maskRect
  var mask
  var letterSpacing = 8
  var padding = 5
  var quotes = []

  buildSvg()

  $('blockquote').each(extractBlockquotes)
  console.log(quotes)
  if (quotes && quotes.length > 0) {
    fadeIn()
    $('#shoplift-svg').click(function () {
      mask.selectAll('text')
        .interrupt('waiting')
        .interrupt('entering')
    })
  }

  function buildSvg () {
    if (!svgRoot) {
      svgRoot = d3.select('body').append('svg')

      mask = svgRoot
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

      svgRoot
        .attr('id', 'shoplift-svg')
        .style('width', '100%')
        .style('height', '100%')
        .style('position', 'fixed')
        .style('z-index', '999999999')
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

  function appendTextElement () {
    return mask.append('text')
      // .attr('id', 'shoplift-text')
      .attr('x', padding + '%')
      .attr('y', '20%')
      .text(null)
      .style('font-family', 'sans-serif')
      .style('letter-spacing', letterSpacing + 'px')
      .style('fill', '#000')
      .style('font-size', '5.2em')
      .style('font-weight', '900')
      .style('text-transform', 'uppercase')
  }

  function extractBlockquotes (index, blockquote) {
    $(blockquote).children()
      .each(function (i, child) {
        var html = $(child).html()
        var broken = html.split(/<br>|<br\/>/)
        // console.log(html, broken)
        for (var s = 0; s < broken.length; s++) {
          quotes.push(broken[s])
        }
      })
      .parent()
      .remove()
  }

  function fadeIn () {
    svgRoot.style('display', 'initial')
    // wrap(calcTextWidth())
    maskRect
      .transition()
      .delay(1000)
      .duration(3500)
      .ease(d3.easePolyIn)
      .style('fill', '#FFF')

    setTimeout(processNextQuote, 4000)
  }

  function fadeOut () {
    // wrap(calcTextWidth())
    maskRect
      .transition()
      .duration(5000)
      .ease(d3.easePolyOut)
      .style('fill', '#000')
      .on('end', function () {
        svgRoot.style('display', 'none')
      })
  }

  function processNextQuote () {
    var quote = quotes.shift()
    if (quote !== undefined) {
      console.log('quotes', quote)
      // hide text
      var text = appendTextElement()
      var exitFn = exitText(text)
      // calculate fit
      var wordCount = wrapping(text, quote, calcTextWidth())
      text.style('fill', '#FFF')
        .transition('entering')
        .duration(500)
        .style('fill', '#000')
        .attrTween('transform', slide(1))
        .on('interrupt', exitFn)
        .transition('waiting')
        .duration(340 * wordCount)
        .on('end interrupt', exitFn)
        // .on('', exitFn)
    } else {
      fadeOut()
    }
  }

  function exitText (text) {
    return function () {
      // console.log('interupted')
      processNextQuote()
      text.transition()
        .duration(500)
        .style('fill', '#FFF')
        .attrTween('transform', slide(-1))
        .on('end', function () {
          text.text(null).remove()
        })
    }
  }

  function slide (direction) {
    var interp = (direction > 0) ? d3.easePolyOut : d3.easePolyOut
    return function () {
      var height = $(window).height()
      return function (t) {
        var value = interp(t)
        if (direction > 0) {
          value = 1.0 - value
        } else {
          value *= -1
        }
        return 'translate(0 , ' + (value * height) + ')'
      }
    }
  }

  function calcTextWidth () {
    return $(window).width() * ((100 - (padding * 2)) / 100)
  }

  function wrapping (text, quote, width) {
    var words = quote.split(/\s+/).reverse()
    var count = words.length
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
      var sentence = line.join(' ')
      tspan.text(sentence)
      var computedLength = tspan.node().getComputedTextLength() + (letterSpacing * sentence.length)
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
    return count
  }
}
