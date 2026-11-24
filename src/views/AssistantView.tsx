import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  MessageSquareQuote,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { SourcePassageViewer } from '../components/SourcePassageViewer'
import { EXECUTIVE_PROMPTS } from '../engine/assistantEngine'
import { useWorkspace } from '../store/workspaceHelpers'
import type { Citation } from '../types/domain'

function renderCitedLine(
  text: string,
  citations: Citation[],
  activeCitation: Citation | null,
  onSelectCitation: (citation: Citation) => void
): ReactNode[] {
  // Split bold **...** and inline citations [1], [2]
  const tokens = text.split(/(\*\*[^*]+\*\*|\[\d+\])/g)
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-950">
          {token.slice(2, -2)}
        </strong>
      )
    }
    const citMatch = token.match(/^\[(\d+)\]$/)
    if (citMatch) {
      const citNum = parseInt(citMatch[1], 10)
      const matched = citations.find((c) => c.index === citNum)
      if (matched) {
        const isSelected =
          activeCitation?.docId === matched.docId &&
          activeCitation?.lineStart === matched.lineStart
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectCitation(matched)}
            className={`inline-flex items-center font-mono-num text-[11px] font-semibold px-1.5 py-0.2 mx-0.5 rounded border transition-colors ${
              isSelected
                ? 'bg-amber-200 text-amber-950 border-amber-500'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            }`}
            title={`Inspect source: ${matched.docTitle} (Lines ${matched.lineStart}-${matched.lineEnd})`}
          >
            [{citNum}]
          </button>
        )
      }
    }
    return <span key={idx}>{token}</span>
  })
}

export function AssistantView() {
  const {
    documents,
    messages,
    isProcessing,
    askAssistant,
    activeCitation,
    setActiveCitation,
    loadAllMeridianFixtures,
    byokActive,
  } = useWorkspace()

  const [input, setInput] = useState('')

  const citedDocument = activeCitation
    ? documents.find((d) => d.id === activeCitation.docId) ?? null
    : documents[0] ?? null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return
    const q = input.trim()
    setInput('')
    await askAssistant(q)
  }

  return (
    <div className="space-y-4">
      <div className="institutional-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
            Requirement 1 • Split-Pane Verifiable Provenance
          </span>
          <h2 className="text-lg font-semibold text-slate-950">
            AI Investment Assistant with Clickable Source Citations
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            {byokActive ? 'Ephemeral BYOK + Local Index' : '100% Local Deterministic Engine'}
          </span>
          {documents.length === 0 && (
            <button
              type="button"
              onClick={loadAllMeridianFixtures}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B1626] text-white hover:bg-slate-800"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Load Synthetic Dataset
            </button>
          )}
        </div>
      </div>

      {/* Split-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Pane: Conversational Q&A */}
        <div className="lg:col-span-7 institutional-card flex flex-col h-[640px] overflow-hidden">
          {/* Executive Suggested Prompts */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Suggested Executive Prompts
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXECUTIVE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => void askAssistant(prompt)}
                  className="text-left text-[11px] px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <MessageSquareQuote className="w-8 h-8 text-slate-300 mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-slate-800">
                  Ask anything across Meridian Crest&apos;s investment documents
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Every numerical figure, anomaly, and liquidity calculation includes clickable inline citations that highlight the exact source lines on the right.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[92%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#0B1626] text-white'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p>{msg.content}</p>
                    ) : (
                      <div className="space-y-2.5">
                        {msg.content.split('\n\n').map((para, pIdx) => (
                          <div key={pIdx} className="space-y-1">
                            {para.split('\n').map((line, lIdx) => (
                              <p key={lIdx}>
                                {renderCitedLine(
                                  line,
                                  msg.citations,
                                  activeCitation,
                                  setActiveCitation
                                )}
                              </p>
                            ))}
                          </div>
                        ))}

                        {msg.citations.length > 0 && (
                          <div className="pt-2.5 mt-2 border-t border-slate-200/80">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                              Verified Source Citations (Click to Highlight)
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.citations.map((cit) => {
                                const selected =
                                  activeCitation?.docId === cit.docId &&
                                  activeCitation?.lineStart === cit.lineStart
                                return (
                                  <button
                                    key={`${cit.docId}-${cit.index}`}
                                    type="button"
                                    onClick={() => setActiveCitation(cit)}
                                    className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md border transition-colors ${
                                      selected
                                        ? 'bg-amber-100 border-amber-400 text-amber-950 font-medium'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                                    }`}
                                  >
                                    <span className="font-mono-num font-semibold text-emerald-700">
                                      [{cit.index}]
                                    </span>
                                    <span className="truncate max-w-[180px]">{cit.docTitle}</span>
                                    <span className="font-mono-num text-[10px] text-slate-400">
                                      L{cit.lineStart}–{cit.lineEnd}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-1 px-1 flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{msg.role === 'user' ? 'Executive Query' : 'Meridian Crest AI'}</span>
                    {msg.confidence && (
                      <span className="font-mono-num text-emerald-700">
                        • {msg.confidence} Confidence
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Prompt Composer */}
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about unfunded commitments, Apex Horizon IV risks, liquidity floor, or fee anomalies..."
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B1626] text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Ask
            </button>
          </form>
        </div>

        {/* Right Pane: Live Source Citation Inspector */}
        <div className="lg:col-span-5 h-[640px]">
          <SourcePassageViewer document={citedDocument} citation={activeCitation} />
        </div>
      </div>
    </div>
  )
}
