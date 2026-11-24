import { useEffect, useRef } from 'react'
import { FileText, ShieldCheck, AlertTriangle, X } from 'lucide-react'
import type { Citation, IngestedDocument } from '../types/domain'

interface SourcePassageViewerProps {
  document: IngestedDocument | null
  citation?: Citation | null
  onClose?: () => void
  compact?: boolean
}

export function SourcePassageViewer({
  document,
  citation,
  onClose,
  compact = false,
}: SourcePassageViewerProps) {
  const highlightRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [citation?.docId, citation?.lineStart, document?.id])

  if (!document) {
    return (
      <div className="institutional-card h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <FileText className="w-8 h-8 text-slate-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-slate-700">Source Provenance Inspector</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Click any inline citation badge (<span className="font-mono-num font-semibold text-emerald-700">[1]</span>,{' '}
          <span className="font-mono-num font-semibold text-emerald-700">[2]</span>) or document card to inspect and highlight the exact verified source passage.
        </p>
      </div>
    )
  }

  const lines = document.rawContent.split('\n')
  const hlStart = citation && citation.docId === document.id ? citation.lineStart : -1
  const hlEnd = citation && citation.docId === document.id ? citation.lineEnd : -1

  return (
    <div className={`institutional-card flex flex-col overflow-hidden ${compact ? 'h-[560px]' : 'h-full'}`}>
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {document.docType.replace(/_/g, ' ')}
            </span>
            <span className="text-slate-300">•</span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                document.confidenceTier === 'High'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : document.confidenceTier === 'Medium'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {document.confidenceTier === 'High' ? (
                <ShieldCheck className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              {document.confidenceScore}% {document.confidenceTier}
            </span>
            {hlStart > 0 && (
              <span className="text-[11px] font-mono-num bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                Highlighted Lines {hlStart}–{hlEnd}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mt-1 truncate">{document.title}</h3>
          <p className="text-[11px] text-slate-500 font-mono-num mt-0.5">
            {document.fileName} • {document.assetClass}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close source viewer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-white p-3 font-mono-num text-xs leading-relaxed">
        {lines.map((line, idx) => {
          const lineNum = idx + 1
          const isHighlighted = hlStart > 0 && lineNum >= hlStart && lineNum <= hlEnd
          const isAnchor = hlStart > 0 && lineNum === hlStart
          return (
            <div
              key={lineNum}
              ref={isAnchor ? highlightRef : undefined}
              className={`flex gap-3 px-2 py-0.5 rounded-sm ${
                isHighlighted
                  ? 'bg-amber-100/90 border-l-2 border-amber-500 text-slate-950 font-medium'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="w-7 shrink-0 text-right text-[10px] text-slate-400 select-none pt-0.5">
                {lineNum}
              </span>
              <span className="whitespace-pre-wrap break-words flex-1">{line || ' '}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
