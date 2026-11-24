import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { deriveInputsFromOpsDocs } from '../engine/assessmentEngine'
import { answerInvestmentQuery } from '../engine/assistantEngine'
import {
  extractTextFromPdfBytes,
  ingestDocument,
  runCrossDocumentChecks,
} from '../engine/selfSteeringRouter'
import {
  CHAOS_STRESS_TEST_PAYLOAD,
  INITIAL_ASSESSMENT_INPUTS,
  MERIDIAN_CREST_FIXTURES,
} from '../fixtures/meridianCrestData'
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
  WorkspaceBundle,
} from '../types/domain'
import {
  DEFAULT_BYOK_ENDPOINT,
  DEFAULT_BYOK_MODEL,
  WorkspaceContext,
  downloadTextFile,
} from './workspaceHelpers'
import type { WorkspaceContextValue } from './workspaceHelpers'

const STORAGE_KEY = 'meridian_crest_workspace_v1'

const VALID_VIEWS: ViewId[] = [
  'hub',
  'assessment',
  'assistant',
  'intelligence',
  'knowledge',
  'reporting',
]

function parseViewFromHash(): ViewId {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0] as ViewId
  return VALID_VIEWS.includes(hash) ? hash : 'hub'
}

interface PersistedState {
  documents: IngestedDocument[]
  anomalies: AnomalyFlag[]
  actionItems: ActionItem[]
  traceRuns: TraceRun[]
  assessmentInputs: AssessmentInputs
  messages: AssistantMessage[]
}

function loadPersistedState(): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    if (!Array.isArray(parsed.documents)) return null
    return {
      documents: parsed.documents,
      anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      traceRuns: Array.isArray(parsed.traceRuns) ? parsed.traceRuns : [],
      assessmentInputs: parsed.assessmentInputs ?? INITIAL_ASSESSMENT_INPUTS,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    }
  } catch {
    return null
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadPersistedState(), [])

  const [activeView, setActiveViewState] = useState<ViewId>(() => parseViewFromHash())
  const [documents, setDocuments] = useState<IngestedDocument[]>(initial?.documents ?? [])
  const [anomalies, setAnomalies] = useState<AnomalyFlag[]>(initial?.anomalies ?? [])
  const [actionItems, setActionItems] = useState<ActionItem[]>(initial?.actionItems ?? [])
  const [traceRuns, setTraceRuns] = useState<TraceRun[]>(initial?.traceRuns ?? [])
  const [assessmentInputs, setAssessmentInputs] = useState<AssessmentInputs>(
    initial?.assessmentInputs ?? INITIAL_ASSESSMENT_INPUTS
  )
  const [messages, setMessages] = useState<AssistantMessage[]>(initial?.messages ?? [])
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeDemoBanner, setActiveDemoBanner] = useState<string | null>(null)
  const [traceDrawerOpen, setTraceDrawerOpen] = useState(false)
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)
  const [inspectedDocId, setInspectedDocId] = useState<string | null>(null)
  const [byokModalOpen, setByokModalOpen] = useState(false)

  // Strictly in-memory BYOK key ref — NEVER written to localStorage
  const byokRef = useRef<ByokConfig>({
    enabled: false,
    endpoint: DEFAULT_BYOK_ENDPOINT,
    model: DEFAULT_BYOK_MODEL,
    apiKey: '',
  })
  const [byokActive, setByokActive] = useState(false)
  const [byokEndpointPreview, setByokEndpointPreview] = useState(DEFAULT_BYOK_ENDPOINT)
  const [byokModelPreview, setByokModelPreview] = useState(DEFAULT_BYOK_MODEL)

  const setActiveView = useCallback((view: ViewId) => {
    setActiveViewState(view)
    if (window.location.hash !== `#/${view}`) {
      window.location.hash = `#/${view}`
    }
  }, [])

  useEffect(() => {
    const onHashChange = () => setActiveViewState(parseViewFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Persist workspace metadata to localStorage (excluding BYOK key)
  useEffect(() => {
    try {
      const payload: PersistedState = {
        documents,
        anomalies,
        actionItems,
        traceRuns: traceRuns.slice(0, 25),
        assessmentInputs,
        messages: messages.slice(-20),
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore storage quota errors cleanly in restricted browser contexts
    }
  }, [documents, anomalies, actionItems, traceRuns, assessmentInputs, messages])

  const commitBatchDocs = useCallback((nextDocs: IngestedDocument[], newRuns: TraceRun[]) => {
    const nextAnomalies = runCrossDocumentChecks(nextDocs)
    setDocuments(nextDocs)
    setAnomalies(nextAnomalies)
    setTraceRuns((prev) => [...newRuns.reverse(), ...prev].slice(0, 30))
    setActionItems((prev) => {
      const existingByTitle = new Map(prev.map((a) => [a.title, a]))
      const merged: ActionItem[] = []
      for (const d of nextDocs) {
        for (const item of d.actionItems) {
          const prior = existingByTitle.get(item.title)
          merged.push(prior ? { ...item, completed: prior.completed } : item)
        }
      }
      // Preserve manual custom actions
      for (const old of prev) {
        if (old.sourceDocId === 'manual' && !merged.some((m) => m.id === old.id)) {
          merged.push(old)
        }
      }
      return merged
    })
    setAssessmentInputs((prev) => deriveInputsFromOpsDocs(prev, nextDocs))
    return nextAnomalies
  }, [])

  const ingestRawText = useCallback(
    (
      rawContent: string,
      title?: string,
      fileName?: string,
      formatHint?: IngestedDocument['format']
    ): IngestedDocument => {
      const result = ingestDocument({ rawContent, title, fileName, formatHint }, documents)
      const deduped = documents.filter((d) => d.title !== result.document.title)
      const nextDocs = [result.document, ...deduped]
      commitBatchDocs(nextDocs, [result.traceRun])
      return result.document
    },
    [documents, commitBatchDocs]
  )

  const ingestUploadedFile = useCallback(
    async (file: File): Promise<IngestedDocument> => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'pdf') {
        const buffer = await file.arrayBuffer()
        const { text } = extractTextFromPdfBytes(buffer, file.name)
        return ingestRawText(text, file.name.replace(/\.pdf$/i, ''), file.name, 'pdf')
      }
      const text = await file.text()
      return ingestRawText(text, undefined, file.name)
    },
    [ingestRawText]
  )

  const ensureFixturesIngested = useCallback(
    (fixtureIds: string[]) => {
      let workingDocs = [...documents]
      const newRuns: TraceRun[] = []

      for (const fid of fixtureIds) {
        const fx = MERIDIAN_CREST_FIXTURES.find((f) => f.id === fid)
        if (!fx) continue
        if (workingDocs.some((d) => d.fileName === fx.fileName)) continue
        const res = ingestDocument(
          {
            rawContent: fx.content,
            fileName: fx.fileName,
            title: fx.title,
            formatHint: fx.format,
          },
          workingDocs
        )
        workingDocs = [...workingDocs, res.document]
        newRuns.push(res.traceRun)
      }

      const nextAnomalies = commitBatchDocs(workingDocs, newRuns)
      return { workingDocs, nextAnomalies }
    },
    [documents, commitBatchDocs]
  )

  const loadAllMeridianFixtures = useCallback(() => {
    ensureFixturesIngested(MERIDIAN_CREST_FIXTURES.map((f) => f.id))
    setActiveDemoBanner(
      'Loaded all 6 Meridian Crest synthetic family office documents into the local browser index.'
    )
  }, [ensureFixturesIngested])

  const askAssistantWithState = useCallback(
    async (query: string, docsOverride?: IngestedDocument[], anomaliesOverride?: AnomalyFlag[]) => {
      const targetDocs = docsOverride ?? documents
      const targetAnomalies = anomaliesOverride ?? anomalies
      const userMsg: AssistantMessage = {
        id: `usr-${Date.now().toString(36)}`,
        role: 'user',
        content: query,
        timestamp: new Date().toISOString(),
        citations: [],
        mode: 'local-deterministic',
      }
      setMessages((prev) => [...prev, userMsg])
      setIsProcessing(true)
      try {
        const reply = await answerInvestmentQuery(
          query,
          targetDocs,
          targetAnomalies,
          byokRef.current.enabled ? byokRef.current : undefined
        )
        setMessages((prev) => [...prev, reply])
        if (reply.citations.length > 0) {
          setActiveCitation(reply.citations[0])
        }
      } finally {
        setIsProcessing(false)
      }
    },
    [documents, anomalies]
  )

  const askAssistant = useCallback(
    async (query: string) => {
      await askAssistantWithState(query)
    },
    [askAssistantWithState]
  )

  const runDemoScenario = useCallback(
    async (demoNumber: 1 | 2 | 3 | 4 | 5) => {
      setIsProcessing(true)
      try {
        if (demoNumber === 1) {
          ensureFixturesIngested(['fixture-ops-memo'])
          setActiveView('assessment')
          setActiveDemoBanner(
            'Demo 1 Active — Ingested Current-State Operations Memo & rendered Operational Maturity Scorecard + 30/60/90 AI Roadmap (Req 0).'
          )
        } else if (demoNumber === 2) {
          ensureFixturesIngested([
            'fixture-apex-q4-letter',
            'fixture-vanguardia-q4-update',
            'fixture-apex-capital-call',
            'fixture-portfolio-csv',
          ])
          setActiveView('intelligence')
          setTraceDrawerOpen(true)
          setActiveDemoBanner(
            'Demo 2 Active — Parsed Q4 Fund Letters, Portfolio CSV & Capital Call Email; automatically caught $50,000 fee discrepancy & $0.5M NAV lag (Req 2).'
          )
        } else if (demoNumber === 3) {
          const { workingDocs, nextAnomalies } = ensureFixturesIngested(
            MERIDIAN_CREST_FIXTURES.map((f) => f.id)
          )
          setActiveView('assistant')
          setActiveDemoBanner(
            'Demo 3 Active — Executed multi-document Executive Q&A with clickable split-pane passage citations (Req 1 & 3).'
          )
          await askAssistantWithState(
            'Can our current cash cover upcoming capital calls, and are there any fund anomalies?',
            workingDocs,
            nextAnomalies
          )
        } else if (demoNumber === 4) {
          ensureFixturesIngested(MERIDIAN_CREST_FIXTURES.map((f) => f.id))
          setActiveView('reporting')
          setActiveDemoBanner(
            'Demo 4 Active — Generated Executive IC Brief, GP Fee-Inquiry Email Draft, IC Debrief & Capital Call Liquidity Radar (Req 4 & 5).'
          )
        } else if (demoNumber === 5) {
          const { workingDocs } = ensureFixturesIngested(MERIDIAN_CREST_FIXTURES.map((f) => f.id))
          const res = ingestDocument(
            {
              rawContent: CHAOS_STRESS_TEST_PAYLOAD.content,
              fileName: CHAOS_STRESS_TEST_PAYLOAD.fileName,
              title: CHAOS_STRESS_TEST_PAYLOAD.title,
            },
            workingDocs
          )
          const deduped = workingDocs.filter((d) => d.fileName !== res.document.fileName)
          commitBatchDocs([res.document, ...deduped], [res.traceRun])
          setActiveView('hub')
          setTraceDrawerOpen(true)
          setActiveDemoBanner(
            `Demo 5 Active — Chaos Stress Test recovered with zero crashes! Fallback parser caught internal IRR conflict & wire-fraud risk (Confidence: ${res.document.confidenceScore}% ${res.document.confidenceTier}).`
          )
        }
      } finally {
        setIsProcessing(false)
      }
    },
    [ensureFixturesIngested, setActiveView, askAssistantWithState, commitBatchDocs]
  )

  const toggleActionItem = useCallback((id: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    )
  }, [])

  const addCustomActionItem = useCallback(
    (title: string, owner: string, priority: ActionItem['priority']) => {
      const item: ActionItem = {
        id: `act-custom-${Date.now().toString(36)}`,
        title,
        owner: owner || 'Investment Team',
        dueDate: 'Upcoming IC',
        priority,
        sourceDocId: 'manual',
        sourceDocTitle: 'Manual IC Task',
        completed: false,
        category: 'IC Governance',
      }
      setActionItems((prev) => [item, ...prev])
    },
    []
  )

  const updateAssessmentInputs = useCallback((patch: Partial<AssessmentInputs>) => {
    setAssessmentInputs((prev) => ({ ...prev, ...patch }))
  }, [])

  const removeDocument = useCallback(
    (docId: string) => {
      const remaining = documents.filter((d) => d.id !== docId)
      const nextAnomalies = runCrossDocumentChecks(remaining)
      setDocuments(remaining)
      setAnomalies(nextAnomalies)
      setActionItems((prev) => prev.filter((a) => a.sourceDocId !== docId))
      if (activeCitation?.docId === docId) setActiveCitation(null)
      if (inspectedDocId === docId) setInspectedDocId(null)
    },
    [documents, activeCitation, inspectedDocId]
  )

  const saveByokInMemory = useCallback((config: ByokConfig) => {
    byokRef.current = { ...config }
    setByokActive(config.enabled && config.apiKey.trim().length > 0)
    setByokEndpointPreview(config.endpoint)
    setByokModelPreview(config.model)
  }, [])

  const clearByokInMemory = useCallback(() => {
    byokRef.current = {
      enabled: false,
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      apiKey: '',
    }
    setByokActive(false)
  }, [])

  const resetSession = useCallback(() => {
    setDocuments([])
    setAnomalies([])
    setActionItems([])
    setTraceRuns([])
    setMessages([])
    setAssessmentInputs(INITIAL_ASSESSMENT_INPUTS)
    setActiveCitation(null)
    setInspectedDocId(null)
    setActiveDemoBanner('Session wiped clean — all local browser storage & in-memory keys cleared.')
    clearByokInMemory()
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [clearByokInMemory])

  const exportWorkspaceJson = useCallback(() => {
    const bundle: WorkspaceBundle = {
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      organization: 'Meridian Crest Family Office (Synthetic Demo)',
      documents,
      anomalies,
      actionItems,
      traceRuns,
      assessmentInputs,
      messages,
    }
    downloadTextFile(
      JSON.stringify(bundle, null, 2),
      `meridian-crest-workspace-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    )
  }, [documents, anomalies, actionItems, traceRuns, assessmentInputs, messages])

  const importWorkspaceJson = useCallback((jsonText: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonText) as Partial<WorkspaceBundle>
      if (!Array.isArray(parsed.documents)) {
        return { ok: false, error: 'Invalid workspace bundle: missing documents array.' }
      }
      setDocuments(parsed.documents)
      setAnomalies(
        Array.isArray(parsed.anomalies)
          ? parsed.anomalies
          : runCrossDocumentChecks(parsed.documents)
      )
      setActionItems(Array.isArray(parsed.actionItems) ? parsed.actionItems : [])
      setTraceRuns(Array.isArray(parsed.traceRuns) ? parsed.traceRuns : [])
      if (parsed.assessmentInputs) setAssessmentInputs(parsed.assessmentInputs)
      if (Array.isArray(parsed.messages)) setMessages(parsed.messages)
      setActiveDemoBanner(`Imported ${parsed.documents.length} document(s) from workspace JSON bundle.`)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to parse JSON bundle.' }
    }
  }, [])

  const value: WorkspaceContextValue = {
    activeView,
    setActiveView,
    documents,
    anomalies,
    actionItems,
    traceRuns,
    assessmentInputs,
    messages,
    isProcessing,
    activeDemoBanner,
    clearDemoBanner: () => setActiveDemoBanner(null),
    traceDrawerOpen,
    setTraceDrawerOpen,
    activeCitation,
    setActiveCitation,
    inspectedDocId,
    setInspectedDocId,
    byokModalOpen,
    setByokModalOpen,
    byokActive,
    byokEndpointPreview,
    byokModelPreview,
    saveByokInMemory,
    clearByokInMemory,
    ingestRawText,
    ingestUploadedFile,
    loadAllMeridianFixtures,
    runDemoScenario,
    askAssistant,
    toggleActionItem,
    addCustomActionItem,
    updateAssessmentInputs,
    resetSession,
    exportWorkspaceJson,
    importWorkspaceJson,
    removeDocument,
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
