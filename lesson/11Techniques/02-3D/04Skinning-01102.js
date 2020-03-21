"use strict";

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }

    // compiles and links the shaders, looks up attribute and uniform locations
    var programInfo = webglUtils.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
        position: {
            numComponents: 2,
            data: [
             //0, 1,  // 0
             //0, -1,  // 1
             //2, 1,  // 2
             //2, -1,  // 3
             //4, 1,  // 4
             //4, -1,  // 5
             //6, 1,  // 6
             //6, -1,  // 7
             //8, 1,  // 8
             //8, -1,  // 9

             2, 1,  // 0
             2, -1,  // 1
             4, 1,  // 2
             4, -1,  // 3
             6, 1,  // 4
             6, -1,  // 5
             8, 1,  // 6
             8, -1,  // 7
             10, 1,  // 8
             10, -1,  // 9
            ],
        },
        //三个节点索引0-2
        boneNdx: {
            numComponents: 2,
            data: [
              0, 0,  // 0
              0, 0,  // 1
              0, 1,  // 2
              0, 1,  // 3
              1, 0,  // 4
              1, 0,  // 5
              1, 2,  // 6
              1, 2,  // 7
              2, 0,  // 8
              2, 0,  // 9
            ],
        },
        weight: {
            numComponents: 2,
            data: [
             1, 0,  // 0
             1, 0,  // 1
            .5, .5, // 2
            .5, .5, // 3
             1, 0,  // 4
             1, 0,  // 5
            .5, .5, // 6
            .5, .5, // 7
             1, 0,  // 8
             1, 0,  // 9
            ],
        },

        indices: {
            numComponents: 2,
            data: [
              0, 1,
              0, 2,
              1, 3,
              2, 3, //
              2, 4,
              3, 5,
              4, 5,
              4, 6,
              5, 7, //
              6, 7,
              6, 8,
              7, 9,
              8, 9,
            ],
        },
    };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData
    var bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);

    // 3 matrices, one for each bone
    var numBones = 3;
    //var boneArray = new Float32Array(numBones * 16);

    var uniforms = {
        projection: m4.orthographic(-20, 20, -10, 10, -1, 1),
        view: m4.translation(-6, 0, 0),
        //bones: boneArray,
        bones:new Float32Array(numBones * 16),
        color: [1, 0, 0, 1],
    };

    // make views for each bone. This lets all the bones
    // exist in 1 array for uploading but as separate
    // arrays for using with the math functions
    // 为所有骨骼创建视图
    // 在一个数组中以便上传，但是是分割的
    // 数学计算用到的数组
    var boneMatrices = [];  // 全局变量数据 the uniform data
    var bones = [];         // 乘以绑定矩阵的逆之前的值 the value before multiplying by inverse bind matrix
    var bindPose = [];      // 绑定矩阵 the bind matrix
    for (var i = 0; i < numBones; ++i) {
        //boneMatrices.push(new Float32Array(boneArray.buffer, i * 4 * 16, 16));//使用同一内存，便于
        boneMatrices.push(m4.identity());//测试
        bindPose.push(m4.identity());  // 仅仅分配存储空间 just allocate storage
        bones.push(m4.identity());     // just allocate storage
    }

    // rotate each bone by a and simulate a hierarchy
    // 旋转每个骨骼角度，模拟一个层级
    function computeBoneMatrices(bones_input, angle) {
        var m = m4.identity();
        m4.zRotate(m, angle, bones_input[0]);//第一个节点旋转，不用平移
        m4.translate(bones_input[0], 4, 0, 0, m);//第二个节点在第一个节点上平移4
        m4.zRotate(m, angle, bones_input[1]);//第二个节点旋转
        m4.translate(bones_input[1], 4, 0, 0, m);//第三个节点在第二个节点基础上平移4
        m4.zRotate(m, -angle, bones_input[2]);//第三个节点旋转
    }

    // compute the initial positions of each matrix
    //  计算每个矩阵的初始位置
    computeBoneMatrices(bindPose, 0);

    // compute their inverses
    // 计算他们的逆  固定不变的
    var bindPoseInv = bindPose.map(function (m) {
        return m4.inverse(m);
    });
    //var bindPoseInv = [];
    //for (var i = 0; i < numBones; ++i) {
    //    bindPoseInv.push(m4.identity()); 
    //}

    function render(time) {
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        m4.orthographic(-aspect * 10, aspect * 10, -10, 10, -1, 1, uniforms.projection);

        //var t = time * 0.001;
        let t = time*Math.PI / 180.0;
        var angle = Math.sin(t);
        computeBoneMatrices(bones, angle);

        // multiply each by its bindPoseInverse
        // 每个都乘以绑定矩阵的逆
        // 本示例中主要消除bone移动
        bones.forEach(function (bone, ndx) {
            m4.multiply(bone, bindPoseInv[ndx], boneMatrices[ndx]);
        });

        //uniforms.bones = new Float32Array(boneMatrices[0], boneMatrices[1], boneMatrices[2]);//赋值方式错误
        var index = 0;
        boneMatrices.forEach(function (bone, ndx) {
            bone.forEach(function (item, ndx1) {
                uniforms.bones[index++] = item;
            });
        });


        gl.useProgram(programInfo.program);
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

        // calls gl.uniformXXX, gl.activeTexture, gl.bindTexture
        webglUtils.setUniforms(programInfo, uniforms);

        // calls gl.drawArrays or gl.drawIndices
        webglUtils.drawBufferInfo(gl, bufferInfo, gl.LINES);

        drawAxis(uniforms.projection, uniforms.view, bones);

        //requestAnimationFrame(render);
    }
    //requestAnimationFrame(render);
    render(30.0);

    // --- ignore below this line - it's not relevant to the exmample and it's kind of a bad example ---

    var axisProgramInfo;
    var axisBufferInfo;
    function drawAxis(projection, view, bones) {
        if (!axisProgramInfo) {
            axisProgramInfo = webglUtils.createProgramInfo(gl, ['vs2', 'fs']);
            axisBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
                position: {
                    numComponents: 2,
                    data: [
                      0, 0,
                      1, 0,
                    ],
                },
            });
        }

        var uniforms = {
            projection: projection,
            view: view,
        };

        gl.useProgram(axisProgramInfo.program);
        webglUtils.setBuffersAndAttributes(gl, axisProgramInfo, axisBufferInfo);

        //作用在原点所以直接乘以bones
        for (var i = 0; i < 3; ++i) {
            drawLine(bones[i], 0, [0, 1, 0, 1]);
            drawLine(bones[i], Math.PI * 0.5, [0, 0, 1, 1]);
        }

        function drawLine(mat, angle, color) {
            uniforms.model = m4.zRotate(mat, angle);
            uniforms.color = color;
            webglUtils.setUniforms(axisProgramInfo, uniforms);
            webglUtils.drawBufferInfo(gl, axisBufferInfo, gl.LINES);
        }
    }
}

main();
