import { WORKFLOW_TYPE_OPTIONS, WORKFLOW_TYPES } from '../../../ai/types'

export function RunWorkflowForm({ value, sources = [], clinics = [], onChange, onRun }) {
  const isFindClinics = value.workflowType === WORKFLOW_TYPES.FIND_CLINICS_BY_REGION
  const isFindContacts = value.workflowType === WORKFLOW_TYPES.FIND_CONTACTS
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
      {isFindContacts ? (
        <label>
          Target clinic
          <select
            className="text-input"
            value={value.targetClinicId}
            onChange={(event) => onChange('targetClinicId', event.target.value)}
          >
            <option value="">Select a clinic</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {!isFindContacts ? (
        <>
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
        </>
      ) : null}
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
        <p>
          {isFindClinics
            ? 'The workflow generates clinic candidates, then the user approves before save.'
            : isFindContacts
              ? 'The workflow extracts real website-based contact candidates from leadership, provider, directory, and contact pages, then the user approves before save.'
              : 'Workflow placeholder. Preview-first behavior still applies.'}
        </p>
      </div>
      <button className="primary-button" onClick={onRun}>
        Run workflow
      </button>
    </div>
  )
}
