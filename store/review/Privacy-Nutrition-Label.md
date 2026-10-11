# App Privacy / Nutrition Label answers

Use these in App Store Connect → App Privacy.

## Privacy Policy URL

Host `store/privacy/privacy-policy.html` (or `PRIVACY.md`) on a public HTTPS URL and paste it into App Store Connect. Required.

## Data Collection

**Select: Data Not Collected**

Rationale for reviewers / yourself:

| Topic                              | Practice                                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Analytics / crash                  | None                                                                                                  |
| Advertising / tracking             | None                                                                                                  |
| Account / contact info             | None                                                                                                  |
| Location                           | None                                                                                                  |
| Browsing history sent to developer | None — we never upload page URLs or content                                                           |
| Settings                           | Stored with `browser.storage.sync` on-device / Apple’s extension sync. Not sent to a developer server |

If Apple’s questionnaire asks about “Product Interaction” or “User Content” because the extension reads DOM to find `<video>` elements: that processing is **on-device only** to adjust `playbackRate`. It is not collected or transmitted by you. Prefer **Data Not Collected** unless ASC forces a category — then mark as not linked to identity and not used for tracking.

## Export compliance

Uses only standard HTTPS for loading web pages the user visits (Safari). No custom cryptography beyond what the OS/Safari provide.  
Typically: **App uses encryption** → **exempt** (HTTPS only) → answer the usual export compliance questions accordingly.
