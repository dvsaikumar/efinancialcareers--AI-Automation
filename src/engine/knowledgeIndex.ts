import type {
  AssetClass,
  Citation,
  DocumentChunk,
  DocumentType,
  IngestedDocument,
} from '../types/domain'

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'this', 'that', 'these',
  'those', 'our', 'we', 'us', 'it', 'its', 'as', 'if', 'about', 'what', 'which', 'who',
  'any', 'all', 'there', 'their', 'into', 'than', 'then', 'how', 'when', 'where',
])

export interface SearchFilters {
  assetClass?: AssetClass | 'ALL'
  fundName?: string | 'ALL'
  docType?: DocumentType | 'ALL'
  onlyWithRisks?: boolean
  onlyActionRequired?: boolean
}

export interface SearchHit {
  chunk: DocumentChunk
  document: IngestedDocument
  score: number
  matchedTerms: string[]
}

export interface EntityCrossRefRow {
  entity: string
  category: 'Fund' | 'Portfolio Company' | 'Risk / Governance'
  documentIds: string[]
  documentTitles: string[]
  mentionCount: number
}

export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9$.%-]+/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ''))
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t))
}

function fuzzyMatchTerm(queryToken: string, docTokens: string[]): number {
  if (docTokens.includes(queryToken)) return 1.0
  // Prefix / stem match
  if (queryToken.length >= 4) {
    const stem = queryToken.slice(0, -1)
    if (docTokens.some((t) => t.startsWith(stem) || queryToken.startsWith(t.slice(0, Math.max(4, t.length - 1))))) {
      return 0.72
    }
  }
  return 0
}

export function searchPassages(
  documents: IngestedDocument[],
  query: string,
  filters: SearchFilters = {},
  topK = 8
): SearchHit[] {
  const filteredDocs = documents.filter((doc) => {
    if (filters.assetClass && filters.assetClass !== 'ALL' && doc.assetClass !== filters.assetClass) return false
    if (filters.docType && filters.docType !== 'ALL' && doc.docType !== filters.docType) return false
    if (filters.fundName && filters.fundName !== 'ALL') {
      const target = filters.fundName.toLowerCase()
      const matchesFund =
        doc.fundName?.toLowerCase() === target ||
        doc.entities.some((e) => e.toLowerCase() === target) ||
        doc.rawContent.toLowerCase().includes(target.split(' ').slice(0, 2).join(' '))
      if (!matchesFund) return false
    }
    if (filters.onlyWithRisks && doc.risks.length === 0) return false
    if (filters.onlyActionRequired && doc.actionItems.length === 0) return false
    return true
  })

  const allChunks: Array<{ chunk: DocumentChunk; doc: IngestedDocument; tokens: string[] }> = []
  for (const doc of filteredDocs) {
    for (const chunk of doc.chunks) {
      allChunks.push({
        chunk,
        doc,
        tokens: tokenize(`${doc.title} ${doc.fundName ?? ''} ${chunk.text}`),
      })
    }
  }

  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return filteredDocs.slice(0, topK).map((doc) => ({
      chunk: doc.chunks[0],
      document: doc,
      score: 1,
      matchedTerms: [],
    }))
  }

  const queryTokens = tokenize(trimmedQuery)
  if (queryTokens.length === 0) return []

  const totalChunks = Math.max(1, allChunks.length)
  const docFreq = new Map<string, number>()
  for (const qt of queryTokens) {
    let df = 0
    for (const entry of allChunks) {
      if (fuzzyMatchTerm(qt, entry.tokens) > 0) df++
    }
    docFreq.set(qt, df)
  }

  const hits: SearchHit[] = []
  const avgLen = allChunks.reduce((acc, c) => acc + c.tokens.length, 0) / totalChunks || 30

  for (const entry of allChunks) {
    let bm25Score = 0
    const matchedTerms: string[] = []
    const lenNorm = 1 - 0.5 + 0.5 * (entry.tokens.length / avgLen)

    for (const qt of queryTokens) {
      const df = docFreq.get(qt) ?? 0
      if (df === 0) continue
      let tf = 0
      for (const dt of entry.tokens) {
        if (dt === qt) tf += 1
        else if (qt.length >= 4 && (dt.startsWith(qt.slice(0, -1)) || qt.startsWith(dt))) tf += 0.6
      }
      if (tf > 0) {
        const idf = Math.log(1 + (totalChunks - df + 0.5) / (df + 0.5))
        bm25Score += idf * ((tf * 2.2) / (tf + 1.2 * lenNorm))
        matchedTerms.push(qt)
      }
    }

    // Bonus for exact phrase match
    if (entry.chunk.text.toLowerCase().includes(trimmedQuery.toLowerCase())) {
      bm25Score += 2.5
    }

    if (bm25Score > 0) {
      hits.push({
        chunk: entry.chunk,
        document: entry.doc,
        score: Number(bm25Score.toFixed(3)),
        matchedTerms: Array.from(new Set(matchedTerms)),
      })
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, topK)
}

export function buildCitationsFromHits(hits: SearchHit[], limit = 4): Citation[] {
  const seenChunks = new Set<string>()
  const citations: Citation[] = []

  for (const hit of hits) {
    if (seenChunks.has(hit.chunk.id)) continue
    seenChunks.add(hit.chunk.id)
    citations.push({
      index: citations.length + 1,
      docId: hit.document.id,
      docTitle: hit.document.title,
      fundName: hit.document.fundName,
      excerpt: hit.chunk.text.slice(0, 320),
      startOffset: hit.chunk.startOffset,
      endOffset: hit.chunk.endOffset,
      lineStart: hit.chunk.lineStart,
      lineEnd: hit.chunk.lineEnd,
      confidence: hit.document.confidenceTier,
      score: hit.score,
    })
    if (citations.length >= limit) break
  }

  return citations
}

export function buildEntityCrossRefMatrix(documents: IngestedDocument[]): EntityCrossRefRow[] {
  const trackedEntities: Array<{ name: string; pattern: RegExp; category: EntityCrossRefRow['category'] }> = [
    { name: 'Apex Horizon Private Equity Fund IV', pattern: /apex\s+horizon/i, category: 'Fund' },
    { name: 'Vanguardia Growth Venture Fund II', pattern: /vanguardia/i, category: 'Fund' },
    { name: 'Crestline Core Plus Real Estate III', pattern: /crestline/i, category: 'Fund' },
    { name: 'Bridge Credit Opportunity Fund III', pattern: /bridge\s+credit/i, category: 'Fund' },
    { name: 'Helix Compute (Co-Invest)', pattern: /helix\s+compute/i, category: 'Portfolio Company' },
    { name: 'Northstar Logistics (Exit Delay)', pattern: /northstar\s+logistics/i, category: 'Portfolio Company' },
    { name: 'Solara MedTech Systems', pattern: /solara\s+medtech/i, category: 'Portfolio Company' },
    { name: 'Management Fee Step-Down / Audit', pattern: /management\s+fee|185,000|235,000|fee\s+error/i, category: 'Risk / Governance' },
    { name: 'IPS $3.0M Liquidity Floor', pattern: /3\.0m|liquidity\s+floor|cash\s+reserve/i, category: 'Risk / Governance' },
    { name: 'Manual PDF-to-Excel Close Latency', pattern: /pdf-to-excel|18(?:-business)?-?day|re-keying/i, category: 'Risk / Governance' },
  ]

  const rows: EntityCrossRefRow[] = []
  for (const item of trackedEntities) {
    const matchingDocs = documents.filter((d) => item.pattern.test(d.rawContent))
    if (matchingDocs.length > 0) {
      let totalMentions = 0
      for (const doc of matchingDocs) {
        const gPattern = new RegExp(item.pattern.source, 'gi')
        totalMentions += (doc.rawContent.match(gPattern) ?? []).length
      }
      rows.push({
        entity: item.name,
        category: item.category,
        documentIds: matchingDocs.map((d) => d.id),
        documentTitles: matchingDocs.map((d) => d.title),
        mentionCount: totalMentions,
      })
    }
  }

  return rows.sort((a, b) => b.documentIds.length - a.documentIds.length || b.mentionCount - a.mentionCount)
}

export function getFacetSummary(documents: IngestedDocument[]) {
  const assetClasses = new Map<AssetClass, number>()
  const docTypes = new Map<DocumentType, number>()
  const funds = new Set<string>()

  for (const doc of documents) {
    assetClasses.set(doc.assetClass, (assetClasses.get(doc.assetClass) ?? 0) + 1)
    docTypes.set(doc.docType, (docTypes.get(doc.docType) ?? 0) + 1)
    if (doc.fundName) funds.add(doc.fundName)
    for (const ent of doc.entities) {
      if (/fund|real estate|credit/i.test(ent)) funds.add(ent)
    }
  }

  return {
    assetClasses: Array.from(assetClasses.entries()),
    docTypes: Array.from(docTypes.entries()),
    funds: Array.from(funds).sort(),
  }
}
