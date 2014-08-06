var spline;
(function (spline) {
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
    spline.smoothingSpline = smoothingSpline;

    var SplineInterpolator = (function () {
        function SplineInterpolator(S, xAccessor, yAccessor, lambda) {
            var xy = S.map(function (d) {
                return [+xAccessor(d), +yAccessor(d)];
            }).filter(function (d) {
                return d[0] !== 0;
            });
            xy.sort(function (d1, d2) {
                return d1[0] - d2[0];
            });
            var x0 = undefined;
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
            var sigma = xy2.map(function () {
                return 1;
            });
            this.n = xy2.length - 1;
            this.x = xy2.map(function (d) {
                return d[0];
            });
            this.y = xy2.map(function (d) {
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
        };

        SplineInterpolator.prototype.min = function () {
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
        };

        SplineInterpolator.prototype.domain = function () {
            return [this.x[0], this.x[this.x.length - 1]];
        };

        SplineInterpolator.prototype.range = function () {
            return [this.min(), this.max()];
        };

        SplineInterpolator.prototype.curve = function (nInterval) {
            var domain = this.domain();
            var delta = (domain[1] - domain[0]) / nInterval;
            var vals = [];
            var i, x;
            for (i = 0, x = domain[0]; i < nInterval; ++i, x += delta) {
                vals[i] = [x, this.interpolate(x)];
            }
            return vals;
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
var squid;
(function (squid) {
    var SI = (function () {
        function SI(CPUEs, variableName_, depthIndex_, lambda_) {
            this.CPUEs = CPUEs;
            this.variableName_ = variableName_;
            this.depthIndex_ = depthIndex_;
            this.lambda_ = lambda_;
            this.active = true;
            this.interpolate();
        }
        Object.defineProperty(SI.prototype, "variableName", {
            get: function () {
                return this.variableName_;
            },
            set: function (value) {
                this.variableName_ = value;
                this.interpolate();
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(SI.prototype, "depthIndex", {
            get: function () {
                return this.depthIndex_;
            },
            set: function (value) {
                this.depthIndex_ = value;
                this.interpolate();
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(SI.prototype, "lambda", {
            get: function () {
                return this.lambda_;
            },
            set: function (value) {
                this.lambda_ = value;
                this.interpolate();
            },
            enumerable: true,
            configurable: true
        });


        SI.prototype.call = function (x) {
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
        };

        SI.prototype.interpolate = function () {
            var key = this.variableName_ + this.depthIndex_;
            this.interpolator = spline.interpolator(this.CPUEs, function (d) {
                return d[key];
            }, function (d) {
                return d.cpue;
            }, this.lambda_);
            this.scale = d3.scale.linear().domain([this.interpolator.min(), this.interpolator.max()]).range([0, 1]);
        };
        return SI;
    })();
    squid.SI = SI;

    var SIManager = (function () {
        function SIManager(DataManager) {
            this.DataManager = DataManager;
            this.SIs = [];
        }
        SIManager.prototype.createSI = function (variableName, depthIndex, lambda) {
            return new SI(this.DataManager.CPUEPoints, variableName, depthIndex, lambda);
        };

        SIManager.prototype.registerSI = function (SI) {
            this.SIs.push(SI);
        };
        SIManager.$inject = ['DataManager'];
        return SIManager;
    })();
    squid.SIManager = SIManager;
})(squid || (squid = {}));
var squid;
(function (squid) {
    var DataManager = (function () {
        function DataManager($q) {
            this.$q = $q;
            this.latStart = 192;
            this.latStop = 312;
            this.latLength = this.latStop - this.latStart;
            this.lonStart = 551;
            this.lonStop = 671;
            this.lonLength = this.lonStop - this.lonStart;
            this.dataCache = {};
        }
        DataManager.prototype.loadMOVE = function (variableName, depthIndex) {
            var _this = this;
            var deferred = this.$q.defer();
            var key = this.key(variableName, this.selectedDate, depthIndex);
            if (this.dataCache[key]) {
                deferred.resolve(this.dataCache[key]);
            } else {
                var v = variableName.toLowerCase();
                var dateIndex = this.dateIndex(this.selectedDate);
                var d = depthIndex;
                var lat = this.latStart + ':' + this.latStop;
                var lon = this.lonStart + ':' + this.lonStop;
                var query = v + '[' + dateIndex + '][' + d + '][' + lat + '][' + lon + ']';
                if (/fcst\d{4}/.test(this.opendapEndpoint)) {
                    switch (v) {
                        case 'u':
                        case 'v':
                        case 't':
                        case 's':
                        case 'hm':
                            var file = 'fcst';
                            break;
                        default:
                            var file = v;
                    }
                } else {
                    var file = v;
                }
                var dataUrl = this.opendapEndpoint + file + '.dods?' + query;
                jqdap.loadData(dataUrl, this.jqdapOptions()).then(function (data) {
                    deferred.resolve(_this.dataCache[key] = data);
                });
            }
            return deferred.promise;
        };

        DataManager.prototype.loadCPUE = function (file) {
            var deferred = this.$q.defer();

            return deferred.promise;
        };

        DataManager.prototype.getCPUE = function () {
            var _this = this;
            return this.CPUEPoints.filter(function (d) {
                return _this.cpueDateFrom <= d.date && d.date <= _this.cpueDateTo;
            });
        };

        DataManager.prototype.getExpectedCPUE = function () {
            var _this = this;
            return this.CPUEPoints.filter(function (d) {
                return d.date.getTime() == _this.selectedDate.getTime();
            });
        };

        DataManager.prototype.initialize = function (CPUEPoints, opendapEndpoint) {
            var _this = this;
            return this.loadData(this.opendapEndpoint + 'w.dods?lat,lon,lev,time').then(function (data) {
                _this.axes = {
                    lat: data[3],
                    lon: data[2],
                    lev: data[1],
                    time: data[0]
                };
            });
        };

        DataManager.prototype.initialized = function () {
            return this.CPUEPoints !== undefined;
        };

        DataManager.prototype.key = function (variableName, date, depthIndex) {
            return this.dateIndex(date) + variableName + depthIndex;
        };

        DataManager.prototype.loadDataset = function (url) {
            var deferred = this.$q.defer();
            jqdap.loadDataset(url, this.jqdapOptions()).then(function (result) {
                deferred.resolve(result);
            });
            return deferred.promise;
        };

        DataManager.prototype.loadData = function (url) {
            var deferred = this.$q.defer();
            jqdap.loadData(url, this.jqdapOptions()).then(function (result) {
                deferred.resolve(result);
            });
            return deferred.promise;
        };

        DataManager.prototype.dateIndex = function (date) {
            var axis = this.axes.time;
            var baseDate = new Date(1970, 0, 1);
            var x = Math.floor((date.getTime() - baseDate.getTime()) / 86400000) + 719164;
            return Math.min(d3.bisectLeft(axis, x), axis.length - 1);
        };

        DataManager.prototype.jqdapOptions = function () {
            if (this.username || this.password) {
                return {
                    withCredentials: true,
                    username: this.username,
                    password: this.password
                };
            } else {
                return {};
            }
        };
        DataManager.$inject = ['$q'];
        return DataManager;
    })();
    squid.DataManager = DataManager;
})(squid || (squid = {}));
var squid;
(function (squid) {
    var nInterval = 100;
    var svgMargin = 40;

    var DistributionRenderer = (function () {
        function DistributionRenderer(selector, width, height) {
            var _this = this;
            this.rootSelection = d3.select(selector).append('svg');
            this.svgWidth = width;
            this.svgHeight = height;
            this.rootSelection.attr({
                width: this.svgWidth,
                height: this.svgHeight
            });
            this.cpuePoints = this.DataManager.getCPUE();

            var initialY = this.svgHeight / 2;
            var xs = (function () {
                var xs = new Array(nInterval);
                var i;
                var d = (_this.svgWidth - svgMargin * 2) / nInterval;
                for (i = 0; i < nInterval; ++i) {
                    xs[i] = d * i;
                }
                return xs;
            })();
            var xScale = d3.scale.linear();
            var yScale = d3.scale.linear().domain(d3.extent(this.cpuePoints, function (d) {
                return +d.cpue;
            })).range([this.svgWidth - svgMargin, svgMargin]);
            var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(10);
            var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(10);
            var line = d3.svg.line().x(function (d) {
                return d;
            }).y(function (d) {
                return initialY;
            });

            this.rootSelection.append('g').classed('points', true);
            this.rootSelection.append('path').classed('spline', true).attr({
                d: line(xs),
                fill: 'none',
                stroke: 'red'
            });
            this.rootSelection.append("g").classed('axis x-axis', true).attr("transform", "translate(0," + (this.svgHeight - svgMargin) + ")").call(xAxis);
            this.rootSelection.append("g").classed('axis y-axis', true).attr("transform", "translate(" + svgMargin + ",0)").call(yAxis);
        }
        DistributionRenderer.prototype.draw = function (key, lambda) {
            var data = this.cpuePoints.filter(function (d) {
                return d[key] != 0;
            });
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
            })).range([svgMargin, this.svgWidth - svgMargin]);
            var yScale = d3.scale.linear().domain(d3.extent(data, function (d) {
                return +d['cpue'];
            })).range([this.svgWidth - svgMargin, svgMargin]);
            var xAxis = d3.svg.axis().scale(xScale).orient("botom").ticks(10);
            var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(10);
            var line = d3.svg.line().x(function (d) {
                return xScale(d);
            }).y(function (d) {
                return yScale(interpolator.interpolate(d));
            });
            this.rootSelection.select('g.points').selectAll('circle.data').data(data, function (d) {
                return d.id;
            }).call(function (selection) {
                selection.enter().append('circle').classed('data', true).attr({
                    fill: 'black',
                    opacity: 0.3,
                    r: 1,
                    cx: 0,
                    cy: function (d) {
                        return yScale(d.cpue);
                    }
                });
                selection.exit().remove();
            });
            var transition = this.rootSelection.transition();
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
        };
        return DistributionRenderer;
    })();
    squid.DistributionRenderer = DistributionRenderer;

    function DistributionRendererFactory(DataManager) {
        function Wrapper() {
            this.DataManager = DataManager;
            DistributionRenderer.apply(this, arguments);
        }
        Wrapper.prototype = DistributionRenderer.prototype;
        return Wrapper;
    }
    squid.DistributionRendererFactory = DistributionRendererFactory;
    DistributionRendererFactory.$inject = ['DataManager'];
})(squid || (squid = {}));
var squid;
(function (squid) {
    var IGNORE_VALUE = -999000000;

    function lonToX(lon) {
        var _r = 128 / Math.PI;
        var lonRad = Math.PI / 180 * lon;
        return _r * (lonRad + Math.PI);
    }

    function latToY(lat) {
        var _r = 128 / Math.PI;
        var latRad = Math.PI / 180 * lat;
        return _r / 2 * Math.log((1.0 + Math.sin(latRad)) / (1.0 - Math.sin(latRad))) + 128;
    }

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

        var extents = values.map(function (row) {
            return d3.extent(row.filter(function (v) {
                return v != IGNORE_VALUE;
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
            if (num == IGNORE_VALUE || isNaN(v)) {
                return d3.hsl(0, 1, 1).toString();
            }
            return d3.hsl(scale(v), 1, 0.5).toString();
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

    var MapRenderer = (function () {
        function MapRenderer() {
            var _this = this;
            var lonW = 180;
            var lonE = 200;
            var latS = 34;
            var latN = 46;
            var xRange = {
                min: lonToX(lonW),
                max: lonToX(lonE)
            };
            var yRange = {
                min: latToY(latS),
                max: latToY(latN)
            };
            var width = xRange.max - xRange.min;
            var height = yRange.max - yRange.min;
            var aspectRatio = height / width;

            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setClearColor(0xffffff, 1.0);

            var camerax = (xRange.max + xRange.min) / 2, cameray = (yRange.max + yRange.min) / 2;
            var camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 2);
            camera.position.set(camerax, cameray, 1);
            camera.lookAt(new THREE.Vector3(camerax, cameray, 0));

            this.scene = new THREE.Scene();

            var render = function () {
                requestAnimationFrame(render);
                _this.renderer.render(_this.scene, camera);
            };

            render();
        }
        MapRenderer.prototype.appendTo = function (selector) {
            $(selector).append(this.renderer.domElement);
        };

        MapRenderer.prototype.setSize = function (width, height) {
            this.renderer.setSize(width, height);
        };

        MapRenderer.prototype.drawVariable = function (variableName, depthIndex) {
            var _this = this;
            this.DataManager.loadMOVE(variableName, depthIndex).then(function (data) {
                if (_this.mesh !== undefined) {
                    _this.scene.remove(_this.mesh);
                }
                var _data = data[0];
                var values = _data[0][0][0];
                var xList = _data[4].map(lonToX);
                var yList = _data[3].map(latToY);
                _this.mesh = createMesh(values, xList, yList, Object);
                _this.scene.add(_this.mesh);
            });
        };

        MapRenderer.prototype.drawSI = function (SI) {
            var _this = this;
            this.DataManager.loadMOVE(SI.variableName, SI.depthIndex).then(function (data) {
                if (_this.mesh !== undefined) {
                    _this.scene.remove(_this.mesh);
                }
                var _data = data[0];
                var values = _data[0][0][0];
                var xList = _data[4].map(lonToX);
                var yList = _data[3].map(latToY);
                _this.mesh = createMesh(values, xList, yList, function (v) {
                    return SI.call(v);
                });
                _this.scene.add(_this.mesh);
            });
        };

        MapRenderer.prototype.drawHSI = function (SIs) {
            var _this = this;
            this.$q.all(SIs.map(function (SI) {
                return _this.DataManager.loadMOVE(SI.variableName, SI.depthIndex);
            })).then(function (planes) {
                if (_this.mesh !== undefined) {
                    _this.scene.remove(_this.mesh);
                }
                if (SIs.length === 0) {
                    return;
                }
                var xList = planes[0][0][4].map(lonToX);
                var yList = planes[0][0][3].map(latToY);
                var n = SIs.length;
                var i, j, k, x, y;
                var values = yList.map(function (y, i) {
                    return xList.map(function (x, j) {
                        var hsi = 1;
                        for (k = 0; k < n; ++k) {
                            var v = planes[k][0][0][0][0][i][j];
                            if (v == IGNORE_VALUE) {
                                hsi = NaN;
                                break;
                            } else {
                                hsi *= SIs[k].call(v);
                            }
                        }
                        return hsi;
                    });
                });
                _this.mesh = createMesh(values, xList, yList, Object);
                _this.scene.add(_this.mesh);
            });
        };

        MapRenderer.prototype.drawGrid = function () {
            var _this = this;
            var xList = [];
            var yList = [];
            var material = new THREE.LineBasicMaterial({ color: 0xaaaaaa }), geometry, x, y, vertice, line, xmin = xList[0], xmax = xList[xList.length - 1], ymin = yList[0], ymax = yList[yList.length - 1];

            xList.forEach(function (x) {
                geometry = new THREE.Geometry();
                vertice = new THREE.Vector3(x, ymin, -0.5);
                geometry.vertices.push(vertice);
                vertice = new THREE.Vector3(x, ymax, -0.5);
                geometry.vertices.push(vertice);
                line = new THREE.Line(geometry, material);
                _this.scene.add(line);
            });

            yList.forEach(function (y) {
                geometry = new THREE.Geometry();
                vertice = new THREE.Vector3(xmin, y, -0.5);
                geometry.vertices.push(vertice);
                vertice = new THREE.Vector3(xmax, y, -0.5);
                geometry.vertices.push(vertice);
                line = new THREE.Line(geometry, material);
                _this.scene.add(line);
            });
        };

        MapRenderer.prototype.drawParticles = function () {
            if (this.particles !== undefined) {
                this.scene.remove(this.particles);
            }
            var points = this.DataManager.getExpectedCPUE();
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
                return d3.hsl(scale(num), 1, 0.5).toString();
            };

            var colors = [];
            for (var i = 0; i < points.length; ++i) {
                var p = points[i];
                var vertex = new THREE.Vector3();
                vertex.x = lonToX(p.x);
                vertex.y = latToY(p.y);
                vertex.z = 0;
                geometry.vertices.push(vertex);
                colors[i] = new THREE.Color(_numTo16Color(p.cpue));
            }
            geometry.colors = colors;

            this.particles = new THREE.ParticleSystem(geometry, material);
            this.scene.add(this.particles);
        };

        MapRenderer.prototype.drawCoastLine = function () {
            var _this = this;
            d3.json('data/coastl_jpn.json').on('load', function (data) {
                var lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
                data.forEach(function (row) {
                    var geometry = new THREE.Geometry();
                    row.forEach(function (pos) {
                        var x = lonToX(pos[1]);
                        var y = latToY(pos[0]);
                        var vertice = new THREE.Vector3(x, y, 0);
                        geometry.vertices.push(vertice);
                    });
                    var line = new THREE.Line(geometry, lineMaterial);
                    _this.scene.add(line);
                });
            }).get();
        };
        return MapRenderer;
    })();
    squid.MapRenderer = MapRenderer;

    function MapRendererFactory($q, DataManager) {
        function Wrapper() {
            this.$q = $q;
            this.DataManager = DataManager;
            MapRenderer.apply(this, arguments);
        }
        Wrapper.prototype = MapRenderer.prototype;
        return Wrapper;
    }
    squid.MapRendererFactory = MapRendererFactory;
    MapRendererFactory.$inject = ['$q', 'DataManager'];
})(squid || (squid = {}));
var squid;
(function (squid) {
    function HSITabController($scope, SIManager, DistributionRenderer, SIMapRenderer, HSIMapRenderer) {
        HSIMapRenderer.appendTo('#hsi-map');
        HSIMapRenderer.setSize($('.col-xs-4').width() - 5, $('.col-xs-3').width());
        HSIMapRenderer.drawParticles();

        SIMapRenderer.appendTo('#si-map2');
        SIMapRenderer.setSize($('.col-xs-4').width() - 5, $('.col-xs-3').width());
        SIMapRenderer.drawParticles();

        var distributionRenderer = new DistributionRenderer('#scatter-plot-graph2', $('.col-xs-3').width(), $('.col-xs-3').width());

        if (SIManager.SIs.length > 0) {
            $scope.selectedSI = SIManager.SIs[0];
            HSIMapRenderer.drawHSI(SIManager.SIs);
            SIMapRenderer.drawSI($scope.selectedSI);
            distributionRenderer.draw($scope.selectedSI.variableName + $scope.selectedSI.depthIndex, $scope.selectedSI.lambda);
        }

        $scope.select = function (SI) {
            $scope.selectedSI = SI;
        };

        $scope.check = function (SI) {
            SI.active = !SI.active;
        };

        $scope.export = function (SI) {
            var text = SI.interpolator.curve(100).map(function (xy) {
                var x = ('    ' + xy[0].toFixed(3)).slice(-9);
                var y = ('    ' + xy[1].toFixed(3)).slice(-9);
                return x + ' ' + y;
            }).join('\r\n');
            return 'data:text/plain;base64,' + btoa(text);
        };

        $scope.activeSIcount = function () {
            return SIManager.SIs.filter(function (SI) {
                return SI.active;
            }).length;
        };

        $scope.$watch('selectedSI', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                SIMapRenderer.drawSI($scope.selectedSI);
                distributionRenderer.draw($scope.selectedSI.variableName + $scope.selectedSI.depthIndex, $scope.selectedSI.lambda);
            }
        });

        $scope.$watch('activeSIcount()', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                if (SIManager.SIs.length > 0) {
                    HSIMapRenderer.drawHSI(SIManager.SIs.filter(function (SI) {
                        return SI.active;
                    }));
                }
            }
        });

        $scope.$watch('DataManager.selectedDate', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                HSIMapRenderer.drawHSI(SIManager.SIs.filter(function (SI) {
                    return SI.active;
                }));
                HSIMapRenderer.drawParticles();
                SIMapRenderer.drawSI($scope.selectedSI);
                SIMapRenderer.drawParticles();
            }
        });
    }
    squid.HSITabController = HSITabController;
    HSITabController.$inject = [
        '$scope',
        'SIManager',
        'DistributionRenderer',
        'SIMapRenderer2',
        'HSIMapRenderer'
    ];
})(squid || (squid = {}));
var squid;
(function (squid) {
    function MainController($scope, DataManager, SIManager) {
        $scope.SIs = SIManager.SIs;
        $scope.DataManager = DataManager;
    }
    squid.MainController = MainController;
    ;
    MainController.$inject = [
        '$scope',
        'DataManager',
        'SIManager'
    ];
})(squid || (squid = {}));
var squid;
(function (squid) {
    var SettingController = (function () {
        function SettingController($scope, $state, DataManager) {
            this.$scope = $scope;
            this.$state = $state;
            this.DataManager = DataManager;
            this.predictionDate = new Date(2013, 6, 1);
            this.cpueFrom = new Date(1999, 0, 1);
            this.cpueTo = new Date(2013, 11, 31);
            this.latFrom = 34;
            this.latTo = 46;
            this.lonFrom = 180;
            this.lonTo = 200;
            this.depthMax = 30;
            this.opendapEndpoint = localStorage.getItem('opendapEndpoint') || 'http://priusa.yes.jamstec.go.jp/opendap/';
            this.username = localStorage.getItem('username') || '';
        }
        SettingController.prototype.start = function () {
            var _this = this;
            var file = $('#fileInput')[0].files[0];
            if (file === undefined) {
                this.$scope.addAlert({
                    type: 'danger',
                    msg: 'Select CPUE file.'
                });
                return;
            }
            var reader = new FileReader();
            reader.onload = function (e) {
                function ignore(v) {
                    return v == -999 ? 0 : v;
                }
                var id = 0;
                var data = d3.csv.parse(e.target.result).map(function (d) {
                    var obj = {
                        id: id++,
                        x: +d.LON,
                        y: +d.LAT,
                        date: new Date(d.YEAR, d.MONTH - 1, d.DAY),
                        cpue: +d.CPUE,
                        hm0: ignore(+d.HM),
                        hmgrad0: ignore(+d.HMg),
                        mld0: ignore(+d.MLD)
                    };
                    ['S', 'T', 'U', 'V', 'W'].forEach(function (v) {
                        var i;
                        for (i = 0; i < 54; ++i) {
                            var val = +d[v + ('0' + (i + 1)).slice(-2)];
                            obj[v.toLowerCase() + i] = ignore(val);
                        }
                    });
                    return obj;
                });
                _this.DataManager.CPUEPoints = data;
                _this.DataManager.selectedDate = _this.predictionDate;
                _this.DataManager.cpueDateFrom = _this.cpueFrom;
                _this.DataManager.cpueDateTo = _this.cpueTo;
                _this.DataManager.opendapEndpoint = _this.opendapEndpoint;
                _this.DataManager.username = _this.username;
                _this.DataManager.password = _this.password;
                _this.DataManager.initialize(data, _this.opendapEndpoint).then(function () {
                    _this.$state.go('main.si');
                });
            };
            reader.readAsText(file);
            localStorage.setItem('opendapEndpoint', this.opendapEndpoint);
            localStorage.setItem('username', this.username);
        };
        SettingController.$inject = ['$scope', '$state', 'DataManager'];
        return SettingController;
    })();
    squid.SettingController = SettingController;
})(squid || (squid = {}));
var squid;
(function (squid) {
    var svgMargin = 20;
    var maxDepth = 30;

    var CorrelationRenderer = (function () {
        function CorrelationRenderer(selector, width, height) {
            var _this = this;
            var Rs = (function () {
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
                height: this.svgHeight
            });
            this.rootSelection.on('click', function () {
                var pos = d3.mouse(_this.rootSelection.node());
                var depth = Math.floor((pos[1] - svgMargin) / (_this.svgHeight - svgMargin * 2) * (maxDepth + 1));
                if (0 <= depth && depth <= maxDepth) {
                    if (_this.depthSelected) {
                        _this.depthSelected(depth);
                    }
                }
            });
            this.cpuePoints = this.DataManager.getCPUE();

            this.xScale = d3.scale.linear().domain([-1, 1]).range([svgMargin, this.svgWidth - svgMargin]).nice();
            this.yScale = d3.scale.linear().domain([0, maxDepth]).range([svgMargin, this.svgHeight - svgMargin]).nice();
            var xAxis = d3.svg.axis().scale(this.xScale).orient("top").ticks(10);
            var yAxis = d3.svg.axis().scale(this.yScale).orient("left").ticks(10);
            this.line = d3.svg.line().x(function (d) {
                return _this.xScale(d[1]);
            }).y(function (d) {
                return _this.yScale(d[0]);
            });

            this.rootSelection.append('g').classed('points', true).selectAll('circle.point').data(Rs).enter().append('circle').classed('point', true).attr({
                fill: 'black',
                r: 2,
                cx: this.xScale(svgMargin),
                cy: function (d) {
                    return _this.yScale(d[0]);
                }
            }).on('click', function (d) {
                if (_this.depthSelected) {
                    _this.depthSelected(d[0]);
                }
            });

            this.rootSelection.append('path').classed('line', true).attr({
                d: this.line(Rs),
                fill: 'none',
                stroke: 'black'
            });

            this.rootSelection.append("g").attr("class", "axis").attr("transform", "translate(0," + svgMargin + ")").call(xAxis);
            this.rootSelection.append("g").attr("class", "axis").attr("transform", "translate(" + (this.svgWidth / 2) + ",0)").call(yAxis);
        }
        CorrelationRenderer.prototype.draw = function (variableName, lambda) {
            var _this = this;
            var Rs = (function () {
                var Rs = [];
                var depth;
                for (depth = 0; depth <= maxDepth; ++depth) {
                    var key = variableName + depth;
                    var dat = _this.cpuePoints.filter(function (d) {
                        return d[key] != 0;
                    });
                    var interpolator = spline.interpolator(dat, function (d) {
                        return +d[key];
                    }, function (d) {
                        return +d['cpue'];
                    }, lambda);
                    var y = dat.map(function (d) {
                        return +d['cpue'];
                    });
                    var yPrime = dat.map(function (d) {
                        return interpolator.interpolate(+d[key]);
                    });
                    Rs.push([depth, spline.correlation(y, yPrime)]);
                }
                return Rs;
            })();

            this.rootSelection.selectAll('circle.point').data(Rs);
            var transition = this.rootSelection.transition();
            transition.selectAll('circle.point').attr('cx', function (d) {
                return _this.xScale(d[1]);
            });
            transition.select('path.line').attr('d', this.line(Rs));
        };

        CorrelationRenderer.prototype.activate = function (depth) {
            this.rootSelection.selectAll('circle.point').style('fill', function (d) {
                return d[0] == depth ? 'red' : 'black';
            });
        };
        return CorrelationRenderer;
    })();
    squid.CorrelationRenderer = CorrelationRenderer;

    function CorrelationRendererFactory(DataManager) {
        function Wrapper() {
            this.DataManager = DataManager;
            CorrelationRenderer.apply(this, arguments);
        }
        Wrapper.prototype = CorrelationRenderer.prototype;
        return Wrapper;
    }
    squid.CorrelationRendererFactory = CorrelationRendererFactory;
    CorrelationRendererFactory.$inject = ['DataManager'];
})(squid || (squid = {}));
var squid;
(function (squid) {
    function SITabController($scope, SIManager, CorrelationRenderer, DistributionRenderer, variableMapRenderer, SIMapRenderer) {
        $scope.currentSI = SIManager.createSI('s', 0, 0.5);
        $scope.depthMin = 0;
        $scope.depthMax = 30;
        $scope.lambdaMin = 0.001;
        $scope.lambdaMax = 0.999;
        $scope.lambdaStep = 0.001;
        $scope.variables = [
            { value: 's', name: 'Salinity' },
            { value: 't', name: 'Temperature' },
            { value: 'u', name: 'Horizontal Velocity (Lon.)' },
            { value: 'v', name: 'Horizontal Velocity (Lat.)' },
            { value: 'w', name: 'Vertical Velocity' },
            { value: 'hm', name: 'Sea Surface Height' },
            { value: 'hmgrad', name: 'Sea Surface Height (grad)' },
            { value: 'mld', name: 'MLD' }
        ];

        $scope.saveSI = function () {
            SIManager.registerSI($scope.currentSI);
            $scope.currentSI = SIManager.createSI($scope.currentSI.variableName, $scope.currentSI.depthIndex, $scope.currentSI.lambda);
        };

        $scope.incrementDepth = function () {
            $scope.currentSI.depthIndex = Math.min($scope.depthMax, +$scope.currentSI.depthIndex + 1);
        };

        $scope.decrementDepth = function () {
            $scope.currentSI.depthIndex = Math.max($scope.depthMin, $scope.currentSI.depthIndex - 1);
        };

        $scope.incrementLambda = function () {
            $scope.currentSI.lambda = Math.min($scope.lambdaMax, +$scope.currentSI.lambda + $scope.lambdaStep);
        };

        $scope.decrementLambda = function () {
            $scope.currentSI.lambda = Math.max($scope.lambdaMin, $scope.currentSI.lambda - $scope.lambdaStep);
        };

        variableMapRenderer.appendTo('#variable-map');
        variableMapRenderer.setSize($('.col-xs-4').width() - 5, $('.col-xs-3').width());
        variableMapRenderer.drawVariable($scope.currentSI.variableName, $scope.currentSI.depthIndex);
        variableMapRenderer.drawParticles();

        SIMapRenderer.appendTo('#si-map');
        SIMapRenderer.setSize($('.col-xs-4').width() - 5, $('.col-xs-3').width());
        SIMapRenderer.drawSI($scope.currentSI);
        SIMapRenderer.drawParticles();

        var correlationRenderer = new CorrelationRenderer('#correlation-graph', $('.col-xs-3').width(), $('.col-xs-3').width());
        correlationRenderer.depthSelected = function (d) {
            $scope.$apply(function () {
                $scope.currentSI.depthIndex = d;
            });
        };
        correlationRenderer.draw($scope.currentSI.variableName, $scope.currentSI.lambda);
        correlationRenderer.activate($scope.currentSI.depthIndex);

        var distributionRenderer = new DistributionRenderer('#scatter-plot-graph', $('.col-xs-3').width(), $('.col-xs-3').width());
        distributionRenderer.draw($scope.currentSI.variableName + $scope.currentSI.depthIndex, $scope.currentSI.lambda);

        $scope.$watch('currentSI.variableName', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                variableMapRenderer.drawVariable($scope.currentSI.variableName, $scope.currentSI.depthIndex);
                SIMapRenderer.drawSI($scope.currentSI);
                correlationRenderer.draw($scope.currentSI.variableName, $scope.currentSI.lambda);
                distributionRenderer.draw($scope.currentSI.variableName + $scope.currentSI.depthIndex, $scope.currentSI.lambda);
            }
        });

        $scope.$watch('currentSI.depthIndex', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                variableMapRenderer.drawVariable($scope.currentSI.variableName, $scope.currentSI.depthIndex);
                SIMapRenderer.drawSI($scope.currentSI);
                correlationRenderer.activate($scope.currentSI.depthIndex);
                distributionRenderer.draw($scope.currentSI.variableName + $scope.currentSI.depthIndex, $scope.currentSI.lambda);
            }
        });

        $scope.$watch('currentSI.lambda', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                SIMapRenderer.drawSI($scope.currentSI);
                correlationRenderer.draw($scope.currentSI.variableName, $scope.currentSI.lambda);
                distributionRenderer.draw($scope.currentSI.variableName + $scope.currentSI.depthIndex, $scope.currentSI.lambda);
            }
        });

        $scope.$watch('DataManager.selectedDate', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                variableMapRenderer.drawVariable($scope.currentSI.variableName, $scope.currentSI.depthIndex);
                variableMapRenderer.drawParticles();
                SIMapRenderer.drawSI($scope.currentSI);
                SIMapRenderer.drawParticles();
            }
        });
    }
    squid.SITabController = SITabController;
    SITabController.$inject = [
        '$scope',
        'SIManager',
        'CorrelationRenderer',
        'DistributionRenderer',
        'variableMapRenderer',
        'SIMapRenderer'
    ];
})(squid || (squid = {}));
var squid;
(function (squid) {
    squid.app = angular.module('squid-hsi', ['ui.router', 'ui.bootstrap']).factory('d3get', [
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
        }]).factory('CorrelationRenderer', squid.CorrelationRendererFactory).factory('DistributionRenderer', squid.DistributionRendererFactory).factory('MapRenderer', squid.MapRendererFactory).service('DataManager', squid.DataManager).service('SIManager', squid.SIManager).service('variableMapRenderer', [
        'MapRenderer', function (MapRenderer) {
            return new MapRenderer;
        }]).service('SIMapRenderer', [
        'MapRenderer', function (MapRenderer) {
            return new MapRenderer;
        }]).service('SIMapRenderer2', [
        'MapRenderer', function (MapRenderer) {
            return new MapRenderer;
        }]).service('HSIMapRenderer', [
        'MapRenderer', function (MapRenderer) {
            return new MapRenderer;
        }]).controller('HSITabController', squid.HSITabController).controller('MainController', squid.MainController).controller('SettingController', squid.SettingController).controller('SITabController', squid.SITabController).config([
        '$compileProvider', function ($compileProvider) {
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|data):/);
        }]).config([
        '$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
            $stateProvider.state('setting', {
                controller: 'SettingController as settings',
                templateUrl: 'partials/setting.html',
                url: '/setting'
            }).state('main', {
                controller: 'MainController',
                templateUrl: 'partials/main.html',
                url: '/main',
                onEnter: [
                    '$state', 'DataManager', function ($state, DataManager) {
                        if (!DataManager.initialized()) {
                            $state.go('setting');
                        }
                    }]
            }).state('main.si', {
                controller: 'SITabController',
                templateUrl: 'partials/si-tab.html',
                url: '/si'
            }).state('main.hsi', {
                controller: 'HSITabController',
                templateUrl: 'partials/hsi-tab.html',
                url: '/hsi'
            });
            $urlRouterProvider.otherwise('/setting');
        }]).config([
        'datepickerConfig', function (datepickerConfig) {
            datepickerConfig.monthFormat = 'MM';
            datepickerConfig.dayTitleFormat = 'yyyy/MM';
            datepickerConfig.showWeeks = false;
        }]).run([
        '$rootScope', function ($rootScope) {
            $rootScope.alerts = [];

            $rootScope.addAlert = function (a) {
                $rootScope.alerts.push(a);
            };

            $rootScope.closeAlert = function (i) {
                $rootScope.alerts.splice(i, 1);
            };
        }]);
})(squid || (squid = {}));
