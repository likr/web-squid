/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="typings/angularjs/angular.d.ts"/>

function quincunx(u, v, w, q) {
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


function smoothingSpline(S, sigma, lambda, x, y) {
  var n = S.length - 1;
  var h = new Array(n + 1);
  var r = new Array(n + 1);
  var f = new Array(n + 1);
  var p = new Array(n + 1);
  var q = new Array(n + 1);
  var u = new Array(n + 1);
  var v = new Array(n + 1);
  var w = new Array(n + 1);
  var params = S.map(function() {
    return [0, 0, 0, 0];
  });
  var i;

  var mu = 2 * (1 - lambda) / (3 * lambda);
  for (i = 0; i < n; ++i) {
    h[i] = x(S[i + 1]) - x(S[i]);
    r[i] = 3 / h[i];
  }
  for (i = 1; i < n; ++i) {
    f[i] = -(r[i - 1] + r[i]);
    p[i] = 2 * (x(S[i + 1]) - x(S[i - 1]));
    q[i] = 3 * (y(S[i + 1]) - y(S[i])) / h[i] - 3 * (y(S[i]) - y(S[i - 1])) / h[i - 1];
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

  params[0][3] = y(S[0]) - mu * r[0] * q[1] * sigma[0];
  params[1][3] = y(S[1]) - mu * (f[1] * q[1] + r[1] * q[2]) * sigma[0];
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
    params[i][3] = y(S[i]) - mu * params[i][3] * sigma[i];
  }
  return params;
}


function splineInterpolator(S, xAccessor, yAccessor, lambda) {
  var sigma = S.map(function() {
    return 1;
  });
  var params = smoothingSpline(S, sigma, lambda, xAccessor, yAccessor);
  return function(x) {
    var i = d3.bisector(xAccessor).right(S, x) - 1;
    if (i >= S.length - 1) {
      i = S.length - 2;
    }
    var a = params[i][0],
        b = params[i][1],
        c = params[i][2],
        d = params[i][3];
    x = x - xAccessor(S[i]);
    return a * x * x * x + b * x * x + c * x + d;
  };
}


function correlation(x, y) {
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


module squid {
export var app = angular.module('squid-hsi', ['ngRoute'])
  .factory('d3get', ['$q', function($q) {
    return function(xhr) {
      var deferred = $q.defer();
      xhr
        .on('load', function(data) {
          deferred.resolve(data);
        })
        .on('error', function(ststus) {
          deferred.reject(status);
        })
        .get()
        ;
      return deferred.promise;
    };
  }])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/', {
        controller: 'MainController',
        templateUrl: 'partials/main.html',
        resolve: {
          cpueVar: ['d3get', function(d3get) {
            return d3get(d3.csv('cpue-var.csv'));
          }]
        }
      })
      ;
  }])
  .controller('MainController', ['$scope', 'cpueVar', function($scope, cpueVar) {
    var xKey = 'S0';
    cpueVar.sort(function(d1, d2) {
      return d1[xKey] - d2[xKey];
    });

    $scope.cpueVar = cpueVar;
  }])
  .controller('DistributionController', ['$scope', function($scope) {
    var cpueVar = $scope.cpueVar;
    var yKey = 'cpue';
    var xKey = $scope.selectedVariable + $scope.selectedDepth;
    cpueVar.sort(function(d1, d2) {
      return d1[xKey] - d2[xKey];
    });
    //var data = [
    //  [  0,   0],
    //  [ 50, 200],
    //  [100,   0],
    //  [150, 200],
    //  [200,   0]
    //];
    //var xs = [  0,  10,  20,  30,  40,  50,  60,  70,  80,  90,
    //          100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];
    var xs = [];
    for (var x = 33.57; x < 34.38; x += (34.38 - 33.57) / 100) {
      xs.push(x);
    }

    var interpolator = splineInterpolator(
      cpueVar,
      function(d) {
        return d[xKey];
      },
      function(d) {
        return d[yKey];
      },
      0.9995);

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
    //line.x(function(d) {return xScale(d[xKey]);});
    //line.y(function(d) {return yScale(d[yKey]);});
    //rootSelection
    //  .append('path')
    //  .attr({
    //    d: line(cpueVar),
    //    fill: 'none',
    //    stroke: 'black'
    //  })
    //  ;
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
  }])
  .run(['$rootScope', function($rootScope) {
    $rootScope.selectedVariable = 'S';
    $rootScope.selectedDepth = '0';
  }])
  ;
}
