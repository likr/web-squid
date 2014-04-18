/// <reference path="spline.ts"/>

module squid {
export class SI {
  public active = true;
  private interpolator;
  private scale;

  constructor(private CPUEs, private variableName_ : string, private depthIndex_ : number, private lambda_ : number) {
    this.interpolate();
  }

  get variableName() : string {
    return this.variableName_;
  }

  set variableName(value : string) {
    this.variableName_ = value;
    this.interpolate();
  }

  get depthIndex() : number {
    return this.depthIndex_;
  }

  set depthIndex(value : number) {
    this.depthIndex_ = value;
    this.interpolate();
  }

  get lambda() : number {
    return this.lambda_;
  }

  set lambda(value : number) {
    this.lambda_ = value;
    this.interpolate();
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

  private interpolate() {
    var key = this.variableName_ + this.depthIndex_;
    this.interpolator = spline.interpolator(
        this.CPUEs,
        d => d[key],
        d => d.cpue,
        this.lambda_);
    this.scale = d3.scale.linear()
      .domain([this.interpolator.min(), this.interpolator.max()])
      .range([0, 1]);
  }
}


export class SIManager {
  static $inject = ['DataManager'];
  public SIs : SI[] = [];

  constructor(private DataManager) {
  }

  createSI(variableName : string, depthIndex : number, lambda : number) {
    return new SI(this.DataManager.CPUEPoints, variableName, depthIndex, lambda);
  }

  registerSI(SI) {
    this.SIs.push(SI);
  }
}
}
