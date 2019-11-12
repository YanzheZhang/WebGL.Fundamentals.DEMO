"use strict";

var textCtx = document.createElement("canvas").getContext("2d");

// Puts text in center of canvas.
function makeTextCanvas(text, width, height) {
    textCtx.canvas.width = width;
    textCtx.canvas.height = height;
    textCtx.font = "20px monospace";
    textCtx.textAlign = "center";
    textCtx.textBaseline = "middle";
    textCtx.fillStyle = "black";
    textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
    textCtx.fillText(text, width / 2, height / 2);
    return textCtx.canvas;
}

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // Create data for 'F'
    var fBufferInfo = primitives.create3DFBufferInfo(gl);
    // Create a unit quad for the 'text'
    var textBufferInfo = primitives.createPlaneBufferInfo(gl, 1, 1, 1, 1, m4.xRotation(Math.PI / 2));

    // setup GLSL programs
    var fProgramInfo = webglUtils.createProgramInfo(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
    var textProgramInfo = webglUtils.createProgramInfo(gl, ["text-vertex-shader", "text-fragment-shader"]);

    // create text texture.
    var textCanvas = makeTextCanvas("Hello!", 100, 26);
    var textWidth = textCanvas.width;
    var textHeight = textCanvas.height;
    var textTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    // make sure we can render it even if it's not a power of 2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var fUniforms = {
        u_matrix: m4.identity(),
    };

    var textUniforms = {
        u_matrix: m4.identity(),
        u_texture: textTex,
    };

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    var translation = [0, 30, 0];
    var rotation = [degToRad(190), degToRad(0), degToRad(0)];
    var scale = [1, 1, 1];
    var fieldOfViewRadians = degToRad(60);
    var rotationSpeed = 1.2;

    var then = 0;

    requestAnimationFrame(drawScene);

    // Draw the scene.
    function drawScene(now) {
        // Convert to seconds
        now *= 0.001;
        // Subtract the previous time from the current time
        var deltaTime = now - then;
        // Remember the current time for the next frame.
        then = now;

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Every frame increase the rotation a little.
        rotation[1] += rotationSpeed * deltaTime;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Compute the matrices used for all objects
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var projectionMatrix =
            m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

        // Compute the camera's matrix using look at.
        var cameraRadius = 360;
        var cameraPosition = [Math.cos(now) * cameraRadius, 0, Math.sin(now) * cameraRadius];
        var target = [0, 0, 0];
        var up = [0, 1, 0];
        var cameraMatrix = m4.lookAt(cameraPosition, target, up);
        var viewMatrix = m4.inverse(cameraMatrix);

        var spread = 170;
        for (var yy = -1; yy <= 1; ++yy) {
            for (var xx = -2; xx <= 2; ++xx) {
                var fViewMatrix = m4.translate(viewMatrix,
                    translation[0] + xx * spread, translation[1] + yy * spread, translation[2]);
                fViewMatrix = m4.xRotate(fViewMatrix, rotation[0]);
                fViewMatrix = m4.yRotate(fViewMatrix, rotation[1] + yy * xx * 0.2);
                fViewMatrix = m4.zRotate(fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1);
                fViewMatrix = m4.scale(fViewMatrix, scale[0], scale[1], scale[2]);
                fViewMatrix = m4.translate(fViewMatrix, -50, -75, 0);

                // setup to draw the 'F'
                gl.useProgram(fProgramInfo.program);

                webglUtils.setBuffersAndAttributes(gl, fProgramInfo, fBufferInfo);

                fUniforms.u_matrix = m4.multiply(projectionMatrix, fViewMatrix);

                webglUtils.setUniforms(fProgramInfo, fUniforms);

                // Draw the geometry.
                gl.drawElements(gl.TRIANGLES, fBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

                // use just the view position of the 'F' for the text
                var textMatrix = m4.translate(projectionMatrix,
                    fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]);
                // scale the F to the size we need it.
                textMatrix = m4.scale(textMatrix, textWidth, textHeight, 1);

                // setup to draw the text.
                gl.useProgram(textProgramInfo.program);

                webglUtils.setBuffersAndAttributes(gl, textProgramInfo, textBufferInfo);

                m4.copy(textMatrix, textUniforms.u_matrix);
                webglUtils.setUniforms(textProgramInfo, textUniforms);

                // Draw the text.
                gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
            }
        }

        requestAnimationFrame(drawScene);
    }
}

main();
