export type ViewId =
  | 'hub'
  | 'assessment'
  | 'assistant'
  | 'intelligence'
  | 'knowledge'
  | 'reporting'

export type DocumentType =
  | 'quarterly_letter'
  | 'capital_call'
  | 'distribution_notice'
  | 'portfolio_csv'
  | 'ic_meeting_notes'
  | 'workflow_ops_memo'
  | 'mixed_chaos'

export type AssetClass =
  | 'Hedge Funds'
  | 'Private Equity'
  | 'Venture Capital'
  | 'Public Equities'
  | 'Real Estate'
  | 'Fixed Income & Credit'
  | 'Cash & Liquidity'
  | 'Operations & Governance'
  | 'Multi-Asset / Unclassified'

export type ConfidenceTier = 'High' | 'Medium' | 'Low'

export type SentimentTone = 'Constructive' | 'Cautious' | 'Urgent' | 'Neutral' | 'Mixed'

export type ReportCadence = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export interface ExtractedMetrics {
  navMillions?: number
  priorNavMillions?: number
  qoqChangePct?: number
  netIrrPct?: number
  tvpi?: number
  dpi?: number
  calledPct?: number
  unfundedMillions?: number
  commitmentMillions?: number
  capitalCallAmount?: number
  managementFeeAmount?: number
  scheduledFeeAmount?: number
  cashLiquidityMillions?: number
  liquidityFloorMillions?: number
  coInvestAmount?: number
  dueDate?: string
  dueInDays?: number
  reportingPeriod?: string
}

export interface PortfolioRow {
  holding: string
  assetClass: AssetClass
  navMillions: number
  unfundedMillions: number
  weightPct?: number
  asOf?: string
  liquidityTier: 'Immediate' | 'Quarterly' | 'Illiquid'
  notes?: string
}

export interface ActionItem {
  id: string
  title: string
  owner: string
  dueDate?: string
  dueInDays?: number
  priority: 'Critical' | 'High' | 'Medium'
  sourceDocId: string
  sourceDocTitle: string
  completed: boolean
  category: 'Wire / Capital Call' | 'Fee Audit' | 'Co-Investment' | 'IC Governance' | 'Operations' | 'Manager Follow-Up'
}

export interface AnomalyFlag {
  id: string
  severity: 'Critical' | 'Warning' | 'Info'
  title: string
  summary: string
  deltaLabel?: string
  fundName?: string
  sourceDocIds: string[]
  evidenceSnippets: Array<{
    docId: string
    docTitle: string
    excerpt: string
  }>
  recommendedAction: string
}

export interface DocumentChunk {
  id: string
  docId: string
  docTitle: string
  docType: DocumentType
  fundName?: string
  assetClass: AssetClass
  text: string
  startOffset: number
  endOffset: number
  lineStart: number
  lineEnd: number
}

export interface IngestedDocument {
  id: string
  title: string
  fileName: string
  rawContent: string
  format: 'txt' | 'md' | 'csv' | 'json' | 'eml' | 'html' | 'pdf' | 'paste'
  docType: DocumentType
  assetClass: AssetClass
  fundName?: string
  managerName?: string
  ingestedAt: string
  documentDate?: string
  metrics: ExtractedMetrics
  portfolioRows?: PortfolioRow[]
  themes: string[]
  risks: string[]
  entities: string[]
  sentiment: SentimentTone
  summary: string
  confidenceScore: number
  confidenceTier: ConfidenceTier
  confidenceReasons: string[]
  usedFallbackParser: boolean
  parseWarnings: string[]
  actionItems: ActionItem[]
  chunks: DocumentChunk[]
}

export interface TraceEvent {
  id: string
  timestamp: string
  stage:
    | 'INGEST'
    | 'CLASSIFY'
    | 'EXTRACT'
    | 'FALLBACK'
    | 'CROSS_CHECK'
    | 'INDEX'
    | 'CONFIDENCE'
    | 'COMPLETE'
  status: 'ok' | 'warn' | 'alert'
  label: string
  detail: string
  durationMs: number
}

export interface TraceRun {
  id: string
  startedAt: string
  sourceLabel: string
  docId?: string
  finalConfidence?: number
  anomalyCount: number
  events: TraceEvent[]
}

export interface Citation {
  index: number
  docId: string
  docTitle: string
  fundName?: string
  excerpt: string
  startOffset: number
  endOffset: number
  lineStart: number
  lineEnd: number
  confidence: ConfidenceTier
  score: number
}

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  citations: Citation[]
  mode: 'local-deterministic' | 'byok-ephemeral'
  confidence?: ConfidenceTier
  relatedAnomalies?: string[]
}

export interface AssessmentInputs {
  quarterlyCloseDays: number
  manualPdfExcelHoursPerWeek: number
  custodianPortalCount: number
  monthlyEmailAttachments: number
  reconciliationErrorsPerQuarter: number
  centralSearchMaturity: 1 | 2 | 3 | 4 | 5
  workflowNotes: string
}

export interface AssessmentDimension {
  key: string
  label: string
  score: number
  status: 'Critical Gap' | 'Developing' | 'Structured' | 'Optimized'
  finding: string
}

export interface BottleneckItem {
  id: string
  area: string
  severity: 'High' | 'Medium' | 'Low'
  effort: 'Low' | 'Medium' | 'High'
  impactHoursPerQuarter: number
  rootCause: string
  evidence?: string
  aiIntervention: string
}

export interface RoadmapPhase {
  phase: 'Days 1–30 (Quick Wins)' | 'Days 31–60 (Core Automation)' | 'Days 61–90 (Executive Intelligence)'
  objective: string
  deliverables: string[]
  estimatedHoursSavedPerQuarter: number
}

export interface AssessmentReport {
  overallScore: number
  maturityBand: 'Manual / Fragile' | 'Transitional' | 'AI-Assisted' | 'Institutional AI-Native'
  estimatedQuarterlyHoursRecoverable: number
  estimatedCloseCompressionDays: number
  dimensions: AssessmentDimension[]
  bottlenecks: BottleneckItem[]
  roadmap: RoadmapPhase[]
  evidenceSources: string[]
}

export interface FollowUpEmailDraft {
  id: string
  title: string
  to: string
  subject: string
  urgency: 'Critical' | 'High' | 'Standard'
  category: string
  body: string
  sourceDocIds: string[]
}

export interface MeetingDebrief {
  title: string
  sourceLabel: string
  decisions: string[]
  openQuestions: string[]
  ownersAndActions: Array<{
    owner: string
    action: string
    due: string
    priority: 'Critical' | 'High' | 'Medium'
  }>
  riskHighlights: string[]
}

export interface LiquidityEvent {
  id: string
  title: string
  fundName: string
  amountMillions: number
  dueInDays: number
  dueDateLabel: string
  type: 'Mandatory Capital Call' | 'Optional Co-Investment' | 'Pending Verification'
  status: 'Flagged Discrepancy' | 'Decision Needed' | 'Scheduled'
  sourceDocId: string
  notes: string
}

export interface AutomationOpportunity {
  id: string
  name: string
  category: string
  hoursSavedPerQuarter: number
  implementationEffort: 'Low' | 'Medium' | 'High'
  riskReduction: 'High' | 'Medium'
  annualizedValueUsd: number
  roiScore: number
  status: 'Live in Workspace' | 'Ready to Deploy' | 'Phase 2 Candidate'
  description: string
}

export interface ByokConfig {
  enabled: boolean
  endpoint: string
  model: string
  apiKey: string
}

export interface WorkspaceBundle {
  schemaVersion: '1.0.0'
  exportedAt: string
  organization: string
  documents: IngestedDocument[]
  anomalies: AnomalyFlag[]
  actionItems: ActionItem[]
  traceRuns: TraceRun[]
  assessmentInputs: AssessmentInputs
  messages: AssistantMessage[]
}
