/// <reference path="spline.ts"/>

module squid {
export class SI {
  public active = true;
  private interpolator;
  private scale;

  constructor(CPUEs, public variableName, public depthIndex, public lambda) {
    var key = variableName + depthIndex;
    this.interpolator = spline.interpolator(
        CPUEs,
        d => d[key],
        d => d.cpue,
        lambda);
    this.scale = d3.scale.linear()
      .domain([this.interpolator.min(), this.interpolator.max()])
      .range([0, 1]);
  }

  call(x : number) : number {
    if (x == 0) {
      return NaN;
    } else {
      var v = this.scale(this.interpolator.interpolate(x));
      if (v > 1) {
        return 1;
      } else if (v < 0) {
        return 0;
      } else {
        return v;
      }
    }
  }
}


export class SIManager {
  static $inject = [];
  public SIs : SI[] = [];
  public currentSI : SI;

  constructor() {
  }
}
}
