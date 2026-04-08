export const WORKFLOW_TYPES = {
  FIND_CLINICS_BY_REGION: 'find_clinics_by_region',
  ENRICH_CLINIC: 'enrich_clinic',
  FIND_CONTACTS: 'find_contacts',
  GENERATE_OUTREACH: 'generate_outreach',
  GENERATE_ONE_PAGER: 'generate_one_pager',
  GENERATE_MEETING_BRIEF: 'generate_meeting_brief',
  GENERATE_DOCUMENTATION_SUMMARY: 'generate_documentation_summary',
}

export const WORKFLOW_TYPE_OPTIONS = [
  {
    id: 'wf-1',
    name: 'Find clinics by region',
    type: WORKFLOW_TYPES.FIND_CLINICS_BY_REGION,
    promptTemplate: 'Discover clinics that fit pilot criteria in a target U.S. region.',
  },
  {
    id: 'wf-2',
    name: 'Enrich clinic',
    type: WORKFLOW_TYPES.ENRICH_CLINIC,
    promptTemplate: 'Expand a clinic profile with fit signals, pain hypotheses, and why-us reasoning.',
  },
  {
    id: 'wf-3',
    name: 'Find contacts',
    type: WORKFLOW_TYPES.FIND_CONTACTS,
    promptTemplate: 'Identify likely operators, clinical champions, and executive buyers.',
  },
  {
    id: 'wf-4',
    name: 'Generate outreach',
    type: WORKFLOW_TYPES.GENERATE_OUTREACH,
    promptTemplate: 'Create concise, personalized outbound materials.',
  },
  {
    id: 'wf-5',
    name: 'Generate one-pager',
    type: WORKFLOW_TYPES.GENERATE_ONE_PAGER,
    promptTemplate: 'Draft a clinic-specific one-pager using internal context.',
  },
  {
    id: 'wf-6',
    name: 'Generate meeting brief',
    type: WORKFLOW_TYPES.GENERATE_MEETING_BRIEF,
    promptTemplate: 'Prepare discovery meeting points, risks, and next questions.',
  },
  {
    id: 'wf-7',
    name: 'Generate documentation summary',
    type: WORKFLOW_TYPES.GENERATE_DOCUMENTATION_SUMMARY,
    promptTemplate: 'Condense internal docs into reusable AI-ready context.',
  },
]

export const INITIAL_FIND_CLINICS_FORM = {
  workflowType: WORKFLOW_TYPES.FIND_CLINICS_BY_REGION,
  instruction:
    'Find GI surgery, hepatobiliary, and surgical oncology programs in the western United States that could be credible early pilot partners.',
  region: 'West Coast',
  specialty: 'GI Surgery',
  clinicType: 'Academic medical center',
  resultLimit: 4,
  previewOnly: true,
  saveAsDraft: true,
}
