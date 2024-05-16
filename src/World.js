var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform int u_textureChoice;
  void main() {
    if (u_textureChoice == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_textureChoice == -1) {
      gl_FragColor = vec4(v_UV,1.0,1.0);
    } else if (u_textureChoice == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_textureChoice == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV) * texture2D(u_Sampler2, v_UV);
    } else if (u_textureChoice == 2) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else if (u_textureChoice == 3) {
      gl_FragColor = texture2D(u_Sampler4, v_UV);
    } else {
      gl_FragColor = vec4(1,.2,.2, 1);      
    }
  }`;

// Globals
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix; 
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;
let u_textureChoice;
let addBlock = false;
let height = Math.floor(Math.random() * 2) + 2;
let map;
let targetValues = [];
var cube = new Cube();
let addedBlocks = [];

//Globals related to UI elements 
let g_globalAngle;
let g_xRotate = 0;
let g_yRotate = 0;
let g_armAngle = 0;
let g_rarmAngle = 0;
let g_larmAngle = 0;
let g_lhandAngle = 0;
let g_rhandAngle = 0;
let g_llegAngle = 0;
let g_rlegAngle = 0;
let g_animation = false;
let g_moveSpeed = 7;
let g_camera;
let shift = 0;
let g_lfarmAngle = 0;
let g_rfarmAngle = 0;
let waving = false;
let waveStartTime = 0;
const waveDuration = 5; // Duration in seconds
let mouseCoords;
let g_world = 1;
let deleteBlock = false;

function setupGLContext() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl', { preserveDrawingBuffer: true });

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of attributes and uniforms
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  u_textureChoice = gl.getUniformLocation(gl.program, 'u_textureChoice');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');

  // Set an initial value for the model matrix to identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function addHTMLActions() {
  // Button Events (Shape Type)
  document.getElementById('animateButton').onclick = function() { g_animation=true; updateAnimationAngles(); };
  document.getElementById('animateOffButton').onclick = function() { g_animation=false; };
  document.getElementById('nightworld').onclick = function() { g_world = 1; renderScene(); };
  document.getElementById('iceworld').onclick = function() { g_world = 2; renderScene(); };

  // Slide Events 
  document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderScene(); });
  document.getElementById('xRotateSlide').addEventListener('mousemove', function() { g_xRotate = this.value; renderScene(); });
  document.getElementById('yRotateSlide').addEventListener('mousemove', function() { g_yRotate = this.value; renderScene(); })
}

function initTextures() {
  let images = [
    { src: 'End_Night_Sky.png', texture: 'u_Sampler0', unit: gl.TEXTURE0 },
    { src: 'top.png', texture: 'u_Sampler1', unit: gl.TEXTURE1 },
    { src: 'top_2.png', texture: 'u_Sampler2', unit: gl.TEXTURE2 },
    { src: 'Amethyst.png', texture: 'u_Sampler3', unit: gl.TEXTURE3 },
    { src: 'sky2.jpg', texture: 'u_Sampler4', unit: gl.TEXTURE4 },
  ];

  images.forEach((imageData, index) => {
    let image = new Image();
    image.onload = function () {
      sendTextureToTextureUnit(image, imageData.unit, imageData.texture);
    };
    image.src = imageData.src;
  });
}

function sendTextureToTextureUnit(image, unit, sampler) {
  let texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(gl.getUniformLocation(gl.program, sampler), unit - gl.TEXTURE0);
}

function main() {
  setupGLContext();
  connectVariablesToGLSL();
  addHTMLActions();
  initializeMap();

  g_camera = new Camera();
  document.onkeydown = keydown;
  canvas.onmousedown = function(ev) { click(ev); }

  initTextures();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.1, 0.1, 0.1, 1.0);

  requestAnimationFrame(tick);
}

function click(ev) {
  let [x, y] = convertCoordinatesEventtoGL(ev);

  if (addBlock) {
    setBlockInFront();
    renderScene();
  } else {
    mouseRotate(ev);
  }
}

function convertCoordinatesEventtoGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);  

  return ([x, y]);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_animation) {
    // Oscillate the right arm angle based on the current time
    g_rarmAngle = 45 * Math.sin((g_seconds / 8) * 4 * g_moveSpeed);
    g_llegAngle = 20 * Math.sin((g_seconds / 8) * 4 * g_moveSpeed);

    // Add a constant phase shift for the left arm, e.g., 0.5 seconds
    const phaseShift = 4;  // This value can be adjusted for more or less delay
    g_larmAngle = 45 * Math.cos(((g_seconds + phaseShift) / 8) * 4 * g_moveSpeed);
    g_rlegAngle = 20 * Math.cos(((g_seconds + phaseShift) / 8) * 4 * g_moveSpeed);
  }

  let currentTime = performance.now() / 1000.0;
  let deltaTime = currentTime - g_seconds;
  g_seconds = currentTime;

  if (waving) {
    let timeElapsed = currentTime - waveStartTime;
    if (timeElapsed <= waveDuration) {
      // Calculate arm waving using a sine function
      let waveAngle = Math.sin(timeElapsed * 2 * Math.PI / waveDuration) * 45; // Oscillate between -45 and 45 degrees
      g_rarmAngle = 90 + waveAngle; // Rotate arm by 90 degrees and oscillate
      g_rfarmAngle = 45 + waveAngle / 2; // Further rotation of the forearm
    } else {
      // Stop waving after the duration ends
      waving = false;
      g_rarmAngle = 90; // Reset to initial position
      g_rfarmAngle = 45;
    }
  }
}

function mouseRotate(ev) {
  mouseCoords = convertCoordinatesEventtoGL(ev);

  if (mouseCoords[0] < 0.5) {
    g_camera.panLeft(mouseCoords[0] * -10);
  } else {
    g_camera.panRight(mouseCoords[0] * +10);
  }
}

function keydown(ev) {
  // Right arrow or 'd'
  let moveSpeed = 0.5;
  let panDegree = 10;

  if (ev.keyCode == 39 || ev.keyCode == 68) { // Capitalize the 'C' in keyCode
    g_camera.moveRight(moveSpeed);
  }
  // Left arrow or 'a'
  else if (ev.keyCode == 37 || ev.keyCode == 65) { // Capitalize the 'C' in keyCode
    g_camera.moveLeft(moveSpeed);
  }
  // Up arrow or 'w'
  else if (ev.keyCode == 38 || ev.keyCode == 87) { // Correct keycode for 'w' and capitalize 'C' in keyCode
    g_camera.moveForward(moveSpeed);
  }
  // Down arrow or 's'
  else if (ev.keyCode == 40 || ev.keyCode == 83) { // Correct keycode for 's' and capitalize 'C' in keyCode
    g_camera.moveBack(moveSpeed);
  }
  // 'q' 
  else if (ev.keyCode == 81) {
    g_camera.panLeft(panDegree);
  }
  // 'e'
  else if (ev.keyCode == 69) {
    g_camera.panRight(panDegree);
  }
  // 'f' to toggle addBlock
  else if (ev.keyCode === 70) {
    addBlock = !addBlock;
    if (addBlock) {
      sendTexttoHtml("Build mode on", 'buildmode', 'rotatemode');
    } else {
      sendTexttoHtml("Build mode off", 'rotatemode', 'buildmode');
    }
  }

  renderScene();
  console.log(ev.keyCode); // Capitalize the 'C' in keyCode
}

function setBlockInFront() {
  // Calculate the position right in front of the camera.
  let lookVector = g_camera.getLookVector(); // Assuming this method returns the direction camera is looking at
  let cameraPos = g_camera.getPosition(); // Assuming this returns {x, y, z} position

  // Calculate the map index
  let targetX = Math.floor(cameraPos.elements[0] + lookVector.elements[0]);
  let targetY = Math.floor(cameraPos.elements[1] + lookVector.elements[1]);
  let targetZ = Math.floor(cameraPos.elements[2] + lookVector.elements[2]);

  targetValues = [targetX, targetY, targetZ];
  console.log(targetX, targetY, targetZ);
  console.log(targetValues);

  if (targetX >= 0 && targetX < 32 && targetY >= 0 && targetY < 32 && targetZ >= 0 && targetZ < 32) {
    if (addBlock && map[targetX][targetY][targetZ] != 1) {
      map[targetX][targetY][targetZ] = 1; // Set to 1 to add a block
      addedBlocks.push(targetValues);
    } else {
      map[targetX][targetY][targetZ] = 0; // Set to 0 to remove a block
      deleteBlock = true;
      addedBlocks.pop(targetValues);
    }
  }
}

function initializeMap() {
  const size = 32; // size of the map
  map = new Array(size);

  // Initialize the map and set the boundaries to 1 (walls)
  for (let x = 0; x < size; x++) {
    map[x] = new Array(size);
    for (let y = 0; y < size; y++) {
      map[x][y] = new Array(size).fill(0);
      if (x == 0 || x == size - 1 || y == 0 || y == size - 1) {
        for (let z = 0; z <= height; z++) {
          map[x][y][z] = 1;
        }
      }
    }
  }

  let clearZoneRadius = 3;
  let offset = Math.floor(size / 2);
  for (let x = 1; x < size - 1; x++) {
    for (let y = 1; y < size - 1; y++) {
      // Skip blocks within the clear zone
      if (Math.abs(x - offset) > clearZoneRadius || Math.abs(y - offset) > clearZoneRadius) {
        if (Math.random() > 0.7) {
          map[x][y][1] = 1; 
        }
      }
    }
  }
}

function drawMap() {
  const size = 32; // size of the map

  // Draw the map based on the map array
  cube.color = [1.0, 1.0, 1.0, 1.0];
  if (g_world == 1) {
    gl.uniform1i(u_textureChoice, 2);
  }
  else {
    gl.uniform1i(u_textureChoice, 3);
  }

  for (let x = 0; x < size; x++) {
    // if (addedBlocks[x]) {
    //   map[addedBlocks[x][0]][addedBlocks[x][1]][addedBlocks[x][2]] = 1;
    // }
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        if (map[x][y][z] === 1) {
          cube.matrix.setIdentity(); // Reset transformation
          cube.matrix.scale(0.5, 1, 0.5);
          cube.matrix.translate(x - 16, z - 2.5, y - 16); // Translate to position
          cube.render();
        }
      }
    }
  }

  if (addBlock && !deleteBlock) {
    gl.uniform1i(u_textureChoice, -2);
    cube.color[1.0, 1.0, 1.0, 1.0];
    cube.matrix.setIdentity();
    cube.matrix.scale(0.5, 0.5, 0.5);
    cube.matrix.translate(-targetValues[0], targetValues[1], targetValues[2] - 7);
    cube.render();
  }
}

function drawEnvironment() {
  // Sky 
  cube.matrix.setIdentity();
  cube.color = [.6, .9, .95, 1];
  gl.uniform1i(u_textureChoice, 0);
  cube.matrix.scale(20, 20, 20);
  cube.matrix.translate(-.5, -.5, -.5);
  cube.render();

  // Ground
  cube.matrix.setIdentity();
  cube.color = [.2, .9, .4, 1];
  if (g_world == 1) {
    gl.uniform1i(u_textureChoice, 1);
  }
  else {
    gl.uniform1i(u_textureChoice, 3);
  }
  cube.matrix.translate(0, -.99, .9);
  cube.matrix.scale(20, 0.1, 20);
  cube.matrix.translate(-.5, 0, -.5);
  cube.render();
}

function drawEnderman() {
  // Body
  if (g_world == 1) {
    gl.uniform1i(u_textureChoice, -2);
  }
  else {
    gl.uniform1i(u_textureChoice, 3);
  }
  var body = new Cube();
  body.color = [0.1, 0.1, .1, 1.0];
  body.matrix.setIdentity();
  body.matrix.translate(-.23, -.05, 0);
  var lupperlegMat = new Matrix4(body.matrix);
  var rupperlegMat = new Matrix4(body.matrix);
  body.matrix.scale(0.3, 0.4, 0.15);
  body.render();

  // Head
  var head = new Cube();
  head.color = [.1, .1, .1, 1.0];
  head.matrix.translate(-.23, .35, -.07);
  var hatbaseMat = new Matrix4(head.matrix);
  head.matrix.scale(0.3, 0.3, 0.3);
  head.render();

  // Legs
  var lupperleg = new Cube();
  lupperleg.color = [.1, .1, .1, 1.0];
  lupperleg.matrix = lupperlegMat;
  lupperleg.matrix.translate(.03, -.38, .13);
  lupperleg.matrix.rotate(g_llegAngle, 1, 0, 0);
  lupperleg.matrix.rotate(180, 1, 0, 0);
  lupperleg.matrix.scale(0.07, .45, 0.07);
  var llegMat = new Matrix4(lupperleg.matrix);
  lupperleg.render();

  var lleg = new Cube();
  lleg.color = [.1, .1, .1, 1.0];
  lleg.matrix = llegMat;
  lleg.matrix.translate(0, -.9, 0);
  lleg.render();

  var rupperleg = new Cube();
  rupperleg.color = [.1, .1, .1, 1.0];
  rupperleg.matrix = rupperlegMat;
  rupperleg.matrix.translate(.18, -.38, .13);
  rupperleg.matrix.rotate(g_rlegAngle, 1, 0, 0);
  rupperleg.matrix.rotate(180, 1, 0, 0);
  rupperleg.matrix.scale(0.07, .45, 0.07);
  var rlegMat = new Matrix4(rupperleg.matrix);
  rupperleg.render();

  var rleg = new Cube();
  rleg.color = [.1, .1, .1, 1.0];
  rleg.matrix = rlegMat;
  rleg.matrix.translate(0, -.9, 0);
  rleg.render();

  // Arms
  var rarm = new Cube();
  rarm.color = [0.1, .1, .1, 1.0];
  rarm.matrix.translate(0.12, -0.3, .05);
  var rfarmMat = new Matrix4(rarm.matrix);
  rarm.matrix.rotate(5, 0, 0, 1);
  rarm.matrix.scale(0.06, .6, 0.06);
  rarm.render();

  var rfarm = new Cube();
  rfarm.color = [0.1, .1, .1, 1.0];
  rfarm.matrix = rfarmMat;
  rfarm.matrix.translate(0, 0.01, 0.06);
  rfarm.matrix.rotate(180, 1, 0, 0);
  rfarm.matrix.rotate(g_rarmAngle, 1, 0, 0);
  rfarm.matrix.rotate(5, 0, 0, 1);
  var rhandMat = new Matrix4(rfarm.matrix);
  rfarm.matrix.scale(0.06, .3, 0.06);
  rfarm.render();

  var larm = new Cube();
  larm.color = [.1, .1, .1, 1.0];
  larm.matrix.translate(-.33, -.3, 0.05);
  var lfarmMat = new Matrix4(larm.matrix);
  larm.matrix.rotate(-5, 0, 0, 1);
  larm.matrix.scale(.06, .6, .06);
  larm.render();

  var lfarm = new Cube();
  lfarm.color = [0.1, .1, .1, 1.0];
  lfarm.matrix = lfarmMat;
  lfarm.matrix.translate(0, 0.01, 0.06);
  lfarm.matrix.rotate(180, 1, 0, 0);
  lfarm.matrix.rotate(g_larmAngle, 1, 0, 0);
  lfarm.matrix.rotate(-5, 0, 0, 1);
  var lhandMat = new Matrix4(lfarm.matrix);
  lfarm.matrix.scale(0.06, .3, 0.06);
  lfarm.render();

  // Hands
  var lhand = new Cube();
  lhand.color = [.37, .37, .37, 1];
  lhand.matrix = lhandMat;
  lhand.matrix.translate(0, .3, 0);
  lhand.matrix.rotate(g_lhandAngle, 1, 0, 0);
  lhand.matrix.scale(0.06, .1, 0.06);
  lhand.render();

  var rhand = new Cube();
  rhand.color = [.37, .37, .37, 1];
  rhand.matrix = rhandMat;
  rhand.matrix.translate(0, .3, 0);
  rhand.matrix.rotate(g_rhandAngle, 1, 0, 0);
  rhand.matrix.scale(0.06, .1, 0.06);
  rhand.render();

  // Eyes
  var leye = new Cube();
  leye.color = [.718, .431, .768, 0.8];
  leye.matrix.translate(-0.2, .5, -.08);
  leye.matrix.scale(0.08, .04, 0.08);
  leye.render();

  var liris = new Cube();
  liris.color = [.718, .431, .768, 1];
  liris.matrix.translate(-0.18, .5, -.09);
  liris.matrix.scale(0.04, 0.04, 0.08);
  liris.render();

  var reye = new Cube();
  reye.color = [.718, .431, .768, 0.8];
  reye.matrix.translate(-.05, .5, -.08);
  reye.matrix.scale(0.08, .04, 0.08);
  reye.render();

  var riris = new Cube();
  riris.color = [.718, .431, .768, 1];
  riris.matrix.translate(-0.03, .5, -.09);
  riris.matrix.scale(0.04, 0.04, 0.08);
  riris.render();

  // Hat
  var hatbase = new Cylinder();
  hatbase.color = [.3, .3, .3, 1];
  hatbase.matrix = hatbaseMat;
  hatbase.matrix.translate(0.16, 0.31, 0.14);
  hatbase.matrix.rotate(90, 1, 0, 0);
  var hattopMat = new Matrix4(hatbase.matrix);
  hatbase.matrix.scale(10, 10, 1);
  hatbase.render();

  var hattop = new Cylinder();
  hattop.color = [.33, .33, .33, 1];
  hattop.matrix = hattopMat;
  hattop.matrix.translate(0, 0, -0.15);
  hattop.matrix.scale(6, 6, 4);
  hattop.render();

  // End of Enderman Drawing
}

function renderScene() {
  // Check the time at the start of this function
  var startTime = performance.now();

  // Pass the matrix to u_ProjectionMatrix attribute
  var projMat = g_camera.projMat;
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  // Pass the matrix to u_ViewMatrix attribute
  var viewMat = g_camera.viewMat;
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  // Pass the matrix to u_ModelMatrix attribute
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  globalRotMat.rotate(g_xRotate, 1, 0, 0);
  globalRotMat.rotate(g_yRotate, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Walls
  drawMap();
  drawEnvironment();
  drawEnderman();

  // Check the time at the end of the function, and print on webpage
  var duration = performance.now() - startTime;
  sendTexttoHtml(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration), 'stats');
}

function sendTexttoHtml(text, htmlID, clearID) {
  var htmlElm = document.getElementById(htmlID);
  var clearElm = document.getElementById(clearID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
  }
  htmlElm.innerHTML = text;
  if (clearElm) {
    clearElm.innerHTML = '';
  }
}
