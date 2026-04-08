export function mapWorkflowClinicToClinicEntity(previewClinic, sequence = 0) {
  const timestamp = new Date().toISOString()

  return {
    id: `clinic-${Date.now()}-${sequence + 1}`,
    name: previewClinic.name,
    website: previewClinic.website,
    city: previewClinic.city,
    state: previewClinic.state,
    type: previewClinic.type,
    specialty_focus: previewClinic.specialty_focus,
    size_estimate: previewClinic.size_estimate,
    has_rpm_signals: previewClinic.has_rpm_signals,
    has_nurse_navigator_program: previewClinic.has_nurse_navigator_program,
    strategic_fit_score: Number(previewClinic.strategic_fit_score),
    stage: 'lead',
    pain_hypothesis: previewClinic.pain_hypothesis,
    why_us: previewClinic.why_us,
    notes: previewClinic.notes,
    last_activity_at: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
  }
}
