const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [16, 48, 128];
const colors = {
    background: '#25D366',
    foreground: '#FFFFFF'
};

// Ensure icons directory exists
if (!fs.existsSync('./icons')) {
    fs.mkdirSync('./icons', { recursive: true });
}

try {
    sizes.forEach(size => {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        // Draw background (rounded rectangle)
        ctx.fillStyle = colors.background;
        ctx.beginPath();
        const radius = size * 0.2;
        ctx.moveTo(size, size - radius);
        ctx.arcTo(size, size, 0, size, radius);
        ctx.arcTo(0, size, 0, 0, radius);
        ctx.arcTo(0, 0, size, 0, radius);
        ctx.arcTo(size, 0, size, size, radius);
        ctx.closePath();
        ctx.fill();

        // Draw "ST" text
        ctx.fillStyle = colors.foreground;
        ctx.font = `bold ${size * 0.5}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ST', size / 2, size / 2);

        // Save the icon
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(`icons/icon${size}.png`, buffer);
        console.log(`Generated icon${size}.png`);
    });

    console.log('Icon generation completed successfully!');
} catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
} 