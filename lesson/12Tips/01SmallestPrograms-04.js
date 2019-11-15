'use strict';
const gl = document.querySelector('#c').getContext('webgl');

const vs = `
// vertex shader

attribute vec4 position;

void main() {
    gl_Position = position;
    gl_PointSize = 20.0;
} 
`;

const fs = `
// fragment shader
precision mediump float;

uniform vec4 color;

void main() {
    gl_FragColor = color;
}
`;

// setup GLSL program
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
const colorLoc = gl.getUniformLocation(program, 'color');

gl.useProgram(program);

const numPoints = 5;
for (let i = 0; i < numPoints; ++i) {
    const u = i / (numPoints - 1);    // 0 to 1
    const clipspace = u * 1.6 - 0.8;  // -0.8 to +0.8
    gl.vertexAttrib2f(positionLoc, clipspace, clipspace);

    gl.uniform4f(colorLoc, u, 0, 1 - u, 1);

    const offset = 0;
    const count = 1;
    gl.drawArrays(gl.POINTS, offset, count);
}
