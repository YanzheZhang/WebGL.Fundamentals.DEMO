'use strict';
const gl = document.querySelector('#c').getContext('webgl');

gl.enable(gl.SCISSOR_TEST);

function drawRect(x, y, width, height, color) {
    gl.scissor(x, y, width, height);
    gl.clearColor(...color);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

for (let i = 0; i < 100; ++i) {
    const x = rand(0, 300);
    const y = rand(0, 150);
    const width = rand(0, 300 - x);
    const height = rand(0, 150 - y);
    drawRect(x, y, width, height, [rand(1), rand(1), rand(1), 1]);
}

function rand(min, max) {
    if (max === undefined) {
        max = min;
        min = 0;
    }
    return Math.random() * (max - min) + min;
}
