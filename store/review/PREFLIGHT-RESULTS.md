# Preflight results (automated)

Date: 2026-10-10

## Automated

- `npm test` — run before every upload (expect all green)
- Bundle smoke — inject.js contains YouTube handler, high-rate booster, shortcuts; manifest has MAIN world + host_permissions
- Public demo URLs reachable from this network (YouTube, W3C mediaevents, MDN flower.mp4, Vimeo)

## Manual (you must complete in Safari with signed/TestFlight build)

See `QA-CHECKLIST.md`. Cursor cannot drive your Safari extension entitlements from this environment.

## Blockers before upload on this machine

- Xcode not installed
- No code-signing identities in Keychain
- `store/config.json` not created yet (copy from example)
- Privacy policy URL not hosted yet
- App Store 1024 icon is upscaled — replace with real art
