import { describe, expect, it } from 'vitest'
import {
  CHAOS_STRESS_TEST_PAYLOAD,
  INITIAL_ASSESSMENT_INPUTS,
  MERIDIAN_CREST_FIXTURES,
} from '../fixtures/meridianCrestData'
import type { IngestedDocument } from '../types/domain'
import { deriveInputsFromOpsDocs, exportAssessmentToMarkdown, generateAssessmentReport } from './assessmentEngine'
import { answerInvestmentQuery } from './assistantEngine'
import { buildEntityCrossRefMatrix, searchPassages } from './knowledgeIndex'
import {
  buildExecutiveIcBriefMarkdown,
  buildFollowUpEmailDrafts,
  buildLiquidityRadar,
  buildPrintReadyExecutiveHtml,
  exportSummaryToCsv,
  synthesizeMeetingDebrief,
} from './reportGenerator'
import { ingestDocument, runCrossDocumentChecks } from './selfSteeringRouter'

function ingestAllFixtures(): IngestedDocument[] {
  const docs: IngestedDocument[] = []
  for (const fx of MERIDIAN_CREST_FIXTURES) {
    const res = ingestDocument(
      {
        rawContent: fx.content,
        fileName: fx.fileName,
        title: fx.title,
        formatHint: fx.format,
      },
      docs
    )
    docs.push(res.document)
  }
  return docs
}

describe('Meridian Crest Self-Steering Engine', () => {
  it('classifies and extracts structured metrics from all 8 synthetic documents', () => {
    const docs = ingestAllFixtures()
    expect(docs).toHaveLength(8)

    const apexLetter = docs.find((d) => d.fileName === 'apex-horizon-iv-q4-letter.txt')
    expect(apexLetter).toBeDefined()
    expect(apexLetter?.docType).toBe('quarterly_letter')
    expect(apexLetter?.fundName).toBe('Apex Horizon Private Equity Fund IV')
    expect(apexLetter?.metrics.navMillions).toBe(18.4)
    expect(apexLetter?.metrics.netIrrPct).toBe(16.8)
    expect(apexLetter?.metrics.tvpi).toBe(1.42)
    expect(apexLetter?.metrics.unfundedMillions).toBe(6.2)
    expect(apexLetter?.metrics.scheduledFeeAmount).toBe(185000)
    expect(apexLetter?.confidenceTier).toBe('High')

    const vanguardia = docs.find((d) => d.fileName === 'vanguardia-growth-ii-q4-update.md')
    expect(vanguardia?.docType).toBe('quarterly_letter')
    expect(vanguardia?.metrics.navMillions).toBe(9.1)
    expect(vanguardia?.metrics.netIrrPct).toBe(22.4)
    expect(vanguardia?.metrics.coInvestAmount).toBe(750000)
    expect(vanguardia?.metrics.dueInDays).toBe(14)

    const capCall = docs.find((d) => d.fileName === 'apex-horizon-iv-capital-call.eml')
    expect(capCall?.docType).toBe('capital_call')
    expect(capCall?.metrics.capitalCallAmount).toBe(1250000)
    expect(capCall?.metrics.managementFeeAmount).toBe(235000)

    const crestlineDist = docs.find((d) => d.fileName === 'crestline-re-iii-q4-distribution.txt')
    expect(crestlineDist?.docType).toBe('distribution_notice')
    expect(crestlineDist?.metrics.navMillions).toBe(14.2)
    expect(crestlineDist?.metrics.netIrrPct).toBe(10.9)

    const csv = docs.find((d) => d.fileName === 'meridian-crest-portfolio-snapshot.csv')
    expect(csv?.docType).toBe('portfolio_csv')
    expect(csv?.portfolioRows?.length).toBe(6)
    expect(csv?.metrics.cashLiquidityMillions).toBe(4.8)
  })

  it('automatically catches the $50,000 fee discrepancy, stale NAV lag, and IPS liquidity floor risk', () => {
    const docs = ingestAllFixtures()
    const anomalies = runCrossDocumentChecks(docs)

    const feeAnomaly = anomalies.find((a) => /management fee discrepancy/i.test(a.title))
    expect(feeAnomaly).toBeDefined()
    expect(feeAnomaly?.severity).toBe('Critical')
    expect(feeAnomaly?.deltaLabel).toContain('$50,000')

    const navAnomaly = anomalies.find((a) => /stale portfolio ledger nav/i.test(a.title))
    expect(navAnomaly).toBeDefined()
    expect(navAnomaly?.deltaLabel).toContain('$0.5M')

    const floorAnomaly = anomalies.find((a) => /ips floor/i.test(a.title))
    expect(floorAnomaly).toBeDefined()
  })

  it('handles malformed mixed-format chaos input without crashing and assigns honest lower confidence', () => {
    const docs = ingestAllFixtures()
    const chaosRes = ingestDocument(
      {
        rawContent: CHAOS_STRESS_TEST_PAYLOAD.content,
        fileName: CHAOS_STRESS_TEST_PAYLOAD.fileName,
        title: CHAOS_STRESS_TEST_PAYLOAD.title,
      },
      docs
    )

    expect(chaosRes.document.docType).toBe('mixed_chaos')
    expect(chaosRes.document.usedFallbackParser).toBe(true)
    expect(chaosRes.document.confidenceScore).toBeLessThan(70)
    expect(chaosRes.document.parseWarnings.length).toBeGreaterThan(0)
    expect(chaosRes.traceRun.events.some((e) => e.stage === 'FALLBACK')).toBe(true)

    const wireFraud = chaosRes.anomalies.find((a) => /bank instruction/i.test(a.title))
    const irrConflict = chaosRes.anomalies.find((a) => /internal metric conflict/i.test(a.title))
    expect(wireFraud).toBeDefined()
    expect(irrConflict).toBeDefined()
  })

  it('retrieves passages with accurate offsets and answers multi-document assistant queries with citations', async () => {
    const docs = ingestAllFixtures()
    const anomalies = runCrossDocumentChecks(docs)

    const hits = searchPassages(docs, 'unfunded commitment Apex Horizon', {}, 5)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].chunk.endOffset).toBeGreaterThan(hits[0].chunk.startOffset)

    const matrix = buildEntityCrossRefMatrix(docs)
    expect(matrix.some((row) => row.entity.includes('Apex Horizon'))).toBe(true)

    const reply = await answerInvestmentQuery(
      'Can our current cash cover upcoming capital calls, and are there any fund anomalies?',
      docs,
      anomalies
    )
    expect(reply.citations.length).toBeGreaterThanOrEqual(2)
    expect(reply.content).toContain('$4.8M')
    expect(reply.content).toContain('$50,000')
    expect(reply.content).toContain('[1]')
  })

  it('generates workflow assessment scorecards, executive briefs, email drafts, liquidity radar, and exports', () => {
    const docs = ingestAllFixtures()
    const anomalies = runCrossDocumentChecks(docs)
    const derivedInputs = deriveInputsFromOpsDocs(INITIAL_ASSESSMENT_INPUTS, docs)
    const assessment = generateAssessmentReport(derivedInputs, docs)

    expect(assessment.overallScore).toBeGreaterThan(0)
    expect(assessment.overallScore).toBeLessThan(65)
    expect(assessment.bottlenecks.length).toBeGreaterThanOrEqual(4)
    expect(assessment.roadmap).toHaveLength(3)
    expect(exportAssessmentToMarkdown(assessment, derivedInputs)).toContain('30 / 60 / 90-Day')

    const allActions = docs.flatMap((d) => d.actionItems)
    const brief = buildExecutiveIcBriefMarkdown(docs, anomalies, allActions)
    expect(brief).toContain('MERIDIAN CREST FAMILY OFFICE')
    expect(brief).toContain('Management Fee Discrepancy')

    const drafts = buildFollowUpEmailDrafts(docs, anomalies)
    expect(drafts.some((d) => d.subject.includes('$50,000'))).toBe(true)

    const icDoc = docs.find((d) => d.docType === 'ic_meeting_notes')
    const debrief = synthesizeMeetingDebrief(icDoc?.rawContent ?? '')
    expect(debrief.ownersAndActions.length).toBeGreaterThan(0)

    const radar = buildLiquidityRadar(docs)
    expect(radar.availableCashM).toBe(4.8)
    expect(radar.events.length).toBeGreaterThanOrEqual(2)

    const csvOut = exportSummaryToCsv(docs)
    expect(csvOut.split('\n').length).toBe(9)

    const htmlOut = buildPrintReadyExecutiveHtml('Executive IC Brief', brief)
    expect(htmlOut).toContain('<!doctype html>')
  })
})
