/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="squid-hsi.ts"/>
/// <reference path="spline.ts"/>


module squid {
var nInterval = 100;
var svgWidth = 184;
var svgHeight = 184;
var svgMargin = 20;

function drawGraph(selection, data, key, lambda) {
  data = data.filter(d => d[key] != 0);
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
  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("botom")
    .ticks(10);
  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(10);
  var line = d3.svg.line()
    .x(d => xScale(d))
    .y(d => yScale(interpolator.interpolate(d)))
    ;
  selection
    .select('g.points')
    .selectAll('circle.data')
    .data(data, d => d.id)
    .call(selection => {
      selection.enter()
        .append('circle')
        .classed('data', true)
        .attr({
          fill: 'black',
          r: 1,
          cx: 0,
          cy: d => yScale(d.cpue)
        })
        ;
      selection.exit()
        .remove()
        ;
    });
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
  transition
    .select('g.x-axis')
    .call(xAxis);
  transition
    .select('g.y-axis')
    .call(yAxis);
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
  var xScale = d3.scale.linear();
  var yScale = d3.scale.linear()
    .domain([0, d3.max(cpueVar, d => +d['cpue'])])
    .range([svgWidth - svgMargin, svgMargin])
    ;
  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .ticks(10);
  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(10);
  var rootSelection = d3.select('svg#distribution')
    .attr({
      width: svgWidth,
      height: svgHeight
    });
  var line = d3.svg.line()
    .x(d => d)
    .y(d => initialY)
    ;
  rootSelection
    .append('g')
    .classed('points', true)
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

  rootSelection.append("g")
    .classed('axis x-axis', true)
    .attr("transform", "translate(0," + (svgHeight - svgMargin) + ")")
    .call(xAxis);
  rootSelection.append("g")
    .classed('axis y-axis', true)
    .attr("transform", "translate(" + svgMargin + ",0)")
    .call(yAxis);

  function draw() {
    var xKey = $scope.selectedVariable + $scope.selectedDepth;
    drawGraph(rootSelection, $scope.cpueVar, xKey, $scope.lambda);
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

  $scope.$watch('cpueVar', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      draw();
    }
  });

  draw();
}]);
}
