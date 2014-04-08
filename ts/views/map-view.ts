/// <reference path="../typings/d3/d3.d.ts"/>
/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="../typings/threejs/three.d.ts"/>
/// <reference path="../data-manager.ts"/>
/// <reference path="../si-manager.ts"/>

module squid {
var IGNORE_VALUE = -999000000;


export enum ViewMode {
  Variable,
  SI,
  HSI,
  None,
}


export class MapView {
  static $inject = ['$q', 'DataManager', 'SIManager'];
  public showCPUE : boolean;
  public viewMode : ViewMode = ViewMode.Variable;
  private scene;
  private mesh;
  private grid;
  private particles;
  private coastLine;
  private xStart : number;
  private xStop : number;
  private yStart : number;
  private yStop : number;

  constructor(private $q, private parameters : DataManager, private SIManager) {
    var lonS = 178;
    var lonN = 191;
    var latW = 34;
    var latE = 46;
    var debugMode = false;
    var xRange = {
      min: this.lonToX(lonS),
      max: this.lonToX(lonN),
    };
    var yRange = {
      min: this.latToY(latW),
      max: this.latToY(latE),
    };
    var width = xRange.max - xRange.min;
    var height = yRange.max - yRange.min;
    var aspectRatio = height / width;

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
    this.scene = new THREE.Scene();

    // render
    var render = () => {
      requestAnimationFrame(render);
      renderer.render(this.scene, camera);
    };

    render();
    this.draw();
    this.drawMesh();
  }

  draw() {
  }

  private createMesh(values, xList, yList, f) {
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

  private drawVariable(values, xList, yList) {
    this.mesh = this.createMesh(values, xList, yList, Object);
    this.scene.add(this.mesh);
  }

  private drawSI(values, xList, yList) {
    this.mesh = this.createMesh(values, xList, yList, this.SIManager.currentSI);
    this.scene.add(this.mesh);
  }

  private drawHSI(values, xList, yList) {
    var SIs = this.SIManager.SIs.filter(SI => SI.active);
    this.$q
      .all(SIs.map(SI => {
        return this.parameters.loadMOVE(SI.variableName, SI.depthIndex);
      }))
      .then(planes => {
        var n = SIs.length;
        var i, j, k, x, y;
        var values = xList.map((x, i) => {
          return yList.map((y, j) => {
            var hsi = 1;
            for (k = 0; k < n; ++k) {
              var v = planes[k][i][j];
              if (v == IGNORE_VALUE) {
                hsi = NaN;
                break;
              } else {
                hsi *= SIs[k].call(v);
              }
            }
          });
        });
        this.mesh = this.createMesh(values, xList, yList, Object);
        this.scene.add(this.mesh);
      });
  }

  private drawMesh() {
    this.parameters
      .loadMOVE(this.SIManager.currentSI.variableName, this.SIManager.currentSI.depthIndex)
      .then(data => {
        var _data = data[0];
        var values = _data[0][0][0];
        var xList = _data[4].map(d => this.lonToX(d));
        var yList = _data[3].map(d => this.latToY(d));
        if (this.mesh !== undefined) {
          this.scene.remove(this.mesh);
        }
        switch (this.viewMode) {
          case ViewMode.Variable:
            this.drawVariable(values, xList, yList);
            break;
          case ViewMode.SI:
            this.drawSI(values, xList, yList);
            break;
          case ViewMode.HSI:
            this.drawHSI(values, xList, yList);
            break;
          case ViewMode.None:
            this.mesh = undefined;
            break;
        }
      })
      ;
  }

  private drawGrid() {
    var xList = [];
    var yList = [];
    var material = new THREE.LineBasicMaterial({ color: 0xaaaaaa }),
        geometry, x, y, vertice, line,
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

  private drawParticles() {
    if (this.particles !== undefined) {
      this.scene.remove(this.particles);
    }
    if (this.showCPUE) {
      var points = this.parameters.getExpectedCPUE();
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
        vertex.x = this.lonToX(p.x);
        vertex.y = this.latToY(p.y);
        vertex.z = 0;
        geometry.vertices.push( vertex );
        colors[i] = new THREE.Color(_numTo16Color(p.cpue));
      }
      geometry.colors = colors;

      this.particles = new THREE.ParticleSystem(geometry, material);
      this.scene.add(this.particles);
    }
  }

  private drawCoastLine() {
    d3.json('data/coastl_jpn.json')
      .on('load', data => {
        var lineMaterial = new THREE.LineBasicMaterial({color: 0x000000});
        data.forEach(row => {
          var geometry = new THREE.Geometry();
          row.forEach(pos => {
            var x = this.lonToX(pos[1]);
            var y = this.latToY(pos[0]);
            var vertice = new THREE.Vector3(x, y, 0);
            geometry.vertices.push(vertice);
          });
          var line = new THREE.Line(geometry, lineMaterial);
          this.scene.add(line);
        });
      })
      .get();
  }

  private lonToX(lon) {
    var _r = 128 / Math.PI;
    var lonRad = Math.PI / 180 * lon;
    return _r * (lonRad + Math.PI);
  }

  private latToY(lat) {
    var _r = 128 / Math.PI;
    var latRad = Math.PI / 180 * lat;
    return _r / 2 * Math.log((1.0 + Math.sin(latRad)) / (1.0 - Math.sin(latRad))) + 128;
  }
}
}
