﻿"use strict";

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // setup GLSL program
    var program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var normalLocation = gl.getAttribLocation(program, "a_normal");

    // lookup uniforms
    var worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");
    var worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
    var colorLocation = gl.getUniformLocation(program, "u_color");
    var rampLocation = gl.getUniformLocation(program, "u_ramp");
    var rampSizeLocation = gl.getUniformLocation(program, "u_rampSize");
    var useRampTextureLocation = gl.getUniformLocation(program, "u_useRampTexture");
    var reverseLightDirectionLocation =
        gl.getUniformLocation(program, "u_reverseLightDirection");

    // Create a buffer to put positions in
    var positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Put geometry data into buffer
    var numElements = setGeometry(gl);

    // Create a buffer to put normals in
    var normalBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = normalBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    // Put normals data into buffer
    setNormals(gl);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
        gl.TEXTURE_2D,     // target
        0,                 // mip level
        gl.LUMINANCE,      // internal format
        2,                 // width
        1,                 // height
        0,                 // border
        gl.LUMINANCE,      // format
        gl.UNSIGNED_BYTE,  // type
        new Uint8Array([0, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    var fieldOfViewRadians = degToRad(60);
    var fRotationRadians = 0;
    var data = {
        useRampTexture: true,
    };

    // Setup a ui.
    webglLessonsUI.setupSlider("#fRotation", { value: radToDeg(fRotationRadians), slide: updateRotation, min: -360, max: 360 });
    webglLessonsUI.setupUI(document.querySelector("#ui"), data, [
      { type: "checkbox", key: "useRampTexture", change: drawScene },
    ]);

    drawScene();

    function updateRotation(event, ui) {
        fRotationRadians = degToRad(ui.value);
        drawScene();
    }

    // Draw the scene.
    function drawScene() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Turn on culling. By default backfacing triangles
        // will be culled.
        gl.enable(gl.CULL_FACE);

        // Enable the depth buffer
        gl.enable(gl.DEPTH_TEST);

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

        // Turn on the normal attribute
        gl.enableVertexAttribArray(normalLocation);

        // Bind the normal buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

        // Tell the attribute how to get data out of normalBuffer (ARRAY_BUFFER)
        var size = 3;          // 3 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floating point values
        var normalize = false; // normalize the data (convert from 0-255 to 0-1)
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            normalLocation, size, type, normalize, stride, offset);

        // Compute the projection matrix
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var zNear = 1;
        var zFar = 50;
        var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        // Compute the camera's matrix
        var camera = [0, 0, 20];
        var target = [0, 0, 0];
        var up = [0, 1, 0];
        var cameraMatrix = m4.lookAt(camera, target, up);

        // Make a view matrix from the camera matrix.
        var viewMatrix = m4.inverse(cameraMatrix);

        // Compute a view projection matrix
        var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        // Draw a F at the origin
        var worldMatrix = m4.yRotation(fRotationRadians);

        // Multiply the matrices.
        var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
        var worldInverseMatrix = m4.inverse(worldMatrix);
        var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

        // Set the matrices
        gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
        gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);

        // Set the color to use
        gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green

        // set the light direction.
        gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([-1.75, 0.7, 1]));

        // bind the texture to active texture unit 0
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // tell the shader that u_ramp should use the texture on texture unit 0
        gl.uniform1i(rampLocation, 0);
        gl.uniform2fv(rampSizeLocation, [2, 1]);

        gl.uniform1i(useRampTextureLocation, data.useRampTexture);

        // Draw the geometry.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        gl.drawArrays(primitiveType, offset, numElements);
    }
}

// Fill the buffer positions for the head.
function setGeometry(gl) {
    var positions = new Float32Array(HeadData.positions);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    return positions.length / 3;
}

// Fill the buffer with normals for the head.
function setNormals(gl, numElements) {
    var normals = HeadData.normals;
    gl.bufferData(
        gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
}


main();
