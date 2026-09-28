# Developer conventions

## Stack
React 18 + Vite 5, React Router 6, Tailwind CSS 3, lucide-react icons, recharts for charts, qrcode.react (`import { QRCodeSVG } from 'qrcode.react'`), clsx. Plain JavaScript (`.jsx`), no TypeScript. Import alias `@` → `src/`.

## Folder structure
```
src/
  App.jsx                    top-level router; lazy-loads one routes.jsx per portal
  main.jsx                   providers
  components/ui/             shared UI kit (import from '@/components/ui')
  components/layout/         PortalLayout, RequireAuth, BrandMark, LanguageSwitcher, AccessibilityToolbar
  context/                   AuthContext (useSession, useCan), StoreContext (useStore), AccessibilityContext
  data/                      shared seed + reference data (roles, institutions, services, kpis, reference, seed)
  i18n/                      en.js, mm.js, I18nContext (useI18n → { t, bi, lang })
  lib/                       format.js (formatMMK, formatDate, maskNrc, uid, slaDaysLeft…), nrc.js (parseNrc, normaliseName, looksLikeZawgyi)
  pages/                     cross-portal pages (LoginPage, PortalChooser, NotFound)
  portals/<portal>/
    routes.jsx               the portal's <Routes> (default export)
    navigation.js            sidebar config (Portals 2–5)
    data/                    portal-private mock data
    components/              portal-private components
    pages/<Module>/<Page>.jsx one folder per menu/module
```

## Theme (taken from the original CIC demo)
- Font: Poppins (Noto Sans Myanmar for Myanmar text).
- Primary navy `bg-primary` / `text-primary` (hsl 214 45% 22%), scale `primary-50…950`.
- Warm amber accent `bg-warm` / `text-warm` / `ring-warm`; teal accent `bg-teal` / `text-teal`.
- Neutrals: Tailwind `slate`. Status: emerald (ok), amber (warning), red (danger), blue (info), violet (maker-checker / investigation).
- Cards `rounded-xl border border-slate-200 bg-white shadow-sm`. Radius `rounded-lg` for controls.

## Shared UI kit (`@/components/ui`)
`Button` (variant: primary|secondary|outline|ghost|warm|teal|danger|success; size: sm|md|lg|icon; `icon={LucideIcon}`),
`Card`, `CardHeader` ({title, subtitle, action, icon}), `CardBody`,
`Badge` (`<Badge status="Pending" />` auto-colours common statuses, or `tone=`),
`StatCard` ({label, value, icon, tone: navy|warm|teal|green|red|violet, delta, deltaLabel, definition, asOf}),
`PageHeader` ({title, subtitle, breadcrumbs:[{label,to}], actions, reqIds:['MFI-01']}),
`DataTable` ({columns:[{key,header,render,sortable,className}], rows, searchKeys, pageSize, onRowClick, toolbar, dense}),
`EmptyState`, `Modal` ({open,onClose,title,subtitle,footer,size: sm|md|lg|xl}),
`Input`, `Textarea`, `Select` ({options, placeholder}), `Checkbox`, `Toggle`, `Field`,
`Tabs` ({tabs:[{id,label,count}], value, onChange}), `Alert` (tone: info|success|warning|danger),
`useToast()` → `toast(msg, 'success'|'warning'|'info'|'danger')`, `Timeline` ({items:[{title,time,actor,description,tone}]}),
`Stepper` ({steps, current}), `MakerCheckerBanner` ({maker, checker, note}), `ChartCard` ({title, subtitle, asOf, height, children}).

## State and auth
- `useSession('<portal>')` → signed-in demo user `{ id, name, role, roleName, tenant?, borrowerId?, sessionId, ip }`.
- `useCan('<portal>')('mfi_checker', 'mfi_admin')` → boolean for UI gating.
- `useStore()` → shared cross-portal collections `announcements, faqs, publications, disputes, inquiries, approvals, grievances, auditLog, institutions` and actions `add(collection, item)`, `patch(collection, id, changes|fn)`, `remove`, `logAudit({actor, role, tenant, action, module, target, purpose?, outcome?})`, `announcementsFor(audience)`.
  - Always read notices through `announcementsFor('public'|'borrower'|'mfi'|'regulator'|'admin')` (AC07).
  - Write to the audit log for every sensitive action (inquiry, download, approval, config change, denied access).
- Maker-checker: the maker creates an entry in `approvals` (`status: 'Pending'`); a checker with a different user id approves. Never let the same user approve their own item.

## Page conventions
- Every page starts with `<PageHeader title subtitle reqIds={[...]}/>` citing the requirement IDs it implements.
- Every KPI shows a definition and "as of" date (`AS_OF` from `@/data/kpis`).
- Mock numbers must be plausible for Myanmar microfinance (MMK, townships, NRC format `12/OUKAMA(N)245781`).
- Accessibility: real `<button>`/`<a>`, labels on inputs, `aria-label` on icon-only buttons, keyboard reachable.
- Keep components under ~300 lines; split into portal `components/` when larger.
- English copy in UI; use `t()`/`bi()` for strings already in i18n and for bilingual content objects `{ en, mm }`.
