import d3 from 'd3'

function quincunx(u, v, w, q) {
  var n = u.length - 1;
  var i;

  u[0] = 0;
  v[0] = 0;
  w[0] = 0;
  v[1] = v[1] / u[1];
  w[1] = w[1] / u[1];
  for (i = 2; i < n; ++i) {
    u[i] = u[i] - u[i - 2] * w[i - 2] * w[i - 2] - u[i - 1] * v[i - 1] * v[i - 1];
    v[i] = (v[i] - u[i - 1] * v[i - 1] * w[i - 1]) / u[i];
    w[i] = w[i] / u[i];
  }

  for (i = 2; i < n; ++i) {
    q[i] = q[i] - v[i - 1] * q[i - 1] - w[i - 2] * q[i - 2]
  }
  for (i = 1; i < n; ++i) {
    q[i] = q[i] / u[i];
  }

  q[n - 2] = q[n - 2] - v[n - 2] * q[n- 1];
  for (i = n - 3; i > 0; --i) {
    q[i] = q[i] - v[i] * q[i + 1] - w[i] * q[i + 2];
  }
}


function smoothingSpline(x, y, sigma, lambda) {
  var n = x.length - 1;
  var h = new Array(n + 1);
  var r = new Array(n + 1);
  var f = new Array(n + 1);
  var p = new Array(n + 1);
  var q = new Array(n + 1);
  var u = new Array(n + 1);
  var v = new Array(n + 1);
  var w = new Array(n + 1);
  var params = x.map(function() {
    return [0, 0, 0, 0];
  });
  var i;

  var mu = 2 * (1 - lambda) / (3 * lambda);
  for (i = 0; i < n; ++i) {
    h[i] = x[i + 1] - x[i];
    r[i] = 3 / h[i];
  }
  q[0] = 0;
  for (i = 1; i < n; ++i) {
    f[i] = -(r[i - 1] + r[i]);
    p[i] = 2 * (x[i + 1] - x[i - 1]);
    q[i] = 3 * (y[i + 1] - y[i]) / h[i] - 3 * (y[i] - y[i - 1]) / h[i - 1];
  }
  q[n] = 0;

  for (i = 1; i < n; ++i) {
    u[i] = r[i - 1] * r[i - 1] * sigma[i - 1] + f[i] * f[i] * sigma[i] + r[i] * r[i] * sigma[i + 1];
    u[i] = mu * u[i] + p[i];
  }
  for (i = 1; i < n - 1; ++i) {
    v[i] = f[i] * r[i] * sigma[i] + r[i] * f[i + 1] * sigma[i + 1];
    v[i] = mu * v[i] + h[i];
  }
  for (i = 1; i < n - 2; ++i) {
    w[i] = mu * r[i] * r[i + 1] * sigma[i + 1];
  }

  quincunx(u, v, w, q);

  params[0][3] = y[0] - mu * r[0] * q[1] * sigma[0];
  params[1][3] = y[1] - mu * (f[1] * q[1] + r[1] * q[2]) * sigma[0];
  params[0][0] = q[1] / (3 * h[0]);
  params[0][1] = 0;
  params[0][2] = (params[1][3] - params[0][3]) / h[0] - q[1] * h[0] / 3;
  r[0] = 0;
  for (i = 1; i < n; ++i) {
    params[i][0] = (q[i + 1] - q[i]) / (3 * h[i]);
    params[i][1] = q[i];
    params[i][2] = (q[i] + q[i - 1]) * h[i - 1] + params[i - 1][2];
    params[i][3] = r[i - 1] * q[i - 1] + f[i] * q[i] + r[i] * q[i + 1];
    params[i][3] = y[i] - mu * params[i][3] * sigma[i];
  }
  return params;
}


class SplineInterpolator {
  // n;
  // params[][];
  // private x[];
  // private y[];

  constructor(S, xAccessor, yAccessor, lambda) {
    var xy = S
      .map(d => [+xAccessor(d), +yAccessor(d)])
      .filter(d => d[0] !== 0);
    xy.sort((d1, d2) => d1[0] - d2[0]);
    var i, n = xy.length, x, sum, count;
    var xy2 = [];
    for (i = 0, sum = 0, count = 0, x = xy[0][0]; i < n; ++i, ++count) {
      if (xy[i][0] != x) {
        xy2.push([x, sum / count]);
        x = xy[i][0];
        count = 0;
        sum = 0;
      }
      sum += xy[i][1];
    }
    xy2.push([x, sum / count]);
    var sigma = xy2.map(function() {
      return 1;
    });
    this.n = xy2.length - 1;
    this.x = xy2.map(d => d[0]);
    this.y = xy2.map(d => d[1]);
    this.params = smoothingSpline(this.x, this.y, sigma, lambda);
  }

  interpolate(v) {
    var i = d3.bisectRight(this.x, v) - 1;
    if (i < 0) {
      return this.y[0];
    }
    if (i >= this.n) {
      return this.y[this.n];
    }
    var a = this.params[i][0],
        b = this.params[i][1],
        c = this.params[i][2],
        d = this.params[i][3];
    v = v - this.x[i];
    return a * v * v * v + b * v * v + c * v + d;
  }

  max() {
    var step = 100;
    var xStart = this.x[0];
    var xStop = this.x[this.n];
    var delta = (xStop - xStart) / step;
    var maxValue = -Infinity;
    var i, x, y;
    for (i = 0, x = xStart; i < step; ++i, x += delta) {
      y = this.interpolate(x);
      if (y > maxValue) {
        maxValue = y;
      }
    }
    return maxValue;
  }

  min() {
    var step = 100;
    var xStart = this.x[0];
    var xStop = this.x[this.n];
    var delta = (xStop - xStart) / step;
    var minValue = Infinity;
    var i, x, y;
    for (i = 0, x = xStart; i < step; ++i, x += delta) {
      y = this.interpolate(x);
      if (y < minValue) {
        minValue = y;
      }
    }
    return minValue;
  }

  domain() {
    return [this.x[0], this.x[this.x.length - 1]];
  }

  range() {
    return [this.min(), this.max()];
  }

  curve(nInterval) {
    var domain = this.domain();
    var delta = (domain[1] - domain[0]) / nInterval;
    var vals = [];
    var i, x;
    for (i = 0, x = domain[0]; i < nInterval; ++i, x += delta) {
      vals[i] = [x, this.interpolate(x)];
    }
    return vals;
  }
}


export const interpolator = (S, xAccessor, yAccessor, lambda) => {
  return new SplineInterpolator(S, xAccessor, yAccessor, lambda);
}

export const correlation = (x, y) => {
  var xBar = 0,
      yBar = 0,
      sigmaXX = 0,
      sigmaYY = 0,
      sigmaXY = 0;
  var i, n = x.length;
  for (i = 0; i < n; ++i) {
    xBar += x[i];
    yBar += y[i];
  }
  xBar /= n;
  yBar /= n;
  for (i = 0; i < n; ++i) {
    sigmaXX += (x[i] - xBar) * (x[i] - xBar);
    sigmaYY += (y[i] - yBar) * (y[i] - yBar);
    sigmaXY += (x[i] - xBar) * (y[i] - yBar);
  }
  return sigmaXY / Math.sqrt(sigmaXX * sigmaYY);
}
