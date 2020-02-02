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
    const vertexColorProgramInfo = webglUtils.createProgramInfo(gl, ['3d-vertex-shader', '3d-fragment-shader']);
    const solidColorProgramInfo = webglUtils.createProgramInfo(gl, ['solid-color-vertex-shader', 'solid-color-fragment-shader']);

    // create buffers and fill with data for a 3D 'F'
    const fBufferInfo = primitives.create3DFBufferInfo(gl);

    // create geometry for a camera
    function createCameraBufferInfo(gl, scale = 1) {
        // first let's add a cube. It goes from 1 to 3
        // because cameras look down -Z so we want
        // the camera to start at Z = 0. We'll put a
        // a cone in front of this cube opening
        // toward -Z
        const positions = [
          -1, -1,  1,  // cube vertices
           1, -1,  1,
          -1,  1,  1,
           1,  1,  1,
          -1, -1,  3,
           1, -1,  3,
          -1,  1,  3,
           1,  1,  3,
           0,  0,  1,  // cone tip
        ];
        const indices = [
          0, 1, 1, 3, 3, 2, 2, 0, // cube indices
          4, 5, 5, 7, 7, 6, 6, 4,
          0, 4, 1, 5, 3, 7, 2, 6,
        ];
        // add cone segments
        const numSegments = 6;
        const coneBaseIndex = positions.length / 3;
        const coneTipIndex =  coneBaseIndex - 1;
        for (let i = 0; i < numSegments; ++i) {
            const u = i / numSegments;
            const angle = u * Math.PI * 2;
            const x = Math.cos(angle);
            const y = Math.sin(angle);
            positions.push(x, y, 0);
            // line from tip to edge
            indices.push(coneTipIndex, coneBaseIndex + i);
            // line from point on edge to next point on edge
            indices.push(coneBaseIndex + i, coneBaseIndex + (i + 1) % numSegments);
        }
        positions.forEach((v, ndx) => {
            positions[ndx] *= scale;
    });
        return webglUtils.createBufferInfoFromArrays(gl, {
            position: positions,
            indices,
        });
    }

    const cameraScale = 20;
    const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    const settings = {
        rotation: 150,  // in degrees
        cam1FieldOfView: 60,  // in degrees
        cam1PosX: 0,
        cam1PosY: 0,
        cam1PosZ: -200,
    };
    webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
      { type: 'slider',   key: 'rotation',     min: 0, max: 360, change: render, precision: 2, step: 0.001, },
      { type: 'slider',   key: 'cam1FieldOfView',  min: 1, max: 170, change: render, },
      { type: 'slider',   key: 'cam1PosX',     min: -200, max: 200, change: render, },
      { type: 'slider',   key: 'cam1PosY',     min: -200, max: 200, change: render, },
      { type: 'slider',   key: 'cam1PosZ',     min: -200, max: 200, change: render, },
    ]);

    function drawScene(projectionMatrix, cameraMatrix, worldMatrix) {
        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Make a view matrix from the camera matrix.
        const viewMatrix = m4.inverse(cameraMatrix);

        let mat = m4.multiply(projectionMatrix, viewMatrix);
        mat = m4.multiply(mat, worldMatrix);

        gl.useProgram(vertexColorProgramInfo.program);

        // ------ Draw the F --------

        // Setup all the needed attributes.
        webglUtils.setBuffersAndAttributes(gl, vertexColorProgramInfo, fBufferInfo);

        // Set the uniforms
        webglUtils.setUniforms(vertexColorProgramInfo, {
            u_matrix: mat,
        });

        webglUtils.drawBufferInfo(gl, fBufferInfo);
    }

    function render() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.SCISSOR_TEST);

        // we're going to split the view in 2
        const effectiveWidth = gl.canvas.clientWidth / 2;
        const aspect = effectiveWidth / gl.canvas.clientHeight;
        const near = 1;
        const far = 2000;

        // Compute a perspective projection matrix
        const perspectiveProjectionMatrix =
            m4.perspective(degToRad(settings.cam1FieldOfView), aspect, near, far);

        // Compute the camera's matrix using look at.
        const cameraPosition = [
            settings.cam1PosX,
            settings.cam1PosY,
            settings.cam1PosZ,
        ];
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
    gl.scissor(0, 0, leftWidth, height);
    gl.clearColor(1, 0.8, 0.8, 1);

    drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);

    // draw on right with perspective camera
    const rightWidth = width - leftWidth;
    gl.viewport(leftWidth, 0, rightWidth, height);
    gl.scissor(leftWidth, 0, rightWidth, height);
    gl.clearColor(0.8, 0.8, 1, 1);

    // compute a second projection matrix and a second camera
    const perspectiveProjectionMatrix2 =
        m4.perspective(degToRad(60), aspect, near, far);

    // Compute the camera's matrix using look at.
    const cameraPosition2 = [-600, 400, -400];
    const target2 = [0, 0, 0];
    const cameraMatrix2 = m4.lookAt(cameraPosition2, target2, up);

    drawScene(perspectiveProjectionMatrix2, cameraMatrix2, worldMatrix);

    // draw object to represent first camera
    {
        // Make a view matrix from the 2nd camera matrix.
        const viewMatrix = m4.inverse(cameraMatrix2);

        let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
        // use the first's camera's matrix as the matrix to position
        // the camera's representative in the scene
        mat = m4.multiply(mat, cameraMatrix);

        gl.useProgram(solidColorProgramInfo.program);

        // ------ Draw the Camera Representation --------

        // Setup all the needed attributes.
        webglUtils.setBuffersAndAttributes(gl, solidColorProgramInfo, cameraBufferInfo);

        // Set the uniforms
        webglUtils.setUniforms(solidColorProgramInfo, {
            u_matrix: mat,
            u_color: [0, 0, 0, 1],
        });

        webglUtils.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);
    }
}
render();
}

main();
