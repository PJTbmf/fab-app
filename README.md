# #bemorefab Sessions (Fab App) — Phase F2 (prototype)

The Fab App (Phase 3b games, EYFS Hub, Wellbeing Hub) with the Learning Hub (Christmas Carol lesson and the adaptive Times tables flightpath) added,
ready to run as a custom app inside Pencil Spaces.

## What's in this folder

| File | What it is |
| --- | --- |
| `index.html` | The whole app in one file. Works offline, in a normal tab, in a Web Viewer, or as a Pencil Spaces app |
| `icon.png` | 100 × 100 icon for the Pencil Spaces App Library |

## How it behaves

| Opened… | Behaviour |
| --- | --- |
| In a normal tab, a Web Viewer, or from a laptop | Exactly as before: offline, nothing shared |
| As a Pencil Spaces app, at an address ending `?pencil=1` | "Live" mode: everyone in the Space sees the same Learning Hub lesson, step and answers. A green bar shows who is here |

In F1 only the Learning Hub is shared live. Games and the Wellbeing Hub work as before for whoever is using them.
No child data is stored by the app.

## Step 1: host it (free, public, no Microsoft sign-in)

GitHub Pages (simplest):

1. Create a free GitHub account for BMF, then a new **public** repository called `fab-app`.
2. Upload `index.html` and `icon.png` (Add file → Upload files → Commit).
3. Settings → Pages → Source: *Deploy from a branch*, Branch: `main`, folder `/ (root)` → Save.
4. After a minute the app is at `https://<account>.github.io/fab-app/`.

Pencil Spaces recommends Firebase Hosting; either works. The page holds lesson content only, never pupil data.

## Step 2: test on Pencil's staging server

1. Ask Pencil Spaces support to add BMF as a custom app developer.
2. On `staging.pencilapp.com`, create a Space → Apps → **Import a Mario App** →
   paste `https://<account>.github.io/fab-app/?pencil=1&host=staging`.
3. Join the Space from a second device or browser, open the Learning Hub → Meet Scrooge, and check that both screens move together.

## Step 3: submit to Pencil Spaces

Send support@pencilspaces.com:

| Field | Value |
| --- | --- |
| App name | #bemorefab Sessions |
| Subtitle | Hello, games, wellbeing and lessons together |
| Icon | `icon.png` |
| Staging URL | `https://<account>.github.io/fab-app/?pencil=1&host=staging` |
| Production URL | `https://<account>.github.io/fab-app/?pencil=1` |

Once approved it appears under **Your institution's apps** in BMF's Spaces.

## Updating

Replace `index.html` in the repository. Pencil Spaces loads the new version next time the app is opened.

## Technical notes

- Bundles Pencil's `@pncl/mario` 0.6.2 client library and its MIT-licensed dependencies (Yjs, lodash, fp-ts, fast-json-patch, eventemitter3, ts-adt).
- Messages are accepted only from `my.pencilapp.com` (or `staging.pencilapp.com` with `host=staging`).
- Shared state: `{ v: 1, lesson: { id, pack, step, state, openedBy, openedAt } }`. Lesson packs pasted by a teacher travel with the lesson so every device can show it.
