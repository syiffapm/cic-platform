# CIC Myanmar — end-to-end flows

How citizens, lenders and the ministry use the live platform, from the public landing page to the end of each journey. Every step names the screen (URL) where it happens, so the flows can be walked through live at https://cic-platform.vercel.app.

There are two separate entry points:

| Audience | Address | Sign in with |
| --- | --- | --- |
| Citizens | `/login` on the public website (cic.gov.mm) | NRC or mobile number + password + SMS code |
| Staff of CIC, the Central Bank and licensed MFIs | `/workspace/login` — the Staff Workspace (workspace.cic.gov.mm in production) | Work email + password + authenticator code |

The public website never links to the Staff Workspace. Staff addresses (`/mfi`, `/gov`, `/gov/admin`) always send signed-out users to the staff sign-in, and a staff email is rejected by the citizen sign-in.

Training environment: seeded accounts use password **`Cic@2026`**, and any 6 digits work as the SMS or authenticator code. The identity-verification code at registration is **`123456`**.

| Who | Sign in with | Lands on |
| --- | --- | --- |
| Daw Hnin Wai — citizen, grade B, 3 active loans | NRC `12/OUKAMA(N)245781` | `/borrower` |
| Ko Aung Aung — citizen, loans in arrears | NRC `12/LAMANA(N)402917` | `/borrower` |
| Ma Su Myat — MFI Credit Officer (PGMF) | `su.myat@pgmf.org.mm` | `/mfi` |
| U Kyaw Thu — Regional Supervisor (Mandalay, Sagaing, Magway) | `kyaw.thu@cbm.gov.mm` | `/gov/dashboard` |
| Ko Htet Naing — CIC Security Administrator (roles & users) | `htet.naing@cic.gov.mm` | `/gov/admin/iam/users` |
| Ma Yamin — Content Editor | `yamin@cic.gov.mm` | `/gov/admin/cms` |
| U Kyaw Zin — MFI Administrator (PGMF) | `kyaw.zin@pgmf.org.mm` | `/mfi` |
| Dr. Than Than Nwe — Governor / Director, CBM | `director.frd@cbm.gov.mm` | `/gov/dashboard` |
| U Min Htet — Supervisor, CBM | `min.htet@cbm.gov.mm` | `/gov/dashboard` |
| Daw Nilar Win — Consumer Protection Officer | `nilar.win@cbm.gov.mm` | `/gov/disputes` |
| Ma Thandar — Licensing Officer | `thandar@cbm.gov.mm` | `/gov/mfi` |
| U Soe Paing — CIC Super Administrator | `soe.paing@cic.gov.mm` | `/gov/admin` |
| Ko Pyae Sone — CIC Data Steward | `pyae.sone@cic.gov.mm` | `/gov/admin` |

All other roles are listed under "Training environment accounts" on the sign-in page.

## Role-based access (CRUD per feature)

- **One Government Portal** (`/gov`) serves the Central Bank and CIC. Supervision, content management (CMS) and platform administration share one sign-in and one sidebar.
- **Every feature supports some of six actions:** Create, Read, Update, Delete, Approve, Export.
- **Each role grants actions per feature and carries a data scope.** Scopes include all data, assigned regions, own institution, aggregates only, and masked personal data.
- **What the permission matrix controls:**
  - the sidebar, which lists only the features a role can read
  - route access; a denied attempt is logged
  - every button: create, edit, delete, approve/publish/issue, and export
- **Where roles are managed:** Government Portal → Platform administration → **Roles & permissions** (`/gov/admin/access/roles`), by the Security or Super Administrator. From there they can:
  - create, clone, disable or delete a role, and edit its matrix and scope
  - see a warning when one role can both create and approve the same feature (segregation of duties)
  - rely on maker-checker: every change waits for a second administrator
- **MFI role templates** are defined there too: Administrator, Credit Officer, Data Submitter, Data Approver, Dispute Officer, Viewer. Each MFI administrator assigns them to their own staff (`/mfi/institution/users`) but cannot change their permissions.
- **Examples:**
  - The Regional Supervisor sees only institutions, cases and townships in Mandalay, Sagaing and Magway.
  - The Content Editor can create and edit content but cannot publish; the Publisher can publish but not their own edits.
  - A Credit Officer can check and decide a loan; only the MFI Administrator can disburse it or give the second approval for amounts above 5,000,000 MMK.

## Role-based sign-in

- **Citizens** sign in at `/login` with the NRC or mobile number and the password they chose at registration. Every sign-in needs an SMS code.
- **Staff** sign in at `/workspace/login` with their work email, password and authenticator code.
- In both, 5 wrong passwords lock the account, and every attempt is written to the audit log.

The **role on the account** decides where the user goes and which menus they see:
   - Citizen → Borrower Self-Service. Only their own file.
   - MFI roles → MFI Member Portal. Only their own institution; officers, makers, checkers, dispute officers and viewers each see different menus.
   - CBM roles → Government Portal. Director, supervisor, consumer-protection officer, analyst and licensing officer each land on their own home page and get a "Your access" card stating their data scope.
   - CIC roles → Government Portal (administration). Editor, publisher, steward, helpdesk, billing, security, auditor and DPO. Actions they may not take are hidden or read-only.

## Citizen journeys

### 1. Getting access to the credit report
1. Public home page `/` → **Check my credit report**.
2. `/my-credit` explains the 3 steps: create an account, verify identity, sign in with an SMS code. It also shows what the citizen will see.
3. **Register** → `/borrower/register`:
   - Enter name, NRC (checked against the national format), mobile number, optional email and **a password of your own** (with strength rules).
   - Choose where to receive the account confirmation (**SMS or email**), and agree to the terms and privacy notice.
   - Verify identity in one of three ways: NRC photo + selfie, an SMS code to the phone registered with your lender, or an activation code from a branch. After 3 failed attempts the citizen is referred to the helpdesk.
4. **The citizen is not signed in automatically.** The confirmation page reads "Identity confirmed — your account is ready".
   - CIC sends an **account confirmation with the user ID** (NRC or mobile number) by the chosen channel. It never contains a password.
   - The account is linked to the citizen's registry file, or a new empty file is opened. Its status is *Pending first sign-in*.
5. The citizen returns to the website → `/login` → NRC or mobile number + **the password they created** → SMS code.
   - The account becomes *Active*, and they land on `/borrower?welcome=1` with a first-time checklist.
6. Every later sign-in: `/login` → NRC or mobile number + password → SMS code.

In the training environment, the confirmation sent to the citizen appears under **Training environment → Confirmations sent to new registrations** on `/login`. Clicking it fills in the user ID; the citizen types their own password. To show registration linked to an existing credit file, use NRC `14/PATHEIN(N)118412`.

### 2. Requesting the credit report and score

The score is **not** shown just because the citizen signed in. The data first has to be validated and processed, so the citizen requests a report and CIC issues it.

1. **Before any request**, `/borrower` shows a **Get your credit report** card instead of a score. It explains the process and the free quota: one report every 12 months, then 3,000 MMK.
2. **Request** (`/borrower/requests/new`):
   - Choose a purpose: check my record, preparing to apply for a loan, after a dispute was corrected, or other.
   - Choose how to be told the report is ready (SMS or email).
   - Tick "I am requesting my own credit report" → **Send request to CIC**.
3. **Automated validation** runs at once (status *Validating*):
   - Identity: matched to the CIC file.
   - Data freshness: the latest data received from every lender.
   - Records under dispute, pending corrections, and the free quota.

   The request then moves to *Pending review*. The citizen follows it at `/borrower/requests/:id` (stepper, checks in plain language, timeline). The decision is made within 1 working day.
4. **CIC officer review** (Staff Workspace → `/gov/admin/report-requests`; Helpdesk, Data Steward or Super Administrator):
   - The queue shows a decision timer for each request.
   - The detail page shows the automated checks, a data-processing panel (each lender's last report date, open disputes, pending corrections, inquiries in the last 12 months) and **Re-run validation**.
   - **Approve and issue report**: blocked if a check failed; warnings must be ticked as reviewed. Or **Reject** with a reason, which is shown to the citizen in plain language.
5. **Issued**:
   - The report is frozen as a dated snapshot (report ID `CIC-P-…`, 6-digit verification code, valid 30 days).
   - An **SMS/email "Your credit report is ready"** is sent and appears in `/gov/admin/notifications` → delivery log.
   - The citizen gets an alert, and the request shows *Ready*.
6. **Result**:
   - `/borrower` shows **My CIC credit score**: grade A–E, score out of 100, factors and tips, with "issued / valid until / data as of".
   - `/borrower/report` shows the full report from the snapshot: loans by lender with the data date per line, a 24-month repayment grid, guarantees and dispute flags.
   - A citizen with no loans gets "No credit history yet", never a low score.
7. **Next steps** (the "What you can do next" panel):
   - **Download PDF / share with a lender.** The PDF carries a QR code and verification code that anyone can check at `/verify`: Valid / Expired / Not found, never the content.
   - **Something wrong? → Dispute** that record (journey 4). Once the dispute is **Resolved**, the citizen is offered **a free updated report** (a new request with purpose "After a dispute was corrected").
   - **Improve your score**: tips for each factor.
   - **Apply for a loan** (journey 3).
   - **Turn on alerts**: new inquiry, new loan reported, request decided.
8. After 30 days the report expires, and the citizen requests a new one.
9. `/borrower/who-viewed` is always available. It lists every lender that checked the file, with the purpose and the loan application it was for.

### 3. Applying for a loan online
1. The citizen finds a lender:
   - `/mfi-directory` → MFI profile → **Apply for a loan with this MFI** (only licensed MFIs), or
   - `/borrower` → **Apply for a loan**.
2. `/borrower/loans/apply`:
   - Choose a lender: licensed MFIs only, filterable by township or region.
   - Enter loan details: product, amount, period, income, occupation and purpose. The form warns if repayments exceed 40% of income or if the citizen already has 3 or more active loans.
   - Give **consent**: "I allow <MFI> to view my CIC credit report once for this application — valid 30 days".
3. Submitting the application:
   - creates a record `LAP-2026-xxxxx` with status **Submitted**
   - sends it to the MFI's inbox
   - shows the consent under `/borrower/consents`
4. `/borrower/loans/:id` tracks progress: Submitted → Credit check → Decision → Disbursed.
   - The citizen can withdraw while the application is still Submitted.
   - A decline shows the reason in plain language.
5. After disbursement the loan number is shown, and the loan appears in `/borrower/report` straight away.

### 4. Fixing a mistake (dispute)
1. `/borrower/report` → **Dispute it** on a loan, or `/borrower/disputes/new`: choose the record and a reason, describe the problem, and attach evidence (PDF/JPG, max 5 MB).
2. The dispute goes to the lender's inbox (`/mfi/disputes`), which has 10 working days to respond. The lender either confirms the data or submits a correction.
3. A CIC Data Steward approves the correction in `/gov/admin/helpdesk` or `/gov/admin/approvals`, which creates a new version of the record.
4. The citizen follows each step at `/borrower/disputes/:id`, including the SLA countdown and the corrected record.
5. If the SLA is breached, the case is escalated to CBM Consumer Protection (`/gov/disputes`).

### 5. Verifying a lender or a report
- **Lender:** `/mfi-directory` shows licence status, licence history, branches, map, and a complaint link.
- **Report:** `/verify` → enter the report ID + 6-digit code (or scan the QR). The result is only Valid, Revoked or Not found, never the report's content.
- **Complaints:** `/help/grievance` produces a ticket number and appears in the regulator's complaint register (`/gov/complaints`).

## Paying for credit reports (MFI)

- **Price:** credit reports are paid per borrower and per institution. **Basic is USD 2**: grade, active loans, total exposure, delinquency flag. **Full is USD 4**: everything, including the 24-month history, guarantees, inquiries, reason codes and PDF.
- **Shared across the institution:** a purchase by any user unlocks that tier for **every user of the same MFI for 30 days**. Basic does not include Full, so an upgrade costs USD 4. The same applies to every MFI role.
- **Nothing is shown before a report is chosen.** On a loan application or a credit inquiry, the user first chooses Basic or Full and then goes to the **checkout page** (`/mfi/checkout`). Payment options are the CIC prepaid wallet, the monthly invoice, or KBZPay / Wave Money / bank transfer. A receipt is issued and the report opens. If a colleague already unlocked it, the page shows "Unlocked by … — no charge".
- **Subscription (SaaS):** an MFI on the **Unlimited checks** plan (USD 300/month) pays nothing per report while subscribed. The MFI Administrator can subscribe or cancel under *Usage & billing*.
- **Where it shows up:**
  - Credit & lending → *Unlocked reports* lists what the MFI has already paid for.
  - *Usage & billing* shows the plan, wallet, purchases and invoice line.
  - In the Government Portal, Billing → *Report purchases* shows purchases across all MFIs.
- **How to search:** by NRC or CIC borrower ID only. Searching is free, and a no-hit result is never charged.

## Lender (MFI) journey — processing an online application

1. Ma Su Myat signs in → `/mfi` → **Loan applications** widget, or `/mfi/applications`. The inbox shows status tabs and a 3-working-day decision countdown.
2. `/mfi/applications/:id` (the MFI menu **Credit & lending** combines Loan applications, Credit inquiry, Batch inquiry and Unlocked reports):
   - The page shows the applicant, the requested terms, an affordability check, and the **digital consent** (reference, validity, not yet used).
   - **Choose Basic (USD 2) or Full (USD 4)** → checkout → pay. This makes one inquiry with purpose "new loan" and the consent reference. It returns the full CIC report and grade, which is the same grade the citizen sees. The inquiry is logged, and the citizen sees it under "Who viewed".
3. **Decision**:
   - **Approve:** amount, rate (capped at 28%), tenor. Approvals above 5,000,000 MMK need a second approval from the MFI Administrator.
   - **Decline:** a reason code from the standard list, shown to the citizen in plain language.
4. **Disburse and report to CIC** (needs the Approve right: MFI Administrator):
   - A loan number is generated and the loan is added to the registry at once.
   - The citizen's report, score and the regulator's figures all update.
5. The monthly data submission (`/mfi/submissions`) runs in parallel: upload → validation report → checker approval → identity resolution → load + reconciliation.

## Ministry journeys (Central Bank / CIC)

### Supervising the credit market — Government Portal
1. The Director signs in → `/gov/dashboard`. The executive KPIs each show a definition and an as-of date. There are filters by period, region, tier and product, a township heat-map, top-risk MFIs, and a **Citizen & lending activity** section.
2. `/gov/lending` shows:
   - online vs branch applications and the approval rate
   - approval rate for applicants who already hold 3 or more loans
   - decline reasons and time to decision
   - disbursement by region and by MFI
   - citizen self-service adoption

   All figures are aggregated; no names or NRCs are shown.
3. Early warning → action:
   - `/gov/ews` alert → **Investigate** opens a case `/gov/cases/:id`.
   - The case moves through triage → investigation → information request to the MFI → decision (approved by a Director) → action (warning, fine, suspension) → close. It can be published if the outcome is public.
4. Over-indebtedness `/gov/over-indebtedness` is shown by township. Drilling down to borrower level needs a written justification and is logged.
5. Licensing:
   - The Licensing Officer requests a status change in `/gov/mfi/:id`.
   - The Director approves it.
   - The public directory updates immediately.
6. Consumer protection: `/gov/disputes` (SLA breaches, escalation) and `/gov/complaints` (from the public form).
7. Publishing: a notice is drafted in `/gov/announcements`, then approved in `/gov/publication-approval`. It appears on the public site only if classified Public.

### Running the platform — Government Portal (administration)
1. `/gov/admin` has four dashboards:
   - **Operations:** system health, pending approvals, citizen accounts, identity checks, loan applications in flight, consents in force.
   - **Security**, **Content** and **Business**.
2. **Content:** an Editor drafts in `/gov/admin/cms`; a Publisher approves (never their own item). Classification decides who can see it.
3. **Access:** `/gov/admin/iam/users` (staff and citizen accounts) and the role builder, policies, IP allow-lists and recertification. Every change goes through maker-checker in `/gov/admin/approvals`.
4. **Data:**
   - data quality (`/gov/admin/data-quality`)
   - identity resolution: similar identities are never merged automatically (`/gov/admin/identity`)
   - versioned scoring rules with test, approve and rollback (`/gov/admin/rules`)
5. **Service desk:** disputes awaiting CIC approval, identity-verification tickets and grievances (`/gov/admin/helpdesk`).
6. **Governance:**
   - hash-chained audit log with integrity check and SIEM export (`/gov/admin/audit`)
   - backups and restore tests (`/gov/admin/system`)
   - data subject requests and the breach register (`/gov/admin/compliance`)

## One flow across all portals (walkthrough)

**Part A — new citizen: from registration to a credit report**
1. `/` → Check my credit report → `/my-credit` → **Create account** → register U Aung Aung, NRC `14/PATHEIN(N)118412`, create a password (e.g. `Myanmar@2026`), confirmation by SMS, activation code `123456`.
2. The screen says "your account is ready". `/login` → NRC `14/PATHEIN(N)118412` + the password you created at registration → SMS code.
3. The dashboard shows **no score yet**, only "Get your credit report" → **Request** → the request moves to *Pending review*.
4. Staff Workspace `/workspace/login` → Ma Hsu Lai (`hsu.lai@cic.gov.mm`, Helpdesk) → **Credit report requests** → open the request → review the checks → **Approve and issue report**. The SMS "report ready" appears in the delivery log.
5. Back as the citizen → the alert and request show *Ready* → dashboard score → full report → Download PDF → check the report ID and code at `/verify`.

**Part B — existing borrower: loan application to disbursement**
1. `/login` as Daw Hnin Wai (already holds a valid report CIC-P-260913-4417, grade B) → **Apply for a loan** → PGMF, 600,000 MMK → consent → Submitted.
2. Staff Workspace as Ma Su Myat → Loan applications → Run credit check → Record approval → Disburse and report to CIC.
3. As Daw Hnin Wai: the application shows *Disbursed* with a loan number, and PGMF's check appears in Who viewed my report. The new loan appears in the next report she requests.

**Part C — ministry view**
1. Staff Workspace as the Director → the executive dashboard and **Lending activity**: applications, approval rate, report requests issued/rejected, and citizen adoption, all as aggregates.
2. As U Soe Paing (Super Administrator) → the Operations dashboard shows report requests and applications in flight, and `/gov/admin/audit` shows every step in the hash-chained log.

**Part D — access control**
1. Staff Workspace as Ko Htet Naing (Security Administrator) → **Roles & permissions** → open *Regional Supervisor* → untick *Supervisory cases — Create* → Submit. This creates an approval request.
2. Sign in as U Soe Paing (Super Administrator) → Approvals inbox → approve it.
3. Sign in as U Kyaw Thu → the "New case" button is gone, and the data is still limited to his three regions.
