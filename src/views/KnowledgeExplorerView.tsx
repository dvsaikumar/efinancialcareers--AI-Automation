import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Eye,
  Filter,
  Network,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import {
  buildEntityCrossRefMatrix,
  getFacetSummary,
  searchPassages,
} from '../engine/knowledgeIndex'
import { useWorkspace } from '../store/workspaceHelpers'
import type { AssetClass, DocumentType } from '../types/domain'

export function KnowledgeExplorerView() {
  const {
    documents,
    anomalies,
    setInspectedDocId,
    loadAllMeridianFixtures,
  } = useWorkspace()

  const [query, setQuery] = useState('')
  const [assetClass, setAssetClass] = useState<AssetClass | 'ALL'>('ALL')
  const [docType, setDocType] = useState<DocumentType | 'ALL'>('ALL')
  const [fundName, setFundName] = useState<string>('ALL')
  const [onlyWithRisks, setOnlyWithRisks] = useState(false)
  const [onlyActionRequired, setOnlyActionRequired] = useState(false)

  const facets = useMemo(() => getFacetSummary(documents), [documents])

  const hits = useMemo(
    () =>
      searchPassages(
        documents,
        query,
        {
          assetClass,
          docType,
          fundName,
          onlyWithRisks,
          onlyActionRequired,
        },
        15
      ),
    [documents, query, assetClass, docType, fundName, onlyWithRisks, onlyActionRequired]
  )

  const entityMatrix = useMemo(() => buildEntityCrossRefMatrix(documents), [documents])

  return (
    <div className="space-y-6">
      <div className="institutional-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
            Requirement 3 • Centralized No-DB Knowledge System
          </span>
          <h2 className="text-xl font-semibold text-slate-950 mt-0.5">
            Instant Full-Text Search, Entity Matrix & Discrepancy Radar
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Client-side BM25 passage retrieval, faceted filtering across asset classes and funds, automatic entity cross-referencing, and real-time conflict radar — running entirely in browser memory.
          </p>
        </div>
        {documents.length === 0 && (
          <button
            type="button"
            onClick={loadAllMeridianFixtures}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B1626] text-white hover:bg-slate-800 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Load Meridian Crest Vault
          </button>
        )}
      </div>

      {/* Search & Faceted Filters Bar */}
      <div className="institutional-card p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Instant full-text search across all indexed passages (e.g., 'management fee', 'Northstar exit', 'unfunded', 'Helix Compute', '$3.0M')..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            Facets:
          </span>

          <select
            value={assetClass}
            onChange={(e) => setAssetClass(e.target.value as AssetClass | 'ALL')}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs"
          >
            <option value="ALL">All Asset Classes ({documents.length})</option>
            {facets.assetClasses.map(([ac, count]) => (
              <option key={ac} value={ac}>
                {ac} ({count})
              </option>
            ))}
          </select>

          <select
            value={fundName}
            onChange={(e) => setFundName(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs"
          >
            <option value="ALL">All Funds & Vehicles</option>
            {facets.funds.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType | 'ALL')}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs"
          >
            <option value="ALL">All Document Types</option>
            {facets.docTypes.map(([dt, count]) => (
              <option key={dt} value={dt}>
                {dt.replace(/_/g, ' ')} ({count})
              </option>
            ))}
          </select>

          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyWithRisks}
              onChange={(e) => setOnlyWithRisks(e.target.checked)}
              className="accent-rose-700"
            />
            <span>Risk Flagged</span>
          </label>

          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyActionRequired}
              onChange={(e) => setOnlyActionRequired(e.target.checked)}
              className="accent-emerald-700"
            />
            <span>Action Required</span>
          </label>
        </div>
      </div>

      {/* Main Split: Search Results + Discrepancy Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 institutional-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Matched Knowledge Passages ({hits.length})
            </h3>
            <span className="text-[11px] font-mono-num text-slate-500">BM25 Local Index</span>
          </div>

          {hits.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No passages matched your current search or filter criteria.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 max-h-[520px] overflow-y-auto">
              {hits.map((hit) => (
                <div key={hit.chunk.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-950">
                          {hit.document.title}
                        </span>
                        <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          Lines {hit.chunk.lineStart}–{hit.chunk.lineEnd}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {hit.document.assetClass}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1.5 leading-relaxed line-clamp-3 font-mono-num bg-slate-50/80 p-2 rounded border border-slate-100">
                        {hit.chunk.text}
                      </p>
                      {hit.matchedTerms.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-slate-400">Matched:</span>
                          {hit.matchedTerms.map((term) => (
                            <span
                              key={term}
                              className="text-[10px] font-mono-num px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectedDocId(hit.document.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shrink-0"
                    >
                      <Eye className="w-3 h-3" />
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discrepancy & Alert Radar */}
        <div className="lg:col-span-5 institutional-card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Discrepancy & Alert Radar ({anomalies.length})
            </h3>
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[520px]">
            {anomalies.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                Zero cross-document conflicts detected across the current vault.
              </p>
            ) : (
              anomalies.map((anom) => (
                <div
                  key={anom.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-950">
                      {anom.severity === 'Critical' ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      {anom.title}
                    </span>
                  </div>
                  {anom.deltaLabel && (
                    <span className="inline-block text-[10px] font-mono-num font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                      {anom.deltaLabel}
                    </span>
                  )}
                  <p className="text-[11px] text-slate-600 leading-relaxed">{anom.summary}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Entity & Fund Cross-Reference Matrix */}
      <div className="institutional-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Auto-Generated Entity & Fund Cross-Reference Matrix
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Maps funds, holdings, and risks across documents
          </span>
        </div>

        {entityMatrix.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Ingest documents to build the cross-document entity graph.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/40 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-5 font-semibold">Entity / Theme</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Mentions</th>
                  <th className="py-2.5 px-5 font-semibold">Referenced Source Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {entityMatrix.map((row) => (
                  <tr key={row.entity} className="hover:bg-slate-50/60">
                    <td className="py-3 px-5 font-semibold text-slate-900">{row.entity}</td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {row.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-semibold text-slate-900">
                      {row.mentionCount}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex flex-wrap gap-1.5">
                        {row.documentIds.map((docId, i) => (
                          <button
                            key={docId}
                            type="button"
                            onClick={() => setInspectedDocId(docId)}
                            className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:text-slate-950"
                          >
                            {row.documentTitles[i]}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
