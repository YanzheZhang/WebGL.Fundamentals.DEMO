"use strict";

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // setup GLSL program
    var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
    gl.useProgram(program);

    // look up where the vertex data needs to go.
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    // lookup uniforms
    var colorLocation = gl.getUniformLocation(program, "u_color");
    var matrixLocation = gl.getUniformLocation(program, "u_matrix");

    // Create a buffer to put three 2d clip space points in
    var positionBuffer = gl.createBuffer();

    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    requestAnimationFrame(drawScene);

    // Draw the scene.
    function drawScene(now) {
        now *= 0.001;  // convert to seconds

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas.
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the attribute
        gl.enableVertexAttribArray(positionAttributeLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset);

        // Set Geometry.
        var radius = Math.sqrt(gl.canvas.width * gl.canvas.width + gl.canvas.height * gl.canvas.height) * 0.5;
        var angle = now;
        var x = Math.cos(angle) * radius;
        var y = Math.sin(angle) * radius;
        var centerX = gl.canvas.width / 2;
        var centerY = gl.canvas.height / 2;
        setGeometry(gl, centerX + x, centerY + y, centerX - x, centerY - y);

        // Compute the matrices
        var projectionMatrix = m3.projection(gl.canvas.width, gl.canvas.height);

        // Set the matrix.
        gl.uniformMatrix3fv(matrixLocation, false, projectionMatrix);

        // Draw in red
        gl.uniform4fv(colorLocation, [1, 0, 0, 1]);

        // Draw the geometry.
        var primitiveType = gl.LINES;
        var offset = 0;
        var count = 2;
        gl.drawArrays(primitiveType, offset, count);

        requestAnimationFrame(drawScene);
    }
}

// Fill the buffer with a line
function setGeometry(gl, x1, y1, x2, y2) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            x1, y1,
            x2, y2]),
        gl.STATIC_DRAW);
}

main();

var m3 = {
    projection: function (width, height) {
        // Note: This matrix flips the Y axis so that 0 is at the top.
        return [
          2 / width, 0, 0,
          0, -2 / height, 0,
          -1, 1, 1
        ];
    },

    identity: function () {
        return [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ];
    },

    translation: function (tx, ty) {
        return [
          1, 0, 0,
          0, 1, 0,
          tx, ty, 1,
        ];
    },

    rotation: function (angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
          c, -s, 0,
          s, c, 0,
          0, 0, 1,
        ];
    },

    scaling: function (sx, sy) {
        return [
          sx, 0, 0,
          0, sy, 0,
          0, 0, 1,
        ];
    },

    multiply: function (a, b) {
        var a00 = a[0 * 3 + 0];
        var a01 = a[0 * 3 + 1];
        var a02 = a[0 * 3 + 2];
        var a10 = a[1 * 3 + 0];
        var a11 = a[1 * 3 + 1];
        var a12 = a[1 * 3 + 2];
        var a20 = a[2 * 3 + 0];
        var a21 = a[2 * 3 + 1];
        var a22 = a[2 * 3 + 2];
        var b00 = b[0 * 3 + 0];
        var b01 = b[0 * 3 + 1];
        var b02 = b[0 * 3 + 2];
        var b10 = b[1 * 3 + 0];
        var b11 = b[1 * 3 + 1];
        var b12 = b[1 * 3 + 2];
        var b20 = b[2 * 3 + 0];
        var b21 = b[2 * 3 + 1];
        var b22 = b[2 * 3 + 2];
        return [
          b00 * a00 + b01 * a10 + b02 * a20,
          b00 * a01 + b01 * a11 + b02 * a21,
          b00 * a02 + b01 * a12 + b02 * a22,
          b10 * a00 + b11 * a10 + b12 * a20,
          b10 * a01 + b11 * a11 + b12 * a21,
          b10 * a02 + b11 * a12 + b12 * a22,
          b20 * a00 + b21 * a10 + b22 * a20,
          b20 * a01 + b21 * a11 + b22 * a21,
          b20 * a02 + b21 * a12 + b22 * a22,
        ];
    },

    translate: function (m, tx, ty) {
        return m3.multiply(m, m3.translation(tx, ty));
    },

    rotate: function (m, angleInRadians) {
        return m3.multiply(m, m3.rotation(angleInRadians));
    },

    scale: function (m, sx, sy) {
        return m3.multiply(m, m3.scaling(sx, sy));
    },
};