'use strict';

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    // setup GLSL programs
    // compiles shaders, links program
    const program = webglUtils.createProgramFromScripts(
        gl, ['3d-vertex-shader', '3d-fragment-shader']);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const colorLoc = gl.getUniformLocation(program, 'color');
    const matrixLoc = gl.getUniformLocation(program, 'matrix');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -0.1,  0.4,
        -0.1, -0.8,
         0.1, -0.4,
         0.1, -0.4,
        -0.1,  0.4,
         0.1,  0.4,
         0.4, -0.1,
        -0.4, -0.1,
        -0.4,  0.1,
        -0.4,  0.1,
         0.4, -0.1,
         0.4,  0.1,
    ]), gl.STATIC_DRAW);
    const numVertices = 12;

    const numInstances = 5;
    const matrices = [
      m4.identity(),
      m4.identity(),
      m4.identity(),
      m4.identity(),
      m4.identity(),
    ];

    const colors = [
      [ 1, 0, 0, 1, ],  // red
      [ 0, 1, 0, 1, ],  // green
      [ 0, 0, 1, 1, ],  // blue
      [ 1, 0, 1, 1, ],  // magenta
      [ 0, 1, 1, 1, ],  // cyan
    ];

    function render(time) {
        time *= 0.001; // seconds

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(program);

        // setup the position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(
            positionLoc,  // location
            2,            // size (num values to pull from buffer per iteration)
            gl.FLOAT,     // type of data in buffer
            false,        // normalize
            0,            // stride (0 = compute from size and type above)
            0,            // offset in buffer
        );

        matrices.forEach((mat, ndx) => {
            m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
            m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);

            const color = colors[ndx];

            gl.uniform4fv(colorLoc, color);
            gl.uniformMatrix4fv(matrixLoc, false, mat);

            gl.drawArrays(
               gl.TRIANGLES,
               0,             // offset
               numVertices,   // num vertices per instance
           );
       });

    requestAnimationFrame(render);
}
requestAnimationFrame(render);
}

main();