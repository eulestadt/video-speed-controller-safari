#!/usr/bin/env node
/**
 * Build a macOS Safari Web Extension app from dist/ without requiring Xcode.
 * Uses the Command Line Tools Swift toolchain + MacOSX26.5.sdk.
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync, execSync } from 'child_process';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const pkg = require(path.join(rootDir, 'package.json'));

const APP_NAME = 'Video Speed Controller';
const EXT_NAME = 'Video Speed Controller Extension';
const APP_ID = 'com.igrigorik.videospeed';
const EXT_ID = `${APP_ID}.Extension`;
const MODULE_EXT = 'Video_Speed_Controller_Extension';
const MODULE_APP = 'Video_Speed_Controller';

const outRoot = path.join(rootDir, 'release', 'safari');
const appPath = path.join(outRoot, `${APP_NAME}.app`);
const appexPath = path.join(appPath, 'Contents', 'PlugIns', `${EXT_NAME}.appex`);

const preferredSdks = [
  '/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk',
  '/Library/Developer/CommandLineTools/SDKs/MacOSX26.sdk',
  '/Library/Developer/CommandLineTools/SDKs/MacOSX15.4.sdk',
];

function findSdk() {
  for (const sdk of preferredSdks) {
    if (fs.existsSync(sdk)) return sdk;
  }
  try {
    return execFileSync('xcrun', ['--show-sdk-path'], { encoding: 'utf8' }).trim();
  } catch {
    throw new Error('No macOS SDK found. Install Xcode or Command Line Tools.');
  }
}

function run(cmd, args, opts = {}) {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { stdio: 'inherit', ...opts });
}

function ensureDist() {
  const manifest = path.join(rootDir, 'dist', 'manifest.json');
  if (!fs.existsSync(manifest)) {
    console.log('dist/ missing — running npm build…');
    run('npm', ['run', 'build'], { cwd: rootDir, env: process.env });
  }
}

function safariManifest(chromeManifest) {
  const m = structuredClone(chromeManifest);
  delete m.minimum_chrome_version;
  m.browser_specific_settings = {
    safari: {
      strict_min_version: '18.0',
    },
  };
  // Safari is happier with classic background scripts for IIFE bundles.
  m.background = {
    scripts: ['background.js'],
    persistent: false,
  };
  m.host_permissions = ['*://*/*', 'file:///*'];
  return m;
}

/** Folder for Safari 26 Developer → Add Temporary Extension… (must not be inside an .app). */
function writeTemporaryExtensionFolder() {
  const dest = path.join(rootDir, 'dist-safari');
  fs.removeSync(dest);
  fs.copySync(path.join(rootDir, 'dist'), dest, {
    filter: (src) => !['CONTRIBUTING.md', 'README.md'].includes(path.basename(src)),
  });
  const chromeManifest = fs.readJsonSync(path.join(rootDir, 'dist', 'manifest.json'));
  fs.writeJsonSync(path.join(dest, 'manifest.json'), safariManifest(chromeManifest), {
    spaces: 2,
  });
  try {
    execFileSync('xattr', ['-cr', dest], { stdio: 'ignore' });
  } catch {
    /* optional */
  }
  console.log(`✅ Temporary Safari extension folder: ${dest}`);
  return dest;
}

function writeIcon(destIcns) {
  const srcPng = path.join(rootDir, 'dist', 'assets', 'icons', 'icon128.png');
  const iconset = path.join(outRoot, 'AppIcon.iconset');
  fs.removeSync(iconset);
  fs.ensureDirSync(iconset);
  const sizes = [16, 32, 128, 256, 512];
  for (const size of sizes) {
    const out1 = path.join(iconset, `icon_${size}x${size}.png`);
    run('sips', ['-z', String(size), String(size), srcPng, '--out', out1], {
      stdio: 'pipe',
    });
    if (size <= 256) {
      const out2 = path.join(iconset, `icon_${size}x${size}@2x.png`);
      run('sips', ['-z', String(size * 2), String(size * 2), srcPng, '--out', out2], {
        stdio: 'pipe',
      });
    }
  }
  run('iconutil', ['-c', 'icns', iconset, '-o', destIcns]);
  fs.removeSync(iconset);
}

function compileExtension(sdk, binaryOut) {
  const src = path.join(rootDir, 'macos', 'Extension', 'SafariWebExtensionHandler.swift');
  run('swiftc', [
    '-sdk',
    sdk,
    '-target',
    'arm64-apple-macos13.0',
    '-framework',
    'SafariServices',
    '-framework',
    'Foundation',
    '-Xlinker',
    '-e',
    '-Xlinker',
    '_NSExtensionMain',
    '-emit-executable',
    '-module-name',
    MODULE_EXT,
    '-o',
    binaryOut,
    src,
  ]);
}

function compileApp(sdk, binaryOut) {
  const src = path.join(rootDir, 'macos', 'App', 'VideoSpeedControllerApp.swift');
  run('swiftc', [
    '-sdk',
    sdk,
    '-target',
    'arm64-apple-macos13.0',
    '-framework',
    'SwiftUI',
    '-framework',
    'AppKit',
    '-framework',
    'SafariServices',
    '-parse-as-library',
    '-emit-executable',
    '-module-name',
    MODULE_APP,
    '-o',
    binaryOut,
    src,
  ]);
}

function packageBundle(sdk) {
  fs.removeSync(outRoot);
  fs.ensureDirSync(outRoot);

  const appMacOS = path.join(appPath, 'Contents', 'MacOS');
  const appResources = path.join(appPath, 'Contents', 'Resources');
  const extMacOS = path.join(appexPath, 'Contents', 'MacOS');
  const extResources = path.join(appexPath, 'Contents', 'Resources');

  fs.ensureDirSync(appMacOS);
  fs.ensureDirSync(appResources);
  fs.ensureDirSync(extMacOS);
  fs.ensureDirSync(extResources);
  fs.ensureDirSync(path.join(appPath, 'Contents', 'PlugIns'));

  // Copy web extension payload
  fs.copySync(path.join(rootDir, 'dist'), extResources, {
    filter: (src) => {
      const base = path.basename(src);
      return !['CONTRIBUTING.md', 'README.md'].includes(base);
    },
  });

  const chromeManifest = fs.readJsonSync(path.join(rootDir, 'dist', 'manifest.json'));
  const version = chromeManifest.version || pkg.version;
  fs.writeJsonSync(path.join(extResources, 'manifest.json'), safariManifest(chromeManifest), {
    spaces: 2,
  });

  // Info.plist files with version
  const appInfo = fs.readFileSync(path.join(rootDir, 'macos', 'App', 'Info.plist'), 'utf8');
  const extInfo = fs.readFileSync(path.join(rootDir, 'macos', 'Extension', 'Info.plist'), 'utf8');
  fs.writeFileSync(
    path.join(appPath, 'Contents', 'Info.plist'),
    appInfo.replaceAll('0.11.1', version)
  );
  fs.writeFileSync(
    path.join(appexPath, 'Contents', 'Info.plist'),
    extInfo.replaceAll('0.11.1', version)
  );
  fs.writeFileSync(path.join(appPath, 'Contents', 'PkgInfo'), 'APPL????');

  const icns = path.join(appResources, 'AppIcon.icns');
  writeIcon(icns);
  // Ensure Info.plist references icon
  let info = fs.readFileSync(path.join(appPath, 'Contents', 'Info.plist'), 'utf8');
  if (!info.includes('CFBundleIconFile')) {
    info = info.replace(
      '</dict>\n</plist>',
      '\t<key>CFBundleIconFile</key>\n\t<string>AppIcon</string>\n</dict>\n</plist>'
    );
    fs.writeFileSync(path.join(appPath, 'Contents', 'Info.plist'), info);
  }

  const extBin = path.join(extMacOS, EXT_NAME);
  const appBin = path.join(appMacOS, APP_NAME);
  compileExtension(sdk, extBin);
  compileApp(sdk, appBin);

  // Ad-hoc sign extension then app (nested)
  const extEnt = path.join(rootDir, 'macos', 'Extension', 'Video_Speed_Controller_Extension.entitlements');
  const appEnt = path.join(rootDir, 'macos', 'App', 'Video_Speed_Controller.entitlements');

  run('codesign', [
    '--force',
    '--sign',
    '-',
    '--entitlements',
    extEnt,
    '--timestamp=none',
    appexPath,
  ]);
  run('codesign', [
    '--force',
    '--sign',
    '-',
    '--entitlements',
    appEnt,
    '--timestamp=none',
    appPath,
  ]);

  run('codesign', ['--verify', '--verbose=2', appPath]);
  console.log(`\n✅ Safari app built: ${appPath}`);
  console.log(`   Bundle IDs: ${APP_ID} / ${EXT_ID}`);
}

function installApp() {
  const destDir = path.join(process.env.HOME, 'Applications');
  fs.ensureDirSync(destDir);
  const dest = path.join(destDir, `${APP_NAME}.app`);
  fs.removeSync(dest);
  fs.copySync(appPath, dest);
  // Re-sign after copy
  const appEnt = path.join(rootDir, 'macos', 'App', 'Video_Speed_Controller.entitlements');
  const extEnt = path.join(rootDir, 'macos', 'Extension', 'Video_Speed_Controller_Extension.entitlements');
  run('codesign', [
    '--force',
    '--sign',
    '-',
    '--entitlements',
    extEnt,
    '--timestamp=none',
    path.join(dest, 'Contents', 'PlugIns', `${EXT_NAME}.appex`),
  ]);
  run('codesign', ['--force', '--sign', '-', '--entitlements', appEnt, '--timestamp=none', dest]);
  console.log(`✅ Installed to ${dest}`);
  try {
    execSync(`open "${dest}"`);
  } catch {
    console.log('Open the app manually to register the Safari extension.');
  }
}

ensureDist();
writeTemporaryExtensionFolder();

const skipApp = process.argv.includes('--temporary-only');
if (!skipApp) {
  const sdk = findSdk();
  console.log(`Using SDK: ${sdk}`);
  packageBundle(sdk);
  if (process.argv.includes('--install')) {
    installApp();
  }
} else {
  console.log('\nSkip app packaging (--temporary-only).');
  console.log('In Safari: Settings → Developer → Add Temporary Extension…');
  console.log(`Select folder: ${path.join(rootDir, 'dist-safari')}`);
}
