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

uniform sampler2D tex;

void main() {
    gl_FragColor = texture2D(tex, gl_PointCoord.xy);
}
`;

// setup GLSL program
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

// a 2x2 pixel data
const pixels = new Uint8Array([
  0xFF, 0x00, 0x00, 0xFF,  // red
  0x00, 0xFF, 0x00, 0xFF,  // green
  0x00, 0x00, 0xFF, 0xFF,  // blue
  0xFF, 0x00, 0xFF, 0xFF,  // cyan
]);
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                 // level
    gl.RGBA,           // internal format
    2,                 // width
    2,                 // height
    0,                 // border
    gl.RGBA,           // format
    gl.UNSIGNED_BYTE,  // type
    pixels,            // data
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

gl.useProgram(program);

const offset = 0;
const count = 1;
gl.drawArrays(gl.POINTS, offset, count);
