import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react'
import { useWorkspace } from '../store/workspaceHelpers'

export function TraceDrawer() {
  const { traceDrawerOpen, setTraceDrawerOpen, traceRuns } = useWorkspace()

  if (!traceDrawerOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-[#0B1626] text-slate-100 shadow-2xl border-l border-slate-800 flex flex-col">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Live Self-Steering Agent Trace</h2>
            <p className="text-[11px] text-slate-400">
              Deterministic audit trail • {traceRuns.length} ingestion run(s)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setTraceDrawerOpen(false)}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close trace drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {traceRuns.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-center">
            <p className="text-sm text-slate-300 font-medium">No trace events yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Drop a document or launch any Guided Demo to inspect the live self-steering classification, extraction, fallback, and cross-check pipeline.
            </p>
          </div>
        ) : (
          traceRuns.map((run) => (
            <div
              key={run.id}
              className="rounded-lg border border-slate-800 bg-[#111F35] overflow-hidden"
            >
              <div className="px-3.5 py-2.5 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-900/50">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{run.sourceLabel}</p>
                  <p className="text-[10px] text-slate-400 font-mono-num">
                    {new Date(run.startedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {run.anomalyCount > 0 && (
                    <span className="text-[10px] font-mono-num px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {run.anomalyCount} alert{run.anomalyCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {run.finalConfidence !== undefined && (
                    <span
                      className={`text-[10px] font-mono-num px-2 py-0.5 rounded-full border ${
                        run.finalConfidence >= 85
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : run.finalConfidence >= 65
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {run.finalConfidence}% conf
                    </span>
                  )}
                </div>
              </div>

              <ol className="p-3 space-y-2.5">
                {run.events.map((ev) => (
                  <li key={ev.id} className="flex items-start gap-2.5 text-xs">
                    <span className="mt-0.5 shrink-0">
                      {ev.status === 'ok' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {ev.status === 'warn' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      {ev.status === 'alert' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-100">{ev.label}</span>
                        <span className="text-[10px] font-mono-num text-slate-500 shrink-0">
                          {ev.durationMs}ms
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{ev.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
