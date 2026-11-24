import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Download,
  FileBarChart2,
  Layers,
  Menu,
  MessageSquareQuote,
  Play,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useWorkspace } from '../store/workspaceHelpers'
import type { ViewId } from '../types/domain'
import { SourcePassageViewer } from './SourcePassageViewer'
import { TraceDrawer } from './TraceDrawer'

const NAV_ITEMS: Array<{
  id: ViewId
  label: string
  sublabel: string
  icon: typeof Layers
}> = [
  { id: 'hub', label: 'Command & Accept-All Hub', sublabel: 'Ingest & Self-Steering', icon: Layers },
  { id: 'assessment', label: 'Workflow Assessment', sublabel: 'Req 0 • Maturity & ROI', icon: ClipboardCheck },
  { id: 'assistant', label: 'AI Investment Assistant', sublabel: 'Req 1 • Cited Q&A', icon: MessageSquareQuote },
  { id: 'intelligence', label: 'Fund & Comms Intelligence', sublabel: 'Req 2 • Metrics & Alerts', icon: BarChart3 },
  { id: 'knowledge', label: 'Knowledge Explorer', sublabel: 'Req 3 • No-DB Search', icon: BookOpen },
  { id: 'reporting', label: 'Reporting & Automations', sublabel: 'Req 4 & 5 • IC Briefs', icon: FileBarChart2 },
]

const DEMO_SCENARIOS: Array<{
  num: 1 | 2 | 3 | 4 | 5
  shortLabel: string
  hint: string
}> = [
  { num: 1, shortLabel: 'Demo 1: Onboarding', hint: 'Req 0 Assessment' },
  { num: 2, shortLabel: 'Demo 2: $50K Fee Catch', hint: 'Req 2 Anomaly' },
  { num: 3, shortLabel: 'Demo 3: Cited Q&A', hint: 'Req 1 & 3' },
  { num: 4, shortLabel: 'Demo 4: IC Brief & Radar', hint: 'Req 4 & 5' },
  { num: 5, shortLabel: 'Demo 5: Chaos Stress Test', hint: 'Accept-All Recovery' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const {
    activeView,
    setActiveView,
    documents,
    anomalies,
    traceRuns,
    traceDrawerOpen,
    setTraceDrawerOpen,
    runDemoScenario,
    activeDemoBanner,
    clearDemoBanner,
    resetSession,
    exportWorkspaceJson,
    inspectedDocId,
    setInspectedDocId,
    isProcessing,
  } = useWorkspace()

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const inspectedDoc = documents.find((d) => d.id === inspectedDocId) ?? null
  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activeView) ?? NAV_ITEMS[0]

  return (
    <div className="min-h-screen flex bg-[#F6F7F9] text-[#0F172A]">
      {/* Mobile Sidebar Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Institutional Navy Left Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-40 w-68 shrink-0 bg-[#0B1626] text-slate-200 flex flex-col border-r border-slate-800/80 transition-transform duration-200 lg:translate-x-0 h-screen ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#13233A] border border-slate-700/80 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none">
                <path
                  d="M4 21V7L10.5 15.5L14 10.5L17.5 15.5L24 7V21"
                  stroke="#F8FAFC"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="14" cy="6" r="2" fill="#10B981" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white">Meridian Crest AI</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">
                Family Office Platform
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            const badge =
              item.id === 'intelligence' && anomalies.length > 0
                ? anomalies.length
                : item.id === 'knowledge' && documents.length > 0
                  ? documents.length
                  : null

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveView(item.id)
                  setMobileNavOpen(false)
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors relative ${
                  isActive
                    ? 'bg-[#152842] text-white'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-emerald-400" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}
                  strokeWidth={1.75}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{item.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{item.sublabel}</div>
                </div>
                {badge !== null && (
                  <span
                    className={`text-[10px] font-mono-num px-1.5 py-0.5 rounded-full ${
                      item.id === 'intelligence'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-700/80 text-slate-200'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-3.5 border-t border-slate-800/80 space-y-2.5 bg-[#08111E]">
          <div className="rounded-lg border border-slate-800 bg-[#0F1E33] px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Zero-DB • Local Browser Engine
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              No backend server. All documents, search indices, and analytics execute locally in your browser.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Executive Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
                aria-label="Open navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                  {activeNavMeta.label}
                </h1>
              </div>
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                No-DB • Local Browser Engine
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTraceDrawerOpen(!traceDrawerOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  traceDrawerOpen
                    ? 'bg-[#0B1626] text-white border-[#0B1626]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Agent Trace</span>
                {traceRuns.length > 0 && (
                  <span className="font-mono-num text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700">
                    {traceRuns.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={exportWorkspaceJson}
                disabled={documents.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                title="Download entire workspace as portable JSON bundle"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Export Bundle</span>
              </button>

              <button
                type="button"
                onClick={resetSession}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-rose-700 bg-rose-50/70 border border-rose-200 hover:bg-rose-100 transition-colors"
                title="Immediately wipe all browser session data and in-memory keys"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Wipe Session</span>
              </button>
            </div>
          </div>

          {/* One-Click Guided Demo Launcher Bar */}
          <div className="px-4 sm:px-6 py-2 bg-[#F8FAFC] border-t border-slate-200/80 flex items-center gap-2 overflow-x-auto no-print">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 shrink-0 mr-1">
              Guided Demos:
            </span>
            {DEMO_SCENARIOS.map((demo) => (
              <button
                key={demo.num}
                type="button"
                disabled={isProcessing}
                onClick={() => void runDemoScenario(demo.num)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50 transition-colors shrink-0 shadow-[0_1px_1px_rgba(15,23,42,0.03)]"
                title={demo.hint}
              >
                <Play className="w-3 h-3 text-emerald-700 fill-emerald-700/20" />
                <span>{demo.shortLabel}</span>
              </button>
            ))}
          </div>

          {activeDemoBanner && (
            <div className="px-4 sm:px-6 py-2 bg-emerald-950 text-emerald-50 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate sm:whitespace-normal">{activeDemoBanner}</span>
              </div>
              <button
                type="button"
                onClick={clearDemoBanner}
                className="p-1 text-emerald-300 hover:text-white shrink-0"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </header>

        {/* Active View Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">{children}</main>
      </div>

      {/* Collapsible Live Trace Drawer */}
      <TraceDrawer />

      {/* Global Source Provenance Inspector Modal (when inspecting from non-Assistant views) */}
      {inspectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl h-[80vh]">
            <SourcePassageViewer
              document={inspectedDoc}
              onClose={() => setInspectedDocId(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
