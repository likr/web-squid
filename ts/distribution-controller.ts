/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="squid-hsi.ts"/>
/// <reference path="spline.ts"/>


module squid {
var nInterval = 100;
var svgWidth = 200;
var svgHeight = 200;
var svgMargin = 5;

function drawGraph(selection, data, key, lambda) {
  var xs = (() => {
    var xs = new Array(nInterval);
    var extent  = d3.extent(data, (d => +d[key]));
    var i;
    var d = (extent[1] - extent[0]) / nInterval;
    for (i = 0; i < nInterval; ++i) {
      xs[i] = d * i + extent[0];
    }
    return xs;
  })();

  var interpolator = spline.interpolator(
      data,
      d => +d[key],
      d => +d['cpue'],
      lambda);

  var xScale = d3.scale.linear()
    .domain(d3.extent(data, d => +d[key]))
    .range([svgMargin, svgWidth - svgMargin])
    ;
  var yScale = d3.scale.linear()
    .domain([0, d3.max(data, d => +d['cpue'])])
    .range([svgWidth - svgMargin, svgMargin])
    ;
  var line = d3.svg.line()
    .x(d => xScale(d))
    .y(d => yScale(interpolator.interpolate(d)))
    ;
  var transition = selection.transition();
  transition
    .selectAll('circle.data')
    .attr({
      cx: d => xScale(+d[key]),
      cy: d => yScale(+d['cpue'])
    })
    ;
  transition
    .select('path.spline')
    .attr({
      d: line(xs)
    })
    ;
}


app.controller('DistributionController', ['$scope', function($scope) {
  var cpueVar = $scope.cpueVar;
  var initialY = svgHeight / 2;
  var xs = (() => {
    var xs = new Array(nInterval);
    var i;
    var d = (svgWidth - svgMargin * 2) / nInterval;
    for (i = 0; i < nInterval; ++i) {
      xs[i] = d * i;
    }
    return xs;
  })();
  var yScale = d3.scale.linear()
    .domain([0, d3.max(cpueVar, d => +d['cpue'])])
    .range([svgWidth - svgMargin, svgMargin])
    ;
  var rootSelection = d3.select('svg#distribution')
    .attr({
      width: svgWidth,
      height: svgHeight
    });
  rootSelection
    .selectAll('circle.data')
    .data(cpueVar)
    .enter()
    .append('circle')
    .classed('data', true)
    .attr({
      fill: 'black',
      r: 1,
      cx: 0,
      cy: d => yScale(d.cpue)
    })
    ;
  var line = d3.svg.line()
    .x(d => d)
    .y(d => initialY)
    ;
  rootSelection
    .append('path')
    .classed('spline', true)
    .attr({
      d: line(xs),
      fill: 'none',
      stroke: 'red'
    })
    ;

  function draw() {
    var xKey = $scope.selectedVariable + $scope.selectedDepth;
    drawGraph(rootSelection, cpueVar, xKey, $scope.lambda);
  }

  $scope.$watch('selectedVariable', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      draw();
    }
  });

  $scope.$watch('selectedDepth', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      draw();
    }
  });

  $scope.$watch('lambda', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      if (0 < $scope.lambda && $scope.lambda <= 1) {
        draw();
      }
    }
  });

  draw();
}]);
}
