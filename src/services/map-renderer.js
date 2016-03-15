import angular from 'angular'
import d3 from 'd3'
import THREE from 'three'

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
    for (let i = 0; i < 3; i++) {
      geo.vertices.push(new THREE.Vector3(vList[i][0], vList[i][1], -1));
    }
    var vNum = 3 * cnt;
    geo.faces.push(new THREE.Face3(vNum, vNum + 1, vNum + 2));
    for (let i = 0; i < 3; i++) {
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
        [xList[xi], yList[yi + 1]],
      ];
      var cList = [
        _numTo16Color(values[yi][xi]),
        _numTo16Color(values[yi][xi + 1]),
        _numTo16Color(values[yi + 1][xi + 1]),
        _numTo16Color(values[yi + 1][xi]),
      ];
      _createSquare(vList, cList);
    }
  }

  var material = new THREE.MeshBasicMaterial({
      vertexColors:THREE.VertexColors,
      side:THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, material);
}

const modName = 'squid-hsi.services.map-renderer';

angular.module(modName, []).factory('MapRenderer', ($q, DataManager) => {
  class MapRenderer {
    constructor() {
      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setClearColor(0xffffff, 1.0);
      this.scene = new THREE.Scene();
      this.drawCoastLine();
      var camera = new THREE.OrthographicCamera(-10, 10, 6, -6, 1, 2);

      // render
      var render = () => {
        var xRange = {
          min: lonToX(MapRenderer.lonW),
          max: lonToX(MapRenderer.lonE),
        };
        var yRange = {
          min: latToY(MapRenderer.latS),
          max: latToY(MapRenderer.latN),
        };
        var width = xRange.max - xRange.min;
        var height = yRange.max - yRange.min;
        if (width * 3 / 4 > height) {
          height = width * 3 / 4;
        } else {
          width = height * 4 / 3;
        }
        var camerax = (xRange.max + xRange.min)/2;
        var cameray = (yRange.max + yRange.min)/2;
        camera.left = -width / 2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = -height / 2;
        camera.updateProjectionMatrix();
        camera.position.set(camerax, cameray, 1);
        camera.lookAt(new THREE.Vector3(camerax, cameray, 0));

        requestAnimationFrame(render);
        this.renderer.render(this.scene, camera);
      };

      render();
    }

    appendTo(selector) {
      $(selector).append(this.renderer.domElement);
    }

    setSize(width, height) {
      this.renderer.setSize(width, height);
    }

    drawVariable(variableName, depthIndex) {
      DataManager
        .loadMOVE(variableName, depthIndex, {
          lonFrom: MapRenderer.lonW,
          lonTo: MapRenderer.lonE,
          latFrom: MapRenderer.latS,
          latTo: MapRenderer.latN,
        })
        .then(data => {
          if (this.mesh !== undefined) {
            this.scene.remove(this.mesh);
          }
          var _data = data[0];
          var values = _data[0][0][0];
          var xList = _data[4].map(lonToX);
          var yList = _data[3].map(latToY);
          this.mesh = createMesh(values, xList, yList, Object);
          this.scene.add(this.mesh);
        })
    }

    drawSI(SI) {
      DataManager
        .loadMOVE(SI.variableName, SI.depthIndex, {
          lonFrom: MapRenderer.lonW,
          lonTo: MapRenderer.lonE,
          latFrom: MapRenderer.latS,
          latTo: MapRenderer.latN,
        })
        .then(data => {
          if (this.mesh !== undefined) {
            this.scene.remove(this.mesh);
          }
          var _data = data[0];
          var values = _data[0][0][0];
          var xList = _data[4].map(lonToX);
          var yList = _data[3].map(latToY);
          this.mesh = createMesh(values, xList, yList, v => SI.call(v));
          this.scene.add(this.mesh);
        })
    }

    drawHSI(SIs) {
      $q
        .all(SIs.map(SI => {
          return DataManager.loadMOVE(SI.variableName, SI.depthIndex, {
          lonFrom: MapRenderer.lonW,
          lonTo: MapRenderer.lonE,
          latFrom: MapRenderer.latS,
          latTo: MapRenderer.latN,
        });
        }))
        .then(planes => {
          if (this.mesh !== undefined) {
            this.scene.remove(this.mesh);
          }
          if (SIs.length === 0) {
            return;
          }
          var xList = planes[0][0][4].map(lonToX);
          var yList = planes[0][0][3].map(latToY);
          var n = SIs.length;
          var k;
          var values = yList.map((y, i) => {
            return xList.map((x, j) => {
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
          this.mesh = createMesh(values, xList, yList, Object);
          this.scene.add(this.mesh);
        });
    }

    drawGrid() {
      var xList = [];
      var yList = [];
      var material = new THREE.LineBasicMaterial({ color: 0xaaaaaa }),
          geometry, vertice, line,
          xmin = xList[0], xmax = xList[xList.length-1],
          ymin = yList[0], ymax = yList[yList.length-1];

      xList.forEach(x => {
        geometry = new THREE.Geometry();
        vertice = new THREE.Vector3(x, ymin, -0.5);
        geometry.vertices.push(vertice);
        vertice = new THREE.Vector3(x, ymax, -0.5);
        geometry.vertices.push(vertice);
        line = new THREE.Line(geometry, material);
        this.scene.add(line);
      });

      yList.forEach(y => {
        geometry = new THREE.Geometry();
        vertice = new THREE.Vector3(xmin, y, -0.5);
        geometry.vertices.push(vertice);
        vertice = new THREE.Vector3(xmax, y, -0.5);
        geometry.vertices.push(vertice);
        line = new THREE.Line(geometry, material);
        this.scene.add(line);
      });
    }

    drawParticles() {
      if (this.particles !== undefined) {
        this.scene.remove(this.particles);
      }
      var points = DataManager.getExpectedCPUE();
      var geometry = new THREE.Geometry();
      var material = new THREE.PointsMaterial({
        size: 5,
        sizeAttenuation: false,
        vertexColors: true,
      });

      var scale = d3.scale.linear()
                    .domain(d3.extent(points, (p) => p.cpue))
                    .range([240, 360]);
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

      this.particles = new THREE.Points(geometry, material);
      this.scene.add(this.particles);
    }

    drawCoastLine() {
      d3.json('data/coastl_jpn.json')
        .on('load', data => {
          var lineMaterial = new THREE.LineBasicMaterial({color: 0x000000});
          data.forEach(row => {
            var geometry = new THREE.Geometry();
            row.forEach(pos => {
              var x = lonToX(pos[1]);
              var y = latToY(pos[0]);
              var vertice = new THREE.Vector3(x, y, 0);
              geometry.vertices.push(vertice);
            });
            var line = new THREE.Line(geometry, lineMaterial);
            this.scene.add(line);
          });
        })
        .get();
    }
  }

  MapRenderer.lonW = 180;
  MapRenderer.lonE = 200;
  MapRenderer.latS = 34;
  MapRenderer.latN = 46;

  return MapRenderer
});

export default modName
