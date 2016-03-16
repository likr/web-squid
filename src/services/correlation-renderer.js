import angular from 'angular'
import d3 from 'd3'
import {interpolator, correlation} from './spline'

const modName = 'squid-hsi.services.correlation-renderer';

const svgMargin = 20;
const maxDepth = 30;

angular.module(modName, []).factory('CorrelationRenderer', (DataManager) => {
  return class CorrelationRenderer {
    constructor(selector, width, height) {
      var Rs = (() => {
        var Rs = [];
        var depth;
        for (depth = 0; depth <= maxDepth; ++depth) {
          Rs.push([depth, 0]);
        }
        return Rs;
      })();
      this.rootSelection = d3.select(selector).append('svg');
      this.svgWidth = width;
      this.svgHeight = height;
      this.rootSelection.attr({
        width: this.svgWidth,
        height: this.svgHeight,
      });
      this.rootSelection.on('click', () => {
        var pos = d3.mouse(this.rootSelection.node());
        var depth = Math.floor((pos[1] - svgMargin) / (this.svgHeight - svgMargin * 2)* (maxDepth + 1));
        if (0 <= depth && depth <= maxDepth) {
          if (this.depthSelected) {
            this.depthSelected(depth);
          }
        }
      });
      this.cpuePoints = DataManager.getCPUE();

      this.xScale = d3.scale.linear()
        .domain([-1, 1])
        .range([svgMargin, this.svgWidth - svgMargin])
        .nice();
      this.yScale = d3.scale.linear()
        .domain([0, maxDepth])
        .range([svgMargin, this.svgHeight - svgMargin])
        .nice();
      var xAxis = d3.svg.axis()
        .scale(this.xScale)
        .orient("top")
        .ticks(10);
      var yAxis = d3.svg.axis()
        .scale(this.yScale)
        .orient("left")
        .ticks(10);
      this.line = d3.svg.line()
        .x(d => this.xScale(d[1]))
        .y(d => this.yScale(d[0]));

      this.rootSelection.append('g')
        .classed('points', true)
        .selectAll('circle.point')
        .data(Rs)
        .enter()
        .append('circle')
        .classed('point', true)
        .attr({
          fill: 'black',
          r: 2,
          cx: this.xScale(svgMargin),
          cy: d => this.yScale(d[0]),
        })
        .on('click', d => {
          if (this.depthSelected) {
            this.depthSelected(d[0]);
          }
        });

        this.rootSelection.append('path')
          .classed('line', true)
          .attr({
            d: this.line(Rs),
            fill: 'none',
            stroke: 'black',
          });

        this.rootSelection.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0," + svgMargin + ")")
          .call(xAxis);
        this.rootSelection.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(" + (this.svgWidth / 2) + ",0)")
          .call(yAxis);
    }

    draw(variableName, lambda) {
      var Rs = (() => {
        var Rs = [];
        var depth;
        for (depth = 0; depth <= maxDepth; ++depth) {
          var key = variableName + depth;
          var dat = this.cpuePoints.filter(d => d[key] != 0);
          var spline = interpolator(dat, (d) => +d[key], (d) => +d['cpue'], lambda);
          var y = dat.map(d => +d['cpue']);
          var yPrime = dat.map(d => spline.interpolate(+d[key]));
          Rs.push([depth, correlation(y, yPrime)]);
        }
        return Rs;
      })();

      this.rootSelection
        .selectAll('circle.point')
        .data(Rs);
      var transition = this.rootSelection.transition();
      transition
        .selectAll('circle.point')
        .attr('cx', d => this.xScale(d[1]));
      transition
        .select('path.line')
        .attr('d', this.line(Rs));
    }

    activate(depth) {
      this.rootSelection
        .selectAll('circle.point')
        .style('fill', d => d[0] == depth ? 'red' : 'black');
    }
  }
});

export default modName
