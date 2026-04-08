import { WORKFLOW_TYPE_OPTIONS } from '../../../ai/types'

function getWorkflowName(workflowType) {
  return (
    WORKFLOW_TYPE_OPTIONS.find((workflow) => workflow.type === workflowType)?.name ?? workflowType
  )
}

export function WorkflowHistory({ runs, activeRunId, onOpenRun }) {
  return (
    <div className="history-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Runs</p>
          <h3>Workflow history</h3>
        </div>
      </div>

      <div className="stack-list">
        {runs.map((run) => (
          <button
            key={run.id}
            className={`history-item history-button ${activeRunId === run.id ? 'active' : ''}`}
            onClick={() => onOpenRun(run.id)}
          >
            <div>
              <p className="eyebrow">{new Date(run.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              <h4>{getWorkflowName(run.workflowType)}</h4>
              <p className="muted">{run.status}</p>
            </div>
            <div className="history-stats">
              <span>{run.generated_items} generated</span>
              <span>{run.approved_items} approved</span>
              <span>{run.saved_items} saved</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
