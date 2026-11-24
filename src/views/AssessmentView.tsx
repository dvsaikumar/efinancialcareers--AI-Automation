import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileCode2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import {
  exportAssessmentToMarkdown,
  generateAssessmentReport,
} from '../engine/assessmentEngine'
import { buildPrintReadyExecutiveHtml } from '../engine/reportGenerator'
import { downloadTextFile, useWorkspace } from '../store/workspaceHelpers'

export function AssessmentView() {
  const {
    assessmentInputs,
    updateAssessmentInputs,
    documents,
    ingestRawText,
    runDemoScenario,
  } = useWorkspace()

  const [memoInput, setMemoInput] = useState('')
  const [ingestFeedback, setIngestFeedback] = useState<string | null>(null)

  const report = useMemo(
    () => generateAssessmentReport(assessmentInputs, documents),
    [assessmentInputs, documents]
  )

  const handleAnalyzeMemo = () => {
    if (!memoInput.trim()) return
    const doc = ingestRawText(memoInput, 'Uploaded Workflow Assessment Memo', 'workflow-notes.txt', 'txt')
    updateAssessmentInputs({ workflowNotes: memoInput })
    setIngestFeedback(`Analyzed "${doc.title}" and recalibrated maturity scores & bottlenecks.`)
    setMemoInput('')
  }

  const handleExportMd = () => {
    const md = exportAssessmentToMarkdown(report, assessmentInputs)
    downloadTextFile(md, 'meridian-crest-workflow-assessment.md', 'text/markdown')
  }

  const handleExportHtml = () => {
    const md = exportAssessmentToMarkdown(report, assessmentInputs)
    const html = buildPrintReadyExecutiveHtml('Family Office Operational Assessment', md)
    downloadTextFile(html, 'meridian-crest-workflow-assessment.html', 'text/html')
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="institutional-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
            Requirement 0 • Current-State Diagnostic Engine
          </span>
          <h2 className="text-xl font-semibold text-slate-950 mt-0.5">
            Family Office Reporting & Operational Maturity Assessment
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Quantify reporting close latency, PDF-to-Excel manual handoffs, custodian portal fragmentation, and fee reconciliation risks to generate a prioritized 30/60/90-day AI automation roadmap.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void runDemoScenario(1)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Ops Memo Fixture
          </button>
          <button
            type="button"
            onClick={handleExportMd}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export .MD
          </button>
          <button
            type="button"
            onClick={handleExportHtml}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#0B1626] text-white hover:bg-slate-800"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Print-Ready HTML
          </button>
        </div>
      </div>

      {/* Diagnostic Input Form + Maturity Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive Diagnostic Controls */}
        <div className="lg:col-span-5 institutional-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Operational Baseline Inputs</h3>
            <span className="text-[11px] text-slate-500">Auto-calibrated from Ops Memo</span>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 font-medium">Quarterly Close Cycle (Business Days)</span>
                <span className="font-mono-num font-semibold text-slate-900">
                  {assessmentInputs.quarterlyCloseDays} days
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={30}
                value={assessmentInputs.quarterlyCloseDays}
                onChange={(e) =>
                  updateAssessmentInputs({ quarterlyCloseDays: Number(e.target.value) })
                }
                className="w-full accent-[#0B1626]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-700 font-medium">Manual PDF-to-Excel Re-Keying (Hrs/Week)</span>
                <span className="font-mono-num font-semibold text-slate-900">
                  {assessmentInputs.manualPdfExcelHoursPerWeek} hrs/wk
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={35}
                value={assessmentInputs.manualPdfExcelHoursPerWeek}
                onChange={(e) =>
                  updateAssessmentInputs({ manualPdfExcelHoursPerWeek: Number(e.target.value) })
                }
                className="w-full accent-[#0B1626]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Custodian / Admin Portals
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={assessmentInputs.custodianPortalCount}
                  onChange={(e) =>
                    updateAssessmentInputs({ custodianPortalCount: Number(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono-num rounded-md border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Monthly Manager Emails/PDFs
                </label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={assessmentInputs.monthlyEmailAttachments}
                  onChange={(e) =>
                    updateAssessmentInputs({ monthlyEmailAttachments: Number(e.target.value) || 10 })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono-num rounded-md border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Recon Errors / Quarter
                </label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={assessmentInputs.reconciliationErrorsPerQuarter}
                  onChange={(e) =>
                    updateAssessmentInputs({
                      reconciliationErrorsPerQuarter: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono-num rounded-md border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Central Search Maturity (1–5)
                </label>
                <select
                  value={assessmentInputs.centralSearchMaturity}
                  onChange={(e) =>
                    updateAssessmentInputs({
                      centralSearchMaturity: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white"
                >
                  <option value={1}>1 — Scattered Outlook / Folders</option>
                  <option value={2}>2 — Basic Shared Drive</option>
                  <option value={3}>3 — Tagged Repository</option>
                  <option value={4}>4 — Indexed Knowledge Base</option>
                  <option value={5}>5 — AI Citation Search</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Paste Additional Workflow Pain-Point Memo
              </label>
              <textarea
                rows={3}
                value={memoInput}
                onChange={(e) => setMemoInput(e.target.value)}
                placeholder="Describe current close workflows, manual Excel steps, or manager reporting friction..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-700">{ingestFeedback ?? ''}</span>
                <button
                  type="button"
                  disabled={!memoInput.trim()}
                  onClick={handleAnalyzeMemo}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40"
                >
                  Analyze Workflow Text
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Maturity Scorecard */}
        <div className="lg:col-span-7 institutional-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Operational Maturity Scorecard
                </span>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-4xl font-bold font-mono-num text-slate-950">
                    {report.overallScore}
                    <span className="text-lg font-normal text-slate-400">/100</span>
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      report.overallScore < 40
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : report.overallScore < 65
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {report.maturityBand}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                    Recoverable Capacity
                  </div>
                  <div className="text-lg font-bold font-mono-num text-emerald-950">
                    {report.estimatedQuarterlyHoursRecoverable} hrs/qtr
                  </div>
                </div>
                <div className="rounded-lg bg-slate-100 border border-slate-200 px-3.5 py-2 text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    Close Compression
                  </div>
                  <div className="text-lg font-bold font-mono-num text-slate-950">
                    -{report.estimatedCloseCompressionDays} days
                  </div>
                </div>
              </div>
            </div>

            {/* 5 Dimension Bars */}
            <div className="mt-5 space-y-4">
              {report.dimensions.map((dim) => (
                <div key={dim.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-900">{dim.label}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          dim.score < 40
                            ? 'bg-rose-50 text-rose-700'
                            : dim.score < 65
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {dim.status}
                      </span>
                      <span className="font-mono-num font-semibold text-slate-900 w-10 text-right">
                        {dim.score}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        dim.score < 40
                          ? 'bg-rose-600'
                          : dim.score < 65
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{dim.finding}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottleneck Heatmap Table */}
      <div className="institutional-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Workflow Bottleneck Heatmap & Root-Cause Matrix
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Prioritized by Severity × Effort</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-5 font-semibold">Bottleneck Area</th>
                <th className="py-2.5 px-3 font-semibold">Severity</th>
                <th className="py-2.5 px-3 font-semibold">AI Effort</th>
                <th className="py-2.5 px-3 font-semibold text-right">Savings / Qtr</th>
                <th className="py-2.5 px-5 font-semibold">Recommended AI Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {report.bottlenecks.map((bn) => (
                <tr key={bn.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-5 align-top">
                    <div className="font-semibold text-slate-900">{bn.area}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{bn.rootCause}</div>
                  </td>
                  <td className="py-3.5 px-3 align-top">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        bn.severity === 'High'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {bn.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 align-top">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {bn.effort} Effort
                    </span>
                  </td>
                  <td className="py-3.5 px-3 align-top text-right font-mono-num font-semibold text-slate-900 whitespace-nowrap">
                    {bn.impactHoursPerQuarter} hrs
                  </td>
                  <td className="py-3.5 px-5 align-top text-slate-700">{bn.aiIntervention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 30 / 60 / 90-Day Quick-Win AI Automation Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {report.roadmap.map((phase) => (
          <div key={phase.phase} className="institutional-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                  {phase.phase}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono-num text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Clock className="w-3 h-3" />
                  {phase.estimatedHoursSavedPerQuarter}h/qtr
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{phase.objective}</p>
              <ul className="mt-3.5 space-y-2">
                {phase.deliverables.map((del) => (
                  <li key={del} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{del}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
