'use strict';
const gl = document.querySelector('#c').getContext('webgl');

const vs = `
// vertex shader
void main() {
    gl_Position = vec4(0, 0, 0, 1);  // center
    gl_PointSize = 120.0;
} 
`;

const fs = `
// fragment shader
precision mediump float;
void main() {
    gl_FragColor = vec4(1, 0, 0, 1);  // red
}
`;

// setup GLSL program
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
gl.useProgram(program);

const offset = 0;
const count = 1;
gl.drawArrays(gl.POINTS, offset, count);
