/// <reference path="squid-hsi.ts"/>
/// <reference path="spline.ts"/>

module squid {
var svgWidth = 250;
var svgHeight = 250;
var svgMargin = 20;
var maxDepth = 25;
var xScale = d3.scale.linear()
  .domain([-1, 1])
  .range([svgMargin, svgWidth - svgMargin])
  .nice()
  ;
var yScale = d3.scale.linear()
  .domain([0, maxDepth])
  .range([svgMargin, svgHeight - svgMargin])
  .nice()
  ;
var xAxis = d3.svg.axis()
  .scale(xScale)
  .orient("top")
  .ticks(10)
  ;
var yAxis = d3.svg.axis()
  .scale(yScale)
  .orient("left")
  .ticks(10)
  ;
var line = d3.svg.line()
  .x(d => xScale(d[1]))
  .y(d => yScale(d[0]))
  ;


function drawGraph(selection, data, variable, lambda) {
  var Rs = (() => {
    var Rs = [];
    var depth;
    for (depth = 0; depth <= maxDepth; ++depth) {
      var key = variable + depth;
      var interpolator = spline.interpolator(
          data,
          d => +d[key],
          d => +d['cpue'],
          lambda);
      var y = data.map(d => +d['cpue']);
      var yPrime = data.map(d => interpolator.interpolate(+d[key]));
      Rs.push([depth, spline.correlation(y, yPrime)]);
    }
    return Rs;
  })();

  selection
    .selectAll('circle.point')
    .data(Rs)
    ;
  var transition = selection.transition();
  transition
    .selectAll('circle.point')
    .attr('cx', d => xScale(d[1]))
    ;
  transition
    .select('path.line')
    .attr('d', line(Rs))
    ;
}


function changeActivePoint(selection, selectedDepth) {
  selection
    .selectAll('circle.point')
    .style('fill', d => d[0] == selectedDepth ? 'red' : 'black')
    ;
}


app.controller('DepthRelationController', ['$scope', function($scope) {
  var cpueVar = $scope.cpueVar

  var Rs = (() => {
    var Rs = [];
    var depth;
    for (depth = 0; depth <= maxDepth; ++depth) {
      Rs.push([depth, 0]);
    }
    return Rs;
  })();

  var rootSelection = d3.select('svg#depth-relation')
    .attr({
      width: svgWidth,
      height: svgHeight
    })
    .on('click', () => {
      var pos = d3.mouse(rootSelection.node());
      var depth = Math.floor((pos[1] - svgMargin) / (svgHeight - svgMargin * 2)* (maxDepth + 1));
      if (0 <= depth && depth <= maxDepth) {
        $scope.$apply(() => {
          $scope.$parent.selectedDepth = depth;
        });
      }
    });
  rootSelection.append('g')
    .classed('points', true)
    .selectAll('circle.point')
    .data(Rs)
    .enter()
    .append('circle')
    .classed('point', true)
    .attr({
      fill: 'black',
      r: 2,
      cx: xScale(svgMargin),
      cy: d => yScale(d[0])
    })
    .on('click', d => {
        $scope.$apply(() => {
          $scope.$parent.selectedDepth = d[0];
        });
    })
    ;

  rootSelection.append('path')
    .classed('line', true)
    .attr({
      d: line(Rs),
      fill: 'none',
      stroke: 'black'
    })
    ;

  rootSelection.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + svgMargin + ")")
    .call(xAxis);
  rootSelection.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + (svgWidth / 2) + ",0)")
    .call(yAxis);

  $scope.$watch('selectedVariable', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      drawGraph(rootSelection, cpueVar, $scope.selectedVariable, $scope.lambda);
    }
  });

  $scope.$watch('lambda', (newValue, oldValue) => {
    if (newValue !== oldValue && 0 < $scope.lambda && $scope.lambda <= 1) {
      drawGraph(rootSelection, cpueVar, $scope.selectedVariable, $scope.lambda);
    }
  });

  $scope.$watch('selectedDepth', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      changeActivePoint(rootSelection, $scope.selectedDepth);
    }
  });

  $scope.$watch('cpueVar', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      changeActivePoint(rootSelection, $scope.selectedDepth);
    }
  });

  drawGraph(rootSelection, cpueVar, $scope.selectedVariable, $scope.lambda);
  changeActivePoint(rootSelection, $scope.selectedDepth);
}]);
}
