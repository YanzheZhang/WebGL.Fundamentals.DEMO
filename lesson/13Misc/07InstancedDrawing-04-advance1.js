'use strict';

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
        return;
    }

    const ext = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext) {
        return alert('need ANGLE_instanced_arrays');  // eslint-disable-line
    }

    // setup GLSL programs
    // compiles shaders, links program
    const program = webglUtils.createProgramFromScripts(
        gl, ['3d-vertex-shader', '3d-fragment-shader']);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const colorLoc = gl.getAttribLocation(program, 'color');
    const matrixV0Loc = gl.getAttribLocation(program, 'matrixV0');
    const matrixV1Loc = gl.getAttribLocation(program, 'matrixV1');
    const matrixV2Loc = gl.getAttribLocation(program, 'matrixV2');
    const matrixV3Loc = gl.getAttribLocation(program, 'matrixV3');
    const projectionLoc = gl.getUniformLocation(program, 'projection');
    const viewLoc = gl.getUniformLocation(program, 'view');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -0.1,  0.4,
        -0.1, -0.4,
         0.1, -0.4,
         0.1, -0.4,
        -0.1,  0.4,
         0.1,  0.4,
         0.4, -0.1,
        -0.4, -0.1,
        -0.4,  0.1,
        -0.4,  0.1,
         0.4, -0.1,
         0.4,  0.1,
    ]), gl.STATIC_DRAW);
    const numVertices = 12;

    // setup matrixes, one per instance 一个实例对应一个matrice
    const numInstances = 5;
    // make a typed array with one view per matrix
    const matrixData = new Float32Array(numInstances * 16);
    const matrices = [];
    for (let i = 0; i < numInstances; ++i) {
        const byteOffsetToMatrix = i * 16 * 4;
        const numFloatsForView = 16;
        matrices.push(new Float32Array(
            matrixData.buffer,
            byteOffsetToMatrix,
            numFloatsForView));
    }

    //const matrixBuffer = gl.createBuffer();
    //gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
    //// just allocate the buffer
    //gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW);

    //const matrices = [];
    //for (let i = 0; i < numInstances; ++i) {
    //    //matrices.push(m4.identity);
    //    matrices.push(new Float32Array(16));
    //}

    const matrixDataV0 = new Float32Array(numInstances * 4);
    const matrixBufferV0 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBufferV0);
    // just allocate the buffer
    gl.bufferData(gl.ARRAY_BUFFER, matrixDataV0.byteLength, gl.DYNAMIC_DRAW);

    const matrixDataV1 = new Float32Array(numInstances * 4);
    const matrixBufferV1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBufferV1);
    // just allocate the buffer
    gl.bufferData(gl.ARRAY_BUFFER, matrixDataV1.byteLength, gl.DYNAMIC_DRAW);

    const matrixDataV2 = new Float32Array(numInstances * 4);
    const matrixBufferV2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBufferV2);
    // just allocate the buffer
    gl.bufferData(gl.ARRAY_BUFFER, matrixDataV2.byteLength, gl.DYNAMIC_DRAW);

    const matrixDataV3 = new Float32Array(numInstances * 4);
    const matrixBufferV3 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBufferV3);
    // just allocate the buffer
    gl.bufferData(gl.ARRAY_BUFFER, matrixDataV3.byteLength, gl.DYNAMIC_DRAW);

    // setup colors, one per instance
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([
            1, 0, 0, 1,  // red
            0, 1, 0, 1,  // green
            0, 0, 1, 1,  // blue
            1, 0, 1, 1,  // magenta
            0, 1, 1, 1,  // cyan
        ]),
        gl.STATIC_DRAW);

    function render(time) {
        time *= 0.001; // seconds

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(program);

        // set the view and projection matrices since
        // they are shared by all instances
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        gl.uniformMatrix4fv(projectionLoc, false,m4.orthographic(-aspect, aspect, -1, 1, -1, 1));
        //gl.uniformMatrix4fv(viewLoc, false, m4.zRotation(time * .1));
        gl.uniformMatrix4fv(viewLoc, false, m4.identity());//测试

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        // update all the matrices
        matrices.forEach((mat, ndx) => {
            m4.translation(-0.5 + ndx * 0.25, 0, 0, mat);
            m4.zRotate(mat, time * (0.1 + 0.1 * ndx), mat);
        });

        //构造matrixData 
        for (let ndx = 0; ndx < numInstances; ndx++) {
            matrixDataV0[ndx*4]=matrixData[ndx*16+0];
            matrixDataV0[ndx*4+1]=matrixData[ndx*16+4];
            matrixDataV0[ndx*4+2]=matrixData[ndx*16+8];
            matrixDataV0[ndx*4+3]=matrixData[ndx*16+12];
            matrixDataV1[ndx*4]=matrixData[ndx*16+1];
            matrixDataV1[ndx*4+1]=matrixData[ndx*16+5];
            matrixDataV1[ndx*4+2]=matrixData[ndx*16+9];
            matrixDataV1[ndx*4+3]=matrixData[ndx*16+13];
            matrixDataV2[ndx*4]=matrixData[ndx*16+2];
            matrixDataV2[ndx*4+1]=matrixData[ndx*16+6];
            matrixDataV2[ndx*4+2]=matrixData[ndx*16+10];
            matrixDataV2[ndx*4+3]=matrixData[ndx*16+14];
            matrixDataV3[ndx*4]=matrixData[ndx*16+3];
            matrixDataV3[ndx*4+1]=matrixData[ndx*16+7];
            matrixDataV3[ndx*4+2]=matrixData[ndx*16+11];
            matrixDataV3[ndx*4+3]=matrixData[ndx*16+15];

            //matrixDataV0[ndx*4]=matrixData[ndx*16+0];
            //matrixDataV0[ndx*4+1]=matrixData[ndx*16+1];
            //matrixDataV0[ndx*4+2]=matrixData[ndx*16+2];
            //matrixDataV0[ndx*4+3]=matrixData[ndx*16+3];
            //matrixDataV1[ndx*4]=matrixData[ndx*16+4];
            //matrixDataV1[ndx*4+1]=matrixData[ndx*16+5];
            //matrixDataV1[ndx*4+2]=matrixData[ndx*16+6];
            //matrixDataV1[ndx*4+3]=matrixData[ndx*16+7];
            //matrixDataV2[ndx*4]=matrixData[ndx*16+8];
            //matrixDataV2[ndx*4+1]=matrixData[ndx*16+9];
            //matrixDataV2[ndx*4+2]=matrixData[ndx*16+10];
            //matrixDataV2[ndx*4+3]=matrixData[ndx*16+11];
            //matrixDataV3[ndx*4]=matrixData[ndx*16+12];
            //matrixDataV3[ndx*4+1]=matrixData[ndx*16+13];
            //matrixDataV3[ndx*4+2]=matrixData[ndx*16+14];
            //matrixDataV3[ndx*4+3]=matrixData[ndx*16+15];
        }

        //// upload the new matrix data
        //gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
        //gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);
       
        //// set all 4 attributes for matrix
        //const bytesPerMatrix = 4 * 16;
        //for (let i = 0; i < 4; ++i) {
        //    const loc = matrixLoc + i;
        //    gl.enableVertexAttribArray(loc);
        //    // note the stride and offset
        //    const offset = i * 16;  // 4 floats per row, 4 bytes per float
        //    gl.vertexAttribPointer(
        //        loc,              // location
        //        4,                // size (num values to pull from buffer per iteration)
        //        gl.FLOAT,         // type of data in buffer
        //        false,            // normalize
        //        bytesPerMatrix,   // stride, num bytes to advance to get to next set of values
        //        offset,           // offset in buffer
        //    );
        //    // this line says this attribute only changes for each 1 instance
        //    ext.vertexAttribDivisorANGLE(loc, 1);
       //}

       
        gl.bindBuffer(gl.ARRAY_BUFFER, matrixBufferV0);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixDataV0);
        gl.enableVertexAttribArray(matrixV0Loc);
        gl.vertexAttribPointer(matrixV0Loc, 4, gl.FLOAT, false, 0, 0);
        // this line says this attribute only changes for each 1 instance
        ext.vertexAttribDivisorANGLE(matrixV0Loc, 1);

        gl.bindBuffer(gl.ARRAY_BUFFER, matrixBufferV1);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixDataV1);
        gl.enableVertexAttribArray(matrixV1Loc);
        gl.vertexAttribPointer(matrixV1Loc, 4, gl.FLOAT, false, 0, 0);
        // this line says this attribute only changes for each 1 instance
        ext.vertexAttribDivisorANGLE(matrixV1Loc, 1);

        gl.bindBuffer(gl.ARRAY_BUFFER, matrixBufferV2);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixDataV2);
        gl.enableVertexAttribArray(matrixV2Loc);
        gl.vertexAttribPointer(matrixV2Loc, 4, gl.FLOAT, false, 0, 0);
        // this line says this attribute only changes for each 1 instance
        ext.vertexAttribDivisorANGLE(matrixV2Loc, 1);

        gl.bindBuffer(gl.ARRAY_BUFFER, matrixBufferV3);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixDataV3);
        gl.enableVertexAttribArray(matrixV3Loc);
        gl.vertexAttribPointer(matrixV3Loc, 4, gl.FLOAT, false, 0, 0);
       // this line says this attribute only changes for each 1 instance
        ext.vertexAttribDivisorANGLE(matrixV3Loc, 1);
       
        // set attribute for color
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
        // this line says this attribute only changes for each 1 instance
        ext.vertexAttribDivisorANGLE(colorLoc, 1);
       
        ext.drawArraysInstancedANGLE(
          gl.TRIANGLES,
          0,             // offset
          numVertices,   // num vertices per instance
          numInstances,  // num instances
        );
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();
