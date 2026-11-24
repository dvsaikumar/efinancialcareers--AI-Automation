import type {
  AnomalyFlag,
  AssistantMessage,
  ByokConfig,
  Citation,
  IngestedDocument,
} from '../types/domain'
import { buildCitationsFromHits, searchPassages } from './knowledgeIndex'

export const EXECUTIVE_PROMPTS: string[] = [
  'Can our current cash cover upcoming capital calls, and are there any fund anomalies?',
  'What is our total unfunded commitment across Private Equity and Venture funds?',
  'Summarize Q4 performance, risks, and exit delays for Apex Horizon IV.',
  'What action is required on Vanguardia Growth II co-investment and what is the deadline?',
  'What operational bottlenecks are slowing down our quarterly close?',
]

function makeMsgId(): string {
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function findBestCitationForDoc(doc: IngestedDocument, keywords: RegExp): Citation | null {
  const matchingChunk = doc.chunks.find((c) => keywords.test(c.text)) ?? doc.chunks[0]
  if (!matchingChunk) return null
  return {
    index: 0,
    docId: doc.id,
    docTitle: doc.title,
    fundName: doc.fundName,
    excerpt: matchingChunk.text.slice(0, 320),
    startOffset: matchingChunk.startOffset,
    endOffset: matchingChunk.endOffset,
    lineStart: matchingChunk.lineStart,
    lineEnd: matchingChunk.lineEnd,
    confidence: doc.confidenceTier,
    score: 10,
  }
}

function addUniqueCitation(list: Citation[], candidate: Citation | null): number | null {
  if (!candidate) return null
  const existing = list.find(
    (c) => c.docId === candidate.docId && c.startOffset === candidate.startOffset
  )
  if (existing) return existing.index
  const nextIdx = list.length + 1
  list.push({ ...candidate, index: nextIdx })
  return nextIdx
}

async function callEphemeralByok(
  query: string,
  citations: Citation[],
  byok: ByokConfig
): Promise<string | null> {
  if (!byok.enabled || !byok.apiKey.trim() || !byok.endpoint.trim()) return null

  const contextBlock = citations
    .map((c) => `[${c.index}] ${c.docTitle} (Lines ${c.lineStart}-${c.lineEnd}):\n${c.excerpt}`)
    .join('\n\n')

  try {
    const response = await fetch(byok.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${byok.apiKey}`,
      },
      body: JSON.stringify({
        model: byok.model || 'gpt-4o-mini',
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content:
              'You are Meridian Crest AI, an institutional family office investment analyst. Answer concisely using ONLY the provided numbered sources. Cite claims inline as [1], [2], etc.',
          },
          {
            role: 'user',
            content: `Question: ${query}\n\nSources:\n${contextBlock}`,
          },
        ],
      }),
    })
    if (!response.ok) return null
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

export async function answerInvestmentQuery(
  query: string,
  documents: IngestedDocument[],
  anomalies: AnomalyFlag[],
  byok?: ByokConfig
): Promise<AssistantMessage> {
  if (documents.length === 0) {
    return {
      id: makeMsgId(),
      role: 'assistant',
      content:
        'Your local knowledge index is currently empty. Drop documents in the **Command & Accept-All Hub** or click any **Guided Demo Scenario** above to ingest Meridian Crest Family Office data.',
      timestamp: new Date().toISOString(),
      citations: [],
      mode: 'local-deterministic',
      confidence: 'High',
    }
  }

  const lower = query.toLowerCase()
  const hits = searchPassages(documents, query, {}, 6)
  const citations: Citation[] = []

  const csvDoc = documents.find((d) => d.docType === 'portfolio_csv')
  const apexLetter = documents.find(
    (d) => d.docType === 'quarterly_letter' && /apex horizon/i.test(d.fundName ?? d.title)
  )
  const apexCall = documents.find(
    (d) => d.docType === 'capital_call' && /apex horizon/i.test(d.fundName ?? d.title)
  )
  const vanguardiaLetter = documents.find(
    (d) => d.docType === 'quarterly_letter' && /vanguardia/i.test(d.fundName ?? d.title)
  )
  const icNotes = documents.find((d) => d.docType === 'ic_meeting_notes')
  const opsMemo = documents.find((d) => d.docType === 'workflow_ops_memo')

  const paragraphs: string[] = []
  const relatedAnomalies: string[] = []

  const asksCashOrCalls = /cash|liquidity|cover|capital call|wire|floor|reserve/.test(lower)
  const asksAnomalies = /anomal|discrepanc|error|fee|variance|conflict|flag/.test(lower)
  const asksUnfunded = /unfunded|commitment|pe\b|private equity|venture/.test(lower)
  const asksApex = /apex|northstar|q4 performance|solara/.test(lower)
  const asksVanguardia = /vanguardia|helix|co-invest|deadline/.test(lower)
  const asksOps = /bottleneck|close|operations|manual|pdf-to-excel/.test(lower)

  if (asksCashOrCalls || asksAnomalies) {
    const cashM = csvDoc?.metrics.cashLiquidityMillions ?? icNotes?.metrics.cashLiquidityMillions ?? 4.8
    const floorM = icNotes?.metrics.liquidityFloorMillions ?? 3.0
    const deployableM = Number((cashM - floorM).toFixed(2))
    const apexCallM = (apexCall?.metrics.capitalCallAmount ?? 1_250_000) / 1_000_000
    const correctedApexM = 1.2
    const coInvestM = (vanguardiaLetter?.metrics.coInvestAmount ?? 750_000) / 1_000_000

    const cCash = addUniqueCitation(
      citations,
      csvDoc ? findBestCitationForDoc(csvDoc, /cash|treasury|4\.8/i) : icNotes ? findBestCitationForDoc(icNotes, /4\.8m|3\.0m/i) : null
    )
    const cCall = addUniqueCitation(
      citations,
      apexCall ? findBestCitationForDoc(apexCall, /1,250,000|235,000|wire/i) : null
    )
    const cFloor = addUniqueCitation(
      citations,
      icNotes ? findBestCitationForDoc(icNotes, /3\.0m|ips|floor|rebalance/i) : null
    )

    paragraphs.push(
      `**Liquidity Coverage Assessment:** Meridian Crest holds **$${cashM.toFixed(1)}M** in immediate Cash & T-Bills${
        cCash ? ` [${cCash}]` : ''
      }, subject to a hard **$3.0M IPS minimum liquidity floor**${
        cFloor ? ` [${cFloor}]` : ''
      } — leaving **$${deployableM.toFixed(2)}M** in freely deployable cash before any equity rebalance. Current cash easily covers the mandatory **Apex Horizon IV** capital call (**$${apexCallM.toFixed(
        2
      )}M** billed; **$${correctedApexM.toFixed(2)}M** expected post-fee correction)${
        cCall ? ` [${cCall}]` : ''
      }, leaving **$${(cashM - correctedApexM).toFixed(2)}M** on hand.`
    )

    if (vanguardiaLetter) {
      const cVan = addUniqueCitation(
        citations,
        findBestCitationForDoc(vanguardiaLetter, /750,000|co-invest|14 days/i)
      )
      paragraphs.push(
        `**Co-Investment Buffer Constraint:** If the Investment Committee also elects the optional **$750,000 Helix Compute co-investment** via Vanguardia II (due in 14 days)${
          cVan ? ` [${cVan}]` : ''
        }, cash would fall to **$${(cashM - correctedApexM - coInvestM).toFixed(
          2
        )}M** — **$150,000 below** the $3.0M IPS reserve floor. Pre-staging a **$500K trim** from the T+1 liquid Global Quality Dividend Equities SMA keeps post-funding reserves safely above **$3.35M**${
          cFloor ? ` [${cFloor}]` : ''
        }.`
      )
    }

    if (anomalies.length > 0) {
      const cLetterFee = addUniqueCitation(
        citations,
        apexLetter ? findBestCitationForDoc(apexLetter, /185,000|step-down|schedule b/i) : null
      )
      const feeAnom = anomalies.find((a) => /fee/i.test(a.title))
      const navAnom = anomalies.find((a) => /nav/i.test(a.title))

      const bulletLines: string[] = ['**Detected Cross-Document Anomalies:**']
      if (feeAnom) {
        relatedAnomalies.push(feeAnom.id)
        bulletLines.push(
          `- **Critical ($50,000 Fee Overbilling):** Apex Horizon IV Capital Call #14 bills **$235,000** at the legacy 2.00% fee rate${
            cCall ? ` [${cCall}]` : ''
          }, contradicting the Q4 Quarterly Letter Schedule B step-down to **$185,000**${
            cLetterFee ? ` [${cLetterFee}]` : ''
          }. Hold wire authorization pending a corrected $1,200,000 notice.`
        )
      }
      if (navAnom) {
        relatedAnomalies.push(navAnom.id)
        const cApexNav = addUniqueCitation(
          citations,
          apexLetter ? findBestCitationForDoc(apexLetter, /18\.4m|ending nav/i) : null
        )
        bulletLines.push(
          `- **Warning ($0.5M Stale NAV Lag):** The portfolio CSV carries Apex Horizon IV at **$17.9M** (Q3 carry-forward)${
            cCash ? ` [${cCash}]` : ''
          } versus **$18.4M** reported in the Q4 Quarterly Letter${cApexNav ? ` [${cApexNav}]` : ''}.`
        )
      }
      for (const other of anomalies.filter((a) => a !== feeAnom && a !== navAnom).slice(0, 2)) {
        relatedAnomalies.push(other.id)
        bulletLines.push(`- **${other.severity} (${other.deltaLabel ?? other.title}):** ${other.summary}`)
      }
      paragraphs.push(bulletLines.join('\n'))
    }
  } else if (asksUnfunded) {
    const cApex = addUniqueCitation(citations, apexLetter ? findBestCitationForDoc(apexLetter, /unfunded|6\.2m/i) : null)
    const cVan = addUniqueCitation(citations, vanguardiaLetter ? findBestCitationForDoc(vanguardiaLetter, /unfunded|4\.2m/i) : null)
    const cCsv = addUniqueCitation(citations, csvDoc ? findBestCitationForDoc(csvDoc, /crestline|unfunded|6\.2/i) : null)

    const peUnfunded = apexLetter?.metrics.unfundedMillions ?? 6.2
    const vcUnfunded = vanguardiaLetter?.metrics.unfundedMillions ?? 4.2
    const reRow = csvDoc?.portfolioRows?.find((r) => r.assetClass === 'Real Estate')
    const reUnfunded = reRow?.unfundedMillions ?? 2.1

    paragraphs.push(
      `**Unfunded Commitment Rollup:** Across active Private Equity and Venture Capital funds, Meridian Crest carries **$${(
        peUnfunded + vcUnfunded
      ).toFixed(1)}M** in unfunded commitments (**$${(peUnfunded + vcUnfunded + reUnfunded).toFixed(
        1
      )}M** including Real Estate):`
    )
    paragraphs.push(
      `- **Apex Horizon PE Fund IV (Private Equity):** **$${peUnfunded.toFixed(1)}M** unfunded (75.2% called on $25.0M commitment)${
        cApex ? ` [${cApex}]` : ''
      }\n- **Vanguardia Growth Venture Fund II (Venture Capital):** **$${vcUnfunded.toFixed(
        1
      )}M** unfunded (72.0% called on $15.0M commitment)${
        cVan ? ` [${cVan}]` : ''
      }\n- **Crestline Core Plus Real Estate III (Real Estate):** **$${reUnfunded.toFixed(1)}M** unfunded${
        cCsv ? ` [${cCsv}]` : ''
      }`
    )
  } else if (asksApex && apexLetter) {
    const cPerf = addUniqueCitation(citations, findBestCitationForDoc(apexLetter, /18\.4m|16\.8%|1\.42x/i))
    const cRisk = addUniqueCitation(citations, findBestCitationForDoc(apexLetter, /northstar|delay|refinancing/i))
    const cFee = addUniqueCitation(citations, findBestCitationForDoc(apexLetter, /185,000|step-down/i))

    paragraphs.push(
      `**Apex Horizon Private Equity Fund IV — Q4 2026 Summary:** Ending LP NAV rose to **$18.4M** (from $17.9M in Q3) with **16.8% Net IRR**, **1.42x TVPI**, **0.38x DPI**, and **$6.2M** unfunded commitment${
        cPerf ? ` [${cPerf}]` : ''
      }. Operating EBITDA across the 11 platform companies grew +14.2% YoY, led by Solara MedTech (+24% revenue) and Harborline Industrial (+280 bps margin).`
    )
    paragraphs.push(
      `**Key Risks & Exit Delays:** The planned Q1 2027 sale of **Northstar Logistics** (16% of NAV) was pushed **two quarters to Q3 2027** due to debt-financing spreads, deferring H1 LP distributions${
        cRisk ? ` [${cRisk}]` : ''
      }. Two smaller holdings also face a late-2027 refinancing wall (75% hedged). Additionally, Schedule B sets the Q1 2027 management fee at **$185,000**${
        cFee ? ` [${cFee}]` : ''
      } — creating a **$50,000 conflict** with Capital Call Notice #14 ($235,000 billed).`
    )
  } else if (asksVanguardia && vanguardiaLetter) {
    const cPerf = addUniqueCitation(citations, findBestCitationForDoc(vanguardiaLetter, /9\.1m|22\.4%|1\.65x/i))
    const cCo = addUniqueCitation(citations, findBestCitationForDoc(vanguardiaLetter, /750,000|14 days|helix compute/i))
    const cIc = addUniqueCitation(citations, icNotes ? findBestCitationForDoc(icNotes, /helix|rebalance|500k/i) : null)

    paragraphs.push(
      `**Vanguardia Growth Venture Fund II — Action & Performance Brief:** Fund II posted **$9.1M NAV**, **22.4% Net IRR**, and **1.65x TVPI**, driven by Helix Compute's 2.8x Series B markup and Veridian AI's 146% NDR${
        cPerf ? ` [${cPerf}]` : ''
      }.`
    )
    paragraphs.push(
      `**Required Decision:** Meridian Crest has been offered a **$750,000 SPV co-investment** in Helix Compute's Series C extension (0% management fee / 10% carry) with a **binding election deadline in 14 days (February 15, 2027)**${
        cCo ? ` [${cCo}]` : ''
      }. Per IC notes, electing YES requires pre-staging a **$500K Public Equities SMA trim** by Feb 9 to preserve the $3.0M IPS cash floor${
        cIc ? ` [${cIc}]` : ''
      }.`
    )
  } else if (asksOps && opsMemo) {
    const cOps1 = addUniqueCitation(citations, findBestCitationForDoc(opsMemo, /18-business-day|4 separate custodian/i))
    const cOps2 = addUniqueCitation(citations, findBestCitationForDoc(opsMemo, /16 hours per week|reconciliation errors/i))

    paragraphs.push(
      `**Operational Bottlenecks Slowing Quarterly Close:** Meridian Crest's quarterly close currently takes **18 business days** across **4 disconnected custodian/admin portals** and ~**85 monthly manager emails/PDFs**${
        cOps1 ? ` [${cOps1}]` : ''
      }.`
    )
    paragraphs.push(
      `Primary friction points include **16 hrs/week of manual PDF-to-Excel re-keying**, **3–4 quarterly reconciliation errors** from unchecked capital call fee notices, and **2–4 hours per ad-hoc Principal inquiry** due to zero centralized search${
        cOps2 ? ` [${cOps2}]` : ''
      }.`
    )
  } else {
    // General fallback synthesis grounded directly in BM25 search hits
    const topCitations = buildCitationsFromHits(hits, 4)
    citations.push(...topCitations)
    if (topCitations.length === 0) {
      paragraphs.push(
        `No direct passage matches were found for "${query}" across the ${documents.length} ingested document(s). Try querying fund names (Apex Horizon IV, Vanguardia II), cash/liquidity, unfunded commitments, or operational bottlenecks.`
      )
    } else {
      paragraphs.push(
        `Based on **${topCitations.length} matched passage(s)** across your local knowledge index, here is the grounded synthesis:`
      )
      for (const c of topCitations) {
        const snippet = c.excerpt.replace(/\s+/g, ' ').slice(0, 190)
        paragraphs.push(`- **${c.docTitle}:** "${snippet}..." [${c.index}]`)
      }
    }
  }

  // Ensure citations are always populated from hits if empty
  if (citations.length === 0 && hits.length > 0) {
    citations.push(...buildCitationsFromHits(hits, 3))
  }

  // Optional Ephemeral BYOK enhancement if user provided an in-memory key
  if (byok?.enabled && byok.apiKey.trim()) {
    const llmReply = await callEphemeralByok(query, citations, byok)
    if (llmReply) {
      return {
        id: makeMsgId(),
        role: 'assistant',
        content: llmReply,
        timestamp: new Date().toISOString(),
        citations,
        mode: 'byok-ephemeral',
        confidence: citations.some((c) => c.confidence === 'Low') ? 'Medium' : 'High',
        relatedAnomalies,
      }
    }
  }

  const lowestConf = citations.some((c) => c.confidence === 'Low')
    ? 'Low'
    : citations.some((c) => c.confidence === 'Medium')
      ? 'Medium'
      : 'High'

  return {
    id: makeMsgId(),
    role: 'assistant',
    content: paragraphs.join('\n\n'),
    timestamp: new Date().toISOString(),
    citations,
    mode: 'local-deterministic',
    confidence: lowestConf,
    relatedAnomalies,
  }
}
