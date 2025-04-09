const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [16, 48, 128];
const colors = {
    background: '#25D366',
    foreground: '#FFFFFF'
};

sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, size, size);

    // Draw "ST" text
    ctx.fillStyle = colors.foreground;
    ctx.font = `bold ${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ST', size / 2, size / 2);

    // Save the icon
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icons/icon${size}.png`, buffer);
}); 