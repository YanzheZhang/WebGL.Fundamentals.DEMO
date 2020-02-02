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
      { type: 'slider',   key: 'rotation',   min: 0, max: 360, change: render, precision: 2, step: 0.001, },
    ]);

    const fieldOfViewRadians = degToRad(120);

    function drawScene(projectionMatrix, cameraMatrix, worldMatrix) {
        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // we're going to split the view in 2
        const effectiveWidth = gl.canvas.clientWidth / 2;
        const aspect = effectiveWidth / gl.canvas.clientHeight;
        const near = 1;
        const far = 2000;

        // Compute a perspective projection matrix
        const perspectiveProjectionMatrix =
            m4.perspective(fieldOfViewRadians, aspect, near, far);

        // Compute an orthographic projection matrix
        const halfHeightUnits = 120;
        const orthographicProjectionMatrix = m4.orthographic(
            -halfHeightUnits * aspect,  // left
             halfHeightUnits * aspect,  // right
            -halfHeightUnits,           // bottom
             halfHeightUnits,           // top
             -75,                       // near
             2000);                     // far


        // Compute the camera's matrix using look at.
        const cameraPosition = [0, 0, -75];
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        const cameraMatrix = m4.lookAt(cameraPosition, target, up);

        let worldMatrix = m4.yRotation(degToRad(settings.rotation));
        worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
        // center the 'F' around its origin
        worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

        const {width, height} = gl.canvas;
    const leftWidth = width / 2 | 0;

    // draw on the left with orthographic camera
    gl.viewport(0, 0, leftWidth, height);
    gl.clearColor(1, 0, 0, 1);  // red

    drawScene(orthographicProjectionMatrix, cameraMatrix, worldMatrix);

    // draw on the right with perspective camera
    const rightWidth = width - leftWidth;
    gl.viewport(leftWidth, 0, rightWidth, height);
    gl.clearColor(0, 0, 1, 1);  // blue

    drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
}
render();
}

main();
