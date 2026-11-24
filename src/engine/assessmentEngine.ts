import type {
  AssessmentDimension,
  AssessmentInputs,
  AssessmentReport,
  BottleneckItem,
  IngestedDocument,
  RoadmapPhase,
} from '../types/domain'

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)))
}

function dimensionStatus(score: number): AssessmentDimension['status'] {
  if (score < 40) return 'Critical Gap'
  if (score < 65) return 'Developing'
  if (score < 85) return 'Structured'
  return 'Optimized'
}

export function deriveInputsFromOpsDocs(
  baseInputs: AssessmentInputs,
  documents: IngestedDocument[]
): AssessmentInputs {
  const opsDocs = documents.filter(
    (d) => d.docType === 'workflow_ops_memo' || /pdf-to-excel|quarterly close|custodian/i.test(d.rawContent)
  )
  if (opsDocs.length === 0) return baseInputs

  const combined = opsDocs.map((d) => d.rawContent).join('\n')
  const updated = { ...baseInputs }

  const closeMatch = combined.match(/(\d{1,2})(?:-business)?\s*days?\s+(?:quarterly\s+close|after\s+quarter-end)/i)
  if (closeMatch) updated.quarterlyCloseDays = parseInt(closeMatch[1], 10)

  const hoursMatch = combined.match(/(\d{1,2})\s+hours?\s+per\s+week/i)
  if (hoursMatch) updated.manualPdfExcelHoursPerWeek = parseInt(hoursMatch[1], 10)

  const portalMatch = combined.match(/(\d{1,2})\s+separate\s+custodian/i)
  if (portalMatch) updated.custodianPortalCount = parseInt(portalMatch[1], 10)

  const emailMatch = combined.match(/~?(\d{2,3})\s+fund\s+manager\s+emails/i)
  if (emailMatch) updated.monthlyEmailAttachments = parseInt(emailMatch[1], 10)

  const errMatch = combined.match(/(\d)[–-](\d)\s+reconciliation\s+errors/i)
  if (errMatch) updated.reconciliationErrorsPerQuarter = parseInt(errMatch[2], 10)

  if (/zero\s+centralized\s+search/i.test(combined)) {
    updated.centralSearchMaturity = 1
  }

  return updated
}

export function generateAssessmentReport(
  inputs: AssessmentInputs,
  documents: IngestedDocument[]
): AssessmentReport {
  const opsDocs = documents.filter(
    (d) => d.docType === 'workflow_ops_memo' || d.docType === 'ic_meeting_notes'
  )
  const combinedText = `${inputs.workflowNotes}\n${opsDocs.map((d) => d.rawContent).join('\n')}`

  const ingestionScore = clamp(
    100 - inputs.manualPdfExcelHoursPerWeek * 3.2 - inputs.custodianPortalCount * 5,
    14,
    95
  )
  const reportingScore = clamp(100 - inputs.quarterlyCloseDays * 3.6, 15, 95)
  const retrievalScore = clamp(inputs.centralSearchMaturity * 18 + (documents.length > 0 ? 6 : 0), 15, 96)
  const controlsScore = clamp(100 - inputs.reconciliationErrorsPerQuarter * 15 - (inputs.monthlyEmailAttachments > 60 ? 12 : 4), 18, 95)
  const liquidityGovScore = clamp(
    /outlook calendar|manual capital call/i.test(combinedText) ? 38 : 62,
    25,
    92
  )

  const dimensions: AssessmentDimension[] = [
    {
      key: 'ingestion',
      label: 'Data Ingestion & Normalization',
      score: ingestionScore,
      status: dimensionStatus(ingestionScore),
      finding: `${inputs.manualPdfExcelHoursPerWeek} hrs/wk spent manually re-keying PDFs across ${inputs.custodianPortalCount} disconnected portals.`,
    },
    {
      key: 'reporting',
      label: 'Quarterly Close & IC Reporting',
      score: reportingScore,
      status: dimensionStatus(reportingScore),
      finding: `${inputs.quarterlyCloseDays}-day close cycle relies on manual multi-tab Excel rollups and bespoke board pack drafting.`,
    },
    {
      key: 'retrieval',
      label: 'Centralized Knowledge & Search',
      score: retrievalScore,
      status: dimensionStatus(retrievalScore),
      finding:
        inputs.centralSearchMaturity <= 2
          ? `~${inputs.monthlyEmailAttachments} monthly manager emails/PDFs remain trapped in inboxes with 2–4 hr ad-hoc lookup lag.`
          : 'Structured search index partially established across historical manager letters.',
    },
    {
      key: 'controls',
      label: 'Fee Audit & Cross-Doc Controls',
      score: controlsScore,
      status: dimensionStatus(controlsScore),
      finding: `${inputs.reconciliationErrorsPerQuarter} reconciliation variances per quarter; capital call fees are not systematically checked against LPA/LP letter schedules.`,
    },
    {
      key: 'liquidity',
      label: 'Liquidity & Capital Call Governance',
      score: liquidityGovScore,
      status: dimensionStatus(liquidityGovScore),
      finding: 'Upcoming capital calls and co-investment deadlines tracked ad-hoc in calendars rather than dynamically stress-tested against the IPS liquidity floor.',
    },
  ]

  const overallScore = Math.round(
    dimensions.reduce((acc, d) => acc + d.score, 0) / dimensions.length
  )

  const maturityBand: AssessmentReport['maturityBand'] =
    overallScore < 40
      ? 'Manual / Fragile'
      : overallScore < 65
        ? 'Transitional'
        : overallScore < 85
          ? 'AI-Assisted'
          : 'Institutional AI-Native'

  const bottlenecks: BottleneckItem[] = [
    {
      id: 'bn-pdf-excel',
      area: 'Manual PDF-to-Excel Re-Keying',
      severity: inputs.manualPdfExcelHoursPerWeek >= 10 ? 'High' : 'Medium',
      effort: 'Low',
      impactHoursPerQuarter: Math.round(inputs.manualPdfExcelHoursPerWeek * 10.5),
      rootCause: `Analysts re-key NAV, IRR, TVPI, DPI, and unfunded commitments from ${inputs.custodianPortalCount} portals into a 14-tab workbook.`,
      evidence: opsDocs.length > 0 ? 'Detected in Current-State Operations Memo (Section 3)' : 'Diagnostic input threshold triggered',
      aiIntervention: 'Deploy Accept-All Self-Steering Parser with automatic schema inference & CSV/JSON export.',
    },
    {
      id: 'bn-fee-recon',
      area: 'Unchecked Capital Call Fees & NAV Lag',
      severity: inputs.reconciliationErrorsPerQuarter >= 2 ? 'High' : 'Medium',
      effort: 'Low',
      impactHoursPerQuarter: 36,
      rootCause: 'Capital calls arrive via email without automated cross-checking against prior quarterly letter step-down schedules or master ledger NAVs.',
      evidence: 'Directly mitigates $50,000+ fee overbilling errors and stale Q3-to-Q4 NAV carry-forwards.',
      aiIntervention: 'Automated Cross-Document Discrepancy Checker with pre-wire hold alerts and GP inquiry drafts.',
    },
    {
      id: 'bn-search',
      area: 'Fragmented Email & PDF Knowledge Silos',
      severity: inputs.centralSearchMaturity <= 2 ? 'High' : 'Medium',
      effort: 'Low',
      impactHoursPerQuarter: 48,
      rootCause: `~${inputs.monthlyEmailAttachments} monthly manager communications dispersed across Outlook and nested folders.`,
      evidence: 'Ad-hoc Principal/CIO inquiries take 2–4 hours of manual document hunting.',
      aiIntervention: 'Zero-DB Local Search Index + Split-Pane AI Investment Assistant with verifiable inline citations.',
    },
    {
      id: 'bn-ic-pack',
      area: 'Manual IC Pack & Manager Follow-Up Drafting',
      severity: inputs.quarterlyCloseDays >= 12 ? 'High' : 'Medium',
      effort: 'Medium',
      impactHoursPerQuarter: 44,
      rootCause: `Close cycle spans ${inputs.quarterlyCloseDays} business days; manual synthesis of IC memos and follow-up emails consumes 2+ analyst days per cycle.`,
      evidence: 'Observed across Operations Memo & IC Meeting Notes.',
      aiIntervention: 'One-Click Executive IC Brief Builder, IC Note Debrief Synthesizer, and Follow-Up Draft Studio.',
    },
    {
      id: 'bn-liquidity-radar',
      area: 'Calendar-Based Capital Call & Co-Invest Tracking',
      severity: 'Medium',
      effort: 'Low',
      impactHoursPerQuarter: 24,
      rootCause: 'Mandatory wires and optional co-investments are not continuously modeled against the $3.0M IPS cash floor.',
      evidence: 'Combined Apex call + Helix co-invest risks dipping below minimum reserve without pre-staged SMA trim.',
      aiIntervention: 'Live Capital Call & Liquidity Deadline Radar with automated IPS buffer alerts.',
    },
  ]

  const estimatedQuarterlyHoursRecoverable = bottlenecks.reduce(
    (sum, b) => sum + b.impactHoursPerQuarter,
    0
  )
  const estimatedCloseCompressionDays = Math.max(
    4,
    Math.min(inputs.quarterlyCloseDays - 4, Math.round(inputs.quarterlyCloseDays * 0.58))
  )

  const roadmap: RoadmapPhase[] = [
    {
      phase: 'Days 1–30 (Quick Wins)',
      objective: 'Eliminate manual PDF re-keying and launch verifiable citation-backed Q&A with zero database risk.',
      deliverables: [
        'Deploy browser-native Accept-All ingestion hub for LP letters, capital calls, and custodian CSVs',
        'Activate automated fee-step-down & NAV lag cross-document discrepancy checks before wire approvals',
        'Launch Split-Pane AI Investment Assistant for Principal & CIO instant queries with source highlighting',
      ],
      estimatedHoursSavedPerQuarter: Math.round(estimatedQuarterlyHoursRecoverable * 0.45),
    },
    {
      phase: 'Days 31–60 (Core Automation)',
      objective: 'Compress quarterly close cycle and automate manager follow-ups & liquidity pacing.',
      deliverables: [
        'Roll out One-Click Executive IC Brief & print-ready quarterly board summary generation',
        'Operationalize Capital Call & Liquidity Deadline Radar linked to IPS minimum reserve guardrails',
        'Standardize IC Meeting Debrief Synthesizer with owner tracking and automated GP email drafts',
      ],
      estimatedHoursSavedPerQuarter: Math.round(estimatedQuarterlyHoursRecoverable * 0.35),
    },
    {
      phase: 'Days 61–90 (Executive Intelligence)',
      objective: 'Expand cross-portfolio intelligence, optional private-VPC LLM enrichment, and audit governance.',
      deliverables: [
        'Enable optional Ephemeral BYOK / private enterprise LLM endpoint for deep narrative synthesis',
        'Add automated K-1 tax schedule tracking, wire callback verification workflows, and co-invest scoring',
        'Establish quarterly ROI telemetry verifying close compression from 18 days down to ~7 days',
      ],
      estimatedHoursSavedPerQuarter: Math.round(estimatedQuarterlyHoursRecoverable * 0.2),
    },
  ]

  return {
    overallScore,
    maturityBand,
    estimatedQuarterlyHoursRecoverable,
    estimatedCloseCompressionDays,
    dimensions,
    bottlenecks,
    roadmap,
    evidenceSources: opsDocs.map((d) => d.title),
  }
}

export function exportAssessmentToMarkdown(report: AssessmentReport, inputs: AssessmentInputs): string {
  const lines: string[] = [
    '# Meridian Crest Family Office — Operational Maturity & AI Automation Assessment',
    '',
    `- **Overall Maturity Score:** ${report.overallScore}/100 (${report.maturityBand})`,
    `- **Current Quarterly Close:** ${inputs.quarterlyCloseDays} business days -> **Target:** ~${Math.max(4, inputs.quarterlyCloseDays - report.estimatedCloseCompressionDays)} days (-${report.estimatedCloseCompressionDays} days)`,
    `- **Recoverable Analyst Capacity:** ~${report.estimatedQuarterlyHoursRecoverable} hours / quarter`,
    `- **Evidence Sources Analyzed:** ${report.evidenceSources.length > 0 ? report.evidenceSources.join(', ') : 'Interactive Diagnostic Baseline'}`,
    '',
    '## Maturity Scorecard by Dimension',
    '| Dimension | Score | Status | Key Finding |',
    '| --- | ---: | --- | --- |',
    ...report.dimensions.map((d) => `| ${d.label} | ${d.score}/100 | ${d.status} | ${d.finding} |`),
    '',
    '## Prioritized Bottleneck Heatmap',
    ...report.bottlenecks.map(
      (b) =>
        `- **${b.area}** (Severity: ${b.severity} | Effort: ${b.effort} | Est. Savings: ${b.impactHoursPerQuarter} hrs/qtr)\n  - *Root Cause:* ${b.rootCause}\n  - *AI Intervention:* ${b.aiIntervention}`
    ),
    '',
    '## 30 / 60 / 90-Day Quick-Win AI Automation Roadmap',
    ...report.roadmap.flatMap((phase) => [
      `### ${phase.phase} (~${phase.estimatedHoursSavedPerQuarter} hrs/qtr saved)`,
      `*Objective:* ${phase.objective}`,
      ...phase.deliverables.map((del) => `- ${del}`),
      '',
    ]),
  ]
  return lines.join('\n')
}
