import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Eye,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useWorkspace } from '../store/workspaceHelpers'

export function FundIntelligenceView() {
  const {
    documents,
    anomalies,
    setInspectedDocId,
    runDemoScenario,
    setActiveView,
  } = useWorkspace()

  const fundDocs = documents.filter(
    (d) =>
      d.docType === 'quarterly_letter' ||
      d.docType === 'capital_call' ||
      d.docType === 'distribution_notice' ||
      d.docType === 'mixed_chaos'
  )

  const quantitativeLetters = documents.filter(
    (d) =>
      d.docType === 'quarterly_letter' ||
      (d.docType === 'distribution_notice' && d.metrics.navMillions !== undefined)
  )

  return (
    <div className="space-y-6">
      <div className="institutional-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
            Requirement 2 • Automated Manager Communications Analysis
          </span>
          <h2 className="text-xl font-semibold text-slate-950 mt-0.5">
            Fund & Investor Communications Intelligence
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Structured extraction of NAV, Net IRR, TVPI, DPI, Called %, unfunded commitments, management tone, buried action items, and cross-document fee/valuation discrepancies.
          </p>
        </div>
        {documents.length === 0 && (
          <button
            type="button"
            onClick={() => void runDemoScenario(2)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B1626] text-white hover:bg-slate-800 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Run Demo 2 ($50K Fee Catch)
          </button>
        )}
      </div>

      {/* Cross-Document Anomaly Banner */}
      {anomalies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Cross-Document Discrepancies & Governance Alerts ({anomalies.length})
            </h3>
            <button
              type="button"
              onClick={() => setActiveView('reporting')}
              className="text-xs font-medium text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
            >
              Open Auto-Drafted GP Inquiry Email <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                className={`rounded-xl border p-4 bg-white shadow-xs ${
                  anom.severity === 'Critical'
                    ? 'border-rose-300'
                    : 'border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {anom.severity === 'Critical' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <h4 className="text-sm font-semibold text-slate-950">{anom.title}</h4>
                  </div>
                  {anom.deltaLabel && (
                    <span
                      className={`text-[11px] font-mono-num font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
                        anom.severity === 'Critical'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      {anom.deltaLabel}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 mt-2 leading-relaxed">{anom.summary}</p>

                <div className="mt-3 space-y-1.5">
                  {anom.evidenceSnippets.map((ev, idx) => (
                    <div
                      key={`${anom.id}-ev-${idx}`}
                      className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {ev.docTitle}
                        </div>
                        <p className="text-[11px] font-mono-num text-slate-800 mt-0.5">
                          &ldquo;{ev.excerpt}&rdquo;
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInspectedDocId(ev.docId)}
                        className="text-[11px] font-medium text-emerald-800 hover:underline shrink-0"
                      >
                        Source
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-800">
                  <span className="font-semibold text-slate-900">Recommended Action: </span>
                  {anom.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structured Fund Metrics Table */}
      <div className="institutional-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Extracted Private Markets Performance Ledger
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Zero manual Excel re-keying</span>
        </div>

        {quantitativeLetters.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Ingest quarterly fund letters (or run <strong>Demo 2</strong>) to populate structured NAV, Net IRR, TVPI, DPI, and Unfunded metrics.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/40 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-5 font-semibold">Fund & Manager</th>
                  <th className="py-2.5 px-3 font-semibold">Asset Class</th>
                  <th className="py-2.5 px-3 font-semibold text-right">NAV</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Net IRR</th>
                  <th className="py-2.5 px-3 font-semibold text-right">TVPI</th>
                  <th className="py-2.5 px-3 font-semibold text-right">DPI</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Called %</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Unfunded</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {quantitativeLetters.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-950">{doc.fundName ?? doc.title}</div>
                      <div className="text-[11px] text-slate-500">{doc.managerName ?? doc.documentDate}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">{doc.assetClass}</td>
                    <td className="py-3.5 px-3 text-right font-mono-num font-semibold text-slate-950">
                      {doc.metrics.navMillions !== undefined ? `$${doc.metrics.navMillions.toFixed(1)}M` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-num font-semibold text-emerald-700">
                      {doc.metrics.netIrrPct !== undefined ? `${doc.metrics.netIrrPct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-num text-slate-900">
                      {doc.metrics.tvpi !== undefined ? `${doc.metrics.tvpi.toFixed(2)}x` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-num text-slate-700">
                      {doc.metrics.dpi !== undefined ? `${doc.metrics.dpi.toFixed(2)}x` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-num text-slate-700">
                      {doc.metrics.calledPct !== undefined ? `${doc.metrics.calledPct.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-num font-semibold text-slate-900">
                      {doc.metrics.unfundedMillions !== undefined
                        ? `$${doc.metrics.unfundedMillions.toFixed(1)}M`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectedDocId(doc.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="w-3 h-3" />
                        Source
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Structured Intelligence Cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Fund Manager & Communication Intelligence Cards ({fundDocs.length})
        </h3>
        {fundDocs.length === 0 ? (
          <div className="institutional-card p-8 text-center text-xs text-slate-500">
            No manager letters or capital call notices ingested yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {fundDocs.map((doc) => (
              <div key={doc.id} className="institutional-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {doc.docType.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            doc.sentiment === 'Urgent'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : doc.sentiment === 'Constructive'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          Tone: {doc.sentiment}
                        </span>
                        <span className="text-[10px] font-mono-num text-slate-500">
                          {doc.confidenceScore}% conf
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-950 mt-2">{doc.title}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectedDocId(doc.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Source
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{doc.summary}</p>

                  {/* Key Extracted Metrics Chips */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {doc.metrics.capitalCallAmount && (
                      <span className="text-[11px] font-mono-num px-2 py-0.5 rounded bg-rose-50 text-rose-900 border border-rose-200">
                        Call: ${doc.metrics.capitalCallAmount.toLocaleString()}
                      </span>
                    )}
                    {doc.metrics.managementFeeAmount && (
                      <span className="text-[11px] font-mono-num px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                        Billed Fee: ${doc.metrics.managementFeeAmount.toLocaleString()}
                      </span>
                    )}
                    {doc.metrics.scheduledFeeAmount && (
                      <span className="text-[11px] font-mono-num px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                        Scheduled Fee: ${doc.metrics.scheduledFeeAmount.toLocaleString()}
                      </span>
                    )}
                    {doc.metrics.coInvestAmount && (
                      <span className="text-[11px] font-mono-num px-2 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-200">
                        Co-Invest: ${doc.metrics.coInvestAmount.toLocaleString()}
                      </span>
                    )}
                    {doc.metrics.dueInDays && (
                      <span className="text-[11px] font-mono-num px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        Due in {doc.metrics.dueInDays}d
                      </span>
                    )}
                  </div>

                  {/* Themes & Risks */}
                  <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Key Themes
                      </div>
                      <ul className="space-y-1">
                        {doc.themes.map((t) => (
                          <li key={t} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Risks & Buried Flags
                      </div>
                      {doc.risks.length === 0 ? (
                        <p className="text-[11px] text-slate-400">No elevated risks flagged.</p>
                      ) : (
                        <ul className="space-y-1">
                          {doc.risks.map((r) => (
                            <li key={r} className="text-[11px] text-rose-800 flex items-start gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
