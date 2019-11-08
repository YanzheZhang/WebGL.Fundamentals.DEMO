"use strict";

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

    var allocateFBTexture = true;
    var framebufferWidth;   // set at render time
    var framebufferHeight;  // set at render time
    var framebuffer = gl.createFramebuffer();
    var fbTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fbTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTexture, 0);

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

        // Check if the image is a power of 2 in both dimensions.  是 2 的幂，一般用贴图
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);//根据原始图像创建所有的缩小级别，你也可以自己提供缩小级别的图像
        } else {
            /*
            WebGL: INVALID_OPERATION: generateMipmap: level 0 not power of 2 or not all the same size
            WebGL: drawArrays: texture bound to texture unit 0 is not renderable.
                   It maybe non-power-of-2 and have incompatible texture filtering or is not 'texture complete'.

            解决这个问题只需要将包裹模式设置为 CLAMP_TO_EDGE 
            并且通过设置过滤器为 LINEAR or NEAREST 来关闭贴图映射
            */
            // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge  不是 2 的幂，关闭贴图并设置包裹模式为到边缘
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);//告诉WebGL在某个方向不需要重复
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    });

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
    var modelXRotationRadians = degToRad(0);
    var modelYRotationRadians = degToRad(0);

    requestAnimationFrame(drawScene);

    // Draw the scene.
    function drawScene(time) {
        time *= 0.001;  // convert to seconds

        if (webglUtils.resizeCanvasToDisplaySize(gl.canvas, window.devicePixelRatio) || allocateFBTexture) {
            allocateFBTexture = false;
            framebufferWidth = gl.canvas.clientWidth / 4;
            framebufferHeight = gl.canvas.clientHeight / 4;
            gl.bindTexture(gl.TEXTURE_2D, fbTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, framebufferWidth, framebufferHeight,
                          0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, framebufferWidth, framebufferHeight);

        // Clear the framebuffer texture.
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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

        // Turn on the teccord attribute
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
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var zNear = 1;
        var zFar = 2000;
        var projectionMatrix =
            m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        var cameraPosition = [0, 0, 3];
        var up = [0, 1, 0];
        var target = [0, 0, 0];

        // Compute the camera's matrix using look at.
        var cameraMatrix = m4.lookAt(cameraPosition, target, up);

        // Make a view matrix from the camera matrix.
        var viewMatrix = m4.inverse(cameraMatrix);

        var settings = [
          { x: -1, y: -3, z: -30, filter: gl.NEAREST, },//只从最大的体贴图上选择1像素
          { x: 0, y: -3, z: -30, filter: gl.LINEAR, }, //只从最大的体贴图上选择4像素混合
          { x: 1, y: -3, z: -30, filter: gl.NEAREST_MIPMAP_LINEAR, },//选择最合适的两个贴图，从每个上面选择 1 个像素然后混合   (使用多级贴图并且混合颜色，绘制的越小WebGL挑选的像素离原图关系越远)

          { x: -1, y: -1, z: -10, filter: gl.NEAREST, },
          { x: 0, y: -1, z: -10, filter: gl.LINEAR, },
          { x: 1, y: -1, z: -10, filter: gl.NEAREST_MIPMAP_LINEAR, },

          { x: -1, y: 1, z: 0, filter: gl.NEAREST, },
          { x: 0, y: 1, z: 0, filter: gl.LINEAR, },
          { x: 1, y: 1, z: 0, filter: gl.LINEAR_MIPMAP_NEAREST, },
        ];
        var xSpacing = 1.2;
        var ySpacing = 0.7;
        var zDistance = 30;
        settings.forEach(function (s) {
            var z = -5 + s.z; // Math.cos(time * 0.3) * zDistance - zDistance;
            var r = Math.abs(z) * Math.sin(fieldOfViewRadians * 0.5);
            var x = Math.sin(time * 0.2) * r;
            var y = Math.cos(time * 0.2) * r * 0.5;
            var r2 = 1 + r * 0.2;

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);//告诉WebGL在某个方向不需要重复
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, s.filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            var matrix = m4.translate(projectionMatrix, x + s.x * xSpacing * r2, y + s.y * ySpacing * r2, z);
            matrix = m4.xRotate(matrix, modelXRotationRadians);
            matrix = m4.yRotate(matrix, modelYRotationRadians);

            // Set the matrix.
            gl.uniformMatrix4fv(matrixLocation, false, matrix);

            // Tell the shader to use texture unit 0 for u_texture
            gl.uniform1i(textureLocation, 0);

            // Draw the geometry.
            gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.bindTexture(gl.TEXTURE_2D, fbTexture);
        gl.uniformMatrix4fv(matrixLocation, false,
          [2, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1]);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);

        requestAnimationFrame(drawScene);
    }
}

// Fill the buffer with the values that define a plane.
function setGeometry(gl) {
    var positions = new Float32Array(
      [
      -0.5, -0.5, 0.5,
       0.5, -0.5, 0.5,
      -0.5, 0.5, 0.5,
      -0.5, 0.5, 0.5,
       0.5, -0.5, 0.5,
       0.5, 0.5, 0.5,

      ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the buffer with texture coordinates for a plane.
function setTexcoords(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(
          [
          0, 0,
          1, 0,
          0, 1,
          0, 1,
          1, 0,
          1, 1,

          ]),
        gl.STATIC_DRAW);
}

main();
