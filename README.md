# 🛒 Aisle List — Voice Shopping App

**Live:** [aisle-list.vercel.app](https://aisle-list.vercel.app) · auto-deployed from `main` via Vercel.

Dictate your shopping list as you walk around the kitchen. The app listens,
splits your rambling into individual items, and sorts them into supermarket
aisle categories — so at the shop you tick things off in the order you walk
the aisles.

## How it works

- **Voice input** — tap the mic and talk naturally: *"um, we need milk, two
  bananas and some washing up liquid… oh and dog food"*. Uses the browser's
  built-in speech recognition (Chrome / Safari / Edge), so there's no API key
  and nothing leaves your device beyond the browser's own speech service.
- **Item parsing** — filler words ("um", "we need", "get some") are stripped,
  quantities are captured ("two bananas" → bananas ×2), and multi-word
  products are matched greedily ("washing up liquid" stays one item).
- **Aisle categorisation** — a built-in lexicon of ~700 grocery terms maps
  each item to one of 14 aisles (Fruit & Veg, Bakery, Meat & Fish, Dairy,
  Frozen, Food Cupboard, …) ordered the way you'd walk a UK supermarket.
  Unrecognised items land in "Other"; tap any item to move it to a different
  aisle.
- **Shopping mode** — tick items off with big touch targets, watch the
  progress bar, then "Clear ticked" when you're done. The list is saved in
  the browser (localStorage), so it survives closing the tab.
- **Typing fallback** — the text box runs through the same parser, so
  "milk, eggs, 2 bananas" works anywhere the mic isn't available.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 — on your phone, use your computer's local IP
(e.g. `http://192.168.x.x:3000`). Note: **microphone access requires HTTPS**
(or localhost), so for real phone use, deploy it (e.g. `vercel deploy`) and
open the HTTPS URL.

## Accounts & sync (v2)

- **Sign in to sync** (top-right) — powered by Clerk (Google or email passcode).
  Signed in, your list is tied to your account and syncs across every device:
  dictate on your laptop in the kitchen, tick items off on your phone in the
  shop. The list refetches whenever you switch back to the app.
- **Per-person lists** — each account has its own private list. Sharing the
  URL with a friend does not share your list; they sign in and get their own.
- **Offline-first** — changes apply instantly and sync in the background. A
  header badge shows "Synced ✓" / "Syncing…" / "Sync failed — changes saved
  here". Signed out, the app still works fully in local-only mode (v1 lists
  are migrated automatically on first load).
- **Server-side isolation** — the `/api/items` route only ever reads and
  writes rows belonging to the authenticated Clerk user id, so no account can
  touch another's data.

## Stack

- Next.js (App Router) + React + Tailwind CSS v4
- Web Speech API for dictation (`en-GB`)
- Clerk for authentication (Vercel Marketplace integration)
- Neon serverless Postgres for the synced list (`@neondatabase/serverless`)
- localStorage as an offline cache + guest-mode store

## Environment variables

Provisioned automatically by the Vercel Marketplace integrations. Pull them
locally with `vercel env pull .env.local`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — Clerk
- `DATABASE_URL` (Neon pooled connection)

The app degrades gracefully: with no Clerk key it runs in local-only guest
mode, and `next build` does not require `DATABASE_URL` (the DB client is
initialised lazily).

## Ideas for later

- Promote Clerk to a production instance (currently on development keys)
- Shared household lists (one list, multiple accounts)
- Custom aisle ordering to match your specific supermarket
- AI categorisation for unusual items (via Vercel AI Gateway)
- Install-to-home-screen PWA manifest
