/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="typings/angularjs/angular.d.ts"/>
var squid;
(function (squid) {
    squid.app = angular.module('squid-hsi', ['ngRoute', 'ui.date']).factory('d3get', [
        '$q', function ($q) {
            return function (xhr) {
                var deferred = $q.defer();
                xhr.on('load', function (data) {
                    deferred.resolve(data);
                }).on('error', function (ststus) {
                    deferred.reject(status);
                }).get();
                return deferred.promise;
            };
        }]).filter('variableName', [function () {
            return function (variable) {
                switch (variable) {
                    case 'S':
                        return 'Salinity';
                    case 'T':
                        return 'Temperature';
                    case 'U':
                        return 'Horizontal Velocity (Lat.)';
                    case 'V':
                        return 'Horizontal Velocity (Lon.)';
                    case 'W':
                        return 'Vertical Velocity';
                    case 'HM':
                        return 'Sea Surface Height';
                    default:
                        return '';
                }
            };
        }]).config([
        '$routeProvider', function ($routeProvider) {
            $routeProvider.when('/', {
                controller: 'MainController',
                templateUrl: 'partials/main.html',
                resolve: {
                    cpueVar: [
                        'd3get', function (d3get) {
                            var id = 0;
                            return d3get(d3.csv('cpue-var.csv').row(function (d) {
                                var obj = {
                                    id: id++,
                                    x: +d.x,
                                    y: +d.y,
                                    date: new Date(d.stopDate),
                                    cpue: +d.cpue,
                                    HM0: +d.HM0
                                };
                                ['S', 'T', 'U', 'V', 'W'].forEach(function (v) {
                                    var i;
                                    for (i = 0; i < 54; ++i) {
                                        obj[v + i] = +d[v + i];
                                    }
                                });
                                return obj;
                            }));
                        }]
                }
            });
        }]);
})(squid || (squid = {}));
/// <reference path="typings/d3/d3.d.ts"/>
var spline;
(function (spline) {
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
            q[i] = q[i] - v[i - 1] * q[i - 1] - w[i - 2] * q[i - 2];
        }
        for (i = 1; i < n; ++i) {
            q[i] = q[i] / u[i];
        }

        q[n - 2] = q[n - 2] - v[n - 2] * q[n - 1];
        for (i = n - 3; i > 0; --i) {
            q[i] = q[i] - v[i] * q[i + 1] - w[i] * q[i + 2];
        }
    }
    spline.quincunx = quincunx;

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
        var params = x.map(function () {
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
    spline.smoothingSpline = smoothingSpline;

    var SplineInterpolator = (function () {
        function SplineInterpolator(S, xAccessor, yAccessor, lambda) {
            var xy = S.map(function (d) {
                return [+xAccessor(d), +yAccessor(d)];
            });
            xy.sort(function (d1, d2) {
                return d1[0] - d2[0];
            });
            var x0 = undefined;
            xy = xy.filter(function (d) {
                var x00 = x0;
                x0 = d[0];
                return x00 != x0;
            });
            var sigma = xy.map(function () {
                return 1;
            });
            this.n = xy.length - 1;
            this.x = xy.map(function (d) {
                return d[0];
            });
            this.y = xy.map(function (d) {
                return d[1];
            });
            this.params = smoothingSpline(this.x, this.y, sigma, lambda);
        }
        SplineInterpolator.prototype.interpolate = function (v) {
            var i = d3.bisectRight(this.x, v) - 1;
            if (i < 0) {
                return this.y[0];
            }
            if (i >= this.n) {
                return this.y[this.n];
            }
            var a = this.params[i][0], b = this.params[i][1], c = this.params[i][2], d = this.params[i][3];
            v = v - this.x[i];
            return a * v * v * v + b * v * v + c * v + d;
        };

        SplineInterpolator.prototype.max = function () {
            return d3.max(this.y);
        };
        return SplineInterpolator;
    })();
    spline.SplineInterpolator = SplineInterpolator;

    function interpolator(S, xAccessor, yAccessor, lambda) {
        return new SplineInterpolator(S, xAccessor, yAccessor, lambda);
    }
    spline.interpolator = interpolator;

    function correlation(x, y) {
        var xBar = 0, yBar = 0, sigmaXX = 0, sigmaYY = 0, sigmaXY = 0;
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
    spline.correlation = correlation;
})(spline || (spline = {}));
/// <reference path="squid-hsi.ts"/>
/// <reference path="spline.ts"/>
var squid;
(function (squid) {
    var svgWidth = 184;
    var svgHeight = 184;
    var svgMargin = 20;
    var maxDepth = 25;
    var xScale = d3.scale.linear().domain([-1, 1]).range([svgMargin, svgWidth - svgMargin]).nice();
    var yScale = d3.scale.linear().domain([0, maxDepth]).range([svgMargin, svgHeight - svgMargin]).nice();
    var xAxis = d3.svg.axis().scale(xScale).orient("top").ticks(10);
    var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(10);
    var line = d3.svg.line().x(function (d) {
        return xScale(d[1]);
    }).y(function (d) {
        return yScale(d[0]);
    });

    function drawGraph(selection, data, variable, lambda) {
        var Rs = (function () {
            var Rs = [];
            var depth;
            for (depth = 0; depth <= maxDepth; ++depth) {
                var key = variable + depth;
                var interpolator = spline.interpolator(data, function (d) {
                    return +d[key];
                }, function (d) {
                    return +d['cpue'];
                }, lambda);
                var y = data.map(function (d) {
                    return +d['cpue'];
                });
                var yPrime = data.map(function (d) {
                    return interpolator.interpolate(+d[key]);
                });
                Rs.push([depth, spline.correlation(y, yPrime)]);
            }
            return Rs;
        })();

        selection.selectAll('circle.point').data(Rs);
        var transition = selection.transition();
        transition.selectAll('circle.point').attr('cx', function (d) {
            return xScale(d[1]);
        });
        transition.select('path.line').attr('d', line(Rs));
    }

    function changeActivePoint(selection, selectedDepth) {
        selection.selectAll('circle.point').style('fill', function (d) {
            return d[0] == selectedDepth ? 'red' : 'black';
        });
    }

    squid.app.controller('DepthRelationController', [
        '$scope', function ($scope) {
            var cpueVar = $scope.cpueVar;

            var Rs = (function () {
                var Rs = [];
                var depth;
                for (depth = 0; depth <= maxDepth; ++depth) {
                    Rs.push([depth, 0]);
                }
                return Rs;
            })();

            var rootSelection = d3.select('svg#depth-relation').attr({
                width: svgWidth,
                height: svgHeight
            }).on('click', function () {
                var pos = d3.mouse(rootSelection.node());
                var depth = Math.floor((pos[1] - svgMargin) / (svgHeight - svgMargin * 2) * (maxDepth + 1));
                if (0 <= depth && depth <= maxDepth) {
                    $scope.$apply(function () {
                        $scope.$parent.selectedDepth = depth;
                    });
                }
            });
            rootSelection.append('g').classed('points', true).selectAll('circle.point').data(Rs).enter().append('circle').classed('point', true).attr({
                fill: 'black',
                r: 2,
                cx: xScale(svgMargin),
                cy: function (d) {
                    return yScale(d[0]);
                }
            }).on('click', function (d) {
                $scope.$apply(function () {
                    $scope.$parent.selectedDepth = d[0];
                });
            });

            rootSelection.append('path').classed('line', true).attr({
                d: line(Rs),
                fill: 'none',
                stroke: 'black'
            });

            rootSelection.append("g").attr("class", "axis").attr("transform", "translate(0," + svgMargin + ")").call(xAxis);
            rootSelection.append("g").attr("class", "axis").attr("transform", "translate(" + (svgWidth / 2) + ",0)").call(yAxis);

            $scope.$watch('selectedVariable', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    drawGraph(rootSelection, cpueVar, $scope.selectedVariable, $scope.lambda);
                }
            });

            $scope.$watch('lambda', function (newValue, oldValue) {
                if (newValue !== oldValue && 0 < $scope.lambda && $scope.lambda <= 1) {
                    drawGraph(rootSelection, cpueVar, $scope.selectedVariable, $scope.lambda);
                }
            });

            $scope.$watch('selectedDepth', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    changeActivePoint(rootSelection, $scope.selectedDepth);
                }
            });

            $scope.$watch('cpueVar', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    changeActivePoint(rootSelection, $scope.selectedDepth);
                }
            });

            drawGraph(rootSelection, cpueVar, $scope.selectedVariable, $scope.lambda);
            changeActivePoint(rootSelection, $scope.selectedDepth);
        }]);
})(squid || (squid = {}));
/// <reference path="typings/d3/d3.d.ts"/>
/// <reference path="squid-hsi.ts"/>
/// <reference path="spline.ts"/>
var squid;
(function (squid) {
    var nInterval = 100;
    var svgWidth = 184;
    var svgHeight = 184;
    var svgMargin = 20;

    function drawGraph(selection, data, key, lambda) {
        var xs = (function () {
            var xs = new Array(nInterval);
            var extent = d3.extent(data, (function (d) {
                return +d[key];
            }));
            var i;
            var d = (extent[1] - extent[0]) / nInterval;
            for (i = 0; i < nInterval; ++i) {
                xs[i] = d * i + extent[0];
            }
            return xs;
        })();

        var interpolator = spline.interpolator(data, function (d) {
            return +d[key];
        }, function (d) {
            return +d['cpue'];
        }, lambda);

        var xScale = d3.scale.linear().domain(d3.extent(data, function (d) {
            return +d[key];
        })).range([svgMargin, svgWidth - svgMargin]);
        var yScale = d3.scale.linear().domain([0, d3.max(data, function (d) {
                return +d['cpue'];
            })]).range([svgWidth - svgMargin, svgMargin]);
        var xAxis = d3.svg.axis().scale(xScale).orient("botom").ticks(10);
        var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(10);
        var line = d3.svg.line().x(function (d) {
            return xScale(d);
        }).y(function (d) {
            return yScale(interpolator.interpolate(d));
        });
        selection.selectAll('circle.data').data(data, function (d) {
            return d.id;
        }).call(function (selection) {
            selection.enter().append('circle').classed('data', true).attr({
                fill: 'black',
                r: 1,
                cx: 0,
                cy: function (d) {
                    return yScale(d.cpue);
                }
            });
            selection.exit().remove();
        });
        var transition = selection.transition();
        transition.selectAll('circle.data').attr({
            cx: function (d) {
                return xScale(+d[key]);
            },
            cy: function (d) {
                return yScale(+d['cpue']);
            }
        });
        transition.select('path.spline').attr({
            d: line(xs)
        });
        transition.select('g.x-axis').call(xAxis);
        transition.select('g.y-axis').call(yAxis);
    }

    squid.app.controller('DistributionController', [
        '$scope', function ($scope) {
            var cpueVar = $scope.cpueVar;
            var initialY = svgHeight / 2;
            var xs = (function () {
                var xs = new Array(nInterval);
                var i;
                var d = (svgWidth - svgMargin * 2) / nInterval;
                for (i = 0; i < nInterval; ++i) {
                    xs[i] = d * i;
                }
                return xs;
            })();
            var xScale = d3.scale.linear();
            var yScale = d3.scale.linear().domain([0, d3.max(cpueVar, function (d) {
                    return +d['cpue'];
                })]).range([svgWidth - svgMargin, svgMargin]);
            var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(10);
            var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(10);
            var rootSelection = d3.select('svg#distribution').attr({
                width: svgWidth,
                height: svgHeight
            });
            var line = d3.svg.line().x(function (d) {
                return d;
            }).y(function (d) {
                return initialY;
            });
            rootSelection.append('path').classed('spline', true).attr({
                d: line(xs),
                fill: 'none',
                stroke: 'red'
            });

            rootSelection.append("g").classed('axis x-axis', true).attr("transform", "translate(0," + (svgHeight - svgMargin) + ")").call(xAxis);
            rootSelection.append("g").classed('axis y-axis', true).attr("transform", "translate(" + svgMargin + ",0)").call(yAxis);

            function draw() {
                var xKey = $scope.selectedVariable + $scope.selectedDepth;
                drawGraph(rootSelection, $scope.cpueVar, xKey, $scope.lambda);
            }

            $scope.$watch('selectedVariable', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    draw();
                }
            });

            $scope.$watch('selectedDepth', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    draw();
                }
            });

            $scope.$watch('lambda', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    if (0 < $scope.lambda && $scope.lambda <= 1) {
                        draw();
                    }
                }
            });

            $scope.$watch('cpueVar', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    draw();
                }
            });

            draw();
        }]);
})(squid || (squid = {}));
/// <reference path="squid-hsi.ts"/>
var squid;
(function (squid) {
    squid.app.controller('SIController', [
        '$scope', function ($scope) {
            $scope.loadSI = function (SI) {
                $scope.$parent.selectedVariable = SI.variable;
                $scope.$parent.selectedDepth = SI.depth;
                $scope.$parent.lambda = SI.lambda;
                $scope.$parent.SIFunction = SI.SIFunction;
            };

            $scope.removeSI = function (i) {
                $scope.SIs.splice(i, 1);
            };
        }]);
})(squid || (squid = {}));
/// <reference path="squid-hsi.ts"/>
/// <reference path="spline.ts"/>
var squid;
(function (squid) {
    function createSIFunction(cpueVar, selectedVariable, selectedDepth, lambda) {
        var key = selectedVariable + selectedDepth;
        var interpolator = spline.interpolator(cpueVar, function (d) {
            return +d[key];
        }, function (d) {
            return +d['cpue'];
        }, lambda);
        var maxVal = interpolator.max();
        return function (x) {
            if (x == 0) {
                return NaN;
            } else {
                var v = interpolator.interpolate(x) / maxVal;
                if (v > 1) {
                    return 1;
                } else if (v < 0) {
                    return 0;
                } else {
                    return v;
                }
            }
        };
    }

    squid.app.controller('MainController', [
        '$scope', 'cpueVar', function ($scope, cpueVar) {
            function createCurrentSIFunction() {
                return createSIFunction($scope.cpueVar, $scope.selectedVariable, $scope.selectedDepth, $scope.lambda);
            }

            $scope.originalCpueVar = cpueVar;
            $scope.cpueVar = cpueVar;
            $scope.selectedVariable = 'S';
            $scope.selectedDepth = 0;
            $scope.selectedDate = new Date(2006, 0, 10);
            $scope.cpueDateFrom = d3.min($scope.cpueVar, function (d) {
                return d.date;
            });
            $scope.cpueDateTo = d3.max($scope.cpueVar, function (d) {
                return d.date;
            });
            $scope.lambda = 0.5;
            $scope.SIs = [];
            $scope.minRowCount = 8;
            $scope.SIPaddings = [0, 1, 2, 3, 4, 5, 6, 7];
            $scope.SIFunction = createCurrentSIFunction();
            $scope.depthMin = 0;
            $scope.depthMax = 25;
            $scope.lambdaMin = 0.001;
            $scope.lambdaMax = 1;
            $scope.lambdaStep = 0.001;

            $scope.saveSI = function () {
                var dateIndex = (function () {
                    var date = $scope.selectedDate;
                    var startDate = new Date(2006, 0, 10);
                    var dateIndex = (date - startDate) / 86400000;
                    if (dateIndex < 0) {
                        return 0;
                    } else if (dateIndex > 9) {
                        return 9;
                    }
                    return dateIndex;
                })();
                $scope.SIs.push({
                    variable: $scope.selectedVariable,
                    depth: $scope.selectedDepth,
                    date: dateIndex,
                    lambda: $scope.lambda,
                    SIFunction: $scope.SIFunction,
                    active: true
                });
                if ($scope.SIs.length <= $scope.minRowCount) {
                    $scope.SIPaddings.pop();
                }
            };

            $scope.incrementDepth = function () {
                $scope.selectedDepth = Math.min($scope.depthMax, +$scope.selectedDepth + 1);
            };

            $scope.decrementDepth = function () {
                $scope.selectedDepth = Math.max($scope.depthMin, $scope.selectedDepth - 1);
            };

            $scope.incrementLambda = function () {
                $scope.lambda = Math.min($scope.lambdaMax, +$scope.lambda + $scope.lambdaStep);
            };

            $scope.decrementLambda = function () {
                $scope.lambda = Math.max($scope.lambdaMin, $scope.lambda - $scope.lambdaStep);
            };

            $scope.$watch('selectedVariable', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    $scope.SIFunction = createCurrentSIFunction();
                }
            });

            $scope.$watch('selectedDepth', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    $scope.SIFunction = createCurrentSIFunction();
                }
            });

            $scope.$watch('lambda', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    $scope.SIFunction = createCurrentSIFunction();
                }
            });

            $scope.$watch('cpueDateFrom', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    $scope.cpueVar = $scope.originalCpueVar.filter(function (d) {
                        return $scope.cpueDateFrom <= d.date && d.date <= +$scope.cpueDateTo + 86400000;
                    });
                    $scope.SIFunction = createCurrentSIFunction();
                    $scope.SIs.forEach(function (SI) {
                        SI.SIFunction = createSIFunction($scope.cpueVar, SI.variable, SI.depth, SI.lambda);
                    });
                }
            });

            $scope.$watch('cpueDateTo', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    $scope.cpueVar = $scope.originalCpueVar.filter(function (d) {
                        return $scope.cpueDateFrom <= d.date && d.date <= +$scope.cpueDateTo + 86400000;
                    });
                    $scope.SIFunction = createCurrentSIFunction();
                    $scope.SIs.forEach(function (SI) {
                        SI.SIFunction = createSIFunction($scope.cpueVar, SI.variable, SI.depth, SI.lambda);
                    });
                }
            });
        }]);
})(squid || (squid = {}));
/// <reference path="squid-hsi.ts"/>
/// <reference path="typings/jquery/jquery.d.ts"/>
/// <reference path="typings/threejs/three.d.ts"/>
/// <reference path="lib/jsdap.d.ts"/>
var squid;
(function (squid) {
    var mercatrProjection = (function () {
        var _r = 128 / Math.PI;
        var _lonToX = function (lon) {
            var lonRad = Math.PI / 180 * lon;
            return _r * (lonRad + Math.PI);
        };
        var _latToY = function (lat) {
            var latRad = Math.PI / 180 * lat;
            return _r / 2 * Math.log((1.0 + Math.sin(latRad)) / (1.0 - Math.sin(latRad))) + 128;
        };

        return {
            lonToX: _lonToX,
            latToY: _latToY,
            lonArrToX: function (lonArr) {
                var arr = [];
                for (var i = lonArr.length; i--;) {
                    arr[i] = _lonToX(lonArr[i]);
                }
                return arr;
            },
            latArrToY: function (latArr) {
                var arr = [];
                for (var i = latArr.length; i--;) {
                    arr[i] = _latToY(latArr[i]);
                }
                return arr;
            }
        };
    })();

    function createMesh(values, xList, yList, f) {
        var geo = new THREE.Geometry();

        var cnt = 0;
        var _createTriagle = function (vList, cList) {
            for (var i = 0; i < 3; i++) {
                geo.vertices.push(new THREE.Vector3(vList[i][0], vList[i][1], -1));
            }
            var vNum = 3 * cnt;
            geo.faces.push(new THREE.Face3(vNum, vNum + 1, vNum + 2));
            for (var i = 0; i < 3; i++) {
                geo.faces[cnt].vertexColors[i] = new THREE.Color(cList[i]);
            }
            cnt++;
        };

        var _createSquare = function (vList, cList) {
            _createTriagle([vList[0], vList[1], vList[2]], [cList[0], cList[1], cList[2]]);
            _createTriagle([vList[0], vList[3], vList[2]], [cList[0], cList[3], cList[2]]);
        };

        // num to color
        var extents = values.map(function (row) {
            return d3.extent(row.filter(function (v) {
                return v != 0;
            }), f);
        });
        var min = d3.min(extents, function (d) {
            return d[0];
        });
        var max = d3.max(extents, function (d) {
            return d[1];
        });
        var scale = d3.scale.linear().domain([min, max]).range([240, 0]);
        var _numTo16Color = function (num) {
            var v = f(num);
            if (num == 0 || isNaN(v)) {
                return d3.hsl("hsl(100,100%,100%)").toString();
            }
            return d3.hsl("hsl(" + scale(v) + ",50%,50%)").toString();
        };

        for (var xi = 0, xLen = xList.length - 1; xi < xLen; xi++) {
            for (var yi = 0, yLen = yList.length - 1; yi < yLen; yi++) {
                var vList = [
                    [xList[xi], yList[yi]],
                    [xList[xi + 1], yList[yi]],
                    [xList[xi + 1], yList[yi + 1]],
                    [xList[xi], yList[yi + 1]]
                ];
                var cList = [
                    _numTo16Color(values[yi][xi]),
                    _numTo16Color(values[yi][xi + 1]),
                    _numTo16Color(values[yi + 1][xi + 1]),
                    _numTo16Color(values[yi + 1][xi])
                ];
                _createSquare(vList, cList);
            }
        }

        var material = new THREE.MeshBasicMaterial({
            vertexColors: THREE.VertexColors,
            side: THREE.DoubleSide
        });
        return new THREE.Mesh(geo, material);
    }

    squid.app.controller('MapController', [
        '$scope', function ($scope) {
            var lonS = 140;
            var lonN = 149;
            var latW = 36;
            var latE = 43;
            var debugMode = false;
            var xRange = { min: mercatrProjection.lonToX(lonS), max: mercatrProjection.lonToX(lonN) }, yRange = { min: mercatrProjection.latToY(latW), max: mercatrProjection.latToY(latE) }, width = xRange.max - xRange.min, height = yRange.max - yRange.min, aspectRatio = height / width;

            // initialize renderer
            var stage = $('div#stage');
            stage.height(aspectRatio * stage.width());
            var renderer = new THREE.WebGLRenderer(), rendererWidth = stage.innerWidth(), rendererHeight = stage.innerHeight();
            renderer.setSize(rendererWidth, rendererHeight);
            renderer.setClearColor(0xffffff, 1.0);
            stage.append(renderer.domElement);

            // initialize camera
            var camerax = (xRange.max + xRange.min) / 2, cameray = (yRange.max + yRange.min) / 2;
            var camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 2);
            camera.position.set(camerax, cameray, 1);
            camera.lookAt(new THREE.Vector3(camerax, cameray, 0));

            // initialize scene
            var scene = new THREE.Scene();

            var drawCoastLine = function () {
                d3.json('data/coastl_jpn.json').on('load', function (data) {
                    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
                    data.forEach(function (row) {
                        var geometry = new THREE.Geometry();
                        row.forEach(function (pos) {
                            var x = mercatrProjection.lonToX(pos[1]);
                            var y = mercatrProjection.latToY(pos[0]);
                            var vertice = new THREE.Vector3(x, y, 0);
                            geometry.vertices.push(vertice);
                        });
                        var line = new THREE.Line(geometry, lineMaterial);
                        scene.add(line);
                    });
                }).get();
            };

            var particles;
            var markPoints = function () {
                if (particles !== undefined) {
                    scene.remove(particles);
                }
                if ($scope.showWholeCPUE || $scope.showExpectedCPUE) {
                    var points = $scope.showWholeCPUE ? $scope.cpueVar : [];
                    if ($scope.showExpectedCPUE) {
                        if (!$scope.showWholeCPUE || $scope.selectedDate < $scope.cpueDateFrom || $scope.cpueDateTo < $scope.selectedDate) {
                            points = points.concat($scope.originalCpueVar.filter(function (point) {
                                return point.date.getFullYear() == $scope.selectedDate.getFullYear() && point.date.getMonth() == $scope.selectedDate.getMonth() && point.date.getDate() == $scope.selectedDate.getDate();
                            }));
                        }
                    }
                    var geometry = new THREE.Geometry();
                    var material = new THREE.ParticleSystemMaterial({
                        size: 5,
                        sizeAttenuation: false,
                        vertexColors: true
                    });

                    var scale = d3.scale.linear().domain(d3.extent(points, function (p) {
                        return p.cpue;
                    })).range([240, 360]);
                    var _numTo16Color = function (num) {
                        return d3.hsl("hsl(" + scale(num) + ",100%,50%)").toString();
                    };

                    var colors = [];
                    for (var i = 0; i < points.length; i++) {
                        var p = points[i];
                        var vertex = new THREE.Vector3();
                        vertex.x = mercatrProjection.lonToX(p.x);
                        vertex.y = mercatrProjection.latToY(p.y);
                        vertex.z = 0;
                        geometry.vertices.push(vertex);
                        colors[i] = new THREE.Color(_numTo16Color(p.cpue));
                    }
                    geometry.colors = colors;

                    particles = new THREE.ParticleSystem(geometry, material);
                    scene.add(particles);
                }
            };

            var drawGrid = function (xList, yList) {
                var material = new THREE.LineBasicMaterial({ color: 0xaaaaaa }), geometry, x, y, vertice, line, xmin = xList[0], xmax = xList[xList.length - 1], ymin = yList[0], ymax = yList[yList.length - 1];

                for (var i = xList.length; i--;) {
                    geometry = new THREE.Geometry();
                    x = xList[i];
                    vertice = new THREE.Vector3(x, ymin, -0.5);
                    geometry.vertices.push(vertice);
                    vertice = new THREE.Vector3(x, ymax, -0.5);
                    geometry.vertices.push(vertice);
                    line = new THREE.Line(geometry, material);
                    scene.add(line);
                }

                for (var i = yList.length; i--;) {
                    geometry = new THREE.Geometry();
                    y = yList[i];
                    vertice = new THREE.Vector3(xmin, y, -0.5);
                    geometry.vertices.push(vertice);
                    vertice = new THREE.Vector3(xmax, y, -0.5);
                    geometry.vertices.push(vertice);
                    line = new THREE.Line(geometry, material);
                    scene.add(line);
                }
            };

            // render
            var render = function () {
                requestAnimationFrame(render);
                renderer.render(scene, camera);
            };

            var initialized = false;
            var dataCache = {};
            var mesh;
            var grid;
            function paint(values, xList, yList) {
                if (mesh !== undefined) {
                    scene.remove(mesh);
                }
                switch ($scope.view) {
                    case 'variable':
                        mesh = createMesh(values, xList, yList, Object);
                        scene.add(mesh);
                        break;
                    case 'si':
                        mesh = createMesh(values, xList, yList, $scope.SIFunction);
                        scene.add(mesh);
                        break;
                    case 'hsi':
                        var SIs = $scope.SIs.filter(function (SI) {
                            return SI.active;
                        });
                        mesh = createMesh(grid, xList, yList, function (d) {
                            var xi = d[0];
                            var yi = d[1];
                            var hsi = 1;
                            SIs.forEach(function (SI) {
                                hsi *= SI.SIFunction(dataCache[SI.date + SI.variable.toLowerCase() + SI.depth][0][0][0][0][yi][xi]);
                            });
                            return hsi;
                        });
                        scene.add(mesh);
                        break;
                    case 'none':
                        mesh = undefined;
                }
            }
            function drawData(data) {
                var _data = data[0];
                var values = _data[0][0][0];
                var xList = mercatrProjection.lonArrToX(_data[4]);
                var yList = mercatrProjection.latArrToY(_data[3]);
                if (!initialized) {
                    grid = yList.map(function (_, j) {
                        return xList.map(function (_, i) {
                            return [i, j];
                        });
                    });
                    if (debugMode) {
                        drawGrid(xList, yList);
                    }
                }
                paint(values, xList, yList);
            }
            function draw() {
                var v = $scope.selectedVariable.toLowerCase();
                var d = $scope.selectedDepth;
                var dateIndex = (function () {
                    var date = $scope.selectedDate;
                    var startDate = new Date(2006, 0, 10);
                    var dateIndex = (date - startDate) / 86400000;
                    if (dateIndex < 0) {
                        return 0;
                    } else if (dateIndex > 9) {
                        return 9;
                    }
                    return dateIndex;
                })();
                var key = dateIndex + v + d;
                if (dataCache[key]) {
                    drawData(dataCache[key]);
                } else {
                    var dataUrl = 'http://opendap.viz.media.kyoto-u.ac.jp/opendap/data/ocean/' + v + '.nc.dods?' + v + '[' + dateIndex + '][' + d + '][212:282][232:322]';
                    loadData(dataUrl, function (data) {
                        drawData(dataCache[key] = data);
                    });
                }
            }

            $scope.view = 'variable';
            $scope.showWholeCPUE = true;
            $scope.showExpectedCPUE = false;

            $scope.$watch('selectedVariable', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    if ($scope.view != 'hsi') {
                        draw();
                    }
                }
            });

            $scope.$watch('selectedDepth', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    if ($scope.view != 'hsi') {
                        draw();
                    }
                }
            });

            $scope.$watch('selectedDate', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    draw();
                }
            });

            $scope.$watch('lambda', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    if ($scope.view == 'si') {
                        draw();
                    }
                }
            });

            $scope.$watch('cpueVar', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    if ($scope.view != 'variable') {
                        draw();
                    }
                    markPoints();
                }
            });

            $scope.$watch('view', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    draw();
                }
            });

            $scope.$watch('showWholeCPUE', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    markPoints();
                }
            });

            $scope.$watch('showExpectedCPUE', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    markPoints();
                }
            });

            $scope.$watch('SIs.length', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    if ($scope.view == 'hsi') {
                        draw();
                    }
                }
            });

            $scope.activeSICount = function () {
                return $scope.SIs.filter(function (SI) {
                    return SI.active;
                }).length;
            };

            $scope.$watch('activeSICount()', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    if ($scope.view == 'hsi') {
                        draw();
                    }
                }
            });

            render();
            drawCoastLine();
            markPoints();
            draw();
        }]);
})(squid || (squid = {}));
