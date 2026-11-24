import { useState } from 'react'
import { KeyRound, ShieldCheck, Trash2, X } from 'lucide-react'
import { useWorkspace } from '../store/workspaceHelpers'

export function ByokModal() {
  const {
    byokModalOpen,
    setByokModalOpen,
    byokActive,
    byokEndpointPreview,
    byokModelPreview,
    saveByokInMemory,
    clearByokInMemory,
  } = useWorkspace()

  const [endpoint, setEndpoint] = useState(byokEndpointPreview)
  const [model, setModel] = useState(byokModelPreview)
  const [apiKey, setApiKey] = useState('')
  const [enabled, setEnabled] = useState(byokActive)

  if (!byokModalOpen) return null

  const handleSave = () => {
    saveByokInMemory({
      enabled: enabled && apiKey.trim().length > 0,
      endpoint: endpoint.trim(),
      model: model.trim(),
      apiKey: apiKey.trim(),
    })
    setByokModalOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="institutional-card w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Optional Ephemeral BYOK Mode
              </h2>
              <p className="text-[11px] text-slate-500">
                100% offline deterministic mode is active by default
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setByokModalOpen(false)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
            aria-label="Close BYOK modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-semibold">Local-Only / Zero-Persistence Guarantee:</span> Any API
              key entered here lives strictly in React memory (<code className="font-mono-num">useRef</code>).
              It is never written to <code className="font-mono-num">localStorage</code>, cookies, or source code,
              and vanishes immediately on page reload or Session Wipe.
            </div>
          </div>

          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-slate-900">Enable Live LLM Synthesis (OpenAI-Compatible)</p>
              <p className="text-[11px] text-slate-500">
                Falls back automatically to deterministic local engine if unreachable or rate-limited.
              </p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4 accent-emerald-700"
            />
          </label>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Chat Completions Endpoint URL
              </label>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
                className="w-full px-3 py-2 text-xs font-mono-num rounded-md border border-slate-300 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Model Name</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="w-full px-3 py-2 text-xs font-mono-num rounded-md border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ephemeral API Key (Memory Only)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  autoComplete="off"
                  className="w-full px-3 py-2 text-xs font-mono-num rounded-md border border-slate-300 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              clearByokInMemory()
              setApiKey('')
              setEnabled(false)
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 hover:text-rose-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Purge In-Memory Key
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setByokModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[#0B1626] text-white hover:bg-slate-800 transition-colors"
            >
              Apply Ephemeral Config
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
