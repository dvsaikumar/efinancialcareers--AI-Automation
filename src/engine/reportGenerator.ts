import type {
  ActionItem,
  AnomalyFlag,
  AutomationOpportunity,
  FollowUpEmailDraft,
  IngestedDocument,
  LiquidityEvent,
  MeetingDebrief,
  ReportCadence,
} from '../types/domain'

const CADENCE_LABELS: Record<ReportCadence, string> = {
  daily: 'DAILY TREASURY & RISK FLASH',
  weekly: 'WEEKLY OPERATIONS & FOLLOW-UP BRIEF',
  monthly: 'MONTHLY MULTI-ASSET & HEDGE FUND REVIEW',
  quarterly: 'QUARTERLY EXECUTIVE IC BRIEF & MANAGEMENT SUMMARY',
}

export function buildExecutiveIcBriefMarkdown(
  documents: IngestedDocument[],
  anomalies: AnomalyFlag[],
  actionItems: ActionItem[],
  selectedDocIds?: string[],
  cadence: ReportCadence = 'quarterly'
): string {
  const scopeDocs =
    selectedDocIds && selectedDocIds.length > 0
      ? documents.filter((d) => selectedDocIds.includes(d.id))
      : documents

  const csvDoc = scopeDocs.find((d) => d.portfolioRows && d.portfolioRows.length > 0)
  const totalNav =
    csvDoc?.portfolioRows?.reduce((acc, r) => acc + r.navMillions, 0) ??
    scopeDocs.reduce((acc, d) => acc + (d.docType === 'quarterly_letter' ? d.metrics.navMillions ?? 0 : 0), 0)

  const cashM = csvDoc?.metrics.cashLiquidityMillions ?? 4.8
  const unfundedM =
    csvDoc?.metrics.unfundedMillions ??
    scopeDocs.reduce((acc, d) => acc + (d.docType === 'quarterly_letter' ? d.metrics.unfundedMillions ?? 0 : 0), 0)

  const quantitativeFunds = scopeDocs.filter(
    (d) =>
      d.docType === 'quarterly_letter' ||
      (d.docType === 'distribution_notice' && d.metrics.navMillions !== undefined)
  )
  const hedgeFundDocs = scopeDocs.filter((d) => d.assetClass === 'Hedge Funds')
  const relevantAnomalies = anomalies.filter(
    (a) => !selectedDocIds || selectedDocIds.length === 0 || a.sourceDocIds.some((id) => selectedDocIds.includes(id))
  )

  const lines: string[] = [
    `# MERIDIAN CREST FAMILY OFFICE — ${CADENCE_LABELS[cadence]}`,
    '',
    `**Cadence:** ${cadence.toUpperCase()}  `,
    `**Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  `,
    `**Engine Mode:** Zero-DB Local Browser Intelligence (100% Verifiable Provenance)  `,
    `**Documents Synthesized:** ${scopeDocs.length}`,
    '',
    '---',
    '',
  ]

  if (cadence === 'daily') {
    lines.push(
      '## 1. Daily Liquidity & Immediate Wire Watch',
      `- **Immediate Cash & T-Bills:** $${cashM.toFixed(2)}M (IPS Hard Floor: $3.00M -> Deployable Buffer: $${Math.max(0, cashM - 3.0).toFixed(2)}M)`,
      `- **Critical Wire Holds / Discrepancies:** ${relevantAnomalies.filter((a) => a.severity === 'Critical').length} Critical | ${relevantAnomalies.length} Total Active Alerts`,
      `- **Open Urgent Actions:** ${actionItems.filter((a) => !a.completed && a.priority === 'Critical').length} Critical task(s) requiring today's attention`,
      '',
      '## 2. Active Critical Alerts & Pre-Wire Controls',
      ...(relevantAnomalies.length > 0
        ? relevantAnomalies.map(
            (a) => `- **[${a.severity.toUpperCase()}] ${a.title}** (${a.deltaLabel ?? 'Audit Flag'}): ${a.recommendedAction}`
          )
        : ['- Zero active discrepancies requiring intervention today.']),
      '',
      '## 3. Today’s Priority Execution Queue',
      ...(actionItems.filter((a) => !a.completed).slice(0, 5).map(
        (item) => `- [ ] **(${item.priority})** ${item.title} — *Owner:* ${item.owner} | *Due:* ${item.dueDate ?? 'TBD'}`
      ))
    )
  } else if (cadence === 'weekly') {
    lines.push(
      '## 1. Weekly Operations & Close Status',
      `- **Tracked Multi-Asset NAV:** $${totalNav.toFixed(1)}M across ${csvDoc?.portfolioRows?.length ?? scopeDocs.length} sleeves`,
      `- **Completed vs. Open Team Tasks:** ${actionItems.filter((a) => a.completed).length} Completed | ${actionItems.filter((a) => !a.completed).length} Open`,
      `- **Reconciliation Items Flagged:** ${relevantAnomalies.length}`,
      '',
      '## 2. Outstanding GP Follow-Ups & Deadlines',
      ...actionItems.map(
        (item) =>
          `- [${item.completed ? 'x' : ' '}] **(${item.priority})** ${item.title} — *Owner:* ${item.owner} | *Due:* ${
            item.dueDate ?? 'TBD'
          }`
      ),
      '',
      '## 3. Cross-Document Audit Watchlist',
      ...(relevantAnomalies.length > 0
        ? relevantAnomalies.map((a) => `- **${a.title}** (${a.deltaLabel ?? a.severity}): ${a.summary}`)
        : ['- All weekly reconciliations clean.'])
    )
  } else if (cadence === 'monthly') {
    lines.push(
      '## 1. Monthly Liquid Alternatives & Portfolio Pulse',
      `- **Consolidated Portfolio NAV:** $${totalNav.toFixed(1)}M | **Immediate Cash:** $${cashM.toFixed(1)}M | **Unfunded:** $${unfundedM.toFixed(1)}M`,
      ...(hedgeFundDocs.length > 0
        ? hedgeFundDocs.map(
            (hf) =>
              `- **Hedge Fund Highlight (${hf.fundName ?? hf.title}):** Ending NAV $${(hf.metrics.navMillions ?? 0).toFixed(1)}M${
                hf.metrics.priorNavMillions !== undefined ? ` (vs. $${hf.metrics.priorNavMillions.toFixed(1)}M Q3, +${hf.metrics.qoqChangePct ?? 0}%)` : ''
              }, Net Return/IRR ${hf.metrics.netIrrPct ?? '—'}%, Tone: ${hf.sentiment}.`
          )
        : ['- No monthly hedge fund statements currently in scope.']),
      '',
      '## 2. Period-over-Period Fund Performance (Q3 vs. Q4 / Latest)',
      ...(quantitativeFunds.length > 0
        ? [
            '| Fund | Asset Class | Prior NAV (Q3) | Ending NAV | QoQ Δ | Net IRR | Unfunded |',
            '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
            ...quantitativeFunds.map(
              (f) =>
                `| ${f.fundName ?? f.title} | ${f.assetClass} | ${
                  f.metrics.priorNavMillions !== undefined ? `$${f.metrics.priorNavMillions.toFixed(1)}M` : '—'
                } | ${f.metrics.navMillions !== undefined ? `$${f.metrics.navMillions.toFixed(1)}M` : '—'} | ${
                  f.metrics.qoqChangePct !== undefined ? `${f.metrics.qoqChangePct >= 0 ? '+' : ''}${f.metrics.qoqChangePct}%` : '—'
                } | ${f.metrics.netIrrPct !== undefined ? `${f.metrics.netIrrPct}%` : '—'} | ${
                  f.metrics.unfundedMillions !== undefined ? `$${f.metrics.unfundedMillions.toFixed(1)}M` : '—'
                } |`
            ),
          ]
        : ['- No quantitative fund updates in selected scope.']),
      '',
      '## 3. Monthly Risk & Governance Flags',
      ...(relevantAnomalies.length > 0
        ? relevantAnomalies.map((a) => `- **[${a.severity.toUpperCase()}] ${a.title}:** ${a.recommendedAction}`)
        : ['- No material anomalies flagged this month.'])
    )
  } else {
    lines.push(
      '## 1. Portfolio Snapshot & Liquidity Posture',
      `- **Reported Portfolio NAV:** $${totalNav.toFixed(1)}M`,
      `- **Immediate Liquidity (Cash & T-Bills):** $${cashM.toFixed(1)}M (IPS Hard Floor: $3.0M -> Deployable Buffer: $${Math.max(0, cashM - 3.0).toFixed(2)}M)`,
      `- **Total Unfunded Private Commitments:** $${unfundedM.toFixed(1)}M`,
      `- **Active Cross-Document Discrepancies:** ${relevantAnomalies.length}`,
      '',
      '## 2. Fund Manager Intelligence & Period-over-Period Comparison (Q3 vs. Q4)',
      ...(quantitativeFunds.length > 0
        ? [
            '| Fund | Asset Class | Prior NAV (Q3) | Ending NAV | QoQ Δ | Net IRR | TVPI | DPI | Unfunded | Tone |',
            '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
            ...quantitativeFunds.map(
              (f) =>
                `| ${f.fundName ?? f.title} | ${f.assetClass} | ${
                  f.metrics.priorNavMillions !== undefined ? `$${f.metrics.priorNavMillions.toFixed(1)}M` : '—'
                } | ${
                  f.metrics.navMillions !== undefined ? `$${f.metrics.navMillions.toFixed(1)}M` : '—'
                } | ${
                  f.metrics.qoqChangePct !== undefined ? `${f.metrics.qoqChangePct >= 0 ? '+' : ''}${f.metrics.qoqChangePct}%` : '—'
                } | ${f.metrics.netIrrPct !== undefined ? `${f.metrics.netIrrPct}%` : '—'} | ${
                  f.metrics.tvpi !== undefined ? `${f.metrics.tvpi}x` : '—'
                } | ${f.metrics.dpi !== undefined ? `${f.metrics.dpi}x` : '—'} | ${
                  f.metrics.unfundedMillions !== undefined ? `$${f.metrics.unfundedMillions.toFixed(1)}M` : '—'
                } | ${f.sentiment} |`
            ),
          ]
        : ['- No quarterly fund letters currently in selected scope.']),
      '',
      '## 3. Critical Discrepancies & Governance Alerts',
      ...(relevantAnomalies.length > 0
        ? relevantAnomalies.map(
            (a) =>
              `- **[${a.severity.toUpperCase()}] ${a.title}** (${a.deltaLabel ?? 'Audit Flag'}): ${a.summary}\n  - *Recommended Action:* ${a.recommendedAction}`
          )
        : ['- Zero cross-document discrepancies detected in current scope.']),
      '',
      '## 4. Open Management Decisions & Action Checklist',
      ...(actionItems.length > 0
        ? actionItems.map(
            (item) =>
              `- [${item.completed ? 'x' : ' '}] **(${item.priority})** ${item.title} — *Owner:* ${item.owner} | *Due:* ${
                item.dueDate ?? 'TBD'
              }`
          )
        : ['- No open action items logged.'])
    )
  }

  lines.push(
    '',
    '---',
    '*Prepared deterministically inside Meridian Crest AI (Zero-Database Local Engine). Synthetic demonstration data.*'
  )

  return lines.join('\n')
}

export function buildFollowUpEmailDrafts(
  documents: IngestedDocument[],
  anomalies: AnomalyFlag[]
): FollowUpEmailDraft[] {
  const drafts: FollowUpEmailDraft[] = []

  const feeAnomaly = anomalies.find((a) => /fee/i.test(a.title))
  if (feeAnomaly) {
    drafts.push({
      id: 'draft-apex-fee-inquiry',
      title: 'Apex Horizon IV — $50,000 Fee Variance & Revised Notice Request',
      to: 'Marcus Vance <capops@apexhorizon-synthetic.example>; ir@apexhorizon-synthetic.example',
      subject: 'ACTION REQUIRED: Fee Variance on Capital Call Notice #14 — LP Account #MC-408 ($50,000 Discrepancy)',
      urgency: 'Critical',
      category: 'Fee Audit & Wire Hold',
      sourceDocIds: feeAnomaly.sourceDocIds,
      body: `Dear Marcus and Apex Horizon Investor Relations Team,

We are in receipt of Capital Call Notice #14 for Apex Horizon Private Equity Fund IV (LP Account #MC-408), requesting $1,250,000 due February 11, 2027.

During our automated pre-wire reconciliation against the Q4 2026 Limited Partner Quarterly Letter (dated January 18, 2027, Schedule B), we identified a $50,000 discrepancy in the management fee line item:
- Q4 2026 Letter (Schedule B Post-Investment-Period Step-Down to 1.50%): $185,000
- Capital Call Notice #14 (billed at legacy 2.00% rate): $235,000
- Variance: +$50,000 overbilled

Please confirm this variance and issue an amended Capital Call Notice #14 reflecting the corrected total wire amount of $1,200,000 ($1,015,000 Solara MedTech follow-on + $185,000 Q1 management fee). We have placed wire authorization on temporary hold pending receipt of the revised notice and will release funds promptly upon confirmation.

Best regards,
Sarah Chen
Head of Investment Operations — Meridian Crest Family Office`,
    })
  }

  const vanguardiaDoc = documents.find((d) => /vanguardia/i.test(d.fundName ?? d.title))
  if (vanguardiaDoc) {
    drafts.push({
      id: 'draft-vanguardia-coinvest',
      title: 'Vanguardia Growth II — Helix Compute Co-Invest Election & Diligence Request',
      to: 'Vanguardia Allocations <allocations@vanguardia-synthetic.example>',
      subject: 'Meridian Crest LP — Helix Compute Series C Co-Investment ($750,000 Allocation)',
      urgency: 'High',
      category: 'Co-Investment Election',
      sourceDocIds: [vanguardiaDoc.id],
      body: `Dear Vanguardia Partner Team,

Thank you for the Q4 2026 update and for offering Meridian Crest Family Office a $750,000 SPV co-investment allocation in Helix Compute's Series C insider extension (0% fee / 10% carry).

Our Investment Committee has reviewed the opportunity favorably and is finalizing liquidity staging ahead of the February 15, 2027 binding election deadline. Prior to submitting formal subscription documents, could you please share:
1. Updated cap table and pro-forma ownership summary post-Series C extension;
2. Confirmation of information rights and expected secondary tender liquidity timeline for H2 2027;
3. Final SPV subscription agreement and verified wire instructions.

We intend to confirm our formal election well ahead of the February 15 deadline.

Warm regards,
David Morales
Chief Investment Officer — Meridian Crest Family Office`,
    })
  }

  const wireFraudAnomaly = anomalies.find((a) => /bank instruction/i.test(a.title))
  if (wireFraudAnomaly) {
    drafts.push({
      id: 'draft-wire-callback',
      title: 'Bridge Credit III — Out-of-Band Wire Instruction & IRR Verification',
      to: 'Investor Relations <ir@bridgecredit-synthetic.example>',
      subject: 'Compliance Verification: Pending Capital Call & Audited IRR Confirmation — Bridge Credit Fund III',
      urgency: 'Critical',
      category: 'Wire Fraud / Compliance Control',
      sourceDocIds: wireFraudAnomaly.sourceDocIds,
      body: `Dear Bridge Credit Investor Relations,

Before processing any tentative Q1 capital call (~$420,000) for Bridge Credit Opportunity Fund III, Meridian Crest Family Office requires two compliance verifications:
1. Out-of-band dual-control callback verification using our on-file GP directory number to confirm any alleged change in wire instructions;
2. Formal capital account statement reconciling the conflicting Net IRR figures (11.4% vs. 13.8%) noted in preliminary materials.

No funds will be released until written audited confirmation and verbal callback verification are complete.

Regards,
Treasury & Compliance — Meridian Crest Family Office`,
    })
  }

  if (drafts.length === 0) {
    drafts.push({
      id: 'draft-generic-pacing',
      title: 'Q1 Capital Call Pacing Check — General Partner Outreach',
      to: 'GP Investor Relations Distribution List',
      subject: 'Meridian Crest Family Office — Q1/Q2 2027 Capital Call & Distribution Pacing Inquiry',
      urgency: 'Standard',
      category: 'Liquidity Planning',
      sourceDocIds: documents.slice(0, 2).map((d) => d.id),
      body: `Dear Partner,

As part of Meridian Crest Family Office's quarterly liquidity governance review, could you please share your updated 90-day capital call and distribution pacing forecast?

Thank you for your continued partnership.

Best regards,
Investment Operations — Meridian Crest Family Office`,
    })
  }

  return drafts
}

export function synthesizeMeetingDebrief(rawText: string, sourceLabel = 'IC Meeting Notes'): MeetingDebrief {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const decisions: string[] = []
  const openQuestions: string[] = []
  const ownersAndActions: MeetingDebrief['ownersAndActions'] = []
  const riskHighlights: string[] = []

  for (const line of lines) {
    if (/decision:/i.test(line)) {
      decisions.push(line.replace(/^[-*>\s]*decision:\s*/i, '').trim())
    } else if (/action:/i.test(line)) {
      const cleaned = line.replace(/^[-*>\s]*action:\s*/i, '').trim()
      const ownerMatch = cleaned.match(/^([A-Z][a-z]+(?:\s*\([^)]+\))?)\s+to\s+/i)
      const dueMatch = cleaned.match(/\b(TODAY|by\s+[A-Za-z]+\s*\d*|by\s+Friday)\b/i)
      ownersAndActions.push({
        owner: ownerMatch ? ownerMatch[1] : 'Investment Team',
        action: cleaned,
        due: dueMatch ? dueMatch[1] : 'Next IC Sync',
        priority: /today|hold wire|floor/i.test(cleaned) ? 'Critical' : 'High',
      })
    } else if (/\?|open question/i.test(line)) {
      openQuestions.push(line.replace(/^[-*>\s]*(?:open question:\s*)?/i, '').trim())
    }

    if (/floor|overbilling|error|delay|dips|below|phishing|18 days/i.test(line)) {
      riskHighlights.push(line.replace(/^[-*>\s]+/, '').trim())
    }
  }

  if (decisions.length === 0) {
    decisions.push('Pending formal IC vote once open diligence & liquidity checks are verified.')
  }
  if (ownersAndActions.length === 0) {
    ownersAndActions.push({
      owner: 'Investment Operations',
      action: 'Circulate structured notes and confirm follow-up owners with CIO.',
      due: 'Within 48 hours',
      priority: 'Medium',
    })
  }

  return {
    title: 'Structured IC Debrief & Action Matrix',
    sourceLabel,
    decisions,
    openQuestions: openQuestions.slice(0, 5),
    ownersAndActions,
    riskHighlights: Array.from(new Set(riskHighlights)).slice(0, 5),
  }
}

export function buildLiquidityRadar(documents: IngestedDocument[]): {
  availableCashM: number
  ipsFloorM: number
  events: LiquidityEvent[]
  totalMandatoryM: number
  totalOptionalM: number
  projectedCashAfterMandatoryM: number
  projectedCashAfterAllM: number
} {
  const csvDoc = documents.find((d) => d.metrics.cashLiquidityMillions !== undefined)
  const icDoc = documents.find((d) => d.metrics.liquidityFloorMillions !== undefined)
  const availableCashM = csvDoc?.metrics.cashLiquidityMillions ?? icDoc?.metrics.cashLiquidityMillions ?? 4.8
  const ipsFloorM = icDoc?.metrics.liquidityFloorMillions ?? 3.0

  const events: LiquidityEvent[] = []

  for (const doc of documents) {
    if (doc.docType === 'capital_call' && doc.metrics.capitalCallAmount) {
      events.push({
        id: `liq-${doc.id}`,
        title: `Capital Call #14 (${doc.fundName ?? doc.title})`,
        fundName: doc.fundName ?? doc.title,
        amountMillions: Number((doc.metrics.capitalCallAmount / 1_000_000).toFixed(3)),
        dueInDays: doc.metrics.dueInDays ?? 10,
        dueDateLabel: doc.metrics.dueDate ?? 'In 10 days',
        type: 'Mandatory Capital Call',
        status: 'Flagged Discrepancy',
        sourceDocId: doc.id,
        notes: 'Hold wire until $50k fee overbilling is corrected ($1.25M billed vs $1.20M scheduled).',
      })
    }
    if (doc.docType !== 'ic_meeting_notes' && doc.metrics.coInvestAmount) {
      events.push({
        id: `liq-coinv-${doc.id}`,
        title: `Helix Compute Series C Co-Invest (${doc.fundName ?? doc.title})`,
        fundName: doc.fundName ?? doc.title,
        amountMillions: Number((doc.metrics.coInvestAmount / 1_000_000).toFixed(3)),
        dueInDays: doc.metrics.dueInDays ?? 14,
        dueDateLabel: doc.metrics.dueDate ?? 'In 14 days',
        type: 'Optional Co-Investment',
        status: 'Decision Needed',
        sourceDocId: doc.id,
        notes: '0% management fee / 10% carry SPV; requires $500K equity SMA trim to preserve $3.0M IPS floor.',
      })
    }
    if (doc.docType === 'mixed_chaos' && doc.metrics.capitalCallAmount) {
      events.push({
        id: `liq-chaos-${doc.id}`,
        title: `Tentative Call (${doc.fundName ?? 'Unverified Notice'})`,
        fundName: doc.fundName ?? 'Bridge Credit Fund III',
        amountMillions: Number((doc.metrics.capitalCallAmount / 1_000_000).toFixed(3)),
        dueInDays: doc.metrics.dueInDays ?? 21,
        dueDateLabel: `Est. in ${doc.metrics.dueInDays ?? 21} days (unconfirmed)`,
        type: 'Pending Verification',
        status: 'Flagged Discrepancy',
        sourceDocId: doc.id,
        notes: 'Unverified forwarded notice — requires GP wire callback & formal LPA notice.',
      })
    }
  }

  events.sort((a, b) => a.dueInDays - b.dueInDays)

  const totalMandatoryM = Number(
    events
      .filter((e) => e.type === 'Mandatory Capital Call')
      .reduce((sum, e) => sum + e.amountMillions, 0)
      .toFixed(3)
  )
  const totalOptionalM = Number(
    events
      .filter((e) => e.type !== 'Mandatory Capital Call')
      .reduce((sum, e) => sum + e.amountMillions, 0)
      .toFixed(3)
  )

  return {
    availableCashM,
    ipsFloorM,
    events,
    totalMandatoryM,
    totalOptionalM,
    projectedCashAfterMandatoryM: Number((availableCashM - totalMandatoryM).toFixed(2)),
    projectedCashAfterAllM: Number((availableCashM - totalMandatoryM - totalOptionalM).toFixed(2)),
  }
}

export const AUTOMATION_OPPORTUNITIES: AutomationOpportunity[] = [
  {
    id: 'opp-fee-watchdog',
    name: 'Capital Call Fee & LPA Step-Down Watchdog',
    category: 'Risk & Fee Controls',
    hoursSavedPerQuarter: 36,
    implementationEffort: 'Low',
    riskReduction: 'High',
    annualizedValueUsd: 215000,
    roiScore: 98,
    status: 'Live in Workspace',
    description:
      'Automatically reconciles every capital call fee line item against prior LP letters and LPA step-down terms before treasury wire approval (catches $50k+ errors instantly).',
  },
  {
    id: 'opp-pdf-extractor',
    name: 'LP Quarterly Letter Auto-Extraction to Ledger',
    category: 'Reporting Automation',
    hoursSavedPerQuarter: 168,
    implementationEffort: 'Low',
    riskReduction: 'High',
    annualizedValueUsd: 94000,
    roiScore: 95,
    status: 'Live in Workspace',
    description:
      'Eliminates 16 hrs/week of manual PDF-to-Excel re-keying for NAV, Net IRR, TVPI, DPI, and unfunded commitments with provenance citations.',
  },
  {
    id: 'opp-liquidity-radar',
    name: 'Liquidity Floor & Capital Call Deadline Radar',
    category: 'Treasury & Pacing',
    hoursSavedPerQuarter: 28,
    implementationEffort: 'Low',
    riskReduction: 'High',
    annualizedValueUsd: 48000,
    roiScore: 92,
    status: 'Live in Workspace',
    description:
      'Continuously stress-tests upcoming mandatory wires and optional co-investments against the $3.0M IPS cash floor and T+1 liquid SMA sleeves.',
  },
  {
    id: 'opp-ic-synthesizer',
    name: 'IC Meeting Debrief & GP Follow-Up Draft Studio',
    category: 'Executive Productivity',
    hoursSavedPerQuarter: 44,
    implementationEffort: 'Low',
    riskReduction: 'Medium',
    annualizedValueUsd: 38000,
    roiScore: 88,
    status: 'Live in Workspace',
    description:
      'Converts raw IC meeting notes into decision logs, owner checklists, and ready-to-send GP inquiry emails in under 15 seconds.',
  },
  {
    id: 'opp-k1-tracker',
    name: 'K-1 Tax Package & Schedule Extraction Hub',
    category: 'Tax & Compliance',
    hoursSavedPerQuarter: 52,
    implementationEffort: 'Medium',
    riskReduction: 'High',
    annualizedValueUsd: 54000,
    roiScore: 84,
    status: 'Ready to Deploy',
    description:
      'Tracks expected vs. received partnership K-1s across PE/VC/RE sleeves, flags extension deadlines, and packages structured data for external CPA review.',
  },
  {
    id: 'opp-wire-fraud-guard',
    name: 'Dual-Control Wire Instruction Anomaly Guard',
    category: 'Cyber & Fraud Prevention',
    hoursSavedPerQuarter: 16,
    implementationEffort: 'Medium',
    riskReduction: 'High',
    annualizedValueUsd: 120000,
    roiScore: 91,
    status: 'Ready to Deploy',
    description:
      'Diffs ABA routing/account numbers against verified historical LP wire instructions and mandates out-of-band GP callback upon any change.',
  },
]

export function exportSummaryToCsv(documents: IngestedDocument[]): string {
  const headers = [
    'Title',
    'DocumentType',
    'FundName',
    'AssetClass',
    'NAV_M',
    'NetIRR_Pct',
    'TVPI',
    'DPI',
    'Unfunded_M',
    'CapitalCall_USD',
    'Sentiment',
    'Confidence_Pct',
  ]
  const escape = (val: string | number | undefined) => {
    const s = val === undefined ? '' : String(val)
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = documents.map((d) =>
    [
      d.title,
      d.docType,
      d.fundName ?? '',
      d.assetClass,
      d.metrics.navMillions ?? '',
      d.metrics.netIrrPct ?? '',
      d.metrics.tvpi ?? '',
      d.metrics.dpi ?? '',
      d.metrics.unfundedMillions ?? '',
      d.metrics.capitalCallAmount ?? '',
      d.sentiment,
      d.confidenceScore,
    ]
      .map(escape)
      .join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

export function buildPrintReadyExecutiveHtml(title: string, markdownBody: string): string {
  const escaped = markdownBody
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- \[x\] (.+)$/gm, '<li class="done">☑ $1</li>')
    .replace(/^- \[ \] (.+)$/gm, '<li>☐ $1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} — Meridian Crest Family Office</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 860px; margin: 40px auto; padding: 0 24px; color: #0f172a; line-height: 1.6; }
    header { border-bottom: 2px solid #0b1626; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: baseline; }
    .brand { font-weight: 700; letter-spacing: 0.04em; color: #0b1626; font-size: 14px; text-transform: uppercase; }
    .badge { font-size: 11px; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 999px; }
    h1 { font-size: 22px; margin: 0 0 12px; color: #0b1626; }
    h2 { font-size: 16px; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; color: #1e293b; }
    li { margin: 6px 0; }
    li.done { color: #047857; }
    pre, code { font-family: monospace; background: #f8fafc; padding: 2px 5px; border-radius: 4px; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <header>
    <div class="brand">Meridian Crest Family Office • Executive AI Brief</div>
    <div class="badge">Zero-DB Verified Export</div>
  </header>
  <main><p>${escaped}</p></main>
</body>
</html>`
}
