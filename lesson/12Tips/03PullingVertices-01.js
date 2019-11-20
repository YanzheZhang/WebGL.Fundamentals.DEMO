"use strict";

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }
    const ext = gl.getExtension('OES_texture_float');
    if (!ext) {
        alert('need OES_texture_float');  // eslint-disable-line
        return;
    }

    // setup GLSL program
    const program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);

    // look up where the vertex data needs to go.
    const posTexIndexLoc = gl.getAttribLocation(
        program, "positionAndTexcoordIndices");

    // lookup uniforms
    const matrixLoc = gl.getUniformLocation(program, "u_matrix");
    const positionTexLoc = gl.getUniformLocation(program, "positionTexture");
    const positionTexSizeLoc = gl.getUniformLocation(program, "positionTextureSize");
    const texcoordTexLoc = gl.getUniformLocation(program, "texcoordTexture");
    const texcoordTexSizeLoc = gl.getUniformLocation(program, "texcoordTextureSize");
    const u_textureLoc = gl.getUniformLocation(program, "u_texture");

    const positions = [
      -1, -1,  1,  // 0
       1, -1,  1,  // 1
      -1,  1,  1,  // 2
       1,  1,  1,  // 3
      -1, -1, -1,  // 4
       1, -1, -1,  // 5
      -1,  1, -1,  // 6
       1,  1, -1,  // 7
    ];
    const uvs = [
      0, 0,  // 0
      1, 0,  // 1
      0, 1,  // 2
      1, 1,  // 3
    ];
    const positionIndexUVIndex = [
      // front
      0, 1, // 0
      1, 3, // 1
      2, 0, // 2
      3, 2, // 3
      // right
      1, 1, // 4
      5, 3, // 5
      3, 0, // 6
      7, 2, // 7
      // back
      5, 1, // 8
      4, 3, // 9
      7, 0, // 10
      6, 2, // 11
      // left
      4, 1, // 12
      0, 3, // 13
      6, 0, // 14
      2, 2, // 15
      // top
      7, 1, // 16
      6, 3, // 17
      3, 0, // 18
      2, 2, // 19
      // bottom
      1, 1, // 20
      0, 3, // 21
      5, 0, // 22
      4, 2, // 23
    ];
    const indices = [
       0,  1,  2,   2,  1,  3,  // front
       4,  5,  6,   6,  5,  7,  // right
       8,  9, 10,  10,  9, 11,  // back
      12, 13, 14,  14, 13, 15,  // left
      16, 17, 18,  18, 17, 19,  // top
      20, 21, 22,  22, 21, 23,  // bottom
    ];

    function makeDataTexture(gl, data, numComponents) {
        // expand the data to 4 values per pixel.
        const numElements = data.length / numComponents;
        const expandedData = new Float32Array(numElements * 4);
        for (let i = 0; i < numElements; ++i) {
            const srcOff = i * numComponents;
            const dstOff = i * 4;
            for (let j = 0; j < numComponents; ++j) {
                expandedData[dstOff + j] = data[srcOff + j];
            }
        }
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,            // mip level
            gl.RGBA,      // format
            numElements,  // width
            1,            // height
            0,            // border
            gl.RGBA,      // format
            gl.FLOAT,     // type
            expandedData,
        );
        // make it possible to use a non-power-of-2 texture and
        // we don't need any filtering
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        return tex;
    }

    const positionTexture = makeDataTexture(gl, positions, 3);
    const texcoordTexture = makeDataTexture(gl, uvs, 2);

    // Create a buffer for the position and UV indices
    const positionIndexUVIndexBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionIndexUVIndexBuffer);
    // Put the position and texcoord indices in the buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionIndexUVIndex), gl.STATIC_DRAW);

    // Create an index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // Put the indices in the buffer
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Create a checker texture.
    const checkerTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, checkerTexture);
    // Fill the texture with a 4x4 gray checkerboard.
    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);//告诉WebGL一次处理 1 个字节  否则出错
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        2,
        2,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        new Uint8Array([
          0xDD, 0x99, 0xDD, 0xAA,     
          //0x88, 0xCC, 0x88, 0xDD,
          //0xCC, 0x88, 0xCC, 0xAA,
          //0x88, 0xCC, 0x88, 0xCC,
        ]),
    );
    //0xDD, 0x99, 0xDD, 0xAA,
    //0x88, 0xCC, 0x88, 0xDD,
    //0xCC, 0x88, 0xCC, 0xAA,
    //0x88, 0xCC, 0x88, 0xCC,
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    const fieldOfViewRadians = degToRad(60);
    let modelXRotationRadians = degToRad(0);
    let modelYRotationRadians = degToRad(0);

    // Get the starting time.
    let then = 0;

    requestAnimationFrame(drawScene);

    // Draw the scene.
    function drawScene(time) {
        // convert to seconds
        time *= 0.001;
        // Subtract the previous time from the current time
        const deltaTime = time - then;
        // Remember the current time for the next frame.
        then = time;

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Animate the rotation
        modelYRotationRadians += -0.7 * deltaTime;
        modelXRotationRadians += -0.4 * deltaTime;

        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Bind the positionIndexUVIndex buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionIndexUVIndexBuffer);

        // Turn on the position index attribute
        gl.enableVertexAttribArray(posTexIndexLoc);

        // Tell the position/texcoord index attribute how to get data out
        // of positionIndexUVIndexBuffer (ARRAY_BUFFER)
        {
            const size = 2;          // 2 components per iteration
            const type = gl.FLOAT;   // the data is 32bit floats
            const normalize = false; // don't normalize the data
            const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
            const offset = 0;        // start at the beginning of the buffer
            gl.vertexAttribPointer(
              posTexIndexLoc, size, type, normalize, stride, offset);
        }

        // Set our indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // Compute the projection matrix
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix =
            m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

        const cameraPosition = [0, 0, 4];
        const up = [0, 1, 0];
        const target = [0, 0, 0];

        // Compute the camera's matrix using look at.
        const cameraMatrix = m4.lookAt(cameraPosition, target, up);

        // Make a view matrix from the camera matrix.
        const viewMatrix = m4.inverse(cameraMatrix);

        const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        let matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
        matrix = m4.yRotate(matrix, modelYRotationRadians);

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLoc, false, matrix);

        // put the position texture on texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, positionTexture);
        // Tell the shader to use texture unit 0 for positionTexture
        gl.uniform1i(positionTexLoc, 0);
        // Tell the shader the size of the position texture
        gl.uniform2f(positionTexSizeLoc, positions.length / 3, 1);

        // put the texcoord texture on texture unit 1
        gl.activeTexture(gl.TEXTURE0 + 1);
        gl.bindTexture(gl.TEXTURE_2D, texcoordTexture);
        // Tell the shader to use texture unit 1 for texcoordTexture
        gl.uniform1i(texcoordTexLoc, 1);
        // Tell the shader the size of the texcoord texture
        gl.uniform2f(texcoordTexSizeLoc, uvs.length / 2, 1);

        // put the checkboard texture on texture unit 2
        gl.activeTexture(gl.TEXTURE0 + 2);
        gl.bindTexture(gl.TEXTURE_2D, checkerTexture);
        // Tell the shader to use texture unit 2 for u_texture
        gl.uniform1i(u_textureLoc, 2);

        // Draw the geometry.
        gl.drawElements(gl.TRIANGLES, 6 * 6, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(drawScene);
    }
}

main();
