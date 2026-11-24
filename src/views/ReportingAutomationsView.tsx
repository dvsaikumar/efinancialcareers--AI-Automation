import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckSquare,
  Copy,
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Mail,
  Plus,
  Sparkles,
  Square,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  AUTOMATION_OPPORTUNITIES,
  buildExecutiveIcBriefMarkdown,
  buildFollowUpEmailDrafts,
  buildLiquidityRadar,
  buildPrintReadyExecutiveHtml,
  exportSummaryToCsv,
  synthesizeMeetingDebrief,
} from '../engine/reportGenerator'
import { downloadTextFile, useWorkspace } from '../store/workspaceHelpers'
import type { ReportCadence } from '../types/domain'

type SubTab = 'brief' | 'drafts' | 'liquidity' | 'meeting' | 'roi'

const CADENCE_OPTIONS: Array<{ id: ReportCadence; label: string }> = [
  { id: 'daily', label: 'Daily Flash' },
  { id: 'weekly', label: 'Weekly Ops' },
  { id: 'monthly', label: 'Monthly Review' },
  { id: 'quarterly', label: 'Quarterly IC' },
]

export function ReportingAutomationsView() {
  const {
    documents,
    anomalies,
    actionItems,
    toggleActionItem,
    addCustomActionItem,
    exportWorkspaceJson,
    runDemoScenario,
  } = useWorkspace()

  const [tab, setTab] = useState<SubTab>('brief')
  const [cadence, setCadence] = useState<ReportCadence>('quarterly')
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskOwner, setNewTaskOwner] = useState('')
  const [customMeetingNotes, setCustomMeetingNotes] = useState('')

  const icBriefMarkdown = useMemo(
    () => buildExecutiveIcBriefMarkdown(documents, anomalies, actionItems, selectedDocIds, cadence),
    [documents, anomalies, actionItems, selectedDocIds, cadence]
  )

  const emailDrafts = useMemo(
    () => buildFollowUpEmailDrafts(documents, anomalies),
    [documents, anomalies]
  )

  const liquidityRadar = useMemo(() => buildLiquidityRadar(documents), [documents])

  const icNotesDoc = documents.find((d) => d.docType === 'ic_meeting_notes')
  const effectiveNotesText =
    customMeetingNotes.trim() ||
    icNotesDoc?.rawContent ||
    'Paste raw Investment Committee notes here or load the Meridian Crest dataset.'

  const meetingDebrief = useMemo(
    () =>
      synthesizeMeetingDebrief(
        effectiveNotesText,
        customMeetingNotes.trim() ? 'Custom Pasted IC Notes' : icNotesDoc?.title ?? 'IC Notes'
      ),
    [effectiveNotesText, customMeetingNotes, icNotesDoc?.title]
  )

  const toggleScopeDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // ignore clipboard errors
    }
  }

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    addCustomActionItem(newTaskTitle.trim(), newTaskOwner.trim() || 'Investment Ops', 'High')
    setNewTaskTitle('')
    setNewTaskOwner('')
  }

  const TABS: Array<{ id: SubTab; label: string; icon: typeof FileText }> = [
    { id: 'brief', label: 'Executive IC Brief & Exports', icon: FileText },
    { id: 'drafts', label: 'Follow-Up Drafts & Checklist', icon: Mail },
    { id: 'liquidity', label: 'Capital Call & Liquidity Radar', icon: CalendarClock },
    { id: 'meeting', label: 'IC Meeting Debrief Synthesizer', icon: Users },
    { id: 'roi', label: 'AI Automation ROI Scorer', icon: TrendingUp },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="institutional-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
            Requirements 4 & 5 • Executive Reporting & High-Value AI Automations
          </span>
          <h2 className="text-xl font-semibold text-slate-950 mt-0.5">
            Automated Reporting Studio & Family Office Micro-Automations
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            One-click IC briefs, manager inquiry drafts, interactive team checklists, capital call liquidity radar, meeting debrief synthesis, and ROI automation scoring.
          </p>
        </div>
        {documents.length === 0 && (
          <button
            type="button"
            onClick={() => void runDemoScenario(4)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B1626] text-white hover:bg-slate-800 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Run Demo 4 (IC Brief & Radar)
          </button>
        )}
      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                active
                  ? 'bg-[#0B1626] text-white border-[#0B1626]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* TAB 1: Multi-Cadence Executive Reports & Multi-Format Exports */}
      {tab === 'brief' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 institutional-card p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Report Cadence</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automate Daily Flash, Weekly Ops, Monthly Hedge Fund, or Quarterly IC updates.
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                {CADENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCadence(opt.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                      cadence === opt.id
                        ? 'bg-[#0B1626] text-white border-[#0B1626]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Document Scope</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Leave all unchecked to synthesize all {documents.length} workspace documents, or select specific files.
              </p>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {documents.map((doc) => {
                const checked = selectedDocIds.includes(doc.id)
                return (
                  <label
                    key={doc.id}
                    className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleScopeDoc(doc.id)}
                      className="mt-0.5 accent-[#0B1626]"
                    />
                    <span className="text-slate-800 leading-snug">{doc.title}</span>
                  </label>
                )
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Deterministic Export Formats
              </div>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    icBriefMarkdown,
                    'meridian-crest-executive-ic-brief.md',
                    'text/markdown'
                  )
                }
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-[#0B1626] text-white hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5" />
                Download Markdown (.md)
              </button>
              <button
                type="button"
                onClick={() => {
                  const html = buildPrintReadyExecutiveHtml('Executive IC Brief', icBriefMarkdown)
                  downloadTextFile(html, 'meridian-crest-executive-ic-brief.html', 'text/html')
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                Download Print-Ready HTML (.html)
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      exportSummaryToCsv(documents),
                      'meridian-crest-fund-summary.csv',
                      'text/csv'
                    )
                  }
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  CSV Summary
                </button>
                <button
                  type="button"
                  onClick={exportWorkspaceJson}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  JSON Bundle
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 institutional-card overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Live Executive IC Brief Preview
              </h3>
              <button
                type="button"
                onClick={() => void copyText('ic-brief', icBriefMarkdown)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-950"
              >
                {copiedId === 'ic-brief' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Markdown
                  </>
                )}
              </button>
            </div>
            <pre className="p-5 text-xs font-mono-num text-slate-800 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[540px] bg-white">
              {icBriefMarkdown}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: Follow-Up Email Drafts & Team Action Checklist */}
      {tab === 'drafts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Ready-to-Send GP & Counterparty Follow-Up Drafts ({emailDrafts.length})
            </h3>
            {emailDrafts.map((draft) => (
              <div key={draft.id} className="institutional-card overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          draft.urgency === 'Critical'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {draft.urgency}
                      </span>
                      <span className="text-[11px] text-slate-500">{draft.category}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-950 mt-1">{draft.title}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(
                        draft.id,
                        `To: ${draft.to}\nSubject: ${draft.subject}\n\n${draft.body}`
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shrink-0"
                  >
                    {copiedId === draft.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Draft
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 space-y-2 text-xs">
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-800">To:</span> {draft.to}
                  </div>
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-800">Subject:</span> {draft.subject}
                  </div>
                  <pre className="mt-2 p-3.5 rounded-lg bg-slate-50 border border-slate-200 font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {draft.body}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 institutional-card p-5 h-fit space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Interactive Investment Team Action Checklist ({actionItems.filter((a) => !a.completed).length} Open)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Auto-extracted from capital calls, quarterly letters, and IC notes.
              </p>
            </div>

            <form onSubmit={handleAddAction} className="space-y-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add follow-up task..."
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskOwner}
                  onChange={(e) => setNewTaskOwner(e.target.value)}
                  placeholder="Owner (e.g. Sarah / CIO)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-300"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#0B1626] text-white hover:bg-slate-800"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {actionItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleActionItem(item.id)}
                  className={`w-full text-left p-3 rounded-lg border flex items-start gap-2.5 transition-colors ${
                    item.completed
                      ? 'bg-emerald-50/50 border-emerald-200/70 opacity-75'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {item.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs font-medium ${
                        item.completed ? 'line-through text-slate-500' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap text-[10px] text-slate-500">
                      <span>{item.owner}</span>
                      <span>•</span>
                      <span className="font-mono-num">{item.dueDate ?? 'TBD'}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-semibold ${
                          item.priority === 'Critical'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Capital Call & Liquidity Deadline Radar */}
      {tab === 'liquidity' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="institutional-card p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Immediate Cash & T-Bills
              </div>
              <div className="text-2xl font-bold font-mono-num text-slate-950 mt-1">
                ${liquidityRadar.availableCashM.toFixed(2)}M
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Available T+0 / 90-day liquidity</p>
            </div>
            <div className="institutional-card p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                IPS Minimum Reserve Floor
              </div>
              <div className="text-2xl font-bold font-mono-num text-slate-950 mt-1">
                ${liquidityRadar.ipsFloorM.toFixed(2)}M
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Policy guardrail</p>
            </div>
            <div className="institutional-card p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Post-Mandatory Calls Cash
              </div>
              <div className="text-2xl font-bold font-mono-num text-emerald-700 mt-1">
                ${liquidityRadar.projectedCashAfterMandatoryM.toFixed(2)}M
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">Above $3.0M IPS floor</p>
            </div>
            <div className="institutional-card p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                Post-Optional Co-Invest Cash
              </div>
              <div
                className={`text-2xl font-bold font-mono-num mt-1 ${
                  liquidityRadar.projectedCashAfterAllM < liquidityRadar.ipsFloorM
                    ? 'text-rose-700'
                    : 'text-emerald-700'
                }`}
              >
                ${liquidityRadar.projectedCashAfterAllM.toFixed(2)}M
              </div>
              <p className="text-[11px] text-rose-700 mt-1">
                {liquidityRadar.projectedCashAfterAllM < liquidityRadar.ipsFloorM
                  ? 'Breaches IPS floor — pre-stage $500K SMA trim'
                  : 'Within IPS guardrails'}
              </p>
            </div>
          </div>

          {/* Liquidity Coverage Bar */}
          <div className="institutional-card p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">
                30-Day Cash Allocation vs. $3.0M IPS Guardrail
              </span>
              <span className="font-mono-num text-slate-600">
                Total Outflows: ${(liquidityRadar.totalMandatoryM + liquidityRadar.totalOptionalM).toFixed(2)}M / $
                {liquidityRadar.availableCashM.toFixed(2)}M Cash
              </span>
            </div>
            <div className="h-5 rounded-lg bg-slate-100 overflow-hidden flex border border-slate-200">
              <div
                className="bg-rose-600 h-full flex items-center justify-center text-[10px] font-mono-num text-white font-semibold"
                style={{
                  width: `${Math.min(
                    100,
                    (liquidityRadar.totalMandatoryM / liquidityRadar.availableCashM) * 100
                  )}%`,
                }}
              >
                Mandatory (${liquidityRadar.totalMandatoryM.toFixed(2)}M)
              </div>
              <div
                className="bg-amber-500 h-full flex items-center justify-center text-[10px] font-mono-num text-white font-semibold"
                style={{
                  width: `${Math.min(
                    100,
                    (liquidityRadar.totalOptionalM / liquidityRadar.availableCashM) * 100
                  )}%`,
                }}
              >
                Optional/Pending (${liquidityRadar.totalOptionalM.toFixed(2)}M)
              </div>
              <div className="bg-emerald-600/85 flex-1 h-full flex items-center justify-center text-[10px] font-mono-num text-white font-semibold">
                Remaining (${Math.max(0, liquidityRadar.projectedCashAfterAllM).toFixed(2)}M)
              </div>
            </div>
          </div>

          {/* Deadline Timeline */}
          <div className="institutional-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
              <h3 className="text-sm font-semibold text-slate-900">
                Upcoming Capital Call & Election Deadlines ({liquidityRadar.events.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-200">
              {liquidityRadar.events.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No upcoming capital calls or co-investments detected in current documents.
                </div>
              ) : (
                liquidityRadar.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#0B1626] text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-sm font-bold font-mono-num leading-none">
                          {ev.dueInDays}d
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">
                          due
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-950">{ev.title}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              ev.status === 'Flagged Discrepancy'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{ev.notes}</p>
                        <span className="text-[11px] text-slate-400 font-mono-num">
                          {ev.type} • {ev.dueDateLabel}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold font-mono-num text-slate-950">
                        ${ev.amountMillions.toFixed(2)}M
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Meeting Prep & IC Debrief Synthesizer */}
      {tab === 'meeting' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 institutional-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Raw IC Meeting Notes Input</h3>
            <p className="text-xs text-slate-500">
              Automatically pulls ingested IC notes or paste any messy unformatted meeting dump below.
            </p>
            <textarea
              rows={13}
              value={customMeetingNotes || icNotesDoc?.rawContent || ''}
              onChange={(e) => setCustomMeetingNotes(e.target.value)}
              placeholder="Paste raw IC meeting notes..."
              className="w-full p-3 text-xs font-mono-num rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="lg:col-span-7 institutional-card p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">{meetingDebrief.title}</h3>
                <p className="text-[11px] text-slate-500">Source: {meetingDebrief.sourceLabel}</p>
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Auto-Structured
              </span>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Decisions & Provisional Approvals
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-800">
                {meetingDebrief.decisions.map((d, i) => (
                  <li key={i} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Assigned Owners & Next Steps
              </h4>
              <div className="space-y-2">
                {meetingDebrief.ownersAndActions.map((row, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-950">{row.owner}: </span>
                      <span className="text-slate-700">{row.action}</span>
                    </div>
                    <span className="font-mono-num text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                      {row.due}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {meetingDebrief.openQuestions.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Open Diligence Questions
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {meetingDebrief.openQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ROI & High-Value AI Automation Opportunity Scorer */}
      {tab === 'roi' && (
        <div className="institutional-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Family Office AI Automation Opportunity & ROI Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ranked by quarterly analyst hours recovered, fee/error prevention value, and implementation effort.
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Total Annualized Value Identified
              </div>
              <div className="text-lg font-bold font-mono-num text-emerald-700">
                $
                {AUTOMATION_OPPORTUNITIES.reduce((acc, o) => acc + o.annualizedValueUsd, 0).toLocaleString()}
                /yr
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/40 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-5 font-semibold">Automation Opportunity</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Hrs Saved / Qtr</th>
                  <th className="py-2.5 px-3 font-semibold">Effort</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Est. Annual Value</th>
                  <th className="py-2.5 px-5 font-semibold text-right">ROI Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {AUTOMATION_OPPORTUNITIES.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-5 max-w-md">
                      <div className="font-semibold text-slate-950">{opp.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{opp.description}</div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          opp.status === 'Live in Workspace'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {opp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-num font-semibold text-slate-900">
                      {opp.hoursSavedPerQuarter} hrs
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">{opp.implementationEffort}</td>
                    <td className="py-3.5 px-3 text-right font-mono-num font-semibold text-emerald-800">
                      ${opp.annualizedValueUsd.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono-num font-bold bg-[#0B1626] text-white">
                        {opp.roiScore}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
