# Pre-submission QA checklist (Apple-style)

Run with a **signed Development/TestFlight build** (or local app) in Safari after setting **Website Access → All Websites**. Reload each tab after enabling.

## A. Install / permissions (blocking)

| #   | Case                                                      | Pass? | Notes                  |
| --- | --------------------------------------------------------- | ----- | ---------------------- |
| A1  | Fresh install → host app opens and explains All Websites  | ☐     |                        |
| A2  | Extension appears under Safari → Settings → Extensions    | ☐     |                        |
| A3  | With access = Ask / none: no overlay, shortcuts inert     | ☐     | Expected               |
| A4  | Access = All Websites → reload → works                    | ☐     |                        |
| A5  | Disable extension → controls stop; re-enable → works      | ☐     |                        |
| A6  | Unsigned local build: Develop → Allow Unsigned Extensions | ☐     | Ship builds are signed |

## B. Core media sites (no login)

| #   | URL                                                                                          | Checks                                | Pass? |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------- | ----- |
| B1  | https://www.youtube.com/watch?v=jNQXAC9IVRw                                                  | Overlay; D/S/R; G preferred; Z/X seek | ☐     |
| B2  | https://www.youtube.com/shorts (any Short)                                                   | Controller placement; D works         | ☐     |
| B3  | https://vimeo.com/148751763                                                                  | Overlay; D/S                          | ☐     |
| B4  | https://www.w3.org/2010/05/video/mediaevents.html                                            | Plain HTML5 video                     | ☐     |
| B5  | `store/review/demo.html` (local or hosted)                                                   | video + audio elements                | ☐     |
| B6  | https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4 (direct or in demo) | Direct media                          | ☐     |
| B7  | https://www.dailymotion.com (pick a public video)                                            | Speed change                          | ☐     |
| B8  | Podcast page with HTML5 audio (e.g. BBC / NPR episode player)                                | Audio controller or shortcuts         | ☐     |

## C. Logged-in / premium (if you have accounts)

| #   | Site                          | Checks                              | Pass? |
| --- | ----------------------------- | ----------------------------------- | ----- |
| C1  | Netflix                       | Speed sticks or fightback; no crash | ☐     |
| C2  | Disney+ / Prime / Apple TV+   | Same                                | ☐     |
| C3  | Coursera / edX lecture player | Shortcuts during lecture            | ☐     |
| C4  | Twitch VOD                    | Speed while playing                 | ☐     |

## D. Safari-specific edge cases

| #   | Case                                                                             | Pass? |
| --- | -------------------------------------------------------------------------------- | ----- |
| D1  | Private Browsing window + All Websites                                           | ☐     |
| D2  | Second Safari profile                                                            | ☐     |
| D3  | iframe embed (YouTube embed on another page)                                     | ☐     |
| D4  | Picture in Picture (if available) — shortcuts still affect underlying media      | ☐     |
| D5  | Full screen YouTube — keyboard still works                                       | ☐     |
| D6  | Speeds **> 2.0×** on non-YouTube (demo.html) — playable (seek-boost), not frozen | ☐     |
| D7  | Speeds **> 2.0×** on YouTube — native rate, smooth                               | ☐     |
| D8  | `file://` local MP4 (grant file access if prompted)                              | ☐     |
| D9  | Options page opens; change shortcut; reload; new binding works                   | ☐     |
| D10 | Popup presets apply to active tab                                                | ☐     |
| D11 | Per-site disable rule for a domain stops injection there                         | ☐     |
| D12 | Extension does not break page login / checkout flows on a normal site            | ☐     |

## E. Regression / polish

| #   | Case                                                                     | Pass? |
| --- | ------------------------------------------------------------------------ | ----- |
| E1  | No console errors from extension on YouTube + demo                       | ☐     |
| E2  | Host app “Open Safari Extension Settings” works                          | ☐     |
| E3  | App icon + extension toolbar icon look correct (not placeholder)         | ☐     |
| E4  | Privacy policy URL loads over HTTPS                                      | ☐     |
| E5  | Version strings match ASC (CFBundleShortVersionString / CFBundleVersion) | ☐     |

## F. Automated (run before upload)

```sh
npm test
npm run build
npm run build:safari   # or your signed Xcode archive script
```

Record date + build number: _______________
