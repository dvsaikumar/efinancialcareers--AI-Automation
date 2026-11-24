import { createContext, useContext } from 'react'
import type {
  ActionItem,
  AnomalyFlag,
  AssessmentInputs,
  AssistantMessage,
  ByokConfig,
  Citation,
  IngestedDocument,
  TraceRun,
  ViewId,
} from '../types/domain'

export const DEFAULT_BYOK_ENDPOINT = 'https://api.openai.com/v1/chat/completions'
export const DEFAULT_BYOK_MODEL = 'gpt-4o-mini'

export function downloadTextFile(
  content: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8'
) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export interface WorkspaceContextValue {
  activeView: ViewId
  setActiveView: (view: ViewId) => void
  documents: IngestedDocument[]
  anomalies: AnomalyFlag[]
  actionItems: ActionItem[]
  traceRuns: TraceRun[]
  assessmentInputs: AssessmentInputs
  messages: AssistantMessage[]
  isProcessing: boolean
  activeDemoBanner: string | null
  clearDemoBanner: () => void
  traceDrawerOpen: boolean
  setTraceDrawerOpen: (open: boolean) => void
  activeCitation: Citation | null
  setActiveCitation: (citation: Citation | null) => void
  inspectedDocId: string | null
  setInspectedDocId: (docId: string | null) => void
  byokModalOpen: boolean
  setByokModalOpen: (open: boolean) => void
  byokActive: boolean
  byokEndpointPreview: string
  byokModelPreview: string
  saveByokInMemory: (config: ByokConfig) => void
  clearByokInMemory: () => void
  ingestRawText: (
    rawContent: string,
    title?: string,
    fileName?: string,
    formatHint?: IngestedDocument['format']
  ) => IngestedDocument
  ingestUploadedFile: (file: File) => Promise<IngestedDocument>
  loadAllMeridianFixtures: () => void
  runDemoScenario: (demoNumber: 1 | 2 | 3 | 4 | 5) => Promise<void>
  askAssistant: (query: string) => Promise<void>
  toggleActionItem: (id: string) => void
  addCustomActionItem: (title: string, owner: string, priority: ActionItem['priority']) => void
  updateAssessmentInputs: (patch: Partial<AssessmentInputs>) => void
  resetSession: () => void
  exportWorkspaceJson: () => void
  importWorkspaceJson: (jsonText: string) => { ok: boolean; error?: string }
  removeDocument: (docId: string) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}
