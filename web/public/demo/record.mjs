import puppeteer from 'puppeteer';
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { mkdirSync, rmSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ffmpegPath = require('ffmpeg-static');

const FRAMES_DIR = resolve(__dirname, '_frames');
const OUTPUT = resolve(__dirname, 'sigil-demo.mp4');
const FPS = 15; // frames per second
const DURATION_MS = 25000; // 25 seconds total
const FRAME_INTERVAL = 1000 / FPS;

async function main() {
    // Clean up old frames
    try { rmSync(FRAMES_DIR, { recursive: true }); } catch { }
    mkdirSync(FRAMES_DIR, { recursive: true });

    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();
    console.log('Navigating to demo page...');
    await page.goto('http://localhost:3000/demo/sigil-demo.html', { waitUntil: 'networkidle0' });

    console.log(`Recording ${DURATION_MS / 1000}s at ${FPS}fps...`);
    const totalFrames = Math.ceil(DURATION_MS / FRAME_INTERVAL);

    for (let i = 0; i < totalFrames; i++) {
        const padded = String(i).padStart(5, '0');
        await page.screenshot({
            path: resolve(FRAMES_DIR, `frame_${padded}.png`),
            type: 'png'
        });

        if (i % (FPS * 2) === 0) {
            const sec = (i / FPS).toFixed(0);
            console.log(`  ${sec}s / ${DURATION_MS / 1000}s (frame ${i}/${totalFrames})`);
        }

        // Wait for next frame interval
        await new Promise(r => setTimeout(r, FRAME_INTERVAL));
    }

    console.log('Recording complete. Closing browser...');
    await browser.close();

    // Stitch frames into MP4
    const frameCount = readdirSync(FRAMES_DIR).filter(f => f.endsWith('.png')).length;
    console.log(`Stitching ${frameCount} frames into MP4...`);

    execSync(
        `${ffmpegPath} -y -framerate ${FPS} -i "${FRAMES_DIR}/frame_%05d.png" ` +
        `-c:v libx264 -pix_fmt yuv420p -movflags +faststart -preset fast ` +
        `-crf 20 -an "${OUTPUT}"`,
        { stdio: 'inherit' }
    );

    // Clean up frames
    rmSync(FRAMES_DIR, { recursive: true });

    console.log(`\n✅ MP4 saved to: ${OUTPUT}`);
}

main().catch(err => { console.error(err); process.exit(1); });
