import angular from 'angular'
import d3 from 'd3'
import {interpolator} from './spline'

class SI {
  constructor(CPUEs, variableName_, depthIndex_, lambda_) {
    this.active = true;
    this.CPUEs = CPUEs;
    this.variableName_ = variableName_;
    this.depthIndex_ = depthIndex_;
    this.lambda_ = lambda_;
    this.interpolate();
  }

  get variableName() {
    return this.variableName_;
  }

  set variableName(value) {
    this.variableName_ = value;
    this.interpolate();
  }

  get depthIndex() {
    return this.depthIndex_;
  }

  set depthIndex(value) {
    this.depthIndex_ = value;
    this.interpolate();
  }

  get lambda() {
    return this.lambda_;
  }

  set lambda(value) {
    this.lambda_ = value;
    this.interpolate();
  }

  call(x) {
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

  interpolate() {
    var key = this.variableName_ + this.depthIndex_;
    this.interpolator = interpolator(this.CPUEs, (d) => d[key], (d) => d.cpue, this.lambda_);
    this.scale = d3.scale.linear()
      .domain([this.interpolator.min(), this.interpolator.max()])
      .range([0, 1]);
  }
}

class SIManager {
  constructor(DataManager) {
    this.DataManager = DataManager;
    this.SIs = [];
  }

  createSI(variableName, depthIndex, lambda) {
    return new SI(this.DataManager.CPUEPoints, variableName, depthIndex, lambda);
  }

  registerSI(SI) {
    this.SIs.push(SI);
  }
}

const modName = 'squid-hsi.services.si-manager';

angular.module(modName, []).service('SIManager', SIManager);

export default modName
