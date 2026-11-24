import { useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Eye,
  FileSpreadsheet,
  FileText,
  Flame,
  FolderOpen,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react'
import { MERIDIAN_CREST_FIXTURES } from '../fixtures/meridianCrestData'
import { useWorkspace } from '../store/workspaceHelpers'

const PIPELINE_STAGES = [
  { key: 'INGEST', title: '1. Accept-All Ingest', desc: 'TXT, MD, CSV, JSON, EML, HTML, PDF, or chaotic raw paste' },
  { key: 'CLASSIFY', title: '2. Format & Intent Router', desc: 'Auto-classifies letters, calls, CSVs, notes, or chaos blobs' },
  { key: 'EXTRACT', title: '3. Dynamic Schema Inference', desc: 'Extracts NAV, IRR, TVPI, fees, deadlines, themes & actions' },
  { key: 'CROSS_CHECK', title: '4. Self-Steering Verify', desc: 'Triggers fallbacks, catches cross-doc discrepancies & scores confidence' },
]

export function CommandHubView() {
  const {
    documents,
    anomalies,
    actionItems,
    traceRuns,
    ingestRawText,
    ingestUploadedFile,
    loadAllMeridianFixtures,
    runDemoScenario,
    setInspectedDocId,
    setTraceDrawerOpen,
    setActiveView,
    removeDocument,
    importWorkspaceJson,
  } = useWorkspace()

  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteContent, setPasteContent] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const bundleInputRef = useRef<HTMLInputElement | null>(null)

  const csvDoc = documents.find((d) => d.portfolioRows && d.portfolioRows.length > 0)
  const totalNavM =
    csvDoc?.portfolioRows?.reduce((acc, r) => acc + r.navMillions, 0) ??
    documents.reduce((acc, d) => acc + (d.docType === 'quarterly_letter' ? d.metrics.navMillions ?? 0 : 0), 0)
  const cashM = csvDoc?.metrics.cashLiquidityMillions ?? 0
  const openActionsCount = actionItems.filter((a) => !a.completed).length

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    let count = 0
    for (const file of Array.from(files)) {
      await ingestUploadedFile(file)
      count++
    }
    setStatusMessage(`Ingested ${count} file(s) through the self-steering pipeline.`)
    setTraceDrawerOpen(true)
  }

  const handlePasteIngest = () => {
    if (!pasteContent.trim()) return
    const doc = ingestRawText(pasteContent, pasteTitle.trim() || undefined)
    setStatusMessage(
      `Ingested "${doc.title}" as ${doc.docType.replace(/_/g, ' ')} (${doc.confidenceScore}% ${doc.confidenceTier} confidence).`
    )
    setPasteTitle('')
    setPasteContent('')
    setTraceDrawerOpen(true)
  }

  const handleImportBundle = async (files: FileList | null) => {
    if (!files || !files[0]) return
    const text = await files[0].text()
    const res = importWorkspaceJson(text)
    setStatusMessage(res.ok ? 'Workspace JSON bundle restored.' : `Import failed: ${res.error}`)
  }

  const latestRun = traceRuns[0]

  return (
    <div className="space-y-6">
      {/* Executive Welcome + KPI Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 institutional-card p-6 flex flex-col justify-between bg-gradient-to-br from-white to-slate-50/70">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
              Meridian Crest Family Office • Zero-DB Showcase
            </div>
            <h2 className="font-sans text-2xl sm:text-[1.75rem] font-bold tracking-tight text-slate-950 mt-2 leading-snug">
              Institutional AI Command Hub for Unstructured Wealth Operations
            </h2>
            <p className="text-sm text-slate-600 mt-2.5 leading-relaxed max-w-2xl">
              Drop quarterly fund letters, capital call emails, custodian CSVs, IC notes, or messy mixed-format blobs. Every document is classified, cross-checked for anomalies, and indexed locally in your browser with verifiable passage citations.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={loadAllMeridianFixtures}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B1626] text-white hover:bg-slate-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Load Full Meridian Crest Dataset ({MERIDIAN_CREST_FIXTURES.length} Docs)
            </button>
            <button
              type="button"
              onClick={() => void runDemoScenario(5)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 text-amber-700" />
              Run Chaos Stress Test
            </button>
            <button
              type="button"
              onClick={() => bundleInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Import JSON Bundle
            </button>
            <input
              ref={bundleInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => void handleImportBundle(e.target.files)}
            />
          </div>
        </div>

        {/* Workspace KPI Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
          <div className="institutional-card p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Indexed Documents
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold font-mono-num text-slate-950">
                {documents.length}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                {documents.reduce((acc, d) => acc + d.chunks.length, 0)} passages
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">100% browser-local index</p>
          </div>

          <div
            onClick={() => setActiveView('intelligence')}
            className="institutional-card institutional-card-hover p-4 flex flex-col justify-between cursor-pointer"
          >
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Discrepancies Caught
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span
                className={`text-2xl font-semibold font-mono-num ${
                  anomalies.length > 0 ? 'text-rose-700' : 'text-slate-950'
                }`}
              >
                {anomalies.length}
              </span>
              {anomalies.some((a) => a.severity === 'Critical') && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  CRITICAL
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Cross-document audit engine</p>
          </div>

          <div className="institutional-card p-4 flex flex-col justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Tracked Portfolio NAV
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold font-mono-num text-slate-950">
                {totalNavM > 0 ? `$${totalNavM.toFixed(1)}M` : '—'}
              </span>
              {cashM > 0 && (
                <span className="text-[11px] font-mono-num text-slate-600">
                  ${cashM.toFixed(1)}M cash
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Extracted across sleeves</p>
          </div>

          <div
            onClick={() => setActiveView('reporting')}
            className="institutional-card institutional-card-hover p-4 flex flex-col justify-between cursor-pointer"
          >
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Open Action Items
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-semibold font-mono-num text-slate-950">
                {openActionsCount}
              </span>
              <span className="text-[11px] text-slate-500">IC & Treasury</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Auto-extracted owners & dates</p>
          </div>
        </div>
      </div>

      {/* Live Self-Steering Router Pipeline Visualizer */}
      <div className="institutional-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-semibold text-slate-900">
              Self-Steering Accept-All Router Pipeline
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setTraceDrawerOpen(true)}
            className="text-xs font-medium text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
          >
            Inspect Full Trace Drawer <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PIPELINE_STAGES.map((stage) => {
            const matchedEvent = latestRun?.events.find((e) => e.stage === stage.key)
            return (
              <div
                key={stage.key}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">{stage.title}</span>
                    {matchedEvent ? (
                      matchedEvent.status === 'alert' ? (
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : matchedEvent.status === 'warn' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{stage.desc}</p>
                </div>
                {matchedEvent && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] font-mono-num text-slate-700 truncate">
                    {matchedEvent.label}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Universal Accept-All Dropzone & Raw Paste Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 institutional-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Universal File Dropzone</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Accepts <code className="font-mono-num">.txt</code>, <code className="font-mono-num">.md</code>,{' '}
              <code className="font-mono-num">.csv</code>, <code className="font-mono-num">.json</code>,{' '}
              <code className="font-mono-num">.eml</code>, <code className="font-mono-num">.html</code>, and{' '}
              <code className="font-mono-num">.pdf</code> (browser-native extraction).
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              void handleFiles(e.dataTransfer.files)
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-4 border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-emerald-600 bg-emerald-50/70'
                : 'border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2.5" strokeWidth={1.5} />
            <p className="text-xs font-semibold text-slate-800">
              Drag & drop any family office files here
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              or click to browse — processed 100% locally in memory
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.json,.eml,.html,.htm,.pdf"
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Individual Synthetic Test Fixtures
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MERIDIAN_CREST_FIXTURES.map((fx) => {
                const loaded = documents.some((d) => d.fileName === fx.fileName)
                return (
                  <button
                    key={fx.id}
                    type="button"
                    onClick={() => {
                      ingestRawText(fx.content, fx.title, fx.fileName, fx.format)
                      setStatusMessage(`Ingested synthetic fixture: ${fx.title}`)
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                      loaded
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {loaded ? '✓ ' : '+ '}
                    {fx.fileName.replace(/\.[^.]+$/, '')}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Raw Paste Input */}
        <div className="lg:col-span-7 institutional-card p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Accept-All Raw Paste Studio
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Paste raw emails, messy IC bullet notes, broken CSV rows, or HTML snippets — zero rigid schema required.
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2.5 flex-1 flex flex-col">
            <input
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Optional document label (auto-inferred if left blank)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
            />
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              rows={7}
              placeholder="Paste any fund letter, capital call email, CSV holdings snippet, or raw meeting notes..."
              className="w-full flex-1 px-3 py-2.5 text-xs font-mono-num rounded-lg border border-slate-300 bg-slate-50/40 focus:bg-white focus:outline-none focus:border-slate-900 resize-y"
            />
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-500">
                {statusMessage ?? 'Self-steering classifier runs automatically on submit.'}
              </span>
              <button
                type="button"
                disabled={!pasteContent.trim()}
                onClick={handlePasteIngest}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B1626] text-white hover:bg-slate-800 disabled:opacity-40 transition-colors shrink-0"
              >
                Ingest & Auto-Route
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ingested Documents Library */}
      <div className="institutional-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Local Workspace Document Vault ({documents.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Stored strictly in browser state • Zero server persistence
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700">Workspace vault is empty</p>
            <p className="text-xs text-slate-500 mt-1">
              Click <strong>Load Full Meridian Crest Dataset</strong> or any <strong>Guided Demo</strong> button above to begin.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="min-w-0 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                    {doc.format === 'csv' ? (
                      <FileSpreadsheet className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-900">{doc.title}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.docType.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-mono-num px-2 py-0.5 rounded-full border ${
                          doc.confidenceTier === 'High'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : doc.confidenceTier === 'Medium'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {doc.confidenceScore}% {doc.confidenceTier}
                      </span>
                      {doc.usedFallbackParser && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          Fallback Recovered
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{doc.summary}</p>
                    {doc.parseWarnings.length > 0 && (
                      <p className="text-[11px] text-amber-800 mt-1 font-mono-num">
                        ⚠ {doc.parseWarnings[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setInspectedDocId(doc.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDocument(doc.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50"
                    aria-label={`Remove ${doc.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
