# Publish Video Speed Controller to the Mac App Store

End-to-end guide for a paid **Apple Developer Program** account. This repo already contains the Safari web extension, host-app sources, store copy, privacy policy, App Review notes, and QA checklist under `store/`.

## What you must do (you) vs what’s already prepared (repo)

| You                                                | Repo already has                                  |
| -------------------------------------------------- | ------------------------------------------------- |
| Install **Xcode** (or use ASC Safari packager)     | `dist-safari` / build scripts                     |
| Create App ID + certificates with **your** Team ID | `store/config.example.json`                       |
| **Change bundle IDs** off `com.igrigorik.*`        | `scripts/prepare-appstore.mjs`                    |
| Host privacy policy HTTPS URL                      | `store/privacy/privacy-policy.html`               |
| Create ASC listing, screenshots, submit            | `store/metadata/en-US.txt`, review notes, QA list |
| Run Safari QA on real sites                        | `store/review/QA-CHECKLIST.md` + `demo.html`      |

> **Do not ship with `com.igrigorik.videospeed`.** That reverse-DNS is for local/dev only. App Store apps must use an identifier under **your** team (e.g. `com.yourname.videospeedcontroller`).

---

## Phase 0 — One-time Apple setup (~30–60 min)

1. Confirm membership: [developer.apple.com/account](https://developer.apple.com/account) → Membership active.
2. Install **Xcode** from the Mac App Store (full app, not only Command Line Tools).
3. Xcode → Settings → Accounts → add your Apple ID → manage certificates → ensure **Apple Distribution** (and **Apple Development** for device testing) exist. Xcode can create them automatically when you set a Team on a project.
4. In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list):
   - **App ID** (macOS): `com.yourcompany.videospeedcontroller`
   - **App ID** (macOS App Extension): `com.yourcompany.videospeedcontroller.Extension`  
     Enable **Safari Web Extension** capability if shown.
5. Note your **Team ID** (Membership details).

---

## Phase 1 — Configure this repo

```sh
cp store/config.example.json store/config.json
```

Edit `store/config.json`:

- `bundleId` / `extensionBundleId` — your App IDs
- `teamId` — 10-character Team ID
- `privacyPolicyUrl` — public HTTPS URL (GitHub Pages, your site, etc.)
- support / marketing URLs

Host the privacy page:

```sh
# Example: publish store/privacy/privacy-policy.html to GitHub Pages or any static host
# Then set privacyPolicyUrl to that HTTPS URL
open store/privacy/privacy-policy.html
```

Build the App Store payload:

```sh
npm install
npm test
npm run prepare:appstore
```

Outputs:

- `release/appstore/VideoSpeedController-<version>.zip` — web extension zip
- `release/appstore/VideoSpeedController/` — unpacked Resources
- `release/appstore/macos-plists/` — Info.plist with **your** bundle IDs + Swift `extensionId` snippet

---

## Phase 2 — Choose a packaging path

### Path A (recommended if you want full control): Xcode Safari Web Extension app

1. Open Xcode → File → New → Project → **Safari Extension App** (macOS).
2. Product Name: `Video Speed Controller`  
   Bundle Identifier: **exactly** `store/config.json` → `bundleId`  
   Include **Safari Web Extension** target → `extensionBundleId`.
3. Set **Team** to your developer team (Signing & Capabilities).
4. Replace the template’s `Shared (Extension)/Resources` (or equivalent) with the contents of `release/appstore/VideoSpeedController/`.
5. Copy bundle IDs / versions from `release/appstore/macos-plists/`.
6. In the host app Swift, set `extensionId` to your `extensionBundleId` (see `extensionId.swift.txt`).
7. Prefer merging this repo’s `macos/App/VideoSpeedControllerApp.swift` UI (setup checklist + All Websites warning) into the Xcode host app — App Review 4.4 wants help/settings UI.
8. Capabilities on both targets:
   - App Sandbox **ON**
   - Hardened Runtime **ON** (Distribution)
9. Scheme → **Any Mac** → Product → **Archive**.
10. Organizer → **Distribute App** → App Store Connect → Upload.

Optional: keep using `npm run build` / sync Resources via a Run Script build phase that copies `dist-safari` before each archive.

### Path B: App Store Connect Safari Web Extension packager (less Xcode)

Apple can package a web-extension ZIP in App Store Connect (see [Packaging and distributing Safari Web Extensions with App Store Connect](https://developer.apple.com/documentation/SafariServices/packaging-and-distributing-safari-web-extensions-with-app-store-connect)).

1. Create the Mac app record in ASC with your bundle ID.
2. Upload `release/appstore/VideoSpeedController-<version>.zip` when ASC offers the Safari Web Extension packager / conversion flow.
3. Use TestFlight for Safari testing, then submit.

If the ASC UI doesn’t show the packager for your account yet, use Path A.

---

## Phase 3 — App Store Connect listing

1. [App Store Connect](https://appstoreconnect.apple.com) → My Apps → **+** → New App
   - Platforms: **macOS**
   - Name: Video Speed Controller
   - Bundle ID: your App ID
   - SKU: from `store/config.json`
2. **Pricing**: Free (or your choice).
3. **App Privacy**:
   - Privacy Policy URL = hosted `privacy-policy.html`
   - Nutrition Label: **Data Not Collected** (see `store/review/Privacy-Nutrition-Label.md`)
4. **App Information**: category Utilities; content rights; age 4+.
5. **Version** metadata: paste from `store/metadata/en-US.txt`.
6. **Review Notes**: paste `store/review/App-Review-Notes.md`.
7. **Screenshots** (macOS): typically **1280×800** (or current ASC sizes). Capture:
   - Host app window showing the **All Websites** callout
   - Safari on YouTube with the speed overlay visible
   - Safari Extensions settings showing Website Access = All Websites
   - Options / shortcuts page  
     Put finals in `store/screenshots/` (placeholders folder is ready).
8. **App icon**: use `store/icons/AppIcon-1024.png` (generated from `src/assets/icons/logo.svg`). Replace only if you want custom art; keep the SVG as the source of truth.

---

## Phase 4 — Testing Apple is likely to care about

Complete `store/review/QA-CHECKLIST.md`. Minimum set reviewers often hit:

1. Enable flow + **Website Access → All Websites** (call this out in review notes).
2. YouTube watch page — speed keys + overlay.
3. Generic HTML5 — `store/review/demo.html` or W3C mediaevents.
4. Audio element.
5. Private Browsing.
6. Options page + popup.
7. Speeds above 2× on a non-YouTube HTML5 video (Safari seek-boost path).
8. Confirm no crash on a complex site (YouTube is enough if Netflix isn’t available).

Automated gate before every upload:

```sh
npm test
npm run prepare:appstore
```

### Broad host access (guideline 4.4.2)

Reviewers may ask why the extension wants all sites. Answer is in App Review Notes: the product is **universal** HTML5 speed control; Safari still requires the user to grant access. Do **not** market it as a YouTube-only extension if you request all sites.

---

## Phase 5 — TestFlight then Submit

1. After upload processing finishes, add the build to the version.
2. Internal TestFlight → install on your Mac → re-run the QA checklist on a signed build (unsigned quirks go away).
3. Submit for Review.
4. Respond quickly if Resolution Center asks about permissions or “doesn’t work on YouTube” (almost always Website Access).

---

## Phase 6 — After approval

- Verify live product page privacy label + policy URL.
- In the host app / README, point users to **All Websites**.
- For updates: bump `version` in `package.json` (and Xcode `CFBundleShortVersionString` / `CFBundleVersion`), run `prepare:appstore`, archive, upload.

---

## Common rejection causes (avoid these)

| Risk                                        | Mitigation                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| Extension “does nothing” for reviewer       | Review notes spell out All Websites; host app UI highlights it             |
| Too many websites / unclear purpose         | Honest description: universal HTML5 controller; notes cite 4.4.2 rationale |
| Missing privacy policy URL                  | Host `store/privacy/privacy-policy.html`                                   |
| Placeholder / upscaled icon                 | Replace 1024 icon with real artwork                                        |
| Wrong bundle ID / team                      | `store/config.json` + ASC App ID must match Xcode                          |
| No app UI beyond empty shell                | Keep setup checklist host app (4.4)                                        |
| Claiming YouTube-only but matching all URLs | Align marketing with universal behavior                                    |

---

## File map

```
store/
  config.example.json          → copy to config.json
  metadata/en-US.txt           → ASC copy
  privacy/privacy-policy.html  → host this
  icons/                       → replace 1024 before ship
  screenshots/                 → your captures
  review/
    App-Review-Notes.md
    Privacy-Nutrition-Label.md
    QA-CHECKLIST.md
    demo.html
PUBLISHING.md                  → this guide
scripts/prepare-appstore.mjs   → npm run prepare:appstore
```

---

## Timeline (typical)

| Step                                     | Time                   |
| ---------------------------------------- | ---------------------- |
| Xcode + certs + App IDs                  | 1 hour                 |
| config + privacy host + prepare:appstore | 30 min                 |
| Xcode project + first Archive upload     | 2–4 hours (first time) |
| Screenshots + ASC metadata               | 1–2 hours              |
| QA checklist on TestFlight               | 1–3 hours              |
| App Review                               | ~24–48 hours (varies)  |
