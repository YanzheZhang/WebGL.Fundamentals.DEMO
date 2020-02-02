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
    // compiles shaders, links program, looks up locations
    const programInfo = webglUtils.createProgramInfo(gl, ['3d-vertex-shader', '3d-fragment-shader']);

    // create buffers and fill with data for a 3D 'F'
    const bufferInfo = primitives.create3DFBufferInfo(gl);

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    const settings = {
        rotation: 150,  // in degrees
    };
    webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
      { type: 'slider', key: 'rotation', min: 0, max: 360, change: render, precision: 2, step: 0.001, },
    ]);

    const fieldOfViewRadians = degToRad(120);

    function drawScene(projectionMatrix, cameraMatrix, worldMatrix) {
        // Make a view matrix from the camera matrix.
        const viewMatrix = m4.inverse(cameraMatrix);

        let mat = m4.multiply(projectionMatrix, viewMatrix);
        mat = m4.multiply(mat, worldMatrix);

        gl.useProgram(programInfo.program);

        // ------ Draw the F --------

        // Setup all the needed attributes.
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        // Set the uniforms
        webglUtils.setUniforms(programInfo, {
            u_matrix: mat,
        });

        webglUtils.drawBufferInfo(gl, bufferInfo);
    }

    function render() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const near = 1;
        const far = 2000;

        // Compute a perspective projection matrix
        const perspectiveProjectionMatrix =
            m4.perspective(fieldOfViewRadians, aspect, near, far);

        // Compute the camera's matrix using look at.
        const cameraPosition = [0, 0, -75];
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        const cameraMatrix = m4.lookAt(cameraPosition, target, up);

        let worldMatrix = m4.yRotation(degToRad(settings.rotation));
        worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
        // center the 'F' around its origin
        worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

        drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
    }
    render();
}

main();
