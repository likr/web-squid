/// <reference path="squid-hsi.ts"/>
/// <reference path="typings/jquery/jquery.d.ts"/>
/// <reference path="typings/threejs/three.d.ts"/>
/// <reference path="lib/jsdap.d.ts"/>

module squid {
var IGNORE_VALUE = -999000000;

var mercatrProjection = (function () {
  var _r = 128 / Math.PI;
  var _lonToX = function(lon) {
    var lonRad = Math.PI / 180 * lon;
    return _r * (lonRad + Math.PI);
  };
  var _latToY = function (lat) {
    var latRad = Math.PI / 180 * lat;
    return _r / 2 * Math.log((1.0 + Math.sin(latRad))/(1.0 - Math.sin(latRad))) + 128;
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
  }
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
  var extents = values.map(row => {
    return d3.extent(row.filter(v => v != IGNORE_VALUE), f);
  });
  var min = d3.min(extents, d => d[0]);
  var max = d3.max(extents, d => d[1]);
  var scale = d3.scale.linear()
                .domain([min, max])
                .range([240, 0]);
  var _numTo16Color = function (num) {
    var v = f(num);
    if (num == IGNORE_VALUE || isNaN(v)){
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
      vertexColors:THREE.VertexColors,
      side:THREE.DoubleSide
  });
  return new THREE.Mesh(geo, material);
}

app.controller('MapController', ['$scope', function($scope) {
  var lonS = 140;
  var lonN = 148;
  var latW = 35;
  var latE = 43;
  var debugMode = false;
  var xRange = {min: mercatrProjection.lonToX(lonS), max: mercatrProjection.lonToX(lonN)},
      yRange = {min: mercatrProjection.latToY(latW), max: mercatrProjection.latToY(latE)},
      width = xRange.max - xRange.min,
      height = yRange.max - yRange.min,
      aspectRatio = height / width;

  // initialize renderer
  var stage = $('div#stage');
  stage.height(aspectRatio * stage.width());
  var renderer = new THREE.WebGLRenderer(),
      rendererWidth  = stage.innerWidth(),
      rendererHeight = stage.innerHeight();
  renderer.setSize(rendererWidth, rendererHeight);
  renderer.setClearColor(<any>0xffffff, 1.0);
  stage.append(renderer.domElement);

  // initialize camera
  var camerax = (xRange.max + xRange.min)/2,
      cameray = (yRange.max + yRange.min)/2;
  var camera = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/-2, 1, 2);
  camera.position.set(camerax, cameray, 1);
  camera.lookAt(new THREE.Vector3(camerax, cameray, 0));

  // initialize scene
  var scene = new THREE.Scene();

  var drawCoastLine = function () {
    d3.json('data/coastl_jpn.json')
      .on('load', data => {
        var lineMaterial = new THREE.LineBasicMaterial({color: 0x000000});
        data.forEach(row => {
          var geometry = new THREE.Geometry();
          row.forEach(pos => {
            var x = mercatrProjection.lonToX(pos[1]);
            var y = mercatrProjection.latToY(pos[0]);
            var vertice = new THREE.Vector3(x, y, 0);
            geometry.vertices.push(vertice);
          });
          var line = new THREE.Line(geometry, lineMaterial);
          scene.add(line);
        });
      })
      .get();
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
          points = points.concat($scope.originalCpueVar.filter(point => {
            return point.date.getFullYear() == $scope.selectedDate.getFullYear()
            && point.date.getMonth() == $scope.selectedDate.getMonth()
            && point.date.getDate() == $scope.selectedDate.getDate();
          }));
        }
      }
      var geometry = new THREE.Geometry();
      var material = new THREE.ParticleSystemMaterial({
        size: 5,
        sizeAttenuation: false,
        vertexColors: true
      });

      var scale = d3.scale.linear()
                    .domain(d3.extent(points, (p : any) => p.cpue))
                    .range([240, 360]);
      var _numTo16Color = function (num) {
        return d3.hsl(scale(num), 1, 0.5).toString();
      };

      var colors = [];
      for ( var i = 0; i < points.length; i ++ ) {
        var p = points[i];
        var vertex = new THREE.Vector3();
        vertex.x = mercatrProjection.lonToX(p.x);
        vertex.y = mercatrProjection.latToY(p.y);
        vertex.z = 0;
        geometry.vertices.push( vertex );
        colors[i] = new THREE.Color(_numTo16Color(p.cpue));
      }
      geometry.colors = colors;

      particles = new THREE.ParticleSystem(geometry, material);
      scene.add(particles);
    }
  };

  var drawGrid = function (xList, yList) {
    var material = new THREE.LineBasicMaterial({ color: 0xaaaaaa }),
        geometry, x, y, vertice, line,
        xmin = xList[0], xmax = xList[xList.length-1],
        ymin = yList[0], ymax = yList[yList.length-1];

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
  var render = function() {
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
        var SIs = $scope.SIs.filter(SI => SI.active);
        mesh = createMesh(grid, xList, yList, d => {
          var xi = d[0];
          var yi = d[1];
          var hsi = 1;
          SIs.forEach(SI => {
            hsi *= SI.SIFunction(dataCache[SI.date + SI.variable.toLowerCase() + SI.depth][0][0][0][0][yi][xi])
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
      grid = yList.map((_, j) => xList.map((_, i) => [i, j]));
      if (debugMode) {
        drawGrid(xList, yList);
      }
    }
    paint(values, xList, yList);
  }
  function draw () {
    var v = $scope.selectedVariable.toLowerCase();
    var d = $scope.selectedDepth;
    var dateIndex = (() => {
      var date = $scope.selectedDate;
      var startDate : any = new Date(2006, 0, 10);
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
      var dataUrl = 'http://priusa.yes.jamstec.go.jp/opendap/' + v + '.dods?' + v + '[' + dateIndex + '][' + d + '][202:282][242:302]';
      loadData(dataUrl, function(data) {
        drawData(dataCache[key] = data);
      });
    }
  }

  $scope.view = 'variable';
  $scope.showWholeCPUE = true;
  $scope.showExpectedCPUE = false;

  $scope.$watch('selectedVariable', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      if ($scope.view != 'hsi') {
        draw();
      }
    }
  });

  $scope.$watch('selectedDepth', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      if ($scope.view != 'hsi') {
        draw();
      }
    }
  });

  $scope.$watch('selectedDate', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      draw();
    }
  });

  $scope.$watch('lambda', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      if ($scope.view == 'si') {
        draw();
      }
    }
  });

  $scope.$watch('cpueVar', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      if ($scope.view != 'variable') {
        draw();
      }
      markPoints();
    }
  });

  $scope.$watch('view', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      draw();
    }
  });

  $scope.$watch('showWholeCPUE', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      markPoints();
    }
  });

  $scope.$watch('showExpectedCPUE', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      markPoints();
    }
  });

  $scope.$watch('SIs.length', (newValue, oldValue) => {
    if (newValue !== oldValue) {
      if ($scope.view == 'hsi') {
        draw();
      }
    }
  });

  $scope.activeSICount = () => {
    return $scope.SIs.filter(SI => SI.active).length;
  };

  $scope.$watch('activeSICount()', (newValue, oldValue) => {
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
}
