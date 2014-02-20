(function(){
// initialize renderer
var stage = $('div#stage');
var renderer = new THREE.WebGLRenderer(),
    rendererWidth  = stage.innerWidth(),
    rendererHeight = stage.innerHeight();
renderer.setSize(rendererWidth, rendererHeight);
renderer.setClearColor(0xffffff, 1.0);
stage.append(renderer.domElement);

// initialize camera
var zoom = 100,
    camerax = 227.9,
    cameray = 158;
var camera = new THREE.OrthographicCamera(rendererWidth/-zoom, rendererWidth/zoom, rendererHeight/zoom, rendererHeight/-zoom, 1, 1000);
camera.position.set(camerax, cameray, 1);
camera.lookAt(new THREE.Vector3(camerax, cameray, 0));

// initialize scene
var scene = new THREE.Scene();

// mercator projection
var r = 128 / Math.PI;
var latitudeToPlane = function (lat) {
  var latRad = Math.PI / 180 * lat;
  return r / 2 * Math.log((1.0+Math.sin(latRad))/(1.0-Math.sin(latRad))) + 128;
};
var longitudeToPlane = function(lon){
  var lonRad = Math.PI / 180 * lon;
  return r * (lonRad + Math.PI);
};

var drawCoastLine = function(gml) {
  var material = new THREE.LineBasicMaterial({ color: 0x000000 });
  $(gml).find('coastl').each(function() {
    var posList = $(this).find('posList')[0].innerHTML.split(' ');
    var geometry = new THREE.Geometry();
    for (var i = 0; i < posList.length - 1; i += 2) {
      var vertice = new THREE.Vector3(longitudeToPlane(posList[i + 1]), latitudeToPlane(posList[i]), 0);
      geometry.vertices.push(vertice);
    }
    var line = new THREE.Line(geometry, material);
    scene.add(line);
  });
};
// load gml
$.ajax({
  url: "data/coastl_jpn.gml",
  dataType: "xml",
  error: function() { alert('Error loading XML document'); },
  success: drawCoastLine
});

// 明石市テスト
var geometry = new THREE.CircleGeometry(0.1, 10);
var mesh = new THREE.Mesh( geometry );
mesh.position = new THREE.Vector3(longitudeToPlane(135), latitudeToPlane(34.65), 0);
scene.add(mesh);

// 三角形を2つ組み合わせて正方形を作る
var drawSquare = function(vertexCoordinatesList, color16List) {
  var squGeo = new THREE.Geometry();
  for (var i = 0; i < 2; i++) {
    for (var j = 0; j < 3; j++) {
      if(j==1&&i==1) {
        var k = 3;
      } else {
        var k = j;
      }
      var x = longitudeToPlane(vertexCoordinatesList[k][0]);
      var y = latitudeToPlane(vertexCoordinatesList[k][1]);
      squGeo.vertices.push(new THREE.Vector3(x, y, -1));
    }
  }
  squGeo.faces.push(new THREE.Face3(0, 1, 2));
  squGeo.faces.push(new THREE.Face3(3, 4, 5));

  for(var i = 0; i < 2; i++) {
    for (var j = 0; j < 3; j++) {
      if(j==1&&i==1) {
        var k = 3;
      } else {
        var k = j;
      }
      squGeo.faces[i].vertexColors[j] = new THREE.Color(color16List[k]);
    }
  }
  var squMaterial = new THREE.MeshBasicMaterial({
      vertexColors:THREE.VertexColors,
      side:THREE.DoubleSide
  });
  var squMesh = new THREE.Mesh(squGeo, squMaterial);
  scene.add(squMesh);
};

// グリッド描写
var drawGrid = function(xList, yList) {
  var material = new THREE.LineBasicMaterial({ color: 0xaaaaaa }),
      xmin = xList[0],
      xmax = xList[xList.length-1],
      ymin = yList[0],
      ymax = yList[yList.length-1];

  for (var i = xList.length - 1; i >= 0; i--) {
    var geometry = new THREE.Geometry();
    var x = xList[i];
    var vertice = new THREE.Vector3(x, ymin, -0.5);
    geometry.vertices.push(vertice);
    var vertice = new THREE.Vector3(x, ymax, -0.5);
    geometry.vertices.push(vertice);
    var line = new THREE.Line(geometry, material);
    scene.add(line);
  }

  for (var i = yList.length - 1; i >= 0; i--) {
    var geometry = new THREE.Geometry();
    var y = yList[i];
    var vertice = new THREE.Vector3(xmin, y, -0.5);
    geometry.vertices.push(vertice);
    var vertice = new THREE.Vector3(xmax, y, -0.5);
    geometry.vertices.push(vertice);
    var line = new THREE.Line(geometry, material);
    scene.add(line);
  }
};

var xList = [], yList = [];
$.ajax({
  url: 'data/x.csv',
  type: 'get',
  dataType: 'html',
  async: false,
  success: function(lonListCsv) {
    var lonList = CSV.parse(lonListCsv)[0];
    for (var i = lonList.length - 1; i >= 0; i--) {
      xList[i] = longitudeToPlane(lonList[i]);
    }
  }
});
$.ajax({
  url: 'data/y.csv',
  type: 'get',
  dataType: 'html',
  async: false,
  success: function(latListCsv) {
    var latList = CSV.parse(latListCsv)[0];
    for (var i = latList.length - 1; i >= 0; i--) {
      yList[i] = latitudeToPlane(latList[i]);
    }
  }
});
drawGrid(xList, yList);


var rows;
$.ajax({
  url: 'data/kiri.csv',
  type: 'get',
  dataType: 'html',
  async: false,
  success: function(data) {
    rows = CSV.parse(data);
  }
});

function toColor(num) {
  return + ("0x"+rainbow.colourAt(num));
}

var rainbow = new Rainbow();
var len = rows.length,
    max = 0,
    min = 99;
for (var i = len - 1; i >= 0; i--) {
  if (max < rows[i][2]) { max = rows[i][2]; }
}
for (var i = len - 1; i >= 0; i--) {
  if (min > rows[i][2]) { min = rows[i][2]; }
}
min = 34; // 決め打ち
rainbow.setNumberRange(min, max);
for (var i = 0, len = len - 443; i < len; i += 1) {
  if (i != 441 && i % 442 != 441) {
    var ulv = rows[i],
        urv = rows[i+442],
        lrv = rows[i+443],
        llv = rows[i+1],
        vertexCoordinatesList = [
          [ulv[0], ulv[1]],
          [urv[0], urv[1]],
          [lrv[0], lrv[1]],
          [llv[0], llv[1]]
        ],
        colors = [toColor(ulv[2]), toColor(urv[2]), toColor(lrv[2]), toColor(llv[2])];
    drawSquare(vertexCoordinatesList, colors);
  }
}

// render
var render = function() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
};

render();
})();