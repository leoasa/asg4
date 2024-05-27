// Vertex shader
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_vertPos;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1.0)));
    v_vertPos = u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_vertPos;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform int u_textureChoice;
  uniform vec3 u_lightPos;
  uniform vec3 u_spotLightPos;
  uniform vec3 u_spotLightDir;
  uniform vec3 u_cameraPos;
  uniform vec3 u_lightColor;
  uniform vec3 u_spotLightColor;
  uniform bool u_lightingEnabled;
  uniform bool u_normalsEnabled;
  uniform float u_spotLightCutOff;
  uniform float u_spotLightOuterCutOff;
  void main() {
    vec4 textureColor;
    if (u_textureChoice == -3) {
      textureColor = vec4((v_Normal + 1.0) / 2.0, 1.0); // Use normal as texture color
    } else if (u_textureChoice == -2) {
      textureColor = u_FragColor;
    } else if (u_textureChoice == -1) {
      textureColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_textureChoice == 0) {
      textureColor = texture2D(u_Sampler4, v_UV);
    } else if (u_textureChoice == 1) {
      textureColor = texture2D(u_Sampler1, v_UV);
    } else if (u_textureChoice == 2) {
      textureColor = texture2D(u_Sampler3, v_UV);
    } else if (u_textureChoice == 3) {
      textureColor = texture2D(u_Sampler4, v_UV);
    } else {
      textureColor = vec4(1, .2, .2, 1);
    }

    vec3 lightVector = u_lightPos - vec3(v_vertPos);
    float r = length(lightVector);

    // N dot L
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N, L), 0.0);

    // Reflection
    vec3 R = reflect(-L, N);

    // Eye
    vec3 E = normalize(u_cameraPos - vec3(v_vertPos));

    // Specular
    float specular = pow(max(dot(E, R), 0.0), 10.0) * 0.5;

    vec3 diffuse = vec3(textureColor) * nDotL * 0.8;
    vec3 ambient = vec3(textureColor) * 0.3;

    // Spotlight calculations
    vec3 spotLightVector = u_spotLightPos - vec3(v_vertPos);
    float spotLightDistance = length(spotLightVector);
    vec3 spotLightL = normalize(spotLightVector);
    float theta = dot(spotLightL, normalize(-u_spotLightDir));
    float epsilon = u_spotLightCutOff - u_spotLightOuterCutOff;
    float intensity = clamp((theta - u_spotLightOuterCutOff) / epsilon, 0.0, 1.0);

    vec3 spotLightDiffuse = vec3(textureColor) * nDotL * 0.8 * intensity * vec3(u_spotLightColor);
    vec3 spotLightAmbient = vec3(textureColor) * 0.3 * intensity * vec3(u_spotLightColor);

    if (u_lightingEnabled) {
      gl_FragColor = vec4(specular + diffuse + ambient + spotLightDiffuse + spotLightAmbient, 1.0); // Preserve alpha from texture
    } else {
      gl_FragColor = textureColor;
    }
  }`;





// Globals
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_FragColor;
let u_NormalMatrix;
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
let u_lightPos;
let u_cameraPos;
let u_lightingEnabled;
let u_lightColor;
let u_spotLightPos;
let u_spotLightDir;
let u_spotLightColor;
let u_spotLightCutOff;
let u_spotLightOuterCutOff;
let spotLightColor = [1.0, 0.0, 0.0];
let spotLightPos = [0, 1, 6];
let spotLightDir = [0, -1, 0];
let spotLightCutOff = Math.cos(12.5 * Math.PI / 180.0);
let spotLightOuterCutOff = Math.cos(17.5 * Math.PI / 180.0);
let g_camera;
let g_lightPos = [0, 1, 2];
let g_globalAngle = 0;
let g_animation = true;
let lightingEnabled = true;
let normalsEnabled = false;
let lightColor = [1.0, 1.0, 1.0];
let lightIntensity = 5;
let cube = new Cube();

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
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  u_textureChoice = gl.getUniformLocation(gl.program, 'u_textureChoice');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  u_spotLightPos = gl.getUniformLocation(gl.program, 'u_spotLightPos');
  u_spotLightDir = gl.getUniformLocation(gl.program, 'u_spotLightDir');
  u_lightingEnabled = gl.getUniformLocation(gl.program, 'u_lightingEnabled');
  u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
  u_spotLightColor = gl.getUniformLocation(gl.program, 'u_spotLightColor');
  u_spotLightCutOff = gl.getUniformLocation(gl.program, 'u_spotLightCutOff');
  u_spotLightOuterCutOff = gl.getUniformLocation(gl.program, 'u_spotLightOuterCutOff');

  // Set an initial value for the model matrix to identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function addHTMLActions() {
  // Button Events
  document.getElementById('lightingonButton').onclick = function() { lightingEnabled = true; renderScene(); };
  document.getElementById('lightingoffButton').onclick = function() { lightingEnabled = false; renderScene(); };
  document.getElementById('normalsonButton').onclick = function() { normalsEnabled = true; renderScene(); };
  document.getElementById('normalsoffButton').onclick = function() { normalsEnabled = false; renderScene(); };
  document.getElementById('animationonButton').onclick = function() { g_animation = true; renderScene(); }
  document.getElementById('animationoffButton').onclick = function() { g_animation = false; renderScene(); }

  // Slider Events
  document.getElementById('lightXSlider').addEventListener('mousemove', function(ev) { if (ev.buttons == 1) { g_lightPos[0] = this.value/100; renderScene(); }});
  document.getElementById('lightYSlider').addEventListener('mousemove', function(ev) { if (ev.buttons == 1) { g_lightPos[1] = this.value/100; renderScene(); }});
  document.getElementById('lightZSlider').addEventListener('mousemove', function(ev) { if (ev.buttons == 1) { g_lightPos[2] = -this.value/100; renderScene(); }});
  document.getElementById('lightColorRSlider').addEventListener('mousemove', function(ev) { if (ev.buttons == 1) { lightColor[0] = this.value/1000; renderScene(); }});
  document.getElementById('lightColorGSlider').addEventListener('mousemove', function(ev) { if (ev.buttons == 1) { lightColor[1] = this.value/1000; renderScene(); }});
  document.getElementById('lightColorBSlider').addEventListener('mousemove', function(ev) { if (ev.buttons == 1) { lightColor[2] = this.value/1000; renderScene(); }});

  canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev) }};

}

function initTextures() {
  let images = [
    { src: 'End_Night_Sky.png', texture: 'u_Sampler0', unit: gl.TEXTURE0 },
    { src: 'top.png', texture: 'u_Sampler1', unit: gl.TEXTURE1 },
    { src: 'top_2.png', texture: 'u_Sampler2', unit: gl.TEXTURE2 },
    { src: 'dirt.png', texture: 'u_Sampler3', unit: gl.TEXTURE3 },
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
  
  g_camera = new Camera();
  canvas.onmousedown = click;
  canvas.onmousemove = click;

  initTextures();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.1, 0.1, 0.1, 1.0);

  requestAnimationFrame(tick);
}

function click(ev) {
  let [x, y] = convertCoordinatesEventtoGL(ev);
  // Handle click event if needed

  mouseRotate(ev, [x,y]);
}

function mouseRotate(ev, coords) {
  let mouseCoords = coords;

  if (mouseCoords[0] < 0.5) {
    g_camera.panLeft(mouseCoords[0] * -10);
  } else {
    g_camera.panRight(mouseCoords[0] * +10);
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

function drawEnvironment() {
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_cameraPos,g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2]);
  gl.uniform1i(u_lightingEnabled, lightingEnabled);
  gl.uniform3f(u_lightColor, lightColor[0], lightColor[1], lightColor[2]);

  gl.uniform3f(u_spotLightPos, spotLightPos[0], spotLightPos[1], spotLightPos[2]);
  gl.uniform3f(u_spotLightDir, spotLightDir[0], spotLightDir[1], spotLightDir[2]);
  gl.uniform3f(u_spotLightColor, spotLightColor[0], spotLightColor[1], spotLightColor[2]);
  gl.uniform1f(u_spotLightCutOff, spotLightCutOff);
  gl.uniform1f(u_spotLightOuterCutOff, spotLightOuterCutOff);

  // Light
  if (lightingEnabled) {
    cube.matrix.setIdentity();
    cube.color = [1, 1, 0, 1];
    gl.uniform1i(u_textureChoice, -2);
    cube.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    cube.matrix.scale(0.1, 0.1, 0.1);
    cube.matrix.translate(-0.5, -0.5, -0.5);
    cube.render();
  }

  // Sky
  cube.matrix.setIdentity();
  cube.color = [0.6, 0.9, 0.95, 1];
  if (normalsEnabled) {
    gl.uniform1i(u_textureChoice, -3); // Use normal as texture
  } else {
    gl.uniform1i(u_textureChoice, 0);
  }
  cube.matrix.scale(7, 7, 14);
  cube.matrix.translate(-0.5, -0.5, -0.5);
  cube.normalMatrix.setInverseOf(cube.matrix).transpose();
  cube.normalMatrix.rotate(180, 0, 1, 0);
  cube.render();

  // Ground
  cube.matrix.setIdentity();
  cube.color = [0.2, 0.9, 0.4, 1];
  gl.uniform1i(u_textureChoice, 1);
  cube.matrix.translate(0, -2.99, 0.9);
  cube.matrix.scale(7, 0.1, 14);
  cube.matrix.translate(-0.5, 0, -0.5);
  cube.render();

  // Sphere
  var sphere = new Sphere();
  sphere.color = [1.0, 1.0, 1.0, 1.0];
  if (normalsEnabled) {
    gl.uniform1i(u_textureChoice, -3); // Use normal as texture
  } else {
    gl.uniform1i(u_textureChoice, -2);
  }
  sphere.matrix.translate(-1, -1, 0.9);
  sphere.matrix.scale(0.5, 0.5, 0.5);
  sphere.normalMatrix.setInverseOf(sphere.matrix).transpose();
  sphere.render();
}

function drawEnderman() {
  gl.uniform1i(u_textureChoice, -2);
  var body = new Cube();
  body.color = [0.1, 0.1, .1, 1.0];
  body.matrix.setIdentity();
  body.matrix.translate(-.23, -.05, 0);
  var lupperlegMat = new Matrix4(body.matrix);
  var rupperlegMat = new Matrix4(body.matrix);
  body.matrix.scale(0.3, 0.4, 0.15);
  body.normalMatrix.setInverseOf(body.matrix).transpose();
  body.render();

  // Head
  var head = new Cube();
  head.color = [.1, .1, .1, 1.0];
  head.matrix.translate(-.23, .35, -.07);
  head.matrix.scale(0.3, 0.3, 0.3);
  head.normalMatrix.setInverseOf(head.matrix).transpose();
  head.render();

  // Legs
  var lupperleg = new Cube();
  lupperleg.color = [.1, .1, .1, 1.0];
  lupperleg.matrix = lupperlegMat;
  lupperleg.matrix.translate(.03, -.38, .13);
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
  lfarm.matrix.rotate(-5, 0, 0, 1);
  var lhandMat = new Matrix4(lfarm.matrix);
  lfarm.matrix.scale(0.06, .3, 0.06);
  lfarm.render();

  // Hands
  var lhand = new Cube();
  lhand.color = [.37, .37, .37, 1];
  lhand.matrix = lhandMat;
  lhand.matrix.translate(0, .3, 0);
  lhand.matrix.scale(0.06, .1, 0.06);
  lhand.render();

  var rhand = new Cube();
  rhand.color = [.37, .37, .37, 1];
  rhand.matrix = rhandMat;
  rhand.matrix.translate(0, .3, 0);
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
  
  // End of Enderman Drawing

}

function drawWalls() {

  // Walls

  // Draw the map based on the map arrays
  cube.matrix.setIdentity(); // Reset transformation
  cube.color = [1.0,1.0,1.0,1.0];
  if (normalsEnabled) { 
    gl.uniform1i(u_textureChoice, -3);
  }
  else {
    gl.uniform1i(u_textureChoice, 2);
  }
  cube.matrix.scale(1, 1, 1);
  cube.matrix.translate(0, -3, 6); // Translate to position
  cube.normalMatrix.setInverseOf(cube.matrix).transpose();
  cube.render();

  cube.matrix.setIdentity();
  cube.matrix.scale(1, 1, 1);
  cube.matrix.translate(1, -3, 6); // Translate to position
  cube.normalMatrix.setInverseOf(cube.matrix).transpose();
  cube.render();

  cube.matrix.setIdentity();
  cube.matrix.scale(1, 1, 1);
  cube.matrix.translate(2, -3, 6);
  cube.normalMatrix.setInverseOf(cube.matrix).transpose();
  cube.render();

  cube.matrix.setIdentity();
  cube.matrix.scale(1, 1, 1);
  cube.matrix.translate(1, -2, 6); // Translate to position
  cube.normalMatrix.setInverseOf(cube.matrix).transpose();
  cube.render();

  cube.matrix.setIdentity();
  cube.matrix.scale(1, 1, 1);
  cube.matrix.translate(2, -1, 6);
  cube.normalMatrix.setInverseOf(cube.matrix).transpose();
  cube.render();

  cube.matrix.setIdentity();
  cube.matrix.scale(1, 1, 1);
  cube.matrix.translate(2, -2, 5);
  cube.normalMatrix.setInverseOf(cube.matrix).transpose();
  cube.render();

  cube.matrix.setIdentity();
  cube.matrix.scale(1, 1, 1);
  cube.matrix.translate(2, -3, 4);
  cube.normalMatrix.setInverseOf(cube.matrix).transpose();
  cube.render();

  cube.matrix.setIdentity();
  cube.matrix.scale(1, 1, 1);
  cube.matrix.translate(2, -3, 5);
  cube.normalMatrix.setInverseOf(cube.matrix).transpose();
  cube.render();
}

function updateAnimationAngles() {
  if (g_animation) {
    g_lightPos[0] = Math.cos(g_seconds);
  }
  // g_lightPos[1] = Math.sin(g_seconds); // Corrected light rotation
  // g_lightPos[2] = -Math.sin(g_seconds); // Corrected light rotation
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
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  drawEnvironment();
  drawEnderman();
  drawWalls();

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
