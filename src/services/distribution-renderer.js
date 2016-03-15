import angular from 'angular'
import d3 from 'd3'
import {interpolator} from './spline'

const modName = 'squid-hsi.services.distribution-renderer';

const nInterval = 100;
const svgMargin = 40;

angular.module(modName, []).factory('DistributionRenderer', (DataManager) => {
  return class DistributionRenderer {
    constructor(selector, width, height) {
      this.rootSelection = d3.select(selector).append('svg');
      this.svgWidth = width;
      this.svgHeight = height;
      this.rootSelection.attr({
        width: this.svgWidth,
        height: this.svgHeight,
      });
      this.cpuePoints = DataManager.getCPUE();

      var initialY = this.svgHeight / 2;
      var xs = (() => {
        var xs = new Array(nInterval);
        var i;
        var d = (this.svgWidth - svgMargin * 2) / nInterval;
        for (i = 0; i < nInterval; ++i) {
          xs[i] = d * i;
        }
        return xs;
      })();
      var xScale = d3.scale.linear();
      var yScale = d3.scale.linear()
        .domain(d3.extent(this.cpuePoints, d => +d.cpue))
        .range([this.svgWidth - svgMargin, svgMargin])
        ;
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(10);
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(10);
      var line = d3.svg.line()
        .x((d) => d)
        .y(() => initialY);

      this.rootSelection
        .append('g')
        .classed('points', true);
      this.rootSelection
        .append('path')
        .classed('spline', true)
        .attr({
          d: line(xs),
          fill: 'none',
          stroke: 'red',
        });
      this.rootSelection
        .append("g")
        .classed('axis x-axis', true)
        .attr("transform", "translate(0," + (this.svgHeight - svgMargin) + ")")
        .call(xAxis);
      this.rootSelection
        .append("g")
        .classed('axis y-axis', true)
        .attr("transform", "translate(" + svgMargin + ",0)")
        .call(yAxis);
    }

    draw(key, lambda) {
      var data = this.cpuePoints.filter(d => d[key] != 0);
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

      var spline = interpolator(data, (d) => +d[key], (d) => +d['cpue'], lambda);

      var xScale = d3.scale.linear()
        .domain(d3.extent(data, d => +d[key]))
        .range([svgMargin, this.svgWidth - svgMargin]);
      var yScale = d3.scale.linear()
        .domain(d3.extent(data, d => +d['cpue']))
        .range([this.svgWidth - svgMargin, svgMargin]);
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
        .y(d => yScale(spline.interpolate(d)));
      this.rootSelection
        .select('g.points')
        .selectAll('circle.data')
        .data(data, d => d.id)
        .call((selection) => {
          selection.enter()
            .append('circle')
            .classed('data', true)
            .attr({
              fill: 'black',
              opacity: 0.3,
              r: 1,
              cx: 0,
              cy: d => yScale(d.cpue),
            });
          selection.exit()
            .remove();
        });
      var transition = this.rootSelection.transition();
      transition
        .selectAll('circle.data')
        .attr({
          cx: d => xScale(+d[key]),
          cy: d => yScale(+d['cpue']),
        });
      transition
        .select('path.spline')
        .attr({
          d: line(xs),
        });
      transition
        .select('g.x-axis')
        .call(xAxis);
      transition
        .select('g.y-axis')
        .call(yAxis);
    }
  }
});

export default modName
