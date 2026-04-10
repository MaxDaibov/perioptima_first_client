const EDITABLE_FIELDS = [
  ['name', 'Clinic name'],
  ['website', 'Website'],
  ['city', 'City'],
  ['state', 'State'],
  ['type', 'Clinic type'],
  ['specialty_focus', 'Specialty focus'],
  ['size_estimate', 'Size estimate'],
  ['pain_hypothesis', 'Pain hypothesis'],
  ['why_us', 'Why us'],
  ['notes', 'Notes'],
  ['source', 'Source'],
]

export function WorkflowResultsPreview({
  items,
  selectedItemId,
  sourceStatus,
  onSelectItem,
  onApproveSelected,
  onSaveApproved,
  onToggleSelected,
  onApprove,
  onReject,
  onChangeField,
  isSaving = false,
}) {
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0]

  return (
    <>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Preview first</p>
          <h3>Results preview</h3>
          {sourceStatus && (
            <p className="muted">
              Source:
              {' '}
              {sourceStatus === 'live' ? 'live CMS search' : 'mock fallback'}
            </p>
          )}
        </div>
        <div className="inline-actions wrap">
          <button className="ghost-button" onClick={onApproveSelected} disabled={isSaving}>
            Approve selected
          </button>
          <button className="primary-button" onClick={onSaveApproved} disabled={isSaving}>
            {isSaving ? 'Saving approved...' : 'Save approved'}
          </button>
        </div>
      </div>

      <div className="workflow-results-layout">
        {!items.length && (
          <div className="workflow-empty-state">
            <p className="eyebrow">No results</p>
            <h3>No clinics matched this search</h3>
            <p className="muted">
              Try a broader region, fewer specialty terms, or a simpler clinic type like
              {' '}
              <code>Hospital</code>
              {' '}
              or
              {' '}
              <code>Academic medical center</code>.
            </p>
          </div>
        )}

        {!!items.length && (
          <>
            <div className="workflow-results-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  className={`workflow-list-item ${selectedItem?.id === item.id ? 'active' : ''}`}
                  onClick={() => onSelectItem(item.id)}
                >
                  <div className="preview-header">
                    <label className="selection-toggle" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(event) => onToggleSelected(item.id, event.target.checked)}
                      />
                      Select
                    </label>
                    <div className="inline-actions wrap">
                      {item.approved && <span className="status-pill stage-ready_for_outreach">Approved</span>}
                      {item.rejected && <span className="status-pill priority-low">Rejected</span>}
                    </div>
                  </div>
                  <div className="workflow-list-main">
                    <h4>{item.name}</h4>
                    <p className="muted">
                      {item.city}, {item.state} • {item.type}
                    </p>
                    <p className="muted">{item.specialty_focus}</p>
                  </div>
                  <div className="inline-actions wrap">
                    <span className="chip accent">Fit {item.strategic_fit_score}</span>
                    <span className="chip">Confidence {Math.round(item.confidence * 100)}%</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedItem && (
              <article className="workflow-preview-card">
                <div className="preview-header">
                  <div>
                    <p className="eyebrow">Selected clinic</p>
                    <h4>{selectedItem.name}</h4>
                  </div>
                  <div className="inline-actions wrap">
                    <span className="chip accent">Fit {selectedItem.strategic_fit_score}</span>
                    <span className="chip">Confidence {Math.round(selectedItem.confidence * 100)}%</span>
                  </div>
                </div>

                <div className="preview-grid">
                  {EDITABLE_FIELDS.map(([field, label]) => (
                    <label
                      key={field}
                      className={
                        field === 'pain_hypothesis' || field === 'why_us' || field === 'notes'
                          ? 'full-span'
                          : ''
                      }
                    >
                      {label}
                      {field === 'pain_hypothesis' || field === 'why_us' || field === 'notes' ? (
                        <textarea
                          className="editor-area compact"
                          value={selectedItem[field]}
                          onChange={(event) => onChangeField(selectedItem.id, field, event.target.value)}
                        />
                      ) : (
                        <input
                          className="text-input"
                          value={selectedItem[field]}
                          onChange={(event) => onChangeField(selectedItem.id, field, event.target.value)}
                        />
                      )}
                    </label>
                  ))}

                  <label>
                    RPM signals
                    <select
                      className="text-input"
                      value={selectedItem.has_rpm_signals ? 'true' : 'false'}
                      onChange={(event) =>
                        onChangeField(selectedItem.id, 'has_rpm_signals', event.target.value === 'true')
                      }
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </label>
                  <label>
                    Nurse navigator
                    <select
                      className="text-input"
                      value={selectedItem.has_nurse_navigator_program ? 'true' : 'false'}
                      onChange={(event) =>
                        onChangeField(
                          selectedItem.id,
                          'has_nurse_navigator_program',
                          event.target.value === 'true',
                        )
                      }
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </label>
                </div>

                <div className="inline-actions wrap">
                  <button className="ghost-button" onClick={() => onApprove(selectedItem.id)}>
                    Approve
                  </button>
                  <button className="ghost-button danger" onClick={() => onReject(selectedItem.id)}>
                    Reject
                  </button>
                </div>
              </article>
            )}
          </>
        )}
      </div>
    </>
  )
}
