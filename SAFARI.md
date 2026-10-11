# Video Speed Controller for Safari (macOS)

Safari port of [igrigorik/videospeed](https://github.com/igrigorik/videospeed) **v0.11.1** — same features and shortcuts as the Chrome extension.

Publishing to the Mac App Store: see **[PUBLISHING.md](./PUBLISHING.md)** and the `store/` folder.

## Why it disappears when Safari quits

Apple does this on purpose for local/dev installs:

| Install type                                    | Survives Safari quit?                                                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Add Temporary Extension…** (`dist-safari`)    | No — removed when Safari quits                                                                                                                   |
| Host app, **ad-hoc / unsigned** (what we build) | App stays installed, but **Allow Unsigned Extensions** turns off every Safari quit, so the extension looks “gone” until you re-allow + re-enable |
| Mac App Store / Developer-ID signed             | Yes — permanent                                                                                                                                  |

There is no supported way to keep an unsigned Safari extension enabled across Safari restarts without an Apple Developer signature.

### Website access (most common “it doesn’t work” cause)

Safari can show the extension as **enabled** while still blocking it on every
page until you grant website access.

1. Safari → **Settings** → **Extensions** → **Video Speed Controller**
2. Set **Website Access** / **Edit Websites** to **All Websites**
3. Reload the tab (⌘R)

If this is left on **Ask**, nothing injects until you approve each site — people
often think the extension is broken (especially on YouTube).

The host app window highlights this step on launch. The toolbar popup also shows
a Safari-only reminder.

### After every Safari restart

```sh
./scripts/reenable-safari.sh
```

Then in Safari:

1. **Develop → Allow Unsigned Extensions**
2. **Settings → Extensions → Video Speed Controller** → enable
3. **Website Access → All Websites** (do not leave this on Ask)
4. Reload the video tab

If enable fails with “interfered with clicking”, quit **Wispr Flow** / **Cold Turkey** first.

## Recommended daily path: host app (unsigned)

```sh
npm install
npm run build:safari:install
```

Open `~/Applications/Video Speed Controller.app` once, quit it, then use the restart steps above.

## Alternative: Safari 26 temporary extension

Faster to load, but you must re-add the folder after every Safari quit.

```sh
npm run build:safari:temp
```

Then:

1. **Quit** Video Speed Controller.app if it is open.
2. Safari → **Settings** → **Developer**.
3. **Add Temporary Extension…** → select `dist-safari` (folder with `manifest.json`, not the `.app`).
4. Set **Website Access → All Websites** (not Ask).
5. Reload video tabs.

### “Safari detected an app or service that interfered with clicking”

This is a [macOS security check](https://support.apple.com/HT211233), not an extension bug. Safari blocks enabling extensions when another app may be injecting/overlaying clicks (accessibility, screen recording, blockers, dictation overlays).

On this machine the usual suspects are **Wispr Flow** and **Cold Turkey Blocker**.

1. Quit those apps fully (⌘Q), not just close their windows.
2. In Safari, click the enable checkbox yourself with the trackpad/mouse (don’t automate the click).
3. After the extension is on, you can reopen Wispr / Cold Turkey.

If it still fails: Apple’s official workaround is enable the extension in **Safe Mode**, then restart normally.

### Other temporary-extension errors

If Safari says a temporary extension could not be added after quitting an app/service: quit **Video Speed Controller.app**, wait a second, try again. Select `dist-safari` (folder with `manifest.json`), not anything inside the `.app`.

Temporary extensions unload when Safari quits (or after ~24 hours). Re-add `dist-safari` after restart, or use the host-app path below.

## Optional: host app (unsigned)

```sh
npm run build:safari:install
```

1. Open **Video Speed Controller.app** once, then **quit it**.
2. Safari → **Develop** → **Allow Unsigned Extensions** (resets when Safari quits).
3. Safari → **Settings** → **Extensions** → enable **Video Speed Controller**.

## Default shortcuts

| Key   | Action                 |
| ----- | ---------------------- |
| **S** | Decrease speed         |
| **D** | Increase speed         |
| **R** | Reset to 1.0×          |
| **Z** | Rewind 10 seconds      |
| **X** | Advance 10 seconds     |
| **G** | Toggle preferred speed |
| **V** | Show/hide controller   |
| **M** | Set marker             |
| **J** | Jump to marker         |

## Project layout

| Path                       | Role                                           |
| -------------------------- | ---------------------------------------------- |
| `dist-safari/`             | Folder for **Add Temporary Extension…**        |
| `release/safari/*.app`     | Optional host app + appex                      |
| `macos/`                   | Swift sources for the host app                 |
| `scripts/build-safari.mjs` | Builds `dist-safari` and optionally the `.app` |

## License

MIT — Copyright (c) 2014 Ilya Grigorik (extension). Safari packaging follows the same MIT terms for the wrapper code.
