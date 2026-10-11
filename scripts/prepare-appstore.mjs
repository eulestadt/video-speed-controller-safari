#!/usr/bin/env node
/**
 * Apply store/config.json bundle IDs into macos Info.plist templates and
 * produce a release/appstore/ web-extension zip suitable for:
 *  - Xcode Safari Web Extension project Resources, or
 *  - App Store Connect “Safari Web Extension” packager upload
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);
const pkg = require(path.join(root, 'package.json'));

const configPath = path.join(root, 'store', 'config.json');
const examplePath = path.join(root, 'store', 'config.example.json');

if (!fs.existsSync(configPath)) {
  console.error('Missing store/config.json');
  console.error(`Copy ${examplePath} → store/config.json and fill in your Team ID / bundle IDs.`);
  process.exit(1);
}

const config = fs.readJsonSync(configPath);
for (const key of ['bundleId', 'extensionBundleId', 'teamId', 'privacyPolicyUrl']) {
  if (!config[key] || String(config[key]).includes('YOUR')) {
    console.error(`store/config.json: set a real value for "${key}"`);
    process.exit(1);
  }
}

// Ensure dist-safari exists
execFileSync('npm', ['run', 'build:safari:temp'], { cwd: root, stdio: 'inherit', env: process.env });

const outDir = path.join(root, 'release', 'appstore');
fs.removeSync(outDir);
fs.ensureDirSync(outDir);

const webExtDir = path.join(outDir, 'VideoSpeedController');
fs.copySync(path.join(root, 'dist-safari'), webExtDir);

// Stamp publisher bundle metadata into a sidecar for Xcode / ASC
fs.writeJsonSync(
  path.join(outDir, 'publish-identity.json'),
  {
    ...config,
    version: pkg.version,
    builtAt: new Date().toISOString(),
  },
  { spaces: 2 }
);

// Rewrite macos Info.plist templates into release copies (do not mutate source defaults used for local ad-hoc)
const appInfo = fs.readFileSync(path.join(root, 'macos', 'App', 'Info.plist'), 'utf8')
  .replaceAll('com.igrigorik.videospeed', config.bundleId)
  .replaceAll('0.11.1', pkg.version);
const extInfo = fs.readFileSync(path.join(root, 'macos', 'Extension', 'Info.plist'), 'utf8')
  .replaceAll('com.igrigorik.videospeed.Extension', config.extensionBundleId)
  .replaceAll('com.igrigorik.videospeed', config.bundleId)
  .replaceAll('0.11.1', pkg.version);

fs.ensureDirSync(path.join(outDir, 'macos-plists'));
fs.writeFileSync(path.join(outDir, 'macos-plists', 'App-Info.plist'), appInfo);
fs.writeFileSync(path.join(outDir, 'macos-plists', 'Extension-Info.plist'), extInfo);

// Swift host app hardcodes the extension id — emit a reminder snippet
const swiftSnippet = `// Set in VideoSpeedControllerApp.swift before Archive:
private let extensionId = "${config.extensionBundleId}"
`;
fs.writeFileSync(path.join(outDir, 'macos-plists', 'extensionId.swift.txt'), swiftSnippet);

// Zip for App Store Connect Safari packager
const zipPath = path.join(outDir, `VideoSpeedController-${pkg.version}.zip`);
fs.removeSync(zipPath);
execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', webExtDir, zipPath], {
  stdio: 'inherit',
});

console.log(`
✅ App Store package prepared

Web extension folder: ${webExtDir}
Upload ZIP:           ${zipPath}
Plists (your IDs):    ${path.join(outDir, 'macos-plists')}
Identity:             ${config.bundleId} / team ${config.teamId}

Next:
  1. Host store/privacy/privacy-policy.html at ${config.privacyPolicyUrl}
  2. Create the app in App Store Connect with bundle id ${config.bundleId}
  3. Either upload the ZIP via ASC Safari Web Extension packager,
     or open an Xcode Safari Web Extension app, set Team ${config.teamId},
     replace Resources with the web extension folder, Archive → Upload.
  4. Paste store/review/App-Review-Notes.md into Review Notes
  5. Complete Privacy Nutrition Label (Data Not Collected)
`);
