/// <reference path="typings/d3/d3.d.ts"/>


module spline {
export function quincunx(u, v, w, q) {
  var n = u.length - 1;
  var i;

  v[1] = v[1] / u[1];
  w[1] = w[1] / u[1];
  u[2] = u[2] - u[1] * w[1] * w[1];
  v[2] = (v[2] - u[1] * v[1] * w[1]) / u[2];
  w[2] = w[2] / u[2];
  for (i = 3; i < n; ++i) {
    u[i] = u[i] - u[i - 2] * w[i - 2] * w[i - 2] - u[i - 1] * v[i - 1] * v[i - 1];
    v[i] = (v[i] - u[i - 1] * v[i - 1] * w[i - 1]) / u[i];
    w[i] = w[i] / u[i];
  }

  q[2] = q[2] - v[1] * q[1];
  for (i = 3; i < n; ++i) {
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


export function smoothingSpline(x, y, sigma, lambda) {
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
  for (i = 1; i < n; ++i) {
    f[i] = -(r[i - 1] + r[i]);
    p[i] = 2 * (x[i + 1] - x[i - 1]);
    q[i] = 3 * (y[i + 1] - y[i]) / h[i] - 3 * (y[i] - y[i - 1]) / h[i - 1];
  }

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
  q[0] = 0;
  q[n] = 0;
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


export function splineInterpolator(S, xAccessor, yAccessor, lambda) {
  var x0 = undefined;
  S = S.filter(d => {
    var x00 = x0;
    x0 = xAccessor(d);
    return x00 != x0;
  });
  var sigma = S.map(function() {
    return 1;
  });
  var xArray = S.map(xAccessor);
  var yArray = S.map(yAccessor);
  var params = smoothingSpline(xArray, yArray, sigma, lambda);
  return function(x) {
    var i = d3.bisectRight(xArray, x) - 1;
    if (i >= xArray.length - 1) {
      i = xArray.length - 2;
    }
    var a = params[i][0],
        b = params[i][1],
        c = params[i][2],
        d = params[i][3];
    x = x - xArray[i];
    return a * x * x * x + b * x * x + c * x + d;
  };
}


export function correlation(x, y) {
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
}
