#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = fs.readFileSync(path.join(root, 'src/assets/icons/logo.svg'), 'utf8');
const outDir = path.join(root, 'src/assets/icons');
const storeDir = path.join(root, 'store/icons');
fs.mkdirSync(storeDir, { recursive: true });

const chromeCandidates = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean);

const launchOpts = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
};
for (const candidate of chromeCandidates) {
  if (fs.existsSync(candidate)) {
    launchOpts.executablePath = candidate;
    break;
  }
}

const browser = await puppeteer.launch(launchOpts);
const page = await browser.newPage();

async function renderPng(size, filePath, desaturate = false) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:transparent">
      <div id="r" style="width:${size}px;height:${size}px;${
        desaturate ? 'filter:grayscale(1) opacity(0.55)' : ''
      }">${svg}</div>
      <style>svg{width:100%;height:100%;display:block}</style>
    </body></html>`,
    { waitUntil: 'load' }
  );
  await (await page.$('#r')).screenshot({ path: filePath, omitBackground: true });
  console.log('wrote', path.relative(root, filePath), `(${size}px)`);
}

for (const [name, size] of [
  ['icon16.png', 16],
  ['icon19.png', 19],
  ['icon38.png', 38],
  ['icon48.png', 48],
  ['icon128.png', 128],
]) {
  await renderPng(size, path.join(outDir, name));
}
for (const size of [19, 38, 48]) {
  await renderPng(size, path.join(outDir, `icon${size}_disabled.png`), true);
}
await renderPng(1024, path.join(storeDir, 'AppIcon-1024.png'));
await renderPng(512, path.join(storeDir, 'AppIcon-512.png'));
fs.copyFileSync(path.join(outDir, 'logo.svg'), path.join(storeDir, 'logo.svg'));
await browser.close();
console.log('✅ Icons rendered from logo.svg');
