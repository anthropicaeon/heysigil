import { execSync } from 'child_process';
import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Get ffmpeg binary path from ffmpeg-static
const ffmpegPath = require('ffmpeg-static');
console.log('ffmpeg binary:', ffmpegPath);

const input = resolve(__dirname, 'sigil-demo.webp');
const output = resolve(__dirname, 'sigil-demo.mp4');

// Convert animated WebP to MP4
// -an = no audio, -pix_fmt yuv420p for compatibility
try {
    execSync(`${ffmpegPath} -y -i "${input}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "${output}"`, {
        stdio: 'inherit'
    });
    console.log('\\n✅ Converted to MP4:', output);
} catch (e) {
    console.error('Conversion failed:', e.message);
    process.exit(1);
}
