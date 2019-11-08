"use strict";

function main() {
    // Get A 2D context
    /** @type {Canvas2DRenderingContext} */
    const ctx = document.createElement("canvas").getContext("2d");

    ctx.canvas.width = 128;
    ctx.canvas.height = 128;

    const faceInfos = [
      { faceColor: '#F00', textColor: '#0FF', text: '+X' },
      { faceColor: '#FF0', textColor: '#00F', text: '-X' },
      { faceColor: '#0F0', textColor: '#F0F', text: '+Y' },
      { faceColor: '#0FF', textColor: '#F00', text: '-Y' },
      { faceColor: '#00F', textColor: '#FF0', text: '+Z' },
      { faceColor: '#F0F', textColor: '#0F0', text: '-Z' },
    ];
    faceInfos.forEach((faceInfo) => {
        const {faceColor, textColor, text} = faceInfo;
    generateFace(ctx, faceColor, textColor, text);

    // show the result
    ctx.canvas.toBlob((blob) => {
        const img = new Image();
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img);
});
});
}

function generateFace(ctx, faceColor, textColor, text) {
    const {width, height} = ctx.canvas;
ctx.fillStyle = faceColor;
ctx.fillRect(0, 0, width, height);
ctx.font = `${width * 0.7}px sans-serif`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = textColor;
ctx.fillText(text, width / 2, height / 2);
}

main();
