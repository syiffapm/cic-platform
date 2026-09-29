# CIC Myanmar Platform — Prototype

> **Branch `cms-admin` — Government Portal app:** staff sign-in (`/workspace/login`), supervision (`/gov`) and CMS & platform administration (`/gov/admin`). Only CBM / CIC accounts can sign in here. The landing page + citizen portal lives on branch `lp`, the MFI Member Portal on branch `mfi`; `main` keeps the combined app.

Clickable prototype of the Credit Information Center (CIC) Myanmar platform: **a public website plus Borrower, MFI and Government portals on one shared core**, built from the *CIC Myanmar Platform — E2E Requirements Specification v1.0* ([docs/requirements.md](docs/requirements.md)). Theme (colours, Poppins font) follows the original CIC demo; screens and flows are new.

| Portal | Route | Sign-in |
| --- | --- | --- |
| Public website | `/` | none |
| Borrower Self-Service | `/borrower` | `/login` (register at `/borrower/register`) |
| MFI Member Portal | `/mfi` | `/workspace/login` |
| Government Portal — supervision, CMS and platform administration | `/gov` (administration under `/gov/admin`) | `/workspace/login` |

Citizen sign-in: `/login` · Staff Workspace: `/workspace/login`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Sign-in (role-based)
Two separate entry points:
- Citizens sign in at `/login`. Citizens choose their password when registering; after identity verification an account confirmation is sent by SMS or email and they sign in on `/login` (no automatic sign-in).
- Staff of CIC, the Central Bank and MFIs use the Staff Workspace at `/workspace/login`. The public site does not link to it. Set `VITE_STAFF_ORIGIN` and `VITE_PUBLIC_ORIGIN` to run the workspace on its own host.

Seeded training accounts use password `Cic@2026` and any 6-digit verification code. The registration identity code is `123456`. The account's role decides the portal and menus.

End-to-end flows for citizens, lenders and the ministry, with the accounts to use: [docs/e2e-flows.md](docs/e2e-flows.md).

Data lives in the browser (`localStorage` key `cic.store.v5`). To reset: `localStorage.clear()` in the browser console.

## Role-based access
Every staff feature supports a set of actions — Create, Read, Update, Delete, Approve, Export. Each role grants some of those actions per feature and has a data scope (all data, regional, own institution, aggregates only, masked personal data). The catalogue and role templates are in `src/data/rbac.js`; `usePermissions(portal).can(feature, action)` in `src/lib/rbac.js` drives every menu, route and button. Roles are managed in the Government Portal → Platform administration → **Roles & permissions** (`/gov/admin/access/roles`), including the MFI role templates that MFI administrators assign to their staff. Changes go through maker-checker.

## Languages (English / Myanmar)
Every screen is available in English and Myanmar (Unicode). Components are written in English; `src/i18n/DomTranslator.jsx` translates rendered text and user-facing attributes when Myanmar is selected, using `public/i18n/mm.json` (`exact` phrases plus `templates` with `{x}` for dynamic values). Personal names, institution names and IDs stay in Latin script; mark other elements `translate="no"` to exclude them. The default language follows the browser. Fonts (Poppins, Noto Sans Myanmar) are self-hosted.

To add new text: run `node scripts/extract-strings.mjs`, translate the new entries, and add them to `public/i18n/mm.json`. Translations were machine-assisted and should be reviewed by a native Myanmar speaker before production.

## Structure

```
src/
  components/ui/        shared UI kit
  components/layout/    portal shell, auth guard, language + accessibility controls
  context/              auth, shared store (stand-in for core services C1–C12), accessibility
  data/                 shared seed + reference data
  i18n/                 EN / Myanmar (Unicode) strings
  lib/                  formatting, NRC parser
  pages/                citizen login, staff workspace login, 404
  portals/
    public/  borrower/  mfi/
    government/            Government Portal shell, navigation, access (roles & permissions)
    regulator/  admin/     Government Portal feature packages: supervision (/gov) and administration (/gov/admin)
      routes.jsx  navigation.js  pages/<Module>/  components/  data/
```

Conventions: [docs/conventions.md](docs/conventions.md). Requirement IDs (e.g. `MFI-08`) are shown on each page header and traceable to the spec.

## Deploy
Vercel (static SPA). `vercel.json` rewrites every path to `index.html`.

## Not in this prototype
No backend, database, real SSO/MFA, PDF engine or integrations. Numbers are illustrative. Server-side controls (tenant isolation, classification filtering, maker-checker) are simulated in the client store to show the intended behaviour.
