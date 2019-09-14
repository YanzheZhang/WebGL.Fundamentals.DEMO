"use strict";

var zDepth = 50;

function main() {
    // Get A WebGL context
    var canvas = document.getElementById("canvas", { antialias: false });
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // setup GLSL program
    var program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

    // lookup uniforms
    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    var textureLocation = gl.getUniformLocation(program, "u_texture");

    // Create a buffer for positions
    var positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Put the positions in the buffer
    setGeometry(gl);

    // provide texture coordinates for the rectangle.
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    // Set Texcoords.
    setTexcoords(gl);

    // Create a texture.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 255, 255]));
    // Asynchronously load an image
    var image = new Image();
    image.src = "../data/img/f-texture.png";
    image.addEventListener('load', function () {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Check if the image is a power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        drawScene();
    });

    var wrapS = gl.REPEAT;
    var wrapT = gl.REPEAT;

    document.querySelector("#wrap_s0").addEventListener('click', function () { wrapS = gl.REPEAT; drawScene(); });  // eslint-disable-line
    document.querySelector("#wrap_s1").addEventListener('click', function () { wrapS = gl.CLAMP_TO_EDGE; drawScene(); });  // eslint-disable-line
    document.querySelector("#wrap_s2").addEventListener('click', function () { wrapS = gl.MIRRORED_REPEAT; drawScene(); });  // eslint-disable-line
    document.querySelector("#wrap_t0").addEventListener('click', function () { wrapT = gl.REPEAT; drawScene(); });  // eslint-disable-line
    document.querySelector("#wrap_t1").addEventListener('click', function () { wrapT = gl.CLAMP_TO_EDGE; drawScene(); });  // eslint-disable-line
    document.querySelector("#wrap_t2").addEventListener('click', function () { wrapT = gl.MIRRORED_REPEAT; drawScene(); });  // eslint-disable-line

    function isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    var fieldOfViewRadians = degToRad(60);

    drawScene();

    window.addEventListener('resize', drawScene);

    // Draw the scene.
    function drawScene() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the framebuffer texture.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Compute the matrix
        var scaleFactor = 2.5;
        var tsize = 80 * scaleFactor;
        var x = gl.canvas.clientWidth / 2 - tsize / 2;
        var y = gl.canvas.clientHeight - tsize - 60;
        gridContainer.style.left = (x - 50 * scaleFactor) + 'px';
        gridContainer.style.top = (y - 50 * scaleFactor) + 'px';
        gridContainer.style.width = (scaleFactor * 400) + 'px';
        gridContainer.style.height = (scaleFactor * 300) + 'px';

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the position attribute
        gl.enableVertexAttribArray(positionLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 3;          // 3 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionLocation, size, type, normalize, stride, offset);

        // Turn on the texcoord attribute
        gl.enableVertexAttribArray(texcoordLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            texcoordLocation, size, type, normalize, stride, offset);

        // Compute the projection matrix
        var projectionMatrix =
            m4.orthographic(0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -1, 1);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

        var matrix = m4.translate(projectionMatrix, x, y, 0);
        matrix = m4.scale(matrix, tsize, tsize, 1);
        matrix = m4.translate(matrix, 0.5, 0.5, 0);

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // Tell the shader to use texture unit 0 for u_texture
        gl.uniform1i(textureLocation, 0);

        // Draw the geometry.
        gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);
    }
}

// Fill the buffer with the values that define a plane.
function setGeometry(gl) {
    var positions = new Float32Array(
      [
        -0.5, 0.5, 0.5,
         0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5,
        -0.5, -0.5, 0.5,
         0.5, 0.5, 0.5,
         0.5, -0.5, 0.5,
      ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the buffer with texture coordinates for a plane.
function setTexcoords(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(
          [
            -3, -1,
             2, -1,
            -3, 4,
            -3, 4,
             2, -1,
             2, 4,
          ]),
        gl.STATIC_DRAW);
}

main();
