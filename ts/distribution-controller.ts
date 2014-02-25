/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="squid-hsi.ts"/>
/// <reference path="spline.ts"/>


module squid {
app.controller('DistributionController', ['$scope', function($scope) {
  var cpueVar = $scope.cpueVar;
  var yKey = 'cpue';
  var xKey = $scope.selectedVariable + $scope.selectedDepth;
  cpueVar.sort(function(d1, d2) {
    return d1[xKey] - d2[xKey];
  });
  var extent  = d3.extent(cpueVar, (d => +d[xKey]));
  var xs = [];
  for (var x = extent[0]; x < extent[1]; x += (extent[1] - extent[0]) / 100) {
    xs.push(x);
  }

  var interpolator = spline.splineInterpolator(
    cpueVar,
    function(d) {
      return +d[xKey];
    },
    function(d) {
      return +d[yKey];
    },
    0.5);

  var xScale = d3.scale.linear()
    .domain(d3.extent(cpueVar, function(d) {
      return +d[xKey];
    }))
    .range([5, 195])
    ;
  var yScale = d3.scale.linear()
    .domain([0, d3.max(cpueVar, function(d) {
      return +d[yKey];
    })])
    .range([195, 5])
    ;
  var rootSelection = d3.select('svg#distribution')
    .attr({
      width: 200,
      height: 200
    });
  rootSelection
    .selectAll('circle.data')
    .data(xs)
    .enter()
    .append('circle')
    .classed('data', true)
    .attr({
      fill: 'red',
      r: 1,
      cx: function(x) {return xScale(x);},
      cy: function(x) {return yScale(interpolator(x));}
    })
    ;
  rootSelection
    .selectAll('circle.guide')
    .data(cpueVar)
    .enter()
    .append('circle')
    .classed('guide', true)
    .attr({
      fill: 'black',
      r: 1,
      cx: function(d) {return xScale(d[xKey]);},
      cy: function(d) {return yScale(d[yKey]);}
    })
    ;
  var line = d3.svg.line();
  line.x(function(d) {return xScale(d);});
  line.y(function(d) {return yScale(interpolator(d));});
  rootSelection
    .append('path')
    .attr({
      d: line(xs),
      fill: 'none',
      stroke: 'red'
    })
    ;
}]);
}
