'use strict';
import Model from "./model.mjs";
import TrackballRotator from "./Utils/trackball-rotator.mjs";

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

let zoomFactor = -35;
const zoomStep = 1;

// Constructor for ShaderProgram
function ShaderProgram(program) {
    this.prog = program;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

/* Draws the scene */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 0.1, 100);

    /* Get the view matrix from the SimpleRotator object. */
    let modelMatrix = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, zoomFactor);

    modelMatrix = m4.multiply(rotateToPointZero, modelMatrix);
    modelMatrix = m4.multiply(translateToPointZero, modelMatrix);

    let normalMatrix = m4.transpose(m4.inverse(modelMatrix, []), []);

    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projection);
    gl.uniformMatrix4fv(shProgram.iModelMatrix, false, modelMatrix);
    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalMatrix)
    gl.uniform3fv(shProgram.iColor, [0.7, 0.0, 0.0]);
    gl.uniform3fv(shProgram.iLightLocation, [5.0, 5.0, 5.0])

    surface.Draw();
}

/* Initialize the WebGL context */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram(prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "inVertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "inNormal");
    
    shProgram.iProjectionMatrix = gl.getUniformLocation(prog, "projectionMatrix");
    shProgram.iModelMatrix = gl.getUniformLocation(prog, "modelMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "normalMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLightLocation = gl.getUniformLocation(prog, "lightLocation");

    surface = new Model(gl, shProgram);
    surface.CreateSurfaceData();

    gl.enable(gl.DEPTH_TEST);
}

/* Creates a program */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader: " + gl.getShaderInfoLog(vsh));
    }

    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader: " + gl.getShaderInfoLog(fsh));
    }

    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program: " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function update(){
    surface.CreateSurfaceData();
    draw();
}

document.getElementById('canvas-holder').addEventListener('wheel', (event) => {
    event.preventDefault();
    zoomFactor += event.deltaY > 0 ? -1 : 1;
    draw();
});

document.getElementById('A').addEventListener('change', update);
document.getElementById('C').addEventListener('change', update);
document.getElementById('PHI').addEventListener('change', update);


/* Initialize the app */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl2");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML = "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    initGL();

    try {
        
    } catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}


init();