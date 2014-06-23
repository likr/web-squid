/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../typings/d3/d3.d.ts"/>
/// <reference path="../data-manager.ts"/>
/// <reference path="../spline.ts"/>

module squid {
var svgMargin = 20;
var maxDepth = 30;

export class CorrelationRenderer {
  private DataManager : DataManager;
  private cpuePoints : any[];
  private rootSelection : D3.Selection;
  private svgWidth : number;
  private svgHeight : number;
  private xScale : D3.Scale.Scale;
  private yScale : D3.Scale.Scale;
  private line : D3.Svg.Line;
  public depthSelected : (depth : number) => void;

  constructor(selector : string, width : number, height : number) {
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
    this.cpuePoints = this.DataManager.getCPUE();

    this.xScale = d3.scale.linear()
      .domain([-1, 1])
      .range([svgMargin, this.svgWidth - svgMargin])
      .nice()
      ;
    this.yScale = d3.scale.linear()
      .domain([0, maxDepth])
      .range([svgMargin, this.svgHeight - svgMargin])
      .nice()
      ;
    var xAxis = d3.svg.axis()
      .scale(this.xScale)
      .orient("top")
      .ticks(10)
      ;
    var yAxis = d3.svg.axis()
      .scale(this.yScale)
      .orient("left")
      .ticks(10)
      ;
    this.line = d3.svg.line()
      .x(d => this.xScale(d[1]))
      .y(d => this.yScale(d[0]))
      ;

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
        cy: d => this.yScale(d[0])
      })
      .on('click', d => {
        if (this.depthSelected) {
          this.depthSelected(d[0]);
        }
      })
      ;

    this.rootSelection.append('path')
      .classed('line', true)
      .attr({
        d: this.line(Rs),
        fill: 'none',
        stroke: 'black'
      })
      ;

    this.rootSelection.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + svgMargin + ")")
      .call(xAxis);
    this.rootSelection.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(" + (this.svgWidth / 2) + ",0)")
      .call(yAxis);
  }

  draw(variableName : string, lambda : number) {
    var Rs = (() => {
      var Rs = [];
      var depth;
      for (depth = 0; depth <= maxDepth; ++depth) {
        var key = variableName + depth;
        var dat = this.cpuePoints.filter(d => d[key] != 0);
        var interpolator = spline.interpolator(
            dat,
            d => +d[key],
            d => +d['cpue'],
            lambda);
        var y = dat.map(d => +d['cpue']);
        var yPrime = dat.map(d => interpolator.interpolate(+d[key]));
        Rs.push([depth, spline.correlation(y, yPrime)]);
      }
      return Rs;
    })();

    this.rootSelection
      .selectAll('circle.point')
      .data(Rs)
      ;
    var transition = this.rootSelection.transition();
    transition
      .selectAll('circle.point')
      .attr('cx', d => this.xScale(d[1]))
      ;
    transition
      .select('path.line')
      .attr('d', this.line(Rs))
      ;
  }

  activate(depth) {
    this.rootSelection
      .selectAll('circle.point')
      .style('fill', d => d[0] == depth ? 'red' : 'black')
      ;
  }
}

export interface CorrelationRendererClass {
  new (selector : string, width : number, height : number) : CorrelationRenderer;
}

export function CorrelationRendererFactory(DataManager : DataManager) : CorrelationRendererClass {
  function Wrapper() {
    this.DataManager = DataManager;
    CorrelationRenderer.apply(this, arguments);
  }
  Wrapper.prototype = CorrelationRenderer.prototype;
  return <any>Wrapper;
}
CorrelationRendererFactory.$inject = ['DataManager'];
}
