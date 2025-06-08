
var gl; // глобальная переменная для контекста WebGL
var mvMatrix = mat4.create();  // Матрица модели
var pMatrix = mat4.create();   // Матрица перспективы
var mvMatrixStack = []; // Стек для хранения матриц// Текущая матрица модели-вида

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

  gl.uniformMatrix4fv(pUniform, false, perspectiveMatrix);
  gl.uniformMatrix4fv(mvUniform, false, mvMatrix);
}

function makePerspective(fov, aspect, near, far) {
  var f = 1.0 / Math.tan(fov * Math.PI / 360.0);
  var rangeInv = 1.0 / (near - far);

  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ];
}

function loadIdentity() {
  mvMatrix = mat4.create();
}
function mvPushMatrix() {
  var copy = mat4.create();
  mat4.copy(copy, mvMatrix);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length === 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

function mvTranslate(translation) {
  mat4.translate(mvMatrix, mvMatrix, translation);
}

function mvRotate(angle, axis) {
  mat4.rotate(mvMatrix, mvMatrix, glMatrix.toRadian(angle), axis);
}

function mvScale(scale) {
  mat4.scale(mvMatrix, mvMatrix, scale);
}


function start() {
  var canvas = document.getElementById("glcanvas");

  gl = initWebGL(canvas); // инициализация контекста GL

  // продолжать только если WebGL доступен и работает

  if (gl) {
     // Устанавливаем размер вьюпорта
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0); // установить в качестве цвета очистки буфера цвета чёрный, полная непрозрачность
    gl.enable(gl.DEPTH_TEST); // включает использование буфера глубины
    gl.depthFunc(gl.LEQUAL); // определяет работу буфера глубины: более ближние объекты перекрывают дальние
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // очистить буфер цвета и буфер глубины.
  }
  initShaders();
  initBuffers();
  drawScene();
}

function initWebGL(canvas) {
    gl = null;
  
    try {
      // Попытаться получить стандартный контекст. Если не получится, попробовать получить экспериментальный.
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    } catch (e) {}
  
    // Если мы не получили контекст GL, завершить работу
    if (!gl) {
      alert("Unable to initialize WebGL. Your browser may not support it.");
      gl = null;
    }
  
    return gl;
}

function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  // создать шейдерную программу

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // Если создать шейдерную программу не удалось, вывести предупреждение

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.uColor = gl.getUniformLocation(shaderProgram, "uColor"); //  поддержка uColor в initShaders


  vertexPositionAttribute = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition",
  );
  gl.enableVertexAttribArray(vertexPositionAttribute);
}

// Функция получает из DOM шейдерную программу
function getShader(gl, id) {
  var shaderScript, theSource, currentChild, shader;

  shaderScript = document.getElementById(id);

  if (!shaderScript) {
    return null;
  }

  theSource = "";
  currentChild = shaderScript.firstChild;

  while(currentChild) {
    if (currentChild.nodeType == currentChild.TEXT_NODE) {
      theSource += currentChild.textContent;
    }

    currentChild = currentChild.nextSibling;
  }
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    // неизвестный тип шейдера
    return null;
  }
  gl.shaderSource(shader, theSource);

  // скомпилировать шейдерную программу
  gl.compileShader(shader);

  // Проверить успешное завершение компиляции
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
      return null;
  }

  return shader;
}

var horizAspect = 480.0 / 640.0;

function initBuffers() {
    cubeVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);

  var vertices = [
    // Передняя грань
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
  
    // Задняя грань
    -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,
  
    // Верхняя грань
    -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,
  
    // Нижняя грань
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
  
    // Правая грань
    1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
  
    // Левая грань
    -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
  ];


gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  cubeVerticesIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);

  var cubeVertexIndices = [
    0,
    1,
    2,
    0,
    2,
    3, // front
    4,
    5,
    6,
    4,
    6,
    7, // back
    8,
    9,
    10,
    8,
    10,
    11, // top
    12,
    13,
    14,
    12,
    14,
    15, // bottom
    16,
    17,
    18,
    16,
    18,
    19, // right
    20,
    21,
    22,
    20,
    22,
    23, // left
  ];

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(cubeVertexIndices),
    gl.STATIC_DRAW,
  );
}
const positions = [
  [0.0, -1.0, 0.0],  // Основание
  [-2.0, -1.0, 0.0],  // Левый куб
  [2.0, -1.0, 0.0],   // Правый куб
  [0.0, 1.0, 0.0]    // Верхний куб
];

const colors = [
  [1.0, 1.0, 0.0, 1.0],  // Желтый
  [1.0, 0.0, 0.0, 1.0],  // Красный
  [0.0, 0.0, 1.0, 1.0],  // Синий
  [0.0, 1.0, 0.0, 1.0]   // Зеленый
];

let rotBase = 0;
let rotLeft = 0;
let rotRight = 0;
let rotUp = 0;

let rotStep = -5;

let rotAboutCenter = 0;
let rotAboutOrigin = 0;

window.addEventListener('keydown', function (event) {
  if (event.defaultPrevented) {
      return; 
  }

  switch (event.code) {
      case 'KeyD': // Поворот правого кубика вокруг своей оси Y
          rotRight = (rotRight + rotStep) % 360;
          break;
      case 'KeyA': // Поворот левого кубика вокруг своей оси Y
          rotLeft = (rotLeft + rotStep) % 360;
          break;
      case 'KeyS': // Поворот нижнего кубика вокруг своей оси Y
          rotBase = (rotBase + rotStep) % 360;
          break;
      case 'KeyW': // Поворот верхнего кубика вокруг своей оси Y
          rotUp = (rotUp + rotStep) % 360;
          break;
      case 'KeyG': // Поворот всего пьедестала вокруг его центра
          rotAboutCenter = (rotAboutCenter + rotStep) % 360;
          break;
      case 'KeyL': // Поворот всего пьедестала вокруг центра сцены (глобальная ось Y)
          rotAboutOrigin = (rotAboutOrigin + rotStep) % 360;
          break;
      case 'Escape': // Сброс всех вращений
          rotLeft = 0;
          rotRight = 0;
          rotBase = 0;
          rotUp = 0;
          rotAboutOrigin = 0;
          rotAboutCenter = 0;
          break;
      default:
          return;
  }

  event.preventDefault();
}, true);

function getCombinedMatrix(objDelta, objRotation) {
  const result = mat4.create();

  // Apply projection
  mat4.mul(result, result, projection);

  // Apply rotation and translation about origin
  mat4.rotateY(result, result, glMatrix.toRadian(rotAboutOrigin));
  mat4.translate(result, result, originDisplacement);

  // Apply rotation about the center of pedestal
  mat4.rotateY(result, result, glMatrix.toRadian(rotAboutCenter));

  // Apply object's own rotation and displacement
  mat4.translate(result, result, objDelta);
  mat4.rotateY(result, result, glMatrix.toRadian(objRotation));

  return result;
}

function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Устанавливаем матрицу проекции
  perspectiveMatrix = makePerspective(45, 640.0 / 480.0, 0.1, 100.0);

  // Инициализация матрицы модели-вида
  loadIdentity();
  
  // Сначала вращаем ВСЮ сцену вокруг глобального центра
  mvRotate(rotAboutOrigin, [0, 1, 0]); 

  // Двигаем сцену назад
  mvTranslate([0.0, 0.0, -10.0]); 

  // Теперь вращаем пьедестал вокруг его центра
  mvRotate(rotAboutCenter, [0, 1, 0]);  

  // Отрисовка каждого куба
  for (let i = 0; i < positions.length; i++) {
    mvPushMatrix(); // Сохраняем текущую матрицу

    // Применяем перемещение для текущего куба
    mvTranslate(positions[i]);

    // Вращение куба вокруг своей оси
    switch (i) {
      case 0: mvRotate(rotBase, [0, 1, 0]); break;
      case 1: mvRotate(rotLeft, [0, 1, 0]); break;
      case 2: mvRotate(rotRight, [0, 1, 0]); break;
      case 3: mvRotate(rotUp, [0, 1, 0]); break;
    }

    // Устанавливаем цвет и отрисовываем куб
    setColor(colors[i]);
    drawCube();

    mvPopMatrix(); // Восстанавливаем матрицу
  }

  // Запускаем следующий кадр
  requestAnimationFrame(drawScene);
}



function setColor(color) {
    let colorUniform = gl.getUniformLocation(shaderProgram, "uColor");
    gl.uniform4fv(colorUniform, new Float32Array(color));
}

function drawCube() {
  
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}