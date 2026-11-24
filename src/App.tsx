import { AppShell } from './components/AppShell'
import { WorkspaceProvider } from './store/WorkspaceContext'
import { useWorkspace } from './store/workspaceHelpers'
import { AssessmentView } from './views/AssessmentView'
import { AssistantView } from './views/AssistantView'
import { CommandHubView } from './views/CommandHubView'
import { FundIntelligenceView } from './views/FundIntelligenceView'
import { KnowledgeExplorerView } from './views/KnowledgeExplorerView'
import { ReportingAutomationsView } from './views/ReportingAutomationsView'

function ActiveViewRouter() {
  const { activeView } = useWorkspace()

  switch (activeView) {
    case 'assessment':
      return <AssessmentView />
    case 'assistant':
      return <AssistantView />
    case 'intelligence':
      return <FundIntelligenceView />
    case 'knowledge':
      return <KnowledgeExplorerView />
    case 'reporting':
      return <ReportingAutomationsView />
    case 'hub':
    default:
      return <CommandHubView />
  }
}

export function App() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <ActiveViewRouter />
      </AppShell>
    </WorkspaceProvider>
  )
}

export default App
