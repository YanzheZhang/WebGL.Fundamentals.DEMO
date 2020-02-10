"use strict";

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
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    // look up uniform locations
    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    var colorUniformLocation = gl.getUniformLocation(program, "u_color");

    //// Create a buffer to put three 2d clip space points in
    //var positionBuffer = gl.createBuffer();
    //// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    //gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);//ARRAY_BUFFER：提示是顶点类型

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    //// Bind the position buffer.
    //gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);//可省略

    // create the buffer
    const indexBuffer = gl.createBuffer();
    // make this buffer the current 'ELEMENT_ARRAY_BUFFER'
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);//ELEMENT_ARRAY_BUFFER:提示是索引类型

    // Fill the current element array buffer with data
    const indices = [
      0, 1, 2,   // first triangle
      2, 1, 3,   // second triangle
    ];
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
    );

    // code above this line is initialization code
    // --------------------------------
    // code below this line is rendering code


    //放此处也可以 createBuffer与bindBuffer一起
    // Create a buffer to put three 2d clip space points in
    var positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);//ARRAY_BUFFER：提示是顶点类型


    // Turn on the attribute
    gl.enableVertexAttribArray(positionAttributeLocation);

    ////放此可以 createBuffer与bindBuffer一起  必须在enableVertexAttribArray之前
    //// Create a buffer to put three 2d clip space points in
    //var positionBuffer = gl.createBuffer();
    //// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    //gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);//ARRAY_BUFFER：提示是顶点类型

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    //// bind the buffer containing the indices
    //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);//可省略


    ////放此处不行 createBuffer与bindBuffer一起  必须在vertexAttribPointer之前
    //// Create a buffer to put three 2d clip space points in
    //var positionBuffer = gl.createBuffer();
    //// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    //gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);//ARRAY_BUFFER：提示是顶点类型


    // set the resolution
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    //gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);//不能单独放这里 必须createBuffer与bindBuffer一起
    // draw 50 random rectangles in random colors
    for (var ii = 0; ii < 50; ++ii) {
        // Setup a random rectangle
        // This will write to positionBuffer because
        // its the last thing we bound on the ARRAY_BUFFER
        // bind point
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // Set a random color.
        gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

        // Draw the rectangle.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        var indexType = gl.UNSIGNED_SHORT;
        gl.drawElements(primitiveType, count, indexType, offset);
    }
}

// Returns a random integer from 0 to range - 1.
function randomInt(range) {
    return Math.floor(Math.random() * range);
}

// Fill the buffer with the values that define a rectangle.
function setRectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
       x1, y1,
       x2, y1,
       x1, y2,
       x2, y2,
    ]), gl.STATIC_DRAW);
}

main();
