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
    const textureProgramInfo = webglUtils.createProgramInfo(gl, ['3d-vertex-shader', '3d-fragment-shader']);
    const colorProgramInfo = webglUtils.createProgramInfo(gl, ['color-vertex-shader', 'color-fragment-shader']);

    const sphereBufferInfo = primitives.createSphereBufferInfo(
        gl,
        1,  // radius
        12, // subdivisions around
        6,  // subdivisions down
    );
    const planeBufferInfo = primitives.createPlaneBufferInfo(
        gl,
        20,  // width
        20,  // height
        1,   // subdivisions across
        1,   // subdivisions down
    );
    const cubeLinesBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
        position: [
          -1, -1, -1,
           1, -1, -1,
          -1,  1, -1,
           1,  1, -1,
          -1, -1,  1,
           1, -1,  1,
          -1,  1,  1,
           1,  1,  1,
        ],
        indices: [
          0, 1,
          1, 3,
          3, 2,
          2, 0,

          4, 5,
          5, 7,
          7, 6,
          6, 4,

          0, 4,
          1, 5,
          3, 7,
          2, 6,
        ],
    });

    // make a 8x8 checkerboard texture
    const checkerboardTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,                // mip level
        gl.LUMINANCE,     // internal format
        8,                // width
        8,                // height
        0,                // border
        gl.LUMINANCE,     // format
        gl.UNSIGNED_BYTE, // type
        new Uint8Array([  // data
          0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
          0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
          0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
          0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
          0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
          0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
          0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
          0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        ]));
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    function loadImageTexture(url) {
        // Create a texture.
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                      new Uint8Array([0, 0, 255, 255]));
        // Asynchronously load an image
        const image = new Image();
        image.src = url;
        image.addEventListener('load', function() {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
            // assumes this texture is a power of 2
            gl.generateMipmap(gl.TEXTURE_2D);
            render();
        });
        return texture;
    }

    const imageTexture = loadImageTexture('../data/img/f-texture.png');  

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    const settings = {
        cameraX: 2.75,
        cameraY: 5,
        posX: 2.5,
        posY: 4.8,
        posZ: 4.3,
        targetX: 2.5,
        targetY: 0,
        targetZ: 3.5,
        projWidth: 1,
        projHeight: 1,
        perspective: true,
        fieldOfView: 45,
    };
    webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
      { type: 'slider',   key: 'cameraX',    min: -10, max: 10, change: render, precision: 2, step: 0.001, },
      { type: 'slider',   key: 'cameraY',    min:   1, max: 20, change: render, precision: 2, step: 0.001, },
      { type: 'slider',   key: 'posX',       min: -10, max: 10, change: render, precision: 2, step: 0.001, },
      { type: 'slider',   key: 'posY',       min:   1, max: 20, change: render, precision: 2, step: 0.001, },
      { type: 'slider',   key: 'posZ',       min:   1, max: 20, change: render, precision: 2, step: 0.001, },
      { type: 'slider',   key: 'targetX',    min: -10, max: 10, change: render, precision: 2, step: 0.001, },
      { type: 'slider',   key: 'targetY',    min:   0, max: 20, change: render, precision: 2, step: 0.001, },
      { type: 'slider',   key: 'targetZ',    min: -10, max: 20, change: render, precision: 2, step: 0.001, },
      { type: 'slider',   key: 'projWidth',  min:   0, max:  2, change: render, precision: 2, step: 0.001, },
      { type: 'slider',   key: 'projHeight', min:   0, max:  2, change: render, precision: 2, step: 0.001, },
      { type: 'checkbox', key: 'perspective', change: render, },
      { type: 'slider',   key: 'fieldOfView', min:  1, max: 179, change: render, },
    ]);

    const fieldOfViewRadians = degToRad(60);

    // Uniforms for each object.
    const planeUniforms = {
        u_colorMult: [0.5, 0.5, 1, 1],  // lightblue
        u_texture: checkerboardTexture,
        u_world: m4.translation(0, 0, 0),
    };
    const sphereUniforms = {
        u_colorMult: [1, 0.5, 0.5, 1],  // pink
        u_texture: checkerboardTexture,
        u_world: m4.translation(2, 3, 4),
    };

    function drawScene(projectionMatrix, cameraMatrix) {
        // Make a view matrix from the camera matrix.
        const viewMatrix = m4.inverse(cameraMatrix);

        const textureWorldMatrix = m4.lookAt(
            [settings.posX, settings.posY, settings.posZ],          // position
            [settings.targetX, settings.targetY, settings.targetZ], // target
            [0, 1, 0],                                              // up
        );
        const textureProjectionMatrix = settings.perspective
            ? m4.perspective(
                degToRad(settings.fieldOfView),
                settings.projWidth / settings.projHeight,
                0.1,  // near
                200)  // far
            : m4.orthographic(
                -settings.projWidth / 2,   // left
                 settings.projWidth / 2,   // right
                -settings.projHeight / 2,  // bottom
                 settings.projHeight / 2,  // top
                 0.1,                      // near
                 200);                     // far

        let textureMatrix = m4.identity();
        textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
        textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
        textureMatrix = m4.multiply(textureMatrix, textureProjectionMatrix);
        // use the inverse of this world matrix to make
        // a matrix that will transform other positions
        // to be relative this this world space.
        textureMatrix = m4.multiply(
            textureMatrix,
            m4.inverse(textureWorldMatrix));

        gl.useProgram(textureProgramInfo.program);

        // set uniforms that are the same for both the sphere and plane
        webglUtils.setUniforms(textureProgramInfo, {
            u_view: viewMatrix,
            u_projection: projectionMatrix,
            u_textureMatrix: textureMatrix,
            u_projectedTexture: imageTexture,
        });

        // ------ Draw the sphere --------

        // Setup all the needed attributes.
        webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, sphereBufferInfo);

        // Set the uniforms unique to the sphere
        webglUtils.setUniforms(textureProgramInfo, sphereUniforms);

        // calls gl.drawArrays or gl.drawElements
        webglUtils.drawBufferInfo(gl, sphereBufferInfo);

        // ------ Draw the plane --------

        // Setup all the needed attributes.
        webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, planeBufferInfo);

        // Set the uniforms we just computed
        webglUtils.setUniforms(textureProgramInfo, planeUniforms);

        // calls gl.drawArrays or gl.drawElements
        webglUtils.drawBufferInfo(gl, planeBufferInfo);

        // ------ Draw the cube ------

        gl.useProgram(colorProgramInfo.program);

        // Setup all the needed attributes.
        webglUtils.setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo);

        // scale the cube in Z so it's really long
        // to represent the texture is being projected to
        // infinity
        const mat = m4.multiply(
            textureWorldMatrix, m4.inverse(textureProjectionMatrix));

        // Set the uniforms we just computed
        webglUtils.setUniforms(colorProgramInfo, {
            u_color: [0, 0, 0, 1],
            u_view: viewMatrix,
            u_projection: projectionMatrix,
            u_world: mat,
        });

        // calls gl.drawArrays or gl.drawElements
        webglUtils.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
    }

    // Draw the scene.
    function render() {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Compute the projection matrix
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix =
            m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

        // Compute the camera's matrix using look at.
        const cameraPosition = [settings.cameraX, settings.cameraY, 7];
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        const cameraMatrix = m4.lookAt(cameraPosition, target, up);

        drawScene(projectionMatrix, cameraMatrix);
    }
    render();
}

main();
