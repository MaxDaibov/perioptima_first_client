const CONTACT_FIELDS = [
  ['full_name', 'Full name'],
  ['title', 'Title'],
  ['department', 'Department'],
  ['email', 'Email'],
  ['linkedin_url', 'LinkedIn URL'],
  ['role_type', 'Role type'],
  ['source', 'Source links'],
  ['personalization_notes', 'Personalization notes'],
]

export function ContactResultsPreview({
  items,
  selectedItemId,
  onSelectItem,
  onApproveSelected,
  onSaveApproved,
  onToggleSelected,
  onApprove,
  onReject,
  onChangeField,
  isSaving = false,
  searchLeads = null,
  searchedPages = [],
  websiteStatus = null,
}) {
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0]
  const visibleSearchedPages = searchedPages
    .filter((page) => !page.skipped && !page.failed)
    .slice(0, 5)

  return (
    <>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Preview first</p>
          <h3>Contact candidates</h3>
          <p className="muted">These are website-sourced contact candidates extracted from leadership, provider, team, directory, and contact pages on the clinic website.</p>
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

      <ContactSearchLeads
        searchLeads={searchLeads}
        searchedPages={visibleSearchedPages}
        websiteStatus={websiteStatus}
      />

      <div className="workflow-results-layout">
        {!items.length && (
          <div className="workflow-empty-state">
            <p className="eyebrow">No results</p>
            <h3>No verified contacts yet</h3>
            <p className="muted">Use the targeted searches above to continue manual research, or try another clinic with stronger leadership/provider pages.</p>
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
                    <h4>{item.full_name}</h4>
                    <p className="muted">
                      {item.title} • {item.department}
                    </p>
                    <p className="muted">{item.clinic_name}</p>
                  </div>
                  <div className="inline-actions wrap">
                    <span className="chip accent">{item.role_type}</span>
                    <span className="chip">Confidence {Math.round(item.confidence * 100)}%</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedItem && (
              <article className="workflow-preview-card">
                <div className="preview-header">
                  <div>
                    <p className="eyebrow">Selected contact</p>
                    <h4>{selectedItem.full_name}</h4>
                    <p className="muted">{selectedItem.clinic_name}</p>
                  </div>
                  <div className="inline-actions wrap">
                    <span className="chip accent">{selectedItem.role_type}</span>
                    <span className="chip">Confidence {Math.round(selectedItem.confidence * 100)}%</span>
                  </div>
                </div>

                <div className="preview-grid">
                  {CONTACT_FIELDS.map(([field, label]) => (
                    <label
                      key={field}
                      className={field === 'source' || field === 'personalization_notes' ? 'full-span' : ''}
                    >
                      {label}
                      {(field === 'source' || field === 'personalization_notes') ? (
                        <textarea
                          className="editor-area compact"
                          value={selectedItem[field] ?? ''}
                          onChange={(event) => onChangeField(selectedItem.id, field, event.target.value)}
                        />
                      ) : (
                        <input
                          className="text-input"
                          value={selectedItem[field] ?? ''}
                          onChange={(event) => onChangeField(selectedItem.id, field, event.target.value)}
                        />
                      )}
                    </label>
                  ))}

                  <label>
                    Influence score
                    <input
                      className="text-input"
                      type="number"
                      min="0"
                      max="10"
                      value={selectedItem.influence_score}
                      onChange={(event) => onChangeField(selectedItem.id, 'influence_score', event.target.value)}
                    />
                  </label>
                  <label>
                    Champion probability
                    <input
                      className="text-input"
                      type="number"
                      min="0"
                      max="100"
                      value={selectedItem.champion_probability}
                      onChange={(event) => onChangeField(selectedItem.id, 'champion_probability', event.target.value)}
                    />
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

function ContactSearchLeads({ searchLeads, searchedPages, websiteStatus }) {
  if (!searchLeads && !searchedPages.length && !websiteStatus) return null

  return (
    <div className="contact-search-leads">
      <div className="panel-header compact-header">
        <div>
          <p className="eyebrow">Manual search leads</p>
          <h3>Targeted contact searches</h3>
          <p className="muted">
            These are OSINT-style search links for the exact buyer titles we care about. They are not saved as contacts unless a real person is verified.
          </p>
        </div>
      </div>

      {websiteStatus ? (
        <div className={`workflow-source-note ${websiteStatus.status === 'failed' ? 'warning' : ''}`}>
          <p className="eyebrow">
            {websiteStatus.status === 'failed' ? 'Website fallback' : 'Search mode'}
          </p>
          <p>{websiteStatus.message}</p>
        </div>
      ) : null}

      {searchLeads?.targetTitles?.length ? (
        <div className="target-title-row">
          {searchLeads.targetTitles.map((title) => (
            <span key={title} className="chip">{title}</span>
          ))}
        </div>
      ) : null}

      {searchLeads?.titleLeads?.length ? (
        <div className="search-lead-grid compact-search-grid">
          {searchLeads.titleLeads.map((lead) => (
            <article key={lead.id} className="search-lead-card">
              <h4>{lead.title}</h4>
              <p className="muted compact-copy">{lead.roleReason}</p>
              <div className="inline-actions wrap">
                <a className="ghost-button small" href={lead.websiteSearchUrl} target="_blank" rel="noreferrer">
                  Site search
                </a>
                <a className="ghost-button small" href={lead.linkedinSearchUrl} target="_blank" rel="noreferrer">
                  LinkedIn search
                </a>
                <a className="ghost-button small" href={lead.recruitinUrl} target="_blank" rel="noreferrer">
                  Recruitin
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {searchedPages.length ? (
        <div className="workflow-tip">
          <p className="eyebrow">Website pages checked</p>
          {searchedPages.map((page) => (
            <p key={`${page.url}-${page.label}`}>
              <a href={page.url} target="_blank" rel="noreferrer">{page.label || page.url}</a>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}
