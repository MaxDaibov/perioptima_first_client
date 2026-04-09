export function mapWorkflowContactToContactEntity(previewContact, sequence = 0) {
  return {
    id: `contact-${Date.now()}-${sequence + 1}`,
    clinic_id: previewContact.clinic_id,
    full_name: previewContact.full_name,
    title: previewContact.title,
    department: previewContact.department,
    email: previewContact.email,
    linkedin_url: previewContact.linkedin_url,
    phone: previewContact.phone,
    seniority: previewContact.seniority,
    role_type: previewContact.role_type,
    influence_score: Number(previewContact.influence_score),
    champion_probability: Number(previewContact.champion_probability),
    contact_status: previewContact.contact_status,
    personalization_notes: previewContact.personalization_notes,
  }
}
