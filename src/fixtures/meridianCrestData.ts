import type { AssessmentInputs } from '../types/domain'

export interface SyntheticFixture {
  id: string
  title: string
  fileName: string
  format: 'txt' | 'md' | 'csv' | 'eml'
  content: string
  description: string
  demoGroup: 'onboarding' | 'fund_comms' | 'portfolio' | 'governance'
}

export const MERIDIAN_CREST_FIXTURES: SyntheticFixture[] = [
  {
    id: 'fixture-apex-q4-letter',
    title: 'Apex Horizon Private Equity Fund IV — Q4 Quarterly Letter',
    fileName: 'apex-horizon-iv-q4-letter.txt',
    format: 'txt',
    demoGroup: 'fund_comms',
    description:
      'Q4 LP quarterly letter with NAV $18.4M, Net IRR 16.8%, TVPI 1.42x, unfunded $6.2M, delayed exit note, and Q1 fee schedule.',
    content: `APEX HORIZON CAPITAL PARTNERS, L.P.
CONFIDENTIAL LIMITED PARTNER QUARTERLY LETTER — Q4 2026
Fund: Apex Horizon Private Equity Fund IV, L.P.
Prepared for: Meridian Crest Family Office (LP Account #MC-408)
Date: January 18, 2027

Dear Limited Partners,

We are pleased to share the Q4 2026 performance update for Apex Horizon Private Equity Fund IV ("Apex Horizon IV"). Despite higher-for-longer financing costs across middle-market buyouts, portfolio operating EBITDA expanded 14.2% year-over-year across our 11 active platform companies.

KEY LP ACCOUNT SUMMARY — MERIDIAN CREST FAMILY OFFICE (AS OF DEC 31, 2026)
- Total LP Commitment: $25.0M
- Ending NAV: $18.4M (up from $17.9M as of Q3 2026)
- Net IRR: 16.8%
- TVPI: 1.42x
- DPI: 0.38x
- Called %: 75.2% ($18.8M contributed to date)
- Unfunded Commitment: $6.2M

PORTFOLIO HIGHLIGHTS & REALIZATION OUTLOOK
1. Solara MedTech Systems (Healthcare IT, 22% of Fund NAV): Revenue grew 24% YoY following two bolt-on acquisitions. Holding marked at 1.95x cost.
2. Harborline Industrial Automation (19% of Fund NAV): Margin expansion of +280 bps driven by recurring maintenance software contracts.
3. Northstar Logistics Group (16% of Fund NAV — Exit Delay Notice): While freight volumes stabilized in Q4, buyer debt-financing spreads delayed the planned Q1 2027 sale of Northstar Logistics by approximately two quarters (now targeted for Q3 2027). No impairment is anticipated, though LP distributions will shift into H2 2027.

SCHEDULE B — MANAGEMENT FEE ADJUSTMENT & Q1 2027 CAPITAL CALL GUIDANCE
Effective January 1, 2027, Apex Horizon IV entered its post-investment-period step-down from 2.00% on committed capital to 1.50% on net invested cost basis. Under the revised Schedule B fee step-down, Meridian Crest Family Office's scheduled Q1 2027 quarterly management fee is exactly $185,000.

Combined with the planned follow-on equity check for Solara MedTech's acquisition of CareBridge Analytics ($1,015,000), we anticipate an upcoming Q1 2027 Capital Call of approximately $1,200,000 total ($1,015,000 investment + $185,000 scheduled management fee).

RISK FACTORS & WATCHLIST
- Refinancing wall for two smaller holdings (Cinder Packaging and Meridian Cold Chain) in late 2027; interest rate hedging covers 75% of floating exposure.
- Delayed exit timeline on Northstar Logistics pushes near-term DPI realization out by 6 months.

Please contact Investor Relations (ir@apexhorizon-synthetic.example) with any questions ahead of our Annual LP Meeting.

Sincerely,
Elena Rostova, Managing Partner
Apex Horizon Capital Partners`,
  },
  {
    id: 'fixture-vanguardia-q4-update',
    title: 'Vanguardia Growth Venture Fund II — Q4 Update',
    fileName: 'vanguardia-growth-ii-q4-update.md',
    format: 'md',
    demoGroup: 'fund_comms',
    description:
      'Q4 VC update with NAV $9.1M, Net IRR 22.4%, TVPI 1.65x, AI infrastructure momentum, and 14-day co-investment deadline.',
    content: `# Vanguardia Growth Venture Fund II — Q4 2026 Partner Update
**Manager:** Vanguardia Ventures Management
**Fund:** Vanguardia Growth Venture Fund II
**Asset Class:** Venture Capital
**LP:** Meridian Crest Family Office
**Date:** January 22, 2027

## LP Capital Account Snapshot
- **Total Commitment:** $15.0M
- **Ending NAV:** $9.1M
- **Net IRR:** 22.4%
- **TVPI:** 1.65x
- **DPI:** 0.21x
- **Called %:** 72.0%
- **Unfunded Commitment:** $4.2M

## Portfolio Commentary: Enterprise AI Momentum
Enterprise AI infrastructure holdings drove 78% of Q4 unrealized markups:
- **Helix Compute** closed a $140M Series B at a 2.8x step-up led by Tier-1 institutional crossover investors. ARR reached $48M (+210% YoY).
- **Veridian AI Compliance** signed three Tier-1 wealth managers and expanded net dollar retention to 146%.
- **Kestrel Robotics** experienced a 1-quarter hardware certification delay; runway remains healthy at 26 months.

## Urgent LP Action Required: Helix Compute Co-Investment Allocation
Vanguardia has secured a $6.0M SPV co-investment allocation in Helix Compute's Series C insider extension (0% management fee / 10% carry).
- **Meridian Crest Allocation Offered:** $750,000
- **Binding Election Deadline:** Due in 14 days (February 15, 2027)
- **Funding Date if Elected:** February 24, 2027

Please confirm participation or pass via written election notice to allocations@vanguardia-synthetic.example prior to the 14-day deadline.

## Key Risks & Monitoring
- Valuation concentration: Top 3 companies represent 54% of Fund II NAV.
- IPO exit window remains selective; secondary liquidity tenders are under review for H2 2027.`,
  },
  {
    id: 'fixture-apex-capital-call',
    title: 'Capital Call Notice Email — Apex Horizon IV ($1,250,000)',
    fileName: 'apex-horizon-iv-capital-call.eml',
    format: 'eml',
    demoGroup: 'fund_comms',
    description:
      'Urgent capital call wire notice for $1,250,000 due in 10 days — contains a $50,000 management fee discrepancy vs. the Q4 letter.',
    content: `From: Capital Operations <capops@apexhorizon-synthetic.example>
To: Treasury & Investments <investments@meridiancrest-synthetic.example>
Subject: URGENT: Capital Call Notice #14 — Apex Horizon Private Equity Fund IV ($1,250,000 Due in 10 Days)
Date: February 1, 2027

Dear Meridian Crest Family Office Treasury Team,

Pursuant to the Limited Partnership Agreement of Apex Horizon Private Equity Fund IV, L.P., please find Formal Capital Call Notice #14 below.

CAPITAL CALL SUMMARY — LP ACCOUNT #MC-408
Fund Name: Apex Horizon Private Equity Fund IV
Total Wire Amount Due: $1,250,000
Wire Due Date: February 11, 2027 (Due in 10 days)

LINE-ITEM BREAKDOWN:
1. Solara MedTech / CareBridge Analytics Follow-On Investment: $1,015,000
2. Q1 2027 Quarterly Management Fee (billed at legacy 2.00% rate): $235,000
---------------------------------------------------------------------
TOTAL CAPITAL CALL DUE: $1,250,000

Updated Unfunded Commitment Post-Call: $4.95M

WIRE INSTRUCTIONS (SYNTHETIC DEMO ACCOUNT):
Bank: First Institutional Custody Bank, N.A.
ABA Routing: 000000000 (DEMO ONLY)
Account Name: Apex Horizon IV LP Subscription Escrow
Reference: MC-408-CALL-14

ACTION REQUIRED:
Please confirm receipt of this notice within 48 hours and initiate federal funds wire no later than 2:00 PM EST on February 11, 2027 to avoid default interest provisions under Section 5.4 of the LPA.

Regards,
Marcus Vance
Fund Controller, Apex Horizon Capital Partners`,
  },
  {
    id: 'fixture-portfolio-csv',
    title: 'Portfolio Holdings & Liquidity Snapshot (CSV)',
    fileName: 'meridian-crest-portfolio-snapshot.csv',
    format: 'csv',
    demoGroup: 'portfolio',
    description:
      'Multi-asset holdings table across PE, VC, Public Equities, Real Estate, Fixed Income, and $4.8M Cash/T-Bills.',
    content: `Holding,AssetClass,NAV_Millions,Unfunded_Millions,Weight_Pct,AsOf,LiquidityTier,Notes
Apex Horizon Private Equity Fund IV,Private Equity,17.9,6.2,19.9,2026-09-30,Illiquid,Q3 carry-forward NAV pending Q4 letter reconciliation
Vanguardia Growth Venture Fund II,Venture Capital,9.1,4.2,10.1,2026-12-31,Illiquid,Q4 valuation updated; co-invest option pending
Crestline Core Plus Real Estate III,Real Estate,14.2,2.1,15.8,2026-12-31,Illiquid,Multifamily & logistics; 5.4% cash yield
Global Quality Dividend Equities SMA,Public Equities,26.5,0.0,29.5,2027-01-31,Immediate,Custodian A - liquid within T+1
Investment Grade Municipal & Corp Bond Ladder,Fixed Income & Credit,17.4,0.0,19.4,2027-01-31,Quarterly,Average duration 3.4 yrs; 4.85% YTM
Treasury Bills & Institutional Cash Reserve,Cash & Liquidity,4.8,0.0,5.3,2027-02-01,Immediate,Operating cash + 90-day US T-Bills; policy minimum floor $3.0M`,
  },
  {
    id: 'fixture-ic-notes',
    title: 'Investment Committee (IC) Meeting Notes — Raw Unformatted',
    fileName: 'ic-meeting-notes-feb-2027.txt',
    format: 'txt',
    demoGroup: 'governance',
    description:
      'Messy raw IC notes with liquidity policy floor ($3.0M), fee audit question, co-invest decision, and owners.',
    content: `IC sync notes - Feb 2 2027 (raw dump from Sarah's notepad - clean up later!!)

Attendees: David (CIO), Priya (Managing Director), Sarah (Investment Ops), Thomas (Family Principal)

- Quick pulse on liquidity: Cash & T-bills currently $4.8M. Thomas reminded everyone our IPS hard liquidity floor is $3.0M minimum reserve at all times!! So only $1.8M true deployable cash without trimming Public Equities SMA.
- Apex Horizon IV capital call just landed for $1.25M due in 10 days. WAIT - Priya noticed their Q4 letter explicitly said management fee stepped down to $185k in Q1, why is the call notice billing $235k?! Looks like a $50k overbilling error from fund admin!
  -> ACTION: Sarah to email Apex Horizon Fund Controller TODAY and hold wire approval until revised call notice is issued.
- Also Apex Horizon NAV on our master Excel spreadsheet still shows $17.9M (Q3 number) instead of $18.4M from the Q4 letter. Need ops to reconcile before quarterly board deck.
- Northstar Logistics exit pushed 2 quarters to Q3 2027 -> lowers expected H1 distributions, keep eye on pacing.
- Vanguardia Growth II co-investment in Helix Compute ($750k, 0/10 fee/carry) due in 14 days.
  -> DECISION: Committee tentatively leans YES on $750k co-invest IF we verify liquidity buffer stays above $3.0M after Apex call (NOTE: $4.8M - $1.2M - $0.75M = $2.85M!! That dips $150k below our $3.0M IPS floor!).
  -> ACTION: David (CIO) to prepare $500k rebalance trim from Global Quality Dividend Equities SMA by Feb 9 to keep cash > $3.3M if Helix co-invest is approved.
- Open question: Are any other PE/RE managers planning Q1 capital calls (specifically Crestline Core Plus RE III)? Priya to check with Crestline IR by Friday.
- Operations pain: Thomas frustrated it still takes 18 days after quarter-end to assemble the consolidated portfolio pack and we almost missed the $50k fee error manually.`,
  },
  {
    id: 'fixture-ops-memo',
    title: 'Current-State Operations & Reporting Pain-Points Memo',
    fileName: 'current-state-operations-memo.txt',
    format: 'txt',
    demoGroup: 'onboarding',
    description:
      'Internal family office ops memo documenting 18-day close, PDF-to-Excel re-keying, 4 portals, and reconciliation risks.',
    content: `MEMORANDUM — MERIDIAN CREST FAMILY OFFICE
TO: Principal & Investment Committee
FROM: Sarah Chen, Head of Investment Operations
DATE: January 29, 2027
SUBJECT: Current-State Investment Reporting & Workflow Bottleneck Assessment

1. EXECUTIVE SUMMARY
Meridian Crest oversees ~$90M across 6 core sleeves (Private Equity, Venture Capital, Real Estate, Public Equities, Fixed Income, and Cash/T-Bills). Despite institutional-grade holdings, our internal investment reporting and manager monitoring workflows remain heavily manual, creating operational risk and an 18-business-day quarterly close cycle.

2. KEY DATA SOURCES & FRAGMENTATION
- 4 separate custodian and fund administrator portals (requiring manual monthly PDF/CSV downloads).
- ~85 fund manager emails and PDF attachments received per month (quarterly letters, K-1 notices, capital calls, distribution notices, co-invest memos) stored across individual Outlook inboxes and nested SharePoint folders.
- Master portfolio workbook maintained in a fragile 14-tab Excel spreadsheet with manual copy-paste formulas.

3. IDENTIFIED BOTTLENECKS & MANUAL HANDOFFS
- PDF-to-Excel Re-Keying: Analysts spend roughly 16 hours per week manually reading 20-to-40 page LP quarterly PDFs and re-keying NAV, IRR, TVPI, DPI, and unfunded commitments into Excel.
- Unchecked Fee & Capital Call Notices: Capital call wires are tracked in a shared Outlook calendar; line-item management fees are rarely cross-checked against prior LP letters or LPA step-down schedules, causing 3–4 reconciliation errors per quarter.
- Zero Centralized Searchability: When the CIO or Principal asks a cross-fund question ("What is our total unfunded commitment?" or "Which funds flagged exit delays?"), analysts spend 2–4 hours digging through old emails and PDFs.
- Manual IC Reporting & Follow-Up Drafting: Preparing the quarterly IC summary deck and drafting manager follow-up emails takes 2 full analyst days per cycle.

4. COMPLIANCE & PRIVACY MANDATE
Because our family office handles sensitive wealth holdings, any initial AI pilot must prioritize data sovereignty—ideally requiring zero external database persistence, instant session wipe capability, and full citation traceability back to source documents.`,
  },
]

export const CHAOS_STRESS_TEST_PAYLOAD = {
  title: 'Unstructured Mixed-Format Chaos Drop (Broken CSV + Fragmented Email + Notes)',
  fileName: 'chaos-mixed-dump-2027.txt',
  content: `Fwd: RE: maybe bridge credit call?? (forwarded from phone - formatting broken)
From: unknown-sender@bridgecredit-synthetic.example
Sent: Feb 3 2027??

hey team quick note before flight - Bridge Credit Opportunity Fund III might call around $420,000 next month (maybe due in 21 days?? check LPA). Net IRR reported at 11.4% in draft deck BUT table below says 13.8% lol need to verify with GP!!

--- BROKEN CSV PASTE BELOW ---
Fund,NAV_M,IRR_Pct,Unfunded_M,Notes
Bridge Credit Opportunity Fund III,6.4,13.8%,1.9,"unclosed quote row with missing comma
Solara Co-Invest Sidecar,,N/A,0.5,TBD waiting on audit
,,,malformed empty row,,,

RANDOM SCRATCHPAD:
- Call tax advisor about K-1 extensions before March 10
- Verify Bridge Credit wire instructions (changed bank?? HIGH RISK phishing check!!)
- Unclear whether $420k call includes organizational expenses or management fee
- Remember to check overall cash liquidity floor ($3.0M) if Bridge Credit calls simultaneously with Apex Horizon IV`,
}

export const INITIAL_ASSESSMENT_INPUTS: AssessmentInputs = {
  quarterlyCloseDays: 18,
  manualPdfExcelHoursPerWeek: 16,
  custodianPortalCount: 4,
  monthlyEmailAttachments: 85,
  reconciliationErrorsPerQuarter: 4,
  centralSearchMaturity: 1,
  workflowNotes:
    'Manual PDF-to-Excel re-keying across 4 custodian portals, 18-day quarterly close, scattered Outlook attachments, no automated cross-checking of capital call management fees against LP letters.',
}
