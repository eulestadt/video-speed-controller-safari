# App Review Notes (paste into App Store Connect)

## What this app is

macOS container app for a Safari Web Extension that adjusts HTML5 `<video>` / `<audio>` `playbackRate` on websites the user grants. No account, no network API of ours, no ads, no IAP.

## How to enable (reviewer steps)

1. Open **Video Speed Controller** from Launchpad/Applications.
2. Click **Open Safari Extension Settings**.
3. Enable **Video Speed Controller**.
4. Set **Website Access** to **All Websites** (required — with “Ask”, content scripts do not inject and the product appears broken).
5. Open https://www.youtube.com/watch?v=jNQXAC9IVRw (or the demo page below), play the video, press **D** to increase speed. Overlay shows e.g. `1.10`.

Demo page (no login): https://www.w3.org/2010/05/video/mediaevents.html  
Or open the bundled review fixture if provided: `store/review/demo.html` (host locally or attach).

## Why broad website access is requested

Guideline 4.4.2 asks extensions not to claim more sites than necessary. This product’s single purpose is **universal** HTML5 media speed control on whatever site the user is watching (lectures, news, LMS players, podcasts, local files). Narrow host patterns would break that purpose. Access is still gated by Safari’s per-user Website Access UI; we document **All Websites** as the intended grant.

## Permissions

- `storage` — save user preferences (speed, shortcuts, site rules) via `browser.storage.sync` (device / Apple sync). We do not operate a backend.
- Host access via content scripts for pages the user allows.

## Data collection

**Data Not Collected.** See Privacy Nutrition Label answers in `store/review/Privacy-Nutrition-Label.md`. No analytics SDKs, no tracking, no advertising.

## Test accounts

None required. No login.

## Contact

(Your email on file with Apple Developer)
