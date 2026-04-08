import { WORKFLOW_TYPE_OPTIONS, WORKFLOW_TYPES } from '../../../ai/types'

export function RunWorkflowForm({ value, sources = [], onChange, onRun }) {
  const isFindClinics = value.workflowType === WORKFLOW_TYPES.FIND_CLINICS_BY_REGION
  const enabledSources = sources.filter((source) => source.enabled)

  return (
    <div className="form-stack">
      <label>
        Workflow type
        <select
          className="text-input"
          value={value.workflowType}
          onChange={(event) => onChange('workflowType', event.target.value)}
        >
          {WORKFLOW_TYPE_OPTIONS.map((workflow) => (
            <option key={workflow.id} value={workflow.type}>
              {workflow.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Instruction
        <textarea
          className="editor-area compact"
          value={value.instruction}
          onChange={(event) => onChange('instruction', event.target.value)}
        />
      </label>
      <label>
        Region
        <input
          className="text-input"
          value={value.region}
          onChange={(event) => onChange('region', event.target.value)}
        />
      </label>
      <label>
        Specialty
        <input
          className="text-input"
          value={value.specialty}
          onChange={(event) => onChange('specialty', event.target.value)}
        />
      </label>
      <label>
        Clinic type
        <input
          className="text-input"
          value={value.clinicType}
          onChange={(event) => onChange('clinicType', event.target.value)}
        />
      </label>
      <label>
        Result limit
        <input
          className="text-input"
          type="number"
          min="1"
          max="10"
          value={value.resultLimit}
          onChange={(event) => onChange('resultLimit', event.target.value)}
        />
      </label>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={value.previewOnly}
          onChange={(event) => onChange('previewOnly', event.target.checked)}
        />
        Preview only
      </label>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={value.saveAsDraft}
          onChange={(event) => onChange('saveAsDraft', event.target.checked)}
        />
        Save as draft
      </label>
      <div className="workflow-tip">
        <p className="eyebrow">Enabled sources</p>
        <p>
          {enabledSources.length
            ? enabledSources.map((source) => source.name).join(', ')
            : 'No workflow sources are enabled right now.'}
        </p>
      </div>
      <div className="workflow-tip">
        <p className="eyebrow">Rule</p>
        <p>{isFindClinics ? 'The workflow generates clinic candidates, then the user approves before save.' : 'Workflow placeholder. Preview-first behavior still applies.'}</p>
      </div>
      <button className="primary-button" onClick={onRun}>
        Run workflow
      </button>
    </div>
  )
}
