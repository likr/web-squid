/// <reference path="squid-hsi.ts"/>
/// <reference path="spline.ts"/>

module squid {
app.controller('DepthRelationController', ['$scope', function($scope) {
  var cpueVar = $scope.cpueVar
  var yKey = 'cpue';
  var maxDepth = 25;
  var xScale = d3.scale.linear()
    .domain([-1, 1])
    .range([5, 195])
    ;
  var yScale = d3.scale.linear()
    .domain([0, maxDepth])
    .range([195, 5])
    ;

  var Rs = [];
  for (var depth = 0; depth <= maxDepth; ++depth) {
    var xKey = $scope.selectedVariable + depth;
    cpueVar.sort(function(d1, d2) {
      return d1[xKey] - d2[xKey];
    });
    var interpolator = spline.splineInterpolator(
        cpueVar,
        function(d) {
          return +d[xKey];
        },
        function(d) {
          return +d[yKey];
        },
        0.9);
    var y = cpueVar.map(function(d) {
      return +d[yKey];
    });
    var yPrime = cpueVar.map(function(d) {
      return interpolator(+d[xKey]);
    });
    Rs.push([depth, spline.correlation(y, yPrime)]);
  }

  var rootSelection = d3.select('svg#depth-relation')
    .attr({
      width: 200,
      height: 200
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
      cx: function(d) {return xScale(d[1]);},
      cy: function(d) {return yScale(d[0]);}
    });

  var line = d3.svg.line()
    .x(function(d) {return xScale(d[1]);})
    .y(function(d) {return yScale(d[0]);})
    ;

  rootSelection.append('path')
    .attr({
      d: line(Rs),
      fill: 'none',
      stroke: 'black'
    })
    ;
}]);
}
