# IMP-1006 — Settings

**State:** Implemented v1 · **Priority:** P1

## Numbered implementation

| Code | Outcome | Review evidence | Status |
|---|---|---|---|
| `IMP-1006.1` | Theme Mode | — | Implemented and verified |
| &emsp;↳ `IMP-1006.1.1` | Persist accent shade, ambient glow, and surface-depth preferences with IO Blue defaults | — | Implemented and verified |
| &emsp;↳ `IMP-1006.1.2` | Retain the existing animated gradients, moving grid, orbs, layout, typography, and interaction system while tuning color | — | Implemented and verified |
| &emsp;↳ `IMP-1006.1.3` | Provide a minimal live studio with continuous controls, curated presets, and a clearly labeled Default button for restoring IO Blue | — | Implemented and verified |

Settings centralizes personal interface preferences without fragmenting the application’s visual identity. Theme Mode changes the color atmosphere through shared theme variables while keeping IO Vault’s established depth, motion, layout, and component behavior intact.

## Theme contract

| Control | Range | Default | Behavior |
|---|---:|---:|---|
| Accent shade | 0–360° | 198° | Tunes the shared color family |
| Ambient glow | 20–100% | 55% | Adjusts animated light intensity |
| Surface depth | 0–20% | 8% | Adjusts the tonal separation of dark surfaces |
| Presets | IO Blue, Violet, Aurora, Solar, Rose | IO Blue | Applies a curated accent without changing layout or motion |
| Default | One action | IO Blue | Restores 198° hue, 55% glow, and 8% surface depth |

Preferences remain user-scoped inside the existing workspace state and survive local caching and authenticated vault synchronization. Monaco syntax colors, document content, user images, data state, and page behavior are not rewritten by Theme Mode.

## Verification

| Gate | Result |
|---|---|
| Complete repository suite | Passed — 50 tests |
| Production build | Passed |
| Signed-in navigation and live update | Passed |
| Authenticated persistence after sync and reload | Passed — Aurora restored at 155° |
| Default restoration | Passed — IO Blue restored at 198° |
| Motion preservation | Passed — `rotateGlow` remained active after theme changes |
| Browser console | Zero errors |
| Completed | 2026-07-29 |

## Limits

Theme Mode v1 is a unified dark-theme color tuner. Independent per-component colors, light mode, shared theme publishing, scheduled themes, and operating-system synchronization remain outside this rollout.
