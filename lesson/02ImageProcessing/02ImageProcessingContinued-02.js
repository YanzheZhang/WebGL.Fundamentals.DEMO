"use strict";

function main() {
    var image = new Image();
    image.src = "../data/img/leaves.jpg";  // MUST BE SAME DOMAIN!!!
    image.onload = function () {
        render(image);
    };
}

// Define several convolution kernels
var kernels = {
    normal: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0
    ],
    gaussianBlur: [
      0.045, 0.122, 0.045,
      0.122, 0.332, 0.122,
      0.045, 0.122, 0.045
    ],
    gaussianBlur2: [
      1, 2, 1,
      2, 4, 2,
      1, 2, 1
    ],
    gaussianBlur3: [
      0, 1, 0,
      1, 1, 1,
      0, 1, 0
    ],
    unsharpen: [
      -1, -1, -1,
      -1, 9, -1,
      -1, -1, -1
    ],
    sharpness: [
       0, -1, 0,
      -1, 5, -1,
       0, -1, 0
    ],
    sharpen: [
       -1, -1, -1,
       -1, 16, -1,
       -1, -1, -1
    ],
    edgeDetect: [
       -0.125, -0.125, -0.125,
       -0.125, 1, -0.125,
       -0.125, -0.125, -0.125
    ],
    edgeDetect2: [
       -1, -1, -1,
       -1, 8, -1,
       -1, -1, -1
    ],
    edgeDetect3: [
       -5, 0, 0,
        0, 0, 0,
        0, 0, 5
    ],
    edgeDetect4: [
       -1, -1, -1,
        0, 0, 0,
        1, 1, 1
    ],
    edgeDetect5: [
       -1, -1, -1,
        2, 2, 2,
       -1, -1, -1
    ],
    edgeDetect6: [
       -5, -5, -5,
       -5, 39, -5,
       -5, -5, -5
    ],
    sobelHorizontal: [
        1, 2, 1,
        0, 0, 0,
       -1, -2, -1
    ],
    sobelVertical: [
        1, 0, -1,
        2, 0, -2,
        1, 0, -1
    ],
    previtHorizontal: [
        1, 1, 1,
        0, 0, 0,
       -1, -1, -1
    ],
    previtVertical: [
        1, 0, -1,
        1, 0, -1,
        1, 0, -1
    ],
    boxBlur: [
        0.111, 0.111, 0.111,
        0.111, 0.111, 0.111,
        0.111, 0.111, 0.111
    ],
    triangleBlur: [
        0.0625, 0.125, 0.0625,
        0.125, 0.25, 0.125,
        0.0625, 0.125, 0.0625
    ],
    emboss: [
       -2, -1, 0,
       -1, 1, 1,
        0, 1, 2
    ]
};

var effects = [
  { name: "normal", on: true },
  { name: "gaussianBlur", on: true },
  { name: "gaussianBlur2", on: true },
  { name: "gaussianBlur3", },
  { name: "unsharpen", },
  { name: "sharpness", },
  { name: "sharpen", },
  { name: "edgeDetect", },
  { name: "edgeDetect2", },
  { name: "edgeDetect3", },
  { name: "edgeDetect4", },
  { name: "edgeDetect5", },
  { name: "edgeDetect6", on: true },
  { name: "sobelHorizontal", },
  { name: "sobelVertical", },
  { name: "previtHorizontal", },
  { name: "previtVertical", },
  { name: "boxBlur", },
  { name: "triangleBlur", },
  { name: "emboss", },
];

function render(image) {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // setup GLSL program
    var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

    // Create a buffer to put three 2d clip space points in  顶点坐标
    var positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Set a rectangle the same size as the image.
    setRectangle(gl, 0, 0, image.width, image.height);

    // provide texture coordinates for the rectangle. 纹理坐标
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
    ]), gl.STATIC_DRAW);

    function createAndSetupTexture(gl) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set up texture so we can render any size image and so we are
        // working with pixels.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        return texture;
    }

    // Create a texture and put the image in it.
    var originalImageTexture = createAndSetupTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // create 2 textures and attach them to framebuffers.
    var textures = [];
    var framebuffers = [];
    for (var ii = 0; ii < 2; ++ii) {
        var texture = createAndSetupTexture(gl);
        textures.push(texture);

        // make the texture the same size as the image
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, null);

        // Create a framebuffer
        var fbo = gl.createFramebuffer();
        framebuffers.push(fbo);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        // Attach a texture to it.
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    }

    // lookup uniforms
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
    var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
    var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
    var flipYLocation = gl.getUniformLocation(program, "u_flipY");

    // Setup a ui.
    var ui = document.getElementById("ui");
    var table = document.createElement("table");
    var tbody = document.createElement("tbody");
    for (var ii = 0; ii < effects.length; ++ii) {
        var effect = effects[ii];
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        var chk = document.createElement("input");
        chk.value = effect.name;
        chk.type = "checkbox";
        if (effect.on) {
            chk.checked = "true";
        }
        chk.onchange = drawEffects;
        td.appendChild(chk);
        td.appendChild(document.createTextNode('≡ ' + effect.name));
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    ui.appendChild(table);
    $("#ui table").tableDnD({ onDrop: drawEffects });

    drawEffects();

    function computeKernelWeight(kernel) {
        var weight = kernel.reduce(function (prev, curr) {
            return prev + curr;
        });
        return weight <= 0 ? 1 : weight;
    }

    function drawEffects(name) {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the position attribute
        gl.enableVertexAttribArray(positionLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
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

        // set the size of the image
        gl.uniform2f(textureSizeLocation, image.width, image.height);

        // start with the original image
        gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

        // don't y flip images while drawing to the textures
        gl.uniform1f(flipYLocation, 1);//1 不反转 -1反转

        // loop through each effect we want to apply.
        var count = 0;
        for (var ii = 0; ii < tbody.rows.length; ++ii) {
            var checkbox = tbody.rows[ii].firstChild.firstChild;
            if (checkbox.checked) {
                // Setup to draw into one of the framebuffers.
                setFramebuffer(framebuffers[count % 2], image.width, image.height);

                drawWithKernel(checkbox.value);

                // for the next draw, use the texture we just rendered to.
                gl.bindTexture(gl.TEXTURE_2D, textures[count % 2]);

                // increment count so we use the other texture next time.
                ++count;
            }
        }

        // finally draw the result to the canvas.
        gl.uniform1f(flipYLocation, -1);  // need to y flip for canvas
        setFramebuffer(null, gl.canvas.width, gl.canvas.height);//设置为 null是告诉WebGL 你想在画布上绘制，而不是在帧缓冲上
        drawWithKernel("normal");
    }

    function setFramebuffer(fbo, width, height) {
        // make this the framebuffer we are rendering to.
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        // Tell the shader the resolution of the framebuffer.
        gl.uniform2f(resolutionLocation, width, height);

        // Tell webgl the viewport setting needed for framebuffer.
        gl.viewport(0, 0, width, height);
    }


    function drawWithKernel(name) {
        // set the kernel and it's weight
        gl.uniform1fv(kernelLocation, kernels[name]);
        gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]));

        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
    }
}

function setRectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
       x1, y1,
       x2, y1,
       x1, y2,
       x1, y2,
       x2, y1,
       x2, y2,
    ]), gl.STATIC_DRAW);
}

main();
