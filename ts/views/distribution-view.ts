/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../typings/d3/d3.d.ts"/>
/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../data-manager.ts"/>
/// <reference path="../spline.ts"/>

module squid {
var nInterval = 100;
var svgMargin = 40;


export class DistributionRenderer {
  private DataManager : DataManager;
  private cpuePoints : any[];
  private rootSelection : D3.Selection;
  private svgWidth : number;
  private svgHeight : number;

  constructor(selector : string) {
    this.rootSelection = d3.select(selector).append('svg');
    this.svgWidth = this.svgHeight = Math.min($(selector).width(), $(selector).height());
    this.rootSelection.attr({
      width: this.svgWidth,
      height: this.svgHeight,
    });
    this.cpuePoints = this.DataManager.getCPUE();

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
      .x(d => d)
      .y(d => initialY)
      ;

    this.rootSelection
      .append('g')
      .classed('points', true)
      ;
    this.rootSelection
      .append('path')
      .classed('spline', true)
      .attr({
        d: line(xs),
        fill: 'none',
        stroke: 'red'
      })
      ;
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

  draw(key : string, lambda : number) {
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

    var interpolator = spline.interpolator(
        data,
        d => +d[key],
        d => +d['cpue'],
        lambda);

    var xScale = d3.scale.linear()
      .domain(d3.extent(data, d => +d[key]))
      .range([svgMargin, this.svgWidth - svgMargin])
      ;
    var yScale = d3.scale.linear()
      .domain(d3.extent(data, d => +d['cpue']))
      .range([this.svgWidth - svgMargin, svgMargin])
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
    this.rootSelection
      .select('g.points')
      .selectAll('circle.data')
      .data(data, d => d.id)
      .call((selection : D3.UpdateSelection) => {
        selection.enter()
          .append('circle')
          .classed('data', true)
          .attr({
            fill: 'black',
            opacity: 0.3,
            r: 1,
            cx: 0,
            cy: d => yScale(d.cpue)
          })
          ;
        selection.exit()
          .remove()
          ;
      });
    var transition = this.rootSelection.transition();
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
}

export interface DistributionRendererClass {
  new (selector : string) : DistributionRenderer;
}

export function DistributionRendererFactory(DataManager : DataManager) : DistributionRendererClass {
  function Wrapper() {
    this.DataManager = DataManager;
    DistributionRenderer.apply(this, arguments);
  }
  Wrapper.prototype = DistributionRenderer.prototype;
  return <any>Wrapper;
}
DistributionRendererFactory.$inject = ['DataManager']
}
