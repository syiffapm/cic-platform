# CIC Myanmar Platform — E2E Requirements Specification (v1.0 draft, 24 Sep 2026)

Source: PT. LinkIT 360 Presales. This is the working copy used to build the prototype. Requirement IDs are referenced in code (`reqIds` on PageHeader).

Priority: P0 = before 5-MFI pilot; P1 = before scaling to 30 MFIs; P2 = option.
Status: KEEP = exists in old demo; ENHANCE = incomplete in demo; NEW = not in demo.

## 3. Architecture, portals and users

Five role-specific portals on one shared core of 12 services (C1 IAM, C2 Institution Master, C3 Borrower & Loan Registry, C4 Ingestion & DQ, C5 Identity Resolution, C6 Inquiry/Report/Rules, C7 Dispute & Correction, C8 Content & Publication, C9 Metering & Billing, C10 Notification, C11 Audit & Logging, C12 Reporting & Analytics). Public Portal + CMS content in a DMZ with no personal data; Portals 2–5 behind the gateway.

| Portal | Audience | Access |
| --- | --- | --- |
| 1. Public Portal | Citizens, borrowers, media, investors | Open; no login |
| 2. Borrower Self-Service | Individual borrowers / guarantors | Verified identity (eKYC + OTP) |
| 3. MFI Member Portal | MFIs | Institutional SSO + MFA, tenant-scoped |
| 4. Regulator Portal | CBM / FRD supervisors and leadership | Government SSO + MFA, need-to-know |
| 5. CMS & Admin Console | CIC operator staff | Privileged, MFA, maker-checker, IP allow-list |

Roles: see `src/data/roles.js` (24 roles).

## 4. Portal 1 — Public Portal

Official front door: explains every CIC service, lets anyone verify a licensed MFI or a credit report, routes borrowers to Portal 2 — **without collecting personal data**. All content CMS-managed.

### 4.1 Landing page blocks (in order)
1. Government header: CBM/CIC logos, EN/MM switch, accessibility toolbar (font size, contrast), search
2. Hero: mission, 2 CTAs "Check my credit report" (Portal 2), "Find a licensed MFI"
3. Service catalogue: service cards linking to service detail pages
4. Key statistics: reporting MFIs, borrowers covered, townships, reports issued — with "as of" date
5. Latest announcements: 3 newest public notices
6. How it works: 4 steps — MFI reports → CIC validates → inquiry with consent → borrower can check and dispute
7. Know your rights: borrower rights, dispute timeline, privacy notice
8. Publications: annual report, statistical bulletin, regulations, guidelines
9. Help: FAQ, AI assistant, helpdesk contacts, grievance form
10. Footer: legal notices, privacy, accessibility statement, sitemap, last-updated date

### 4.3 Functional requirements
| ID | Requirement | Priority |
| --- | --- | --- |
| PUB-01 | Landing page per 4.1, all blocks CMS-driven, EN/MM | P0 |
| PUB-02 | Service detail page per service: description, eligibility, fee, steps, SLA, documents, FAQ, CTA | P0 |
| PUB-03 | MFI directory: search by name, licence no., township, region; filter by status and type | P0 |
| PUB-04 | MFI profile: licence no., status history, branches, map, contact, products, complaint link | P0 |
| PUB-05 | Directory reads only from Institution Master with publish=true; same data as Portal 4 | P0 |
| PUB-06 | Announcements list with category, date, attachment; only classification=public returned | P0 |
| PUB-07 | Publications library: regulations, guidelines, forms, reports; version and effective date | P1 |
| PUB-08 | Statistics page with charts and CSV download of published aggregates, "as of" label | P1 |
| PUB-09 | Report authenticity check by QR or report ID + 6-digit code; returns valid / revoked / not found, no content | P1 |
| PUB-10 | FAQ with categories and search | P0 |
| PUB-11 | AI assistant (public knowledge only, no PII) | P2 |
| PUB-12 | Grievance / feedback form with ticket number, CAPTCHA, SLA acknowledgement | P1 |
| PUB-13 | Site-wide search across pages, services, notices, FAQ, documents | P1 |
| PUB-14 | No NRC login on Public; borrower actions redirect to Portal 2 | P0 |
| PUB-15 | Newsletter / notice subscription (email) with double opt-in | P2 |
| PUB-16 | Cookie consent, privacy notice, accessibility statement, terms of use | P0 |

NFR: WCAG 2.1 AA, lightweight pages, works on low-end Android, no trackers without consent.

## 5. Portal 2 — Borrower Self-Service (NEW)

Journey: Register (phone + NRC) → Identity check (eKYC / MFI phone OTP / in-person activation code) → MFA login → My credit report → Who viewed me / File dispute → Track case + notifications.

| ID | Requirement | Priority |
| --- | --- | --- |
| BOR-01 | Registration with NRC (format 12/ABC(N)123456), mobile number, password, T&C and privacy consent | P1 |
| BOR-02 | Identity verification by route (a) NRC + selfie eKYC, (b) OTP to phone on record at an MFI, (c) in-person activation code; account `pending` until verified; max 3 failed attempts then helpdesk | P1 |
| BOR-03 | MFA on every login; session timeout 10 min idle | P1 |
| BOR-04 | My Credit Report: identity, loans by MFI, balances, repayment history, guarantees, data date per line, source MFI | P1 |
| BOR-05 | Free report quota (1 per 12 months, configurable); download PDF with QR and watermark | P1 |
| BOR-06 | Who viewed my report: MFI name, date, stated purpose, last 24 months | P1 |
| BOR-07 | Consent log: consents given to MFIs, date and scope; revoke where law allows | P1 |
| BOR-08 | File dispute: select record, reason code, free text, upload evidence (PDF/JPG ≤ 5 MB, virus-scanned) | P1 |
| BOR-09 | Dispute tracker: status, SLA countdown, MFI response, final outcome and corrected record | P1 |
| BOR-10 | Alerts: new inquiry on my file, new loan reported, delinquency flag, dispute updates (SMS/email/in-app) | P2 |
| BOR-11 | Data subject requests: access, rectification, account closure; tracked by DPO | P1 |
| BOR-12 | Authorised representative access with authority document, time-limited | P2 |
| BOR-13 | Mobile-first; Myanmar Unicode; plain-language explanations of each field | P1 |
| BOR-14 | No-hit result shows "No credit record found" with explanation, never a score | P1 |

Controls: borrower can only query own resolved identity; views metered not billed; every view/download/dispute audited with borrower as actor.

## 6. Portal 3 — MFI Member Portal

Submission journey: Maker uploads CSV/XML/API → schema + rule validation → (errors → reject report, fix & resubmit) → Checker approves + attestation → identity resolution → load to registry + reconciliation → submission receipt.

| ID | Requirement | Priority |
| --- | --- | --- |
| MFI-01 | Dashboard: submission status, last cut-off, DQ score, inquiries used vs quota, open disputes, invoices | P0 |
| MFI-02 | Credit inquiry by NRC, name + DOB, or borrower ID; mandatory purpose code (new loan, review, collection, guarantor) | P0 |
| MFI-03 | Consent capture: checkbox + upload/reference of signed consent; inquiry blocked without it | P0 |
| MFI-04 | Result states: single match, multiple candidates (choose with extra fields), no-hit with explanation | P0 |
| MFI-05 | Credit report Basic and Full: identity, active/closed loans, 24-month payment grid, exposure across MFIs, guarantees, inquiries, dispute flags, rule-based grade + reason codes, data date per record | P0 |
| MFI-06 | Report PDF with report ID, QR, watermark (MFI + user + time), rule version | P0 |
| MFI-07 | Batch upload (CSV/XLSX/XML) with downloadable template per schema version | P0 |
| MFI-08 | Validation report per batch: received / accepted / rejected / warning counts; row-level error codes; CSV download | P0 |
| MFI-09 | Idempotent resubmission: same batch ID never duplicates loans (AC01) | P0 |
| MFI-10 | Maker-checker on submissions and corrections; checker signs attestation | P0 |
| MFI-11 | Reconciliation: totals of outstanding balance and loan count vs MFI control totals | P0 |
| MFI-12 | Submission calendar with cut-off, reminders and late-submission flag | P1 |
| MFI-13 | Dispute inbox: disputes on own data, SLA timer, respond, attach evidence, submit correction for approval | P0 |
| MFI-14 | Portfolio monitoring alerts on own borrowers (new external loan, default elsewhere) | P1 |
| MFI-15 | Batch inquiry (upload list of NRCs for portfolio review) with purpose | P1 |
| MFI-16 | User management for own tenant: invite, roles, suspend, MFA reset request | P0 |
| MFI-17 | API keys and webhooks; sandbox environment; developer docs (OpenAPI, changelog) | P1 |
| MFI-18 | Usage and billing: inquiries by user and purpose, invoices, payment status | P1 |
| MFI-19 | Own-tenant audit view: who in my MFI searched whom and why | P0 |
| MFI-20 | Census data input (CSV/manual) — validated and versioned | P1 |
| MFI-21 | Alternative data view with borrower consent | P2 |
| MFI-22 | Announcements inbox with read receipts for mandatory notices | P1 |
| MFI-23 | No raw translation keys; full EN/MM | P0 |

Submission data set: Borrower (NRC, previous NRC, full name MM+EN, DOB, gender, phone, address state/township/ward, occupation, household size); Loan (loan ID, product type, disbursement date, amount MMK, tenor, interest rate, instalment frequency, outstanding, DPD, status, classification, write-off, closure date); Group/guarantor (group ID, member role, guarantor NRC, guarantee amount); Repayment (period, due, paid, date paid); Control totals (record count, sum outstanding, period, licence no.).

## 7. Portal 4 — Regulator / Supervisory Portal

From charts to action: every alert opens a case with owner, deadline and outcome; every KPI shows definition, source, as-of date.
Case journey: EWS alert or complaint → Triage/assign owner → Investigate/drill-down → Request info from MFI → Decision + approval → Action (warning, fine, suspension) → Close + publish if public.

| ID | Module | Requirement | Priority |
| --- | --- | --- | --- |
| GOV-01 | Overview | Executive dashboard: MFIs reporting, borrowers, portfolio, PAR30, NPL, over-indebted borrowers, disputes open; each tile with definition tooltip and as-of date | P0 |
| GOV-02 | Overview | Filters by period, region/township, MFI tier, product; export PDF/XLSX | P1 |
| GOV-03 | MFI Management | Institution register from Master: licence, tier, capital, branches, status history; licence changes via maker-checker | P0 |
| GOV-04 | MFI Management | Reporting compliance: on-time %, DQ score, rejected-row rate, late submissions per MFI | P0 |
| GOV-05 | Supervision | Prudential metrics per MFI (NPL, PAR, LDR, concentration) with trend and peer benchmark | P1 |
| GOV-06 | Supervision | Supervisory case management with SLA, documents, correspondence log | P1 |
| GOV-07 | Supervision | Information requests to MFIs with due date | P1 |
| GOV-08 | Risk Intelligence | EWS rules library (versioned), alert queue, severity, "Investigate" opens case | P0 |
| GOV-09 | Risk Intelligence | Over-indebtedness monitor: borrowers with ≥ 3 active loans or DTI above threshold, by township | P1 |
| GOV-10 | Risk Intelligence | Borrower-level drill-down only with justification text, logged and reviewable | P0 |
| GOV-11 | Consumer Protection | Dispute oversight: all cases, SLA breaches, MFI response times, escalation to CBM decision | P0 |
| GOV-12 | Consumer Protection | Complaint register from Public grievance form, categorised, linked to MFI | P1 |
| GOV-13 | Alt Data Hub | Keep UI; activate only after data-sharing agreements (option) | P2 |
| GOV-14 | Census / Maps | Township map of outreach, gender, loan size; refresh schedule and as-of label | P1 |
| GOV-15 | Announcements | Draft notices with classification (public / MFI-only / internal); publish via CMS approval | P0 |
| GOV-16 | Reports | Statutory and scheduled reports (monthly sector bulletin, quarterly MFI ranking, annual data pack) | P1 |
| GOV-17 | Reports | Ad-hoc report builder on anonymised DWH | P2 |
| GOV-18 | Publication approval | Director approves statistics and notices before publishing to Public Portal | P1 |
| GOV-19 | Policy simulation | What-if on rule thresholds (e.g. DTI cap) using historical data | P2 |
| GOV-20 | AI insights | Anomaly and over-indebtedness insights | P2 |

KPI dictionary: see `src/data/kpis.js`.

## 8. Portal 5 — CMS & Back-Office Administration Console

14 modules: A1 Operations dashboard, A2 CMS, A3 Service catalogue manager, A4 Users/roles/access (IAM), A5 Institution & reference master data, A6 Data quality & ingestion control, A7 Identity resolution review, A8 Rules & scoring configuration, A9 Dispute & helpdesk back-office, A10 Billing & entitlements, A11 Notification templates, A12 Audit, logs & security monitoring, A13 System configuration, jobs & backup, A14 Compliance & data protection (DPO).

### CMS (A2)
| ID | Requirement |
| --- | --- |
| CMS-01 | Content types: page, service, announcement, news, FAQ, publication/document, banner, statistic block, glossary term, contact/office |
| CMS-02 | Rich-text/block editor with Myanmar Unicode; Zawgyi detection and conversion on paste |
| CMS-03 | Bilingual EN/MM side by side; translation status; publish blocked if MM missing (configurable) |
| CMS-04 | Workflow Draft → In review → Approved → Scheduled → Published → Archived; editor cannot approve own item |
| CMS-05 | Classification per item: Public, MFI-only, Regulator-only, Internal; enforced by API (AC07) |
| CMS-06 | Version history with diff, restore, who/when per version |
| CMS-07 | Scheduled publish and auto-expiry; pinned/featured |
| CMS-08 | Media library: images, PDFs; virus scan, alt-text mandatory, size limits, usage tracking |
| CMS-09 | Menu/navigation builder; landing block ordering (drag and drop) |
| CMS-10 | SEO fields, slug, OG image; sitemap auto-generation |
| CMS-11 | Preview per device and language before publish |
| CMS-12 | Targeted notices to MFI groups with mandatory read receipt and acknowledgement report |
| CMS-13 | Forms builder for grievance, feedback, surveys; submissions route to helpdesk |
| CMS-14 | Global settings: logos, contacts, footer, social links, emergency banner |
| CMS-15 | UI string translation manager for all portals |
| CMS-16 | Content analytics: views, searches with no result, FAQ helpfulness votes |

### Other modules
| ID | Module | Requirement | Priority |
| --- | --- | --- | --- |
| ADM-01 | A1 Dashboard | Secure console header, KPIs, report volume, institution status, live audit feed; system health (uptime, queue depth, job failures), open incidents, pending approvals | P0 |
| ADM-02 | A3 Service catalogue | Create/edit services S1–S13: description, eligibility, fee, SLA, channel, documents; feeds Public cards | P0 |
| ADM-03 | A4 IAM | User list; role builder (permission matrix), ABAC rules (tenant, region), MFA enforcement, password policy, IP allow-lists, session policy, dormant auto-disable (90 days), access recertification every 6 months | P0 |
| ADM-04 | A4 IAM | Maker-checker for user creation, role change, reactivation; break-glass accounts with alert | P0 |
| ADM-05 | A5 Master data | Institution master (licence, tier, status history, publish flag); reference tables: regions, townships, product types, purpose codes, reason codes, currencies, holidays | P0 |
| ADM-06 | A6 Data quality | Batch monitor across MFIs, schema version manager, DQ rule editor, reject queue, reconciliation exceptions, re-process | P0 |
| ADM-07 | A7 Identity resolution | Candidate pairs with similarity score, side-by-side, merge/split with checker approval, lineage | P0 |
| ADM-08 | A8 Rules | Versioned rule sets for grade, EWS and over-indebtedness; test on sample, approve, activate with effective date; rollback | P0 |
| ADM-09 | A9 Disputes & helpdesk | Case queue, assignment, SLA timers, templates, escalation matrix, identity-verification tickets, grievance tickets | P0 |
| ADM-10 | A10 Billing | Tariff plans, entitlements/quotas, billable-event ledger, monthly invoice run, credit notes, reconciliation (excludes retries, AC08), payment status | P1 |
| ADM-11 | A11 Notifications | EN/MM templates for email/SMS/in-app, variables, delivery log, retries, opt-out | P1 |
| ADM-12 | A12 Audit & security | Audit log table + CSV export; filters, saved searches, hash-chain integrity check, security events (failed logins, IP anomalies), SIEM export | P0 |
| ADM-13 | A13 System config | Maintenance mode, retention, backup frequency; change approval, job scheduler, backup status + restore test log (RPO/RTO), feature flags, API client registry | P0 |
| ADM-14 | A14 Compliance | Data subject request queue, retention schedule by data class, breach register with notification clock, DPIA records, policy acknowledgements | P1 |

## 9. Dashboards, reports, logs

Dashboards: Public statistics; Borrower "My summary" (active loans, outstanding, recent inquiries, open disputes); MFI cockpit (submission status, DQ trend, rejected rows, inquiry usage vs quota, dispute SLA, invoices, portfolio alerts); Regulator Executive (sector KPIs, heat-map by township, top-risk MFIs, EWS alerts, dispute SLA) and Supervisor (per-MFI health, peer comparison, compliance, open cases); Admin Operations (uptime, API p95, queue depth, job failures, pending approvals, backup), Security (failed logins, MFA failures, IP anomalies, privileged actions, break-glass), Content (published/pending, translation gaps, top pages, no-result searches), Business (inquiries by MFI and purpose, revenue billed vs collected, tiers).

Report catalogue R01–R13: R01 Batch validation (MFI, per batch), R02 Monthly submission compliance, R03 Sector credit bulletin, R04 MFI health scorecard, R05 Over-indebtedness by township, R06 Dispute & complaint statistics, R07 Inquiry usage & billing statement, R08 Access review, R09 Audit trail extract, R10 DQ trend per MFI, R11 System availability & incidents, R12 DSR register, R13 Content publication log. All support scheduling, email to role groups, watermark, footer with cut-off/generation time/generator.

Logs: Audit (10 y WORM, hash of previous entry), Inquiry, Security, Data processing, Content, Application, Notification, Admin change log.

## 10. Security & privacy highlights
SEC-01 MFA; SEC-02 server-side authz, tenant from token (AC04: MFI A requests MFI B data → denied and logged); SEC-03 maker-checker on user/role, licence, rules, corrections, content publishing, config; SEC-04 encryption + field-level for NRC/phone/address; SEC-05 pseudonymised key in DWH; SEC-07 session 10 min idle / 8 h absolute; SEC-08 hash chain + WORM; SEC-10 RPO 1 h, RTO 4 h, quarterly restore test.
LOC-01 EN/MM Unicode, Zawgyi detection; LOC-02 honorific stripping for name match; LOC-03 NRC parser; LOC-04 MMK formatting incl. lakh option; LOC-05 WCAG 2.1 AA; LOC-06 low-bandwidth mode.

## 12.3 Acceptance criteria
AC01 resubmit same batch → no duplicates; AC02 failed validation fixed, totals reconcile; AC03 similar identities not auto-merged, no-hit ≠ low risk; AC04 cross-tenant denied + logged; AC05 inquiry records purpose, consent, rule version, data date; AC06 borrower dispute → MFI response → approved correction with history; AC07 restricted notice never in public UI/API; AC08 invoice excludes retries; AC09 restore meets RPO/RTO; AC10 peak load; AC11 content cannot be published by its own editor, version restore works; AC12 borrower sees only own report and full who-viewed; AC13 screen reader + keyboard on Portals 1–2.
