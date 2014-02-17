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
var zoom = 80,
    camerax = 228,
    cameray = 158;
var camera = new THREE.OrthographicCamera(rendererWidth/-zoom, rendererWidth/zoom, rendererHeight/zoom, rendererHeight/-zoom, 1, 1000);
camera.position.set(camerax, cameray, 1);
camera.lookAt(new THREE.Vector3(camerax, cameray, 0));

// initialize scene
var scene = new THREE.Scene();

// mercator projection
var r = 128 / Math.PI;
var latitudeToPlane = function(lat){
  var latRad = Math.PI / 180 * lat;
  return r / 2 * Math.log((1.0+Math.sin(latRad))/(1.0-Math.sin(latRad))) + 128;
};
var longitudeToPlane = function(lon){
  var lonRad = Math.PI / 180 * lon;
  return r * (lonRad + Math.PI);
};

var drawCoastLine = function(gml) {
  var material = new THREE.LineBasicMaterial({ color: 0x16a085 });
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
var drawSquare = function(coordinates, size, color16List) {
  var triGeo = new THREE.Geometry();
  var vertexCoordinatesList = [
    [-1.0, 1.0],
    [ 1.0, 1.0],
    [ 1.0,-1.0],
    [-1.0,-1.0],
  ];
  for(var i = 0; i < 2; i++) {
    for (var j = 0; j < 3; j++) {
      if(j==1&&i==1) {
        var k = 3;
      } else {
        var k = j;
      }
      var x = size * vertexCoordinatesList[k][0];
      var y = size * vertexCoordinatesList[k][1];
      triGeo.vertices.push(new THREE.Vector3(x, y, 0));
    }
  }
  triGeo.faces.push(new THREE.Face3(0, 1, 2));
  triGeo.faces.push(new THREE.Face3(3, 4, 5));

  for(var i = 0; i < 2; i++) {
    for (var j = 0; j < 3; j++) {
      if(j==1&&i==1) {
        var k = 3;
      } else {
        var k = j;
      }
      triGeo.faces[i].vertexColors[j] = new THREE.Color(color16List[k]);
    }
  }
  var triMaterial = new THREE.MeshBasicMaterial({
      vertexColors:THREE.VertexColors,
      side:THREE.DoubleSide
  });
  var triMesh = new THREE.Mesh(triGeo, triMaterial);
  triMesh.position.set(longitudeToPlane(coordinates[1]), latitudeToPlane(coordinates[0]), -1);
  console.log(triMesh);
  scene.add(triMesh);
};
drawSquare([38, 145], 2.0, [0xe74c3c, 0xecf0f1, 0x3498db, 0xf1c40f]);

// cubeを上から見る
var cubeGeo = new THREE.CubeGeometry(2, 2, 2);
cubeGeo.faces[8].vertexColors[0] = new THREE.Color(0xecf0f1);
cubeGeo.faces[8].vertexColors[1] = new THREE.Color(0xe74c3c);
cubeGeo.faces[8].vertexColors[2] = new THREE.Color(0x3498db);
cubeGeo.faces[9].vertexColors[0] = new THREE.Color(0xe74c3c);
cubeGeo.faces[9].vertexColors[1] = new THREE.Color(0xf1c40f);
cubeGeo.faces[9].vertexColors[2] = new THREE.Color(0x3498db);
var cubeMaterial = new THREE.MeshBasicMaterial({ vertexColors: THREE.VertexColors });
var cube = new THREE.Mesh(cubeGeo, cubeMaterial);
cube.overdraw = true;
cube.position.set(longitudeToPlane(145), latitudeToPlane(34), -10);
scene.add(cube);

// render
var render = function() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
};

render();
})();