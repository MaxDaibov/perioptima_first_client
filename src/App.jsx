import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { findClinicsByRegion as findClinicsByRegionMock } from './ai/services/mockClinicFinder'
import { findClinicsByRegionLive } from './ai/services/realClinicFinder'
import { INITIAL_FIND_CLINICS_FORM, WORKFLOW_TYPES } from './ai/types'
import { RunWorkflowForm } from './features/ai-workflows/components/RunWorkflowForm'
import { WorkflowHistory } from './features/ai-workflows/components/WorkflowHistory'
import { WorkflowResultsPreview } from './features/ai-workflows/components/WorkflowResultsPreview'
import { mapWorkflowClinicToClinicEntity } from './features/clinics/utils/mapWorkflowClinicToClinicEntity'
import { importedHealthSystems } from './data/healthSystemsImport'
import { ContactResultsPreview } from './features/ai-workflows/components/ContactResultsPreview'
import { mapWorkflowContactToContactEntity } from './features/contacts/utils/mapWorkflowContactToContactEntity'
import './App.css'

const WORKSPACE_ITEMS = ['Clinics', 'Tasks', 'Assets', 'Docs', 'Sources', 'Research Workflows']
const STAGES = [
  'lead',
  'researching',
  'ready_for_outreach',
  'contacted',
  'replied',
  'meeting_scheduled',
  'pilot_discussion',
  'closed_won',
  'closed_lost',
]
const FIT_SCORE_GUIDE = [
  'Hospital or academic medical center signal',
  'Relevant surgical specialty match',
  'Nurse navigator or patient navigation signal',
  'Remote monitoring or digital care signal',
  'Clear perioperative workflow relevance',
]

const CONTACT_ROLE_HINTS = [
  { pattern: /chief.*surgery|chair.*surgery|surgeon/i, roleType: 'Clinical champion', department: 'Surgery', influence: 9, champion: 82 },
  { pattern: /perioperative|eras|operating room|or\b/i, roleType: 'Operational buyer', department: 'Perioperative Services', influence: 8, champion: 78 },
  { pattern: /anesthes/i, roleType: 'Clinical champion', department: 'Anesthesiology', influence: 8, champion: 72 },
  { pattern: /quality|outcomes|clinical outcomes|improvement/i, roleType: 'Economic buyer', department: 'Quality and Outcomes', influence: 8, champion: 68 },
  { pattern: /navigation|navigator|patient experience/i, roleType: 'Workflow champion', department: 'Patient Navigation', influence: 7, champion: 74 },
]

function inferSeniorityFromTitle(title = '') {
  if (/chief|chair|president|cmo|cio|coo|vp|vice president/i.test(title)) return 'executive'
  if (/director|head|lead/i.test(title)) return 'director'
  if (/manager|coordinator/i.test(title)) return 'manager'
  return 'unknown'
}

let toastTimer = 0

const importedClinicResearch = [
  {
    name: 'UCSF Health',
    website: 'https://www.ucsfhealth.org',
    city: 'San Francisco',
    state: 'CA',
    type: 'Academic Medical Center',
    specialty_focus: 'Hepatobiliary Surgery, GI Oncology, Liver Transplant',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 10,
    pain_hypothesis:
      'Strong ERAS programs exist but post-discharge adherence and monitoring lack real-time visibility.',
    why_us:
      'We extend ERAS protocols into the home with real-time monitoring and automated risk detection.',
    notes: 'Leader in ERAS protocols and complex HPB surgery.',
    tier: 'A',
  },
  {
    name: 'Stanford Health Care',
    website: 'https://stanfordhealthcare.org',
    city: 'Stanford',
    state: 'CA',
    type: 'Academic Medical Center',
    specialty_focus: 'Transplant, GI Oncology, Precision Health',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 10,
    pain_hypothesis:
      'Highly advanced digital infrastructure but fragmented perioperative patient monitoring.',
    why_us:
      'We unify perioperative workflows with continuous monitoring and patient engagement.',
    notes: 'Strong digital health + AI culture.',
    tier: 'A',
  },
  {
    name: 'UC San Diego Health',
    website: 'https://health.ucsd.edu',
    city: 'La Jolla',
    state: 'CA',
    type: 'Academic Medical Center',
    specialty_focus: 'Surgical Oncology, Liver Surgery',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 10,
    pain_hypothesis:
      'AI initiatives exist but limited real-world perioperative patient data collection.',
    why_us:
      'We provide structured patient monitoring data to support clinical AI evaluation.',
    notes: 'Has VP of AI and clinical AI initiatives.',
    tier: 'A',
  },
  {
    name: 'Cedars-Sinai Medical Center',
    website: 'https://www.cedars-sinai.org',
    city: 'Los Angeles',
    state: 'CA',
    type: 'Academic Medical Center',
    specialty_focus: 'GI Surgery, Hepatobiliary, Surgical Oncology',
    size_estimate: 'Very Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 10,
    pain_hypothesis:
      'High surgical volume creates burden on manual care coordination and follow-up.',
    why_us: 'We automate monitoring and reduce manual coordination workload.',
    notes: 'Top-tier GI surgery program.',
    tier: 'A',
  },
  {
    name: 'UW Medicine',
    website: 'https://www.uwmedicine.org',
    city: 'Seattle',
    state: 'WA',
    type: 'Academic Medical Center',
    specialty_focus: 'Liver Transplant, Hepatobiliary Surgery',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 10,
    pain_hypothesis:
      'Complex transplant workflows require continuous patient engagement post-discharge.',
    why_us: 'We support transplant teams with monitoring and adherence workflows.',
    notes: 'Strong transplant coordinator infrastructure.',
    tier: 'A',
  },
  {
    name: 'Mayo Clinic Arizona',
    website: 'https://www.mayoclinic.org',
    city: 'Phoenix',
    state: 'AZ',
    type: 'Academic Medical Center',
    specialty_focus: 'Hepatobiliary Surgery, Oncology',
    size_estimate: 'Very Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 10,
    pain_hypothesis:
      'High-acuity oncology workflows require better outpatient monitoring and adherence.',
    why_us: 'We enable continuous recovery tracking and early complication detection.',
    notes: 'Strong AI and data science leadership.',
    tier: 'A',
  },
  {
    name: 'Keck Medicine of USC',
    website: 'https://www.keckmedicine.org',
    city: 'Los Angeles',
    state: 'CA',
    type: 'Academic Medical Center',
    specialty_focus: 'Liver Transplant, Hepatobiliary Surgery',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 9,
    pain_hypothesis: 'High-risk transplant patients require better post-op monitoring.',
    why_us: 'We support transplant recovery workflows with real-time alerts.',
    notes: 'Has Donate Well program.',
    tier: 'B',
  },
  {
    name: 'City of Hope',
    website: 'https://www.cityofhope.org',
    city: 'Duarte',
    state: 'CA',
    type: 'Cancer Center',
    specialty_focus: 'Surgical Oncology, GI Cancer',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 9,
    pain_hypothesis: 'Cancer surgery patients need structured recovery tracking.',
    why_us: 'We improve post-surgical oncology patient monitoring.',
    notes: 'Strong navigation model.',
    tier: 'B',
  },
  {
    name: 'UCLA Health',
    website: 'https://www.uclahealth.org',
    city: 'Los Angeles',
    state: 'CA',
    type: 'Academic Medical Center',
    specialty_focus:
      'Liver and Multiorgan Transplant, GI Surgery, Colorectal Surgery, Surgical Oncology',
    size_estimate: 'Very Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 8,
    pain_hypothesis:
      'Large transplant and GI programs likely rely on fragmented follow-up workflows across multidisciplinary teams.',
    why_us:
      'We can unify perioperative coordination and extend post-discharge visibility across complex surgical journeys.',
    notes: 'Elite GI program and strong clinical informatics foundation.',
    tier: 'B',
  },
  {
    name: 'Scripps Health',
    website: 'https://www.scripps.org',
    city: 'La Jolla',
    state: 'CA',
    type: 'Health System',
    specialty_focus: 'Hepatobiliary Surgery, GI Surgery, Colorectal Surgery, Transplant',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 8,
    pain_hypothesis:
      'High-volume hepatology and transplant programs need stronger clinic-to-home recovery tracking.',
    why_us:
      'We provide structured monitoring and escalation workflows after discharge for complex surgical populations.',
    notes: 'Regional thought leader in chronic liver disease and GI care.',
    tier: 'B',
  },
  {
    name: 'UC Davis Health',
    website: 'https://health.ucdavis.edu',
    city: 'Sacramento',
    state: 'CA',
    type: 'Academic Medical Center',
    specialty_focus: 'Surgical Oncology, GI Surgery, Transplant Programs',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 8,
    pain_hypothesis:
      'A large regional catchment area increases follow-up burden and risk of losing visibility after discharge.',
    why_us:
      'We improve perioperative adherence and remote monitoring for geographically distributed patients.',
    notes: 'Strong academic and cancer care environment in Northern California.',
    tier: 'B',
  },
  {
    name: 'OHSU',
    website: 'https://www.ohsu.edu',
    city: 'Portland',
    state: 'OR',
    type: 'Academic Medical Center',
    specialty_focus:
      'Abdominal Organ Transplantation, Hepatobiliary Surgery, GI Surgery, Surgical Oncology',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 9,
    pain_hypothesis:
      'ERAS pathways and discharge planning exist, but home adherence and complication detection remain hard to manage consistently.',
    why_us:
      'We digitize ERAS execution outside the hospital and provide real-time symptom and recovery visibility.',
    notes: 'Strong ERAS outcome research and regional transplant leadership.',
    tier: 'B',
  },
  {
    name: 'Providence Swedish Cancer Institute',
    website: 'https://www.providenceswedishcancer.org',
    city: 'Seattle',
    state: 'WA',
    type: 'Cancer Institute',
    specialty_focus: 'Surgical Oncology, GI Oncology, Gynecologic Oncology',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 9,
    pain_hypothesis:
      'High-touch oncology navigation programs are difficult to scale manually across complex surgical patients.',
    why_us:
      'We act as the digital extension of navigator teams with structured monitoring and escalation support.',
    notes: 'Every cancer patient is assigned a navigator.',
    tier: 'B',
  },
  {
    name: 'Virginia Mason Franciscan Health',
    website: 'https://www.vmfh.org',
    city: 'Seattle',
    state: 'WA',
    type: 'Integrated Health System',
    specialty_focus: 'GI Surgery, Hepatobiliary Surgery, Surgical Oncology',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 9,
    pain_hypothesis:
      'A process-driven surgical system still faces gaps in post-discharge execution and visibility.',
    why_us:
      'We provide measurable workflow support for recovery adherence, escalation, and reduction of avoidable surgical waste.',
    notes: 'Lean operations culture via the Virginia Mason Production System.',
    tier: 'B',
  },
  {
    name: 'Fred Hutchinson Cancer Center',
    website: 'https://www.fredhutch.org',
    city: 'Seattle',
    state: 'WA',
    type: 'Academic Cancer Center',
    specialty_focus: 'Surgical Oncology, GI Oncology',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 8,
    pain_hypothesis:
      'Research-driven oncology surgery programs need better structured recovery tracking and real-world patient data.',
    why_us:
      'We support postoperative monitoring and outcome capture for high-risk oncology care pathways.',
    notes: 'High scientific credibility and multidisciplinary oncology care.',
    tier: 'B',
  },
  {
    name: 'El Camino Health',
    website: 'https://www.elcaminohealth.org',
    city: 'Mountain View',
    state: 'CA',
    type: 'Large Hospital System',
    specialty_focus: 'GI Surgery, Surgical Oncology, General Surgery',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 9,
    pain_hypothesis:
      'A digitally mature hospital can still lack a purpose-built perioperative workflow layer for surgery recovery.',
    why_us:
      'We complement advanced digital infrastructure with structured surgical adherence and monitoring workflows.',
    notes: 'CHIME Level 10 digital maturity and strong innovation posture.',
    tier: 'C',
  },
  {
    name: 'Hoag Memorial Hospital Presbyterian',
    website: 'https://www.hoag.org',
    city: 'Newport Beach',
    state: 'CA',
    type: 'Large Tertiary Hospital',
    specialty_focus: 'GI Surgery, Hepatobiliary Surgery, Surgical Oncology',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 7,
    pain_hypothesis:
      'Patient experience expectations are high, but surgical follow-up and recovery engagement may still rely on fragmented pathways.',
    why_us:
      'We improve communication, recovery adherence, and post-op visibility for high-expectation patient populations.',
    notes: 'Strong digestive health positioning in Orange County.',
    tier: 'C',
  },
  {
    name: 'Renown Health',
    website: 'https://www.renown.org',
    city: 'Reno',
    state: 'NV',
    type: 'Academic Health System',
    specialty_focus: 'GI Surgery, Hepatobiliary Surgery, Colorectal Surgery',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 8,
    pain_hypothesis:
      'A growing GI platform needs structured standards for perioperative monitoring and recovery workflows.',
    why_us:
      'We can help define digitally enabled perioperative care as new surgical programs expand.',
    notes: 'Growing academic system with new GI capacity and population health initiatives.',
    tier: 'C',
  },
  {
    name: 'UMC of Southern Nevada',
    website: 'https://www.umcsn.com',
    city: 'Las Vegas',
    state: 'NV',
    type: 'Public Academic Medical Center',
    specialty_focus: 'Transplant, Trauma Surgery, Surgical Oncology',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 7,
    pain_hypothesis:
      'Public high-acuity surgical populations are difficult to monitor after discharge and are at higher risk of readmission.',
    why_us:
      'We improve follow-up visibility and help reduce avoidable complications in complex public-sector surgical care.',
    notes: 'High-acuity academic public hospital with transplant leadership.',
    tier: 'C',
  },
  {
    name: 'Palomar Medical Center',
    website: 'https://www.palomarhealth.org',
    city: 'Escondido',
    state: 'CA',
    type: 'Large Health System',
    specialty_focus: 'GI Surgery, Advanced Surgical Technology',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 7,
    pain_hypothesis:
      'Advanced surgical technology does not automatically solve post-discharge coordination and adherence gaps.',
    why_us:
      'We add a recovery operations layer to complement a technology-forward surgical environment.',
    notes: 'Known for a high-tech hospital-of-the-future identity.',
    tier: 'C',
  },
  {
    name: 'Banner University Medical Center Phoenix',
    website: 'https://www.bannerhealth.com',
    city: 'Phoenix',
    state: 'AZ',
    type: 'Academic Medical Center',
    specialty_focus: 'Surgical Oncology, GI Surgery, HPB Surgery, Colorectal Surgery',
    size_estimate: 'Very Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 9,
    pain_hypothesis:
      'Large regional oncology and surgical programs require stronger outpatient workflow continuity and coordinated recovery monitoring.',
    why_us:
      'We support advanced practice and oncology care teams with digital postoperative monitoring and adherence workflows.',
    notes: 'Banner MD Anderson partnership and strong oncology administration.',
    tier: 'B',
  },
  {
    name: 'Legacy Health',
    website: 'https://www.legacyhealth.org',
    city: 'Portland',
    state: 'OR',
    type: 'Health System',
    specialty_focus: 'Surgical Oncology, GI Surgery, Hepatobiliary Surgery',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    strategic_fit_score: 7,
    pain_hypothesis:
      'Distributed cancer and surgical programs create coordination challenges across sites and post-discharge recovery.',
    why_us:
      'We centralize recovery monitoring and help navigator teams manage patients more consistently across the system.',
    notes: 'Strong navigation and integrative services across a regional network.',
    tier: 'B',
  },
  {
    name: 'St. Joseph’s Hospital and Medical Center',
    website: 'https://www.dignityhealth.org',
    city: 'Phoenix',
    state: 'AZ',
    type: 'Large Tertiary Hospital',
    specialty_focus: 'GI Surgery, Hepatobiliary Surgery, Transplant',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 7,
    pain_hypothesis:
      'Busy tertiary teaching hospitals need stronger postoperative visibility and standardized home recovery tracking.',
    why_us:
      'We help complex surgical teams manage patients beyond discharge with structured digital workflows.',
    notes: 'High-volume tertiary teaching environment in Phoenix.',
    tier: 'C',
  },
  {
    name: 'Valleywise Health',
    website: 'https://valleywisehealth.org',
    city: 'Phoenix',
    state: 'AZ',
    type: 'Public Teaching Hospital',
    specialty_focus: 'Trauma Surgery, General Surgery, GI Surgery',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 6,
    pain_hypothesis:
      'Underserved and high-risk populations are more likely to miss follow-up and deteriorate without structured support.',
    why_us: 'We can improve adherence and remote follow-up in safety-net surgical populations.',
    notes: 'Public teaching environment with strong need for outcomes improvement.',
    tier: 'C',
  },
  {
    name: 'HonorHealth Scottsdale Shea Medical Center',
    website: 'https://www.honorhealth.com',
    city: 'Scottsdale',
    state: 'AZ',
    type: 'Health System',
    specialty_focus: 'GI Surgery, Surgical Oncology',
    size_estimate: 'Large',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    strategic_fit_score: 7,
    pain_hypothesis:
      'Multi-site surgical systems can struggle with consistent perioperative recovery coordination.',
    why_us:
      'We provide a repeatable digital layer for monitoring and engagement across multiple surgical locations.',
    notes: 'Good candidate for proving multi-site workflow scalability.',
    tier: 'C',
  },
]

const seedClinics = buildSeedClinics([...importedClinicResearch, ...importedHealthSystems])
const seedContacts = []
const seedInteractions = []
const seedTasks = buildSeedTasks(seedClinics)
const seedAssets = []
const seedSources = [
  {
    id: 'source-1',
    name: 'CMS NPI Registry',
    category: 'Official registry',
    integration_key: 'cms_npi_registry',
    enabled: true,
    coverage: 'United States provider organizations',
    status: 'active',
    website: 'https://npiregistry.cms.hhs.gov/',
    notes: 'Primary live discovery source for provider organizations and taxonomy-based search.',
    last_synced_at: '2026-04-07T09:00:00.000Z',
  },
  {
    id: 'source-2',
    name: 'CMS Provider Data Catalog',
    category: 'Official directory',
    integration_key: 'cms_provider_data',
    enabled: true,
    coverage: 'Hospital and teaching-hospital verification',
    status: 'active',
    website: 'https://data.cms.gov/provider-data/',
    notes: 'Secondary enrichment source for hospital type, verification, and official provider details.',
    last_synced_at: '2026-04-07T09:05:00.000Z',
  },
]

const seedDocuments = [
  {
    id: 'doc-1',
    title: 'Product vision',
    category: 'Product Overview',
    content:
      'PeriOptima is a digital health platform focused on perioperative care. The platform aims to improve patient outcomes, reduce complication rates, and create measurable cost savings for hospitals, payors, and health systems. Publicly highlighted capabilities include AI-driven risk prediction, real-time patient monitoring, personalized care pathways, pre-op risk stratification, inpatient decision support, and recovery workflows after discharge.',
    summary: 'Digital health platform for perioperative care with analytics, monitoring, and structured pathways.',
    tags: ['vision', 'pitch'],
  },
  {
    id: 'doc-2',
    title: 'ICP hypotheses',
    category: 'ICP / Market Notes',
    content:
      'Best-fit pilot organizations are hospitals, academic medical centers, cancer programs, and health systems with major surgery volume, perioperative coordination complexity, discharge risk, and strong incentives around readmissions, recovery quality, and cost control. High-signal specialties include GI surgery, hepatobiliary surgery, transplant, and surgical oncology.',
    summary: 'Best-fit targets are surgical hospitals and health systems with complex perioperative workflows and readmission risk.',
    tags: ['icp', 'market'],
  },
  {
    id: 'doc-3',
    title: 'Fit scoring rubric',
    category: 'Context Packs',
    content:
      'Fit is a transparent heuristic score for outreach prioritization, not a black-box AI output.\n\nUnderlying signals and weights:\n- hospital or academic medical center = +3\n- relevant surgical specialty match = +3\n- nurse navigator or patient navigation program = +2\n- remote monitoring or digital-care signal = +2\n- clear perioperative workflow relevance in notes, why-us, or pain hypothesis = +2\n\nRaw score range: 0 to 12\n\nMapping to 10-point fit scale:\n- Fit 10 = raw score 11-12\n- Fit 9 = raw score 10\n- Fit 8 = raw score 8-9\n- Fit 7 = raw score 7\n- Fit 6 = raw score 6\n- Fit 5 = raw score 4-5\n- Fit 4 = raw score 3\n- Fit 3 = raw score 2\n- Fit 2 = raw score 1\n- Fit 1 = raw score 0\n\nInterpretation:\n- Fit 9-10: highest-priority pilot research target\n- Fit 7-8: strong outreach candidate\n- Fit 5-6: possible edge case or later-priority target\n- Fit 1-4: weak signal based on current information',
    summary: 'Fit is based on explicit workflow and care-delivery signals, not a black-box AI score.',
    tags: ['fit', 'scoring', 'workflow'],
  },
  {
    id: 'doc-4',
    title: 'Company overview',
    category: 'Product Overview',
    content:
      'PeriOptima describes the product around the full perioperative care journey: pre-op, in-hospital, and at-home recovery. The public site emphasizes risk prediction before complications occur, continuous patient monitoring, personalized care pathways, reduction in 30-day readmissions, lower perioperative costs, and clinical integration suitable for health-system deployment. Public contact shown on the site: info@perioptima.ai.',
    summary: 'PeriOptima spans the full perioperative journey from pre-op preparation through recovery at home.',
    tags: ['company', 'overview', 'product'],
  },
  {
    id: 'doc-5',
    title: 'Public proof points',
    category: 'Outreach Strategy',
    content:
      'Public proof points highlighted on the company site include 30M inpatient operations annually in the US, $75B annual cost of surgical complications, a 10:1 hospital ROI claim, up to 25% reduction in 30-day readmissions, and lower perioperative costs. This document is for internal alignment so outreach drafts and one-pagers use the same public positioning consistently.',
    summary: 'Internal reference for the public ROI, readmission, and market-size claims shown on the company website.',
    tags: ['proof-points', 'messaging', 'roi'],
  },
]

const seedWorkflowHistory = [
  {
    id: 'run-1',
    workflowType: WORKFLOW_TYPES.GENERATE_OUTREACH,
    input: { instruction: 'Tier A West Coast academic center outreach draft' },
    output: '1 outreach email draft',
    status: 'completed',
    created_at: '2026-04-01T09:00:00.000Z',
    generated_items: 1,
    approved_items: 1,
    saved_items: 1,
    previewItems: [],
    sourceStatus: '',
  },
]

const EMPTY_CLINIC_DRAFT = {
  name: '',
  website: '',
  city: '',
  state: '',
  type: '',
  specialty_focus: '',
  size_estimate: '',
  strategic_fit_score: 7,
  stage: 'researching',
  priority_tier: 'B',
  has_rpm_signals: true,
  has_nurse_navigator_program: true,
  pain_hypothesis: '',
  why_us: '',
  notes: '',
}

const EMPTY_CONTACT_DRAFT = {
  clinic_id: '',
  full_name: '',
  title: '',
  department: '',
  email: '',
  role_type: '',
  influence_score: 7,
  champion_probability: 60,
  personalization_notes: '',
}

const EMPTY_TASK_DRAFT = {
  clinic_id: '',
  title: '',
  due_date: '',
  owner: 'Dan',
  priority: 'medium',
  status: 'open',
}

const EMPTY_INTERACTION_DRAFT = {
  clinic_id: '',
  type: 'email',
  date: '',
  summary: '',
  outcome: '',
  next_step: '',
  next_step_date: '',
}

const EMPTY_ASSET_DRAFT = {
  clinic_id: '',
  asset_type: 'outreach email',
  title: '',
  content: '',
  status: 'draft',
  version: 1,
  generated_by_ai: false,
}

const EMPTY_DOCUMENT_DRAFT = {
  title: '',
  category: 'Product Overview',
  content: '',
  summary: '',
  tags: '',
}

const EMPTY_SOURCE_DRAFT = {
  name: '',
  category: 'Official registry',
  integration_key: '',
  enabled: true,
  coverage: '',
  status: 'active',
  website: '',
  notes: '',
  last_synced_at: '',
}

const INITIAL_CLINIC_FILTERS = {
  search: '',
  stage: 'all',
  state: 'all',
  minFit: 'all',
  tier: 'all',
}

const INITIAL_TASK_FILTERS = {
  search: '',
  owner: 'all',
  priority: 'all',
  status: 'all',
  sortBy: 'due_asc',
}

const CLINIC_IMPORT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  SKIP: 'skip',
}

function App() {
  const [activeView, setActiveView] = useState('Clinics')
  const [clinics, setClinics] = useState(seedClinics)
  const [contacts, setContacts] = useState(seedContacts)
  const [interactions, setInteractions] = useState(seedInteractions)
  const [tasks, setTasks] = useState(seedTasks)
  const [assets, setAssets] = useState(seedAssets)
  const [documents, setDocuments] = useState(seedDocuments)
  const [sources, setSources] = useState(seedSources)
  const [clinicFilters, setClinicFilters] = useState(INITIAL_CLINIC_FILTERS)
  const [taskFilters, setTaskFilters] = useState(INITIAL_TASK_FILTERS)
  const [workflowForm, setWorkflowForm] = useState(INITIAL_FIND_CLINICS_FORM)
  const [workflowPreview, setWorkflowPreview] = useState([])
  const [workflowHistory, setWorkflowHistory] = useState(seedWorkflowHistory)
  const [activeWorkflowRunId, setActiveWorkflowRunId] = useState('')
  const [selectedWorkflowPreviewId, setSelectedWorkflowPreviewId] = useState('')
  const [workflowSourceStatus, setWorkflowSourceStatus] = useState('')
  const [contactResearchContext, setContactResearchContext] = useState({
    searchLeads: null,
    searchedPages: [],
    websiteStatus: null,
  })
  const [selectedClinicId, setSelectedClinicId] = useState(seedClinics[0].id)
  const [selectedDocumentId, setSelectedDocumentId] = useState(seedDocuments[0].id)
  const [editor, setEditor] = useState(null)
  const [clinicImport, setClinicImport] = useState(null)
  const [toast, setToast] = useState('')
  const [actionStatus, setActionStatus] = useState('')
  const [workspaceSyncStatus, setWorkspaceSyncStatus] = useState('loading')
  const [workspaceLastSavedAt, setWorkspaceLastSavedAt] = useState('')
  const persistenceEnabledRef = useRef(false)
  const saveTimerRef = useRef(null)
  const actionTimerRef = useRef(null)

  const selectedClinic = clinics.find((clinic) => clinic.id === selectedClinicId) ?? clinics[0]
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? documents[0]
  const filteredClinics = useMemo(
    () =>
      clinics.filter((clinic) => {
        const search = clinicFilters.search.trim().toLowerCase()
        if (
          search &&
          !`${clinic.name} ${clinic.city} ${clinic.state} ${clinic.specialty_focus} ${clinic.type}`
            .toLowerCase()
            .includes(search)
        ) {
          return false
        }

        if (clinicFilters.stage !== 'all' && clinic.stage !== clinicFilters.stage) {
          return false
        }

        if (clinicFilters.state !== 'all' && clinic.state !== clinicFilters.state) {
          return false
        }

        if (clinicFilters.tier !== 'all' && (clinic.priority_tier ?? '') !== clinicFilters.tier) {
          return false
        }

        if (clinicFilters.minFit !== 'all' && clinic.strategic_fit_score < Number(clinicFilters.minFit)) {
          return false
        }

        return true
      }),
    [clinicFilters, clinics],
  )
  const clinicContacts = contacts.filter((contact) => contact.clinic_id === selectedClinic?.id)
  const clinicInteractions = interactions.filter((interaction) => interaction.clinic_id === selectedClinic?.id)
  const clinicTasks = tasks.filter((task) => task.clinic_id === selectedClinic?.id)
  const clinicAssets = assets.filter((asset) => asset.clinic_id === selectedClinic?.id)
  const filteredTasks = useMemo(
    () =>
      tasks
        .filter((task) => {
          const search = taskFilters.search.trim().toLowerCase()
          if (
            search &&
            !`${task.title} ${task.owner} ${findClinicName(clinics, task.clinic_id)}`
              .toLowerCase()
              .includes(search)
          ) {
            return false
          }

          if (taskFilters.owner !== 'all' && task.owner !== taskFilters.owner) {
            return false
          }

          if (taskFilters.priority !== 'all' && task.priority !== taskFilters.priority) {
            return false
          }

          if (taskFilters.status !== 'all' && task.status !== taskFilters.status) {
            return false
          }

          return true
        })
        .sort((left, right) => compareTasks(left, right, taskFilters.sortBy)),
    [clinics, taskFilters, tasks],
  )

  const metrics = useMemo(
    () => ({
      activeClinics: clinics.length,
      openTasks: tasks.filter((task) => task.status === 'open').length,
      meetings: clinics.filter((clinic) => clinic.stage === 'meeting_scheduled').length,
      docs: documents.length,
    }),
    [clinics, documents.length, tasks],
  )

  const clinicStates = useMemo(
    () => Array.from(new Set(clinics.map((clinic) => clinic.state))).sort(),
    [clinics],
  )
  const taskOwners = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.owner).filter(Boolean))).sort(),
    [tasks],
  )

  useEffect(() => {
    if (!filteredClinics.length) return
    if (!filteredClinics.some((clinic) => clinic.id === selectedClinicId)) {
      setSelectedClinicId(filteredClinics[0].id)
    }
  }, [filteredClinics, selectedClinicId])

  useEffect(() => {
    if (!documents.length) return
    if (!documents.some((document) => document.id === selectedDocumentId)) {
      setSelectedDocumentId(documents[0].id)
    }
  }, [documents, selectedDocumentId])

  useEffect(() => {
    let cancelled = false

    async function loadWorkspace() {
      try {
        const response = await fetch('/api/workspace')
        if (!response.ok) {
          if (!cancelled) {
            setWorkspaceSyncStatus('local')
          }
          return
        }

        const payload = await response.json()
        if (cancelled) return

        persistenceEnabledRef.current = true
        setWorkspaceSyncStatus('synced')
        setWorkspaceLastSavedAt(payload.updatedAt ?? '')

        if (payload.state) {
          setClinics(mergeClinicsWithSeed(payload.state.clinics ?? seedClinics))
          setContacts(payload.state.contacts ?? seedContacts)
          setInteractions(payload.state.interactions ?? seedInteractions)
          setTasks(payload.state.tasks ?? seedTasks)
          setAssets(payload.state.assets ?? seedAssets)
          setDocuments(payload.state.documents ?? seedDocuments)
          setSources(payload.state.sources ?? seedSources)
          setWorkflowHistory(payload.state.workflowHistory ?? seedWorkflowHistory)
        }
      } catch {
        if (!cancelled) {
          setWorkspaceSyncStatus('local')
        }
      }
    }

    loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!persistenceEnabledRef.current) return

    const workspaceState = {
      clinics,
      contacts,
      interactions,
      tasks,
      assets,
      documents,
      sources,
      workflowHistory,
    }

    window.clearTimeout(saveTimerRef.current)
    setWorkspaceSyncStatus('saving')
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/workspace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: workspaceState }),
        })

        if (!response.ok) {
          setWorkspaceSyncStatus('error')
          return
        }

        const payload = await response.json()
        setWorkspaceSyncStatus('synced')
        setWorkspaceLastSavedAt(payload.updatedAt ?? new Date().toISOString())
      } catch {
        setWorkspaceSyncStatus('error')
      }
    }, 500)

    return () => window.clearTimeout(saveTimerRef.current)
  }, [assets, clinics, contacts, documents, interactions, sources, tasks, workflowHistory])

  function notify(message) {
    setToast(message)
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => setToast(''), 2500)
  }

  function startActionStatus(message) {
    window.clearTimeout(actionTimerRef.current)
    setActionStatus(message)
  }

  function finishActionStatus(message = '') {
    window.clearTimeout(actionTimerRef.current)
    if (message) {
      setActionStatus(message)
    }
    actionTimerRef.current = window.setTimeout(() => setActionStatus(''), message ? 1200 : 450)
  }

  function updateWorkflowForm(field, value) {
    setWorkflowForm((current) => ({ ...current, [field]: value }))
  }

  function updateClinicFilter(field, value) {
    setClinicFilters((current) => ({ ...current, [field]: value }))
  }

  function updateTaskFilter(field, value) {
    setTaskFilters((current) => ({ ...current, [field]: value }))
  }

  async function handleClinicImportFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    startActionStatus('Reading import file...')
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      const parsedRows = []
      const duplicateContext = [...clinics]
      const existingClinicIds = new Set(clinics.map((clinic) => clinic.id))
      for (const [index, row] of rows.entries()) {
        const parsedRow = buildClinicImportRow(row, index, duplicateContext)
        if (!parsedRow.clinic.name) continue
        parsedRow.canUpdateDuplicate = parsedRow.duplicateId
          ? existingClinicIds.has(parsedRow.duplicateId)
          : false
        parsedRows.push(parsedRow)
        if (!parsedRow.duplicateId) {
          duplicateContext.push({ ...parsedRow.clinic, id: parsedRow.id })
        }
      }

      if (!parsedRows.length) {
        notify('No clinic rows found in this file')
        return
      }

      setClinicImport({
        fileName: file.name,
        rows: parsedRows,
      })
      finishActionStatus('Import preview ready')
      notify(`${parsedRows.length} clinic rows ready to review`)
    } catch {
      finishActionStatus()
      notify('Could not read this file. Try CSV, XLS, or XLSX.')
    }
  }

  function updateClinicImportRow(rowId, changes) {
    setClinicImport((current) =>
      current
        ? {
            ...current,
            rows: current.rows.map((row) => (row.id === rowId ? { ...row, ...changes } : row)),
          }
        : current,
    )
  }

  function applyClinicImportAction(action) {
    setClinicImport((current) =>
      current
        ? {
            ...current,
            rows: current.rows.map((row) =>
              row.duplicateId
                ? {
                    ...row,
                    action:
                      action === CLINIC_IMPORT_ACTIONS.UPDATE && !row.canUpdateDuplicate
                        ? CLINIC_IMPORT_ACTIONS.SKIP
                        : action,
                  }
                : row,
            ),
          }
        : current,
    )
  }

  function saveClinicImport() {
    if (!clinicImport) return

    const now = new Date().toISOString()
    const activeRows = clinicImport.rows.filter((row) => row.action !== CLINIC_IMPORT_ACTIONS.SKIP)
    const rowsToCreate = activeRows.filter((row) => !row.duplicateId)
    const rowsToUpdate = activeRows.filter(
      (row) => row.duplicateId && row.canUpdateDuplicate && row.action === CLINIC_IMPORT_ACTIONS.UPDATE,
    )

    if (!activeRows.length) {
      notify('No clinic rows selected to import')
      return
    }

    startActionStatus('Saving imported clinics...')
    const createdClinics = rowsToCreate.map((row) => ({
      ...row.clinic,
      id: createLocalId('clinic'),
      created_at: now,
      updated_at: now,
      last_activity_at: now,
    }))

    setClinics((current) => {
      const updated = current.map((clinic) => {
        const replacement = rowsToUpdate.find((row) => row.duplicateId === clinic.id)
        if (!replacement) return clinic

        return {
          ...clinic,
          ...replacement.clinic,
          id: clinic.id,
          created_at: clinic.created_at,
          updated_at: now,
          last_activity_at: now,
        }
      })

      return [...createdClinics, ...updated]
    })

    if (createdClinics[0]) {
      setSelectedClinicId(createdClinics[0].id)
    } else if (rowsToUpdate[0]?.duplicateId) {
      setSelectedClinicId(rowsToUpdate[0].duplicateId)
    }

    setClinicImport(null)
    setActiveView('Clinics')
    finishActionStatus('Import saved')
    notify(`Imported ${createdClinics.length} new, updated ${rowsToUpdate.length}`)
  }

  function syncWorkflowRun(runId, previewItems, overrides = {}) {
    setWorkflowHistory((current) =>
      current.map((run) =>
        run.id === runId
          ? {
              ...run,
              ...overrides,
              previewItems,
              generated_items: previewItems.length,
              approved_items: previewItems.filter((item) => item.approved && !item.rejected).length,
            }
          : run,
      ),
    )
  }

  function updateWorkflowPreview(updater, overrides = {}) {
    setWorkflowPreview((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      if (next.length && !next.some((item) => item.id === selectedWorkflowPreviewId)) {
        setSelectedWorkflowPreviewId(next[0].id)
      }
      if (activeWorkflowRunId) {
        syncWorkflowRun(activeWorkflowRunId, next, overrides)
      }
      return next
    })
  }

  async function runWorkflow() {
    startActionStatus('Running workflow...')
    try {
      let preview = []
      let sourceStatus = 'live'
      let researchContext = { searchLeads: null, searchedPages: [], websiteStatus: null }

      if (workflowForm.workflowType === WORKFLOW_TYPES.FIND_CLINICS_BY_REGION) {
        try {
          preview = await findClinicsByRegionLive({
            ...workflowForm,
            sources: sources.filter((source) => source.enabled),
          })
        } catch {
          sourceStatus = 'fallback'
        }

        if (!preview.length) {
          preview = findClinicsByRegionMock(workflowForm)
          sourceStatus = 'fallback'
        }
      } else if (workflowForm.workflowType === WORKFLOW_TYPES.FIND_CONTACTS) {
        const clinic = clinics.find((item) => item.id === workflowForm.targetClinicId)
        if (!clinic) {
          notify('Select a target clinic first')
          return
        }
        try {
          const response = await fetch('/api/contact-research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clinic, limit: workflowForm.resultLimit }),
          })

          if (!response.ok) {
            throw new Error('Contact research request failed')
          }

          const payload = await response.json()
          preview = payload.candidates ?? []
          sourceStatus = payload.sourceStatus ?? 'website'
          researchContext = {
            searchLeads: payload.searchLeads ?? null,
            searchedPages: payload.searchedPages ?? [],
            websiteStatus: payload.websiteStatus ?? null,
          }
        } catch {
          notify('Contact research failed before search links could be generated')
          return
        }
      } else {
        notify('This workflow type is not implemented yet')
        return
      }

      const runId = `run-${Date.now()}`
      const run = {
        id: runId,
        workflowType: workflowForm.workflowType,
        input: { ...workflowForm },
        output:
          workflowForm.workflowType === WORKFLOW_TYPES.FIND_CONTACTS
            ? `${preview.length} contact candidates`
            : `${preview.length} clinic candidates`,
        status: 'preview_ready',
        created_at: new Date().toISOString(),
        generated_items: preview.length,
        approved_items: 0,
        saved_items: 0,
        previewItems: preview,
        researchContext,
        sourceStatus,
      }

      setActiveWorkflowRunId(runId)
      setWorkflowPreview(preview)
      setSelectedWorkflowPreviewId(preview[0]?.id ?? '')
      setWorkflowSourceStatus(sourceStatus)
      setContactResearchContext(researchContext)
      setWorkflowHistory((current) => [run, ...current])

      if (!preview.length) {
        notify(
          workflowForm.workflowType === WORKFLOW_TYPES.FIND_CONTACTS
            ? 'No verified contacts yet. Targeted search links are ready.'
            : 'No clinics found for these filters',
        )
        return
      }

      if (sourceStatus === 'live') {
        notify('Workflow preview generated from live CMS search')
      } else if (workflowForm.workflowType === WORKFLOW_TYPES.FIND_CONTACTS) {
        notify('Website-sourced contact candidates generated')
      }
    } finally {
      finishActionStatus()
    }
  }

  function togglePreviewSelected(itemId, selected) {
    updateWorkflowPreview((current) =>
      current.map((item) => (item.id === itemId ? { ...item, selected } : item)),
    )
  }

  function approveAllPreview() {
    updateWorkflowPreview((current) =>
      current.map((item) => (item.selected ? { ...item, approved: true, rejected: false } : item)),
    )
    notify('Selected items approved')
  }

  function approvePreviewItem(itemId) {
    updateWorkflowPreview((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, approved: true, rejected: false } : item,
      ),
    )
  }

  function rejectPreviewItem(itemId) {
    updateWorkflowPreview((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, approved: false, rejected: true } : item,
      ),
    )
  }

  function updatePreviewItemField(itemId, field, value) {
    updateWorkflowPreview((current) =>
      current.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    )
  }

  function addManualContactCandidate(values) {
    const targetClinic = clinics.find((item) => item.id === workflowForm.targetClinicId)
    if (!targetClinic) {
      notify('Select a target clinic first')
      return
    }

    const fullName = values.full_name?.trim()
    const title = values.title?.trim()
    if (!fullName || !title) {
      notify('Add at least a name and title')
      return
    }

    const roleHint =
      CONTACT_ROLE_HINTS.find((hint) => hint.pattern.test(title)) ?? {
        roleType: 'Potential buyer',
        department: values.department?.trim() || 'Leadership',
        influence: 7,
        champion: 60,
      }
    const department = values.department?.trim() || roleHint.department
    const source = values.source?.trim() || values.linkedin_url?.trim() || targetClinic.website
    const candidate = {
      id: `manual-contact-${Date.now()}`,
      clinic_id: targetClinic.id,
      clinic_name: targetClinic.name,
      full_name: fullName,
      title,
      department,
      email: values.email?.trim() ?? '',
      linkedin_url: values.linkedin_url?.trim() ?? '',
      phone: '',
      seniority: inferSeniorityFromTitle(title),
      role_type: roleHint.roleType,
      influence_score: roleHint.influence,
      champion_probability: roleHint.champion,
      contact_status: 'researching',
      personalization_notes:
        values.personalization_notes?.trim() ||
        `Manually added from Research Workflows after reviewing ${source}.`,
      source,
      confidence: 0.88,
      selected: true,
      approved: true,
      rejected: false,
    }

    updateWorkflowPreview((current) => [candidate, ...current], {
      output: `${workflowPreview.length + 1} contact candidates`,
    })
    setSelectedWorkflowPreviewId(candidate.id)
    notify('Contact added to preview')
  }

  function openWorkflowRun(runId) {
    const run = workflowHistory.find((item) => item.id === runId)
    if (!run) return
    setActiveWorkflowRunId(runId)
    setWorkflowForm((current) => ({ ...current, ...INITIAL_FIND_CLINICS_FORM, ...(run.input ?? {}) }))
    setWorkflowPreview(run.previewItems ?? [])
    setSelectedWorkflowPreviewId(run.previewItems?.[0]?.id ?? '')
    setWorkflowSourceStatus(run.sourceStatus ?? '')
    setContactResearchContext(run.researchContext ?? { searchLeads: null, searchedPages: [], websiteStatus: null })
  }

  function saveApprovedPreview() {
    if (workflowForm.workflowType === WORKFLOW_TYPES.FIND_CONTACTS) {
      saveApprovedContacts()
      return
    }

    const approved = workflowPreview.filter((item) => item.approved && !item.rejected)
    if (!approved.length) {
      notify('Approve at least one item first')
      return
    }

    startActionStatus('Saving approved clinics...')
    const newClinics = approved.map((item, index) => mapWorkflowClinicToClinicEntity(item, index))
    setClinics((current) => [...newClinics, ...current])
    setSelectedClinicId(newClinics[0].id)
    setTasks((current) => [
      ...newClinics.map((clinic, index) => ({
        id: `task-${Date.now()}-${index + 1}`,
        clinic_id: clinic.id,
        title: 'Research contacts for this clinic',
        due_date: addDaysToToday(2),
        owner: 'Dan',
        priority: 'medium',
        status: 'open',
      })),
      ...current,
    ])

    syncWorkflowRun(activeWorkflowRunId, workflowPreview, {
      status: 'saved',
      saved_items: approved.length,
      output: `${approved.length} clinics saved to CRM`,
    })
    finishActionStatus('Approved clinics saved')
    notify('Approved items saved')
  }

  function saveApprovedContacts() {
    const approved = workflowPreview.filter((item) => item.approved && !item.rejected)
    if (!approved.length) {
      notify('Approve at least one contact first')
      return
    }

    startActionStatus('Saving approved contacts...')
    const newContacts = approved.map((item, index) => mapWorkflowContactToContactEntity(item, index))
    setContacts((current) => {
      const existingKeys = new Set(
        current.map((contact) => `${contact.clinic_id}::${contact.full_name.toLowerCase()}::${contact.title.toLowerCase()}`),
      )
      const dedupedNewContacts = newContacts.filter((contact) => {
        const key = `${contact.clinic_id}::${contact.full_name.toLowerCase()}::${contact.title.toLowerCase()}`
        if (existingKeys.has(key)) return false
        existingKeys.add(key)
        return true
      })
      return [...dedupedNewContacts, ...current]
    })

    syncWorkflowRun(activeWorkflowRunId, workflowPreview, {
      status: 'saved',
      saved_items: approved.length,
      output: `${approved.length} contacts saved to CRM`,
    })
    finishActionStatus('Approved contacts saved')
    notify('Approved contacts saved')
  }

  function toggleTaskStatus(taskId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === 'completed' ? 'open' : 'completed' }
          : task,
      ),
    )
  }

  function openSourceEditor(mode, source = null) {
    setEditor({
      entity: 'source',
      mode,
      values: source ? { ...source } : { ...EMPTY_SOURCE_DRAFT, last_synced_at: new Date().toISOString() },
    })
  }

  function openClinicEditor(mode, clinic = null) {
    setEditor({
      entity: 'clinic',
      mode,
      values: clinic ? { ...clinic } : { ...EMPTY_CLINIC_DRAFT },
    })
  }

  function openTaskEditor(mode, task = null, clinicId = selectedClinic?.id ?? clinics[0]?.id ?? '') {
    setEditor({
      entity: 'task',
      mode,
      values: task ? { ...task } : { ...EMPTY_TASK_DRAFT, clinic_id: clinicId, due_date: addDaysToToday(3) },
    })
  }

  function openInteractionEditor(
    mode,
    interaction = null,
    clinicId = selectedClinic?.id ?? clinics[0]?.id ?? '',
  ) {
    setEditor({
      entity: 'interaction',
      mode,
      values: interaction
        ? { ...interaction }
        : { ...EMPTY_INTERACTION_DRAFT, clinic_id: clinicId, date: addDaysToToday(0) },
    })
  }

  function openContactEditor(mode, contact = null, clinicId = selectedClinic?.id ?? clinics[0]?.id ?? '') {
    setEditor({
      entity: 'contact',
      mode,
      values: contact
        ? { ...contact }
        : { ...EMPTY_CONTACT_DRAFT, clinic_id: clinicId },
    })
  }

  function closeEditor() {
    setEditor(null)
  }

  function updateEditorField(field, value) {
    setEditor((current) => (current ? { ...current, values: { ...current.values, [field]: value } } : current))
  }

  function saveEditor() {
    if (!editor) return

    startActionStatus(`Saving ${editor.entity}...`)
    if (editor.entity === 'clinic') {
      saveClinicEditor(editor.values, editor.mode)
      finishActionStatus()
      return
    }

    if (editor.entity === 'task') {
      saveTaskEditor(editor.values, editor.mode)
      finishActionStatus()
      return
    }

    if (editor.entity === 'contact') {
      saveContactEditor(editor.values, editor.mode)
      finishActionStatus()
      return
    }

    if (editor.entity === 'interaction') {
      saveInteractionEditor(editor.values, editor.mode)
      finishActionStatus()
      return
    }

    if (editor.entity === 'asset') {
      saveAssetEditor(editor.values, editor.mode)
      finishActionStatus()
      return
    }

    if (editor.entity === 'document') {
      saveDocumentEditor(editor.values, editor.mode)
      finishActionStatus()
      return
    }

    if (editor.entity === 'source') {
      saveSourceEditor(editor.values, editor.mode)
      finishActionStatus()
    }
  }

  function saveClinicEditor(values, mode) {
    const now = new Date().toISOString()
    const trimmedName = values.name.trim()

    if (!trimmedName) {
      notify('Clinic name is required')
      return
    }

    const duplicate = clinics.find(
      (clinic) =>
        clinic.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        clinic.id !== values.id,
    )

    if (duplicate) {
      notify('A clinic with this name already exists')
      return
    }

    const nextClinic = {
      ...values,
      name: trimmedName,
      website: values.website.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      type: values.type.trim(),
      specialty_focus: values.specialty_focus.trim(),
      size_estimate: values.size_estimate.trim(),
      pain_hypothesis: values.pain_hypothesis.trim(),
      why_us: values.why_us.trim(),
      notes: values.notes.trim(),
      strategic_fit_score: Number(values.strategic_fit_score) || 0,
      created_at: mode === 'edit' ? values.created_at : now,
      updated_at: now,
      last_activity_at: now,
      id: mode === 'edit' ? values.id : createLocalId('clinic'),
    }

    setClinics((current) =>
      mode === 'edit'
        ? current.map((clinic) => (clinic.id === nextClinic.id ? nextClinic : clinic))
        : [nextClinic, ...current],
    )
    setSelectedClinicId(nextClinic.id)
    setActiveView('Clinics')
    closeEditor()
    notify(mode === 'edit' ? 'Clinic updated' : 'Clinic added')
  }

  function saveTaskEditor(values, mode) {
    if (!values.title.trim()) {
      notify('Task title is required')
      return
    }

    const nextTask = {
      ...values,
      id: mode === 'edit' ? values.id : createLocalId('task'),
      title: values.title.trim(),
      owner: values.owner.trim() || 'Dan',
      due_date: values.due_date || addDaysToToday(3),
    }

    setTasks((current) =>
      mode === 'edit'
        ? current.map((task) => (task.id === nextTask.id ? nextTask : task))
        : [nextTask, ...current],
    )
    if (nextTask.clinic_id) {
      setSelectedClinicId(nextTask.clinic_id)
    }
    closeEditor()
    notify(mode === 'edit' ? 'Task updated' : 'Task added')
  }

  function saveContactEditor(values, mode) {
    if (!values.full_name.trim()) {
      notify('Contact name is required')
      return
    }

    const nextContact = {
      ...values,
      id: mode === 'edit' ? values.id : createLocalId('contact'),
      full_name: values.full_name.trim(),
      title: values.title.trim(),
      department: values.department.trim(),
      email: values.email.trim(),
      role_type: values.role_type.trim(),
      influence_score: Number(values.influence_score) || 0,
      champion_probability: Number(values.champion_probability) || 0,
      personalization_notes: values.personalization_notes.trim(),
    }

    setContacts((current) =>
      mode === 'edit'
        ? current.map((contact) => (contact.id === nextContact.id ? nextContact : contact))
        : [nextContact, ...current],
    )
    if (nextContact.clinic_id) {
      setSelectedClinicId(nextContact.clinic_id)
    }
    closeEditor()
    notify(mode === 'edit' ? 'Contact updated' : 'Contact added')
  }

  function saveInteractionEditor(values, mode) {
    if (!values.summary.trim()) {
      notify('Interaction summary is required')
      return
    }

    const nextInteraction = {
      ...values,
      id: mode === 'edit' ? values.id : createLocalId('interaction'),
      type: values.type.trim(),
      date: values.date || addDaysToToday(0),
      summary: values.summary.trim(),
      outcome: values.outcome.trim(),
      next_step: values.next_step.trim(),
      next_step_date: values.next_step_date || '',
    }

    setInteractions((current) =>
      mode === 'edit'
        ? current.map((interaction) =>
            interaction.id === nextInteraction.id ? nextInteraction : interaction,
          )
        : [nextInteraction, ...current],
    )
    closeEditor()
    notify(mode === 'edit' ? 'Interaction updated' : 'Interaction added')
  }

  function saveAssetEditor(values, mode) {
    if (!values.title.trim()) {
      notify('Asset title is required')
      return
    }

    const nextAsset = {
      ...values,
      id: mode === 'edit' ? values.id : createLocalId('asset'),
      title: values.title.trim(),
      asset_type: values.asset_type.trim(),
      content: values.content.trim(),
      status: values.status.trim(),
      version: Number(values.version) || 1,
      generated_by_ai: Boolean(values.generated_by_ai),
    }

    setAssets((current) =>
      mode === 'edit'
        ? current.map((asset) => (asset.id === nextAsset.id ? nextAsset : asset))
        : [nextAsset, ...current],
    )
    closeEditor()
    notify(mode === 'edit' ? 'Asset updated' : 'Asset added')
  }

  function saveDocumentEditor(values, mode) {
    if (!values.title.trim()) {
      notify('Document title is required')
      return
    }

    const nextDocument = {
      ...values,
      id: mode === 'edit' ? values.id : createLocalId('doc'),
      title: values.title.trim(),
      category: values.category.trim(),
      content: values.content.trim(),
      summary: values.summary.trim(),
      tags: normalizeTags(values.tags),
    }

    setDocuments((current) =>
      mode === 'edit'
        ? current.map((document) => (document.id === nextDocument.id ? nextDocument : document))
        : [nextDocument, ...current],
    )
    setSelectedDocumentId(mode === 'edit' ? nextDocument.id : nextDocument.id)
    closeEditor()
    notify(mode === 'edit' ? 'Document updated' : 'Document added')
  }

  function saveSourceEditor(values, mode) {
    if (!values.name.trim()) {
      notify('Source name is required')
      return
    }

    const nextSource = {
      ...values,
      id: mode === 'edit' ? values.id : createLocalId('source'),
      name: values.name.trim(),
      category: values.category.trim(),
      coverage: values.coverage.trim(),
      website: values.website.trim(),
      notes: values.notes.trim(),
      status: values.status.trim(),
      last_synced_at: values.last_synced_at || new Date().toISOString(),
    }

    setSources((current) =>
      mode === 'edit'
        ? current.map((source) => (source.id === nextSource.id ? nextSource : source))
        : [nextSource, ...current],
    )
    closeEditor()
    notify(mode === 'edit' ? 'Source updated' : 'Source added')
  }

  function openAssetEditor(mode, asset = null, clinicId = selectedClinic?.id ?? clinics[0]?.id ?? '') {
    setEditor({
      entity: 'asset',
      mode,
      values: asset ? { ...asset } : { ...EMPTY_ASSET_DRAFT, clinic_id: clinicId },
    })
  }

  function openDocumentEditor(mode, document = null) {
    setEditor({
      entity: 'document',
      mode,
      values: document
        ? { ...document, tags: Array.isArray(document.tags) ? document.tags.join(', ') : document.tags }
        : { ...EMPTY_DOCUMENT_DRAFT },
    })
  }

  function deleteClinic(clinicId) {
    if (clinics.length === 1) {
      notify('Keep at least one clinic in the workspace')
      return
    }

    setClinics((current) => current.filter((clinic) => clinic.id !== clinicId))
    setContacts((current) => current.filter((contact) => contact.clinic_id !== clinicId))
    setTasks((current) => current.filter((task) => task.clinic_id !== clinicId))
    const fallbackClinic = clinics.find((clinic) => clinic.id !== clinicId)
    if (fallbackClinic) {
      setSelectedClinicId(fallbackClinic.id)
    }
    notify('Clinic removed')
  }

  function deleteTask(taskId) {
    setTasks((current) => current.filter((task) => task.id !== taskId))
    notify('Task removed')
  }

  function deleteContact(contactId) {
    setContacts((current) => current.filter((contact) => contact.id !== contactId))
    notify('Contact removed')
  }

  function deleteInteraction(interactionId) {
    setInteractions((current) =>
      current.filter((interaction) => interaction.id !== interactionId),
    )
    notify('Interaction removed')
  }

  function deleteAsset(assetId) {
    setAssets((current) => current.filter((asset) => asset.id !== assetId))
    notify('Asset removed')
  }

  function deleteDocument(documentId) {
    setDocuments((current) => current.filter((document) => document.id !== documentId))
    notify('Document removed')
  }

  function deleteSource(sourceId) {
    setSources((current) => current.filter((source) => source.id !== sourceId))
    notify('Source removed')
  }

  function toggleSourceEnabled(sourceId) {
    setSources((current) =>
      current.map((source) =>
        source.id === sourceId ? { ...source, enabled: !source.enabled } : source,
      ),
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-panel">
          <p className="eyebrow">PeriOptima</p>
          <h1>Outreach workspace</h1>
          <p className="sidebar-copy">
            Internal workspace for identifying surgical pilot targets, researching buyers, and building outreach around perioperative care transformation.
          </p>
        </div>

        <nav className="nav-list">
          {WORKSPACE_ITEMS.map((item) => (
            <button
              key={item}
              className={`nav-item ${activeView === item ? 'active' : ''}`}
              onClick={() => setActiveView(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-metrics">
          <MetricCard label="Active clinics" value={metrics.activeClinics} />
          <MetricCard label="Open tasks" value={metrics.openTasks} accent />
          <MetricCard label="Meetings" value={metrics.meetings} />
          <MetricCard label="Docs" value={metrics.docs} />
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Internal pilot engine</p>
            <h2>{activeView}</h2>
          </div>
          <div className="inline-actions wrap">
            {actionStatus ? (
              <span className="status-pill action-status">
                <span className="spinner-dot" />
                {actionStatus}
              </span>
            ) : null}
            <span className={`status-pill ${getWorkspaceSyncClass(workspaceSyncStatus)}`}>
              {formatWorkspaceSyncLabel(workspaceSyncStatus)}
            </span>
            {workspaceLastSavedAt ? (
              <span className="chip">Saved {formatDateTime(workspaceLastSavedAt)}</span>
            ) : null}
          </div>
        </header>

        {activeView === 'Clinics' && (
          <section className="workspace-layout">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Pipeline</p>
                  <h3>Clinics</h3>
                  <p className="muted">Fit is heuristic and explained in Docs under <strong>Fit scoring rubric</strong>.</p>
                </div>
                <div className="inline-actions wrap">
                  <label className="ghost-button file-button">
                    {actionStatus === 'Reading import file...' ? 'Reading file...' : 'Import CSV/Excel'}
                    <input
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      disabled={Boolean(actionStatus)}
                      onChange={handleClinicImportFile}
                    />
                  </label>
                  <button className="primary-button" onClick={() => openClinicEditor('create')}>
                    Add clinic
                  </button>
                </div>
              </div>
              <div className="clinic-filters">
                <label>
                  Search
                  <input
                    className="text-input"
                    value={clinicFilters.search}
                    onChange={(event) => updateClinicFilter('search', event.target.value)}
                    placeholder="Search clinic, city, specialty"
                  />
                </label>
                <label>
                  Stage
                  <select
                    className="text-input"
                    value={clinicFilters.stage}
                    onChange={(event) => updateClinicFilter('stage', event.target.value)}
                  >
                    <option value="all">All stages</option>
                    {STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {formatLabel(stage)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  State
                  <select
                    className="text-input"
                    value={clinicFilters.state}
                    onChange={(event) => updateClinicFilter('state', event.target.value)}
                  >
                    <option value="all">All states</option>
                    {clinicStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Min fit
                  <select
                    className="text-input"
                    value={clinicFilters.minFit}
                    onChange={(event) => updateClinicFilter('minFit', event.target.value)}
                  >
                    <option value="all">Any fit</option>
                    <option value="10">10</option>
                    <option value="9">9+</option>
                    <option value="8">8+</option>
                    <option value="7">7+</option>
                    <option value="6">6+</option>
                  </select>
                </label>
                <label>
                  Tier
                  <select
                    className="text-input"
                    value={clinicFilters.tier}
                    onChange={(event) => updateClinicFilter('tier', event.target.value)}
                  >
                    <option value="all">All tiers</option>
                    <option value="A">Tier A</option>
                    <option value="B">Tier B</option>
                    <option value="C">Tier C</option>
                  </select>
                </label>
              </div>
              <div className="stack-list">
                {filteredClinics.length ? (
                  filteredClinics.map((clinic) => (
                    <button
                      key={clinic.id}
                      className={`asset-list-item ${selectedClinicId === clinic.id ? 'active' : ''}`}
                      onClick={() => setSelectedClinicId(clinic.id)}
                    >
                      <div>
                        <h4>{clinic.name}</h4>
                        <p className="muted">
                          {clinic.city}, {clinic.state} • {clinic.specialty_focus}
                        </p>
                      </div>
                      <div className="clinic-list-meta">
                        {clinic.priority_tier ? <span className="chip">Tier {clinic.priority_tier}</span> : null}
                        <span className={`status-pill stage-${clinic.stage}`}>{formatLabel(clinic.stage)}</span>
                        <span className="chip accent">Fit {clinic.strategic_fit_score}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    title="No clinics match these filters"
                    body="Try lowering the fit threshold, widening the stage filter, or searching with fewer specialty terms."
                  />
                )}
              </div>
            </div>

            <section className="clinic-detail-panel">
              <div className="panel command-center">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Clinic command center</p>
                    <h3>{selectedClinic.name}</h3>
                    <p className="muted">
                      {selectedClinic.city}, {selectedClinic.state} • {selectedClinic.type}
                    </p>
                  </div>
                  <div className="inline-actions wrap">
                    <button className="ghost-button small" onClick={() => openClinicEditor('edit', selectedClinic)}>
                      Edit clinic
                    </button>
                    <button className="ghost-button small danger" onClick={() => deleteClinic(selectedClinic.id)}>
                      Delete
                    </button>
                    {selectedClinic.priority_tier ? (
                      <span className="chip">Tier {selectedClinic.priority_tier}</span>
                    ) : null}
                    <span className={`status-pill stage-${selectedClinic.stage}`}>{formatLabel(selectedClinic.stage)}</span>
                    <span className="chip accent">Fit {selectedClinic.strategic_fit_score}</span>
                  </div>
                </div>
                <div className="detail-grid">
                  <InfoCard label="Website" value={selectedClinic.website} />
                  <InfoCard label="Priority tier" value={selectedClinic.priority_tier ?? 'Unassigned'} />
                  <InfoCard label="Specialty focus" value={selectedClinic.specialty_focus} />
                  <InfoCard label="Size estimate" value={selectedClinic.size_estimate} />
                  <InfoCard
                    label="Fit explanation"
                    value={buildFitExplanation(selectedClinic)}
                  />
                  <InfoCard label="Pain hypothesis" value={selectedClinic.pain_hypothesis} />
                  <InfoCard label="Why us" value={selectedClinic.why_us} />
                  <InfoCard label="Notes" value={selectedClinic.notes} />
                </div>
              </div>

              <div className="detail-grid">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">Contacts</p>
                      <h3>Key buyers and champions</h3>
                    </div>
                    <button
                      className="ghost-button small"
                      onClick={() => openContactEditor('create', null, selectedClinic.id)}
                    >
                      Add contact
                    </button>
                  </div>
                  <div className="stack-list">
                    {clinicContacts.length ? (
                      clinicContacts.map((contact) => (
                        <article key={contact.id} className="contact-card">
                          <div>
                            <h4>{contact.full_name}</h4>
                            <p className="muted">
                              {contact.title} • {contact.department}
                            </p>
                            <p className="muted">{contact.email || 'No email yet'}</p>
                            <p>{contact.personalization_notes || 'No personalization notes yet.'}</p>
                          </div>
                          <div className="inline-actions wrap">
                            <button
                              className="ghost-button small"
                              onClick={() => openContactEditor('edit', contact)}
                            >
                              Edit
                            </button>
                            <button
                              className="ghost-button small danger"
                              onClick={() => deleteContact(contact.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))
                    ) : (
                      <EmptyState
                        title="No contacts yet"
                        body="Add a buyer, operator, or clinical champion so outreach work can start from this clinic detail view."
                      />
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">Interactions</p>
                      <h3>Timeline</h3>
                    </div>
                    <button
                      className="ghost-button small"
                      onClick={() => openInteractionEditor('create', null, selectedClinic.id)}
                    >
                      Add interaction
                    </button>
                  </div>
                  <div className="timeline">
                    {clinicInteractions.length ? (
                      clinicInteractions.map((interaction) => (
                        <article key={interaction.id} className="timeline-item">
                          <div className="timeline-dot" />
                          <div className="timeline-content">
                            <div className="inline-actions wrap">
                              <p className="eyebrow">
                                {formatLabel(interaction.type)} • {formatDate(interaction.date)}
                              </p>
                              <div className="inline-actions wrap">
                                <button
                                  className="ghost-button small"
                                  onClick={() => openInteractionEditor('edit', interaction)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="ghost-button small danger"
                                  onClick={() => deleteInteraction(interaction.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <h4>{interaction.summary}</h4>
                            <p>{interaction.outcome || 'No outcome recorded yet.'}</p>
                          </div>
                        </article>
                      ))
                    ) : (
                      <EmptyState
                        title="No interactions yet"
                        body="Log outreach emails, calls, meetings, and LinkedIn touches so the clinic timeline becomes useful."
                      />
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">Tasks</p>
                      <h3>Open work</h3>
                    </div>
                    <button className="ghost-button small" onClick={() => openTaskEditor('create', null, selectedClinic.id)}>
                      Add task
                    </button>
                  </div>
                  <div className="stack-list">
                    {clinicTasks.length ? (
                      clinicTasks.map((task) => (
                        <article key={task.id} className="task-card urgent">
                          <div>
                            <h4>{task.title}</h4>
                            <p className="muted">
                              Due {formatDate(task.due_date)} • {task.owner}
                            </p>
                          </div>
                          <div className="task-actions">
                            <button className="ghost-button small" onClick={() => openTaskEditor('edit', task)}>
                              Edit
                            </button>
                            <button className="ghost-button small" onClick={() => toggleTaskStatus(task.id)}>
                              {task.status === 'completed' ? 'Reopen' : 'Complete'}
                            </button>
                            <button className="ghost-button small danger" onClick={() => deleteTask(task.id)}>
                              Delete
                            </button>
                          </div>
                        </article>
                      ))
                    ) : (
                      <EmptyState
                        title="No tasks yet"
                        body="Add the next founder action here, like researching contacts or drafting outreach."
                      />
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">Assets</p>
                      <h3>Clinic materials</h3>
                    </div>
                    <button
                      className="ghost-button small"
                      onClick={() => openAssetEditor('create', null, selectedClinic.id)}
                    >
                      Add asset
                    </button>
                  </div>
                  <div className="stack-list">
                    {clinicAssets.length ? (
                      clinicAssets.map((asset) => (
                        <article key={asset.id} className="asset-snippet">
                          <div>
                            <h4>{asset.title}</h4>
                            <p className="muted">
                              {asset.asset_type} • {asset.status} • v{asset.version}
                            </p>
                          </div>
                          <div className="stack-list">
                            <p>{asset.content}</p>
                            <div className="inline-actions wrap">
                              <button className="ghost-button small" onClick={() => openAssetEditor('edit', asset)}>
                                Edit
                              </button>
                              <button className="ghost-button small danger" onClick={() => deleteAsset(asset.id)}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <EmptyState
                        title="No assets yet"
                        body="Add outreach drafts, follow-ups, one-pagers, or meeting briefs directly from this clinic view."
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>
          </section>
        )}

        {activeView === 'Tasks' && (
          <section className="panel page-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Execution</p>
                <h3>Global tasks</h3>
              </div>
              <button className="primary-button" onClick={() => openTaskEditor('create')}>
                Add task
              </button>
            </div>
            <div className="clinic-filters">
              <label>
                Search
                <input
                  className="text-input"
                  value={taskFilters.search}
                  onChange={(event) => updateTaskFilter('search', event.target.value)}
                  placeholder="Task title, clinic, owner"
                />
              </label>
              <label>
                Owner
                <select
                  className="text-input"
                  value={taskFilters.owner}
                  onChange={(event) => updateTaskFilter('owner', event.target.value)}
                >
                  <option value="all">All owners</option>
                  {taskOwners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  className="text-input"
                  value={taskFilters.priority}
                  onChange={(event) => updateTaskFilter('priority', event.target.value)}
                >
                  <option value="all">All priorities</option>
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                </select>
              </label>
              <label>
                Status
                <select
                  className="text-input"
                  value={taskFilters.status}
                  onChange={(event) => updateTaskFilter('status', event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="open">open</option>
                  <option value="completed">completed</option>
                </select>
              </label>
              <label>
                Sort by
                <select
                  className="text-input"
                  value={taskFilters.sortBy}
                  onChange={(event) => updateTaskFilter('sortBy', event.target.value)}
                >
                  <option value="due_asc">Due date: soonest first</option>
                  <option value="due_desc">Due date: latest first</option>
                  <option value="priority_desc">Priority: high to low</option>
                  <option value="title_asc">Title: A to Z</option>
                </select>
              </label>
            </div>
            <div className="stack-list">
              {filteredTasks.length ? (
                filteredTasks.map((task) => (
                  <article key={task.id} className="task-card">
                    <div>
                      <h4>{task.title}</h4>
                      <p className="muted">
                        {findClinicName(clinics, task.clinic_id)} • {formatDate(task.due_date)} • {task.owner}
                      </p>
                    </div>
                    <div className="inline-actions wrap">
                      <span className={`status-pill priority-${task.priority}`}>{task.priority}</span>
                      <span className="chip">{task.status}</span>
                      <button className="ghost-button small" onClick={() => openTaskEditor('edit', task)}>
                        Edit
                      </button>
                      <button className="ghost-button small" onClick={() => toggleTaskStatus(task.id)}>
                        {task.status === 'completed' ? 'Reopen' : 'Complete'}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No tasks match these filters"
                  body="Try clearing the search, widening the status filter, or switching the sort order."
                />
              )}
            </div>
          </section>
        )}

        {activeView === 'Assets' && (
          <section className="panel page-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Asset studio</p>
                <h3>Reusable outreach materials</h3>
              </div>
              <button className="primary-button" onClick={() => openAssetEditor('create')}>
                Add asset
              </button>
            </div>
            <div className="stack-list">
              {assets.length ? (
                assets.map((asset) => (
                  <article key={asset.id} className="asset-snippet">
                    <div>
                      <h4>{asset.title}</h4>
                      <p className="muted">
                        {findClinicName(clinics, asset.clinic_id)} • {asset.asset_type}
                      </p>
                    </div>
                    <div className="stack-list">
                      <p>{asset.content}</p>
                      <div className="inline-actions wrap">
                        <span className="status-pill">{asset.status}</span>
                        <span className="chip">v{asset.version}</span>
                        <button className="ghost-button small" onClick={() => openAssetEditor('edit', asset)}>
                          Edit
                        </button>
                        <button className="ghost-button small danger" onClick={() => deleteAsset(asset.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="No assets yet"
                  body="Add outreach drafts, one-pagers, or meeting briefs so each clinic has usable founder material."
                />
              )}
            </div>
          </section>
        )}

        {activeView === 'Docs' && (
          <section className="workspace-layout assets-layout">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Documentation</p>
                  <h3>Internal context library</h3>
                </div>
                <div className="inline-actions wrap">
                  <button
                    className="ghost-button"
                    onClick={() => {
                      const fitDoc = documents.find((document) => document.title === 'Fit scoring rubric')
                      if (fitDoc) {
                        setSelectedDocumentId(fitDoc.id)
                      }
                    }}
                  >
                    How fit works
                  </button>
                  <button className="primary-button" onClick={() => openDocumentEditor('create')}>
                    Add doc
                  </button>
                </div>
              </div>
              <div className="stack-list">
                {documents.length ? (
                  documents.map((document) => (
                    <button
                      key={document.id}
                      className={`asset-list-item ${selectedDocumentId === document.id ? 'active' : ''}`}
                      onClick={() => setSelectedDocumentId(document.id)}
                    >
                      <div>
                        <h4>{document.title}</h4>
                        <p className="muted">
                          {document.category} • {document.tags.join(', ')}
                        </p>
                        <p className="muted">{document.summary}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    title="No docs yet"
                    body="Add product context, outreach strategy, and prompt library notes here so the research workflow area has reusable inputs."
                  />
                )}
              </div>
            </div>

            <section className="panel page-panel">
              {selectedDocument ? (
                <div className="stack-list">
                  <div className="panel-header">
                    <div>
                      <p className="eyebrow">{selectedDocument.category}</p>
                      <h3>{selectedDocument.title}</h3>
                      <p className="muted">{selectedDocument.tags.join(', ')}</p>
                    </div>
                    <div className="inline-actions wrap">
                      <button className="ghost-button small" onClick={() => openDocumentEditor('edit', selectedDocument)}>
                        Edit
                      </button>
                      <button className="ghost-button small danger" onClick={() => deleteDocument(selectedDocument.id)}>
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="info-card">
                    <p className="eyebrow">Summary</p>
                    <p>{selectedDocument.summary}</p>
                  </div>

                  <div className="info-card">
                    <p className="eyebrow">Content</p>
                    <DocContent text={selectedDocument.content} />
                  </div>

                  {selectedDocument.title === 'Fit scoring rubric' ? (
                    <div className="detail-grid">
                      <InfoCard label="Fit 10" value="Raw score 11-12. Highest-priority pilot research target with multiple strong workflow and care-delivery signals." />
                      <InfoCard label="Fit 8" value="Raw score 8-9. Strong outreach candidate with several high-signal attributes, but not a perfect match on every dimension." />
                      <InfoCard label="Fit 6" value="Raw score 6. Useful candidate with some real signal, but still missing one or more important workflow or organizational indicators." />
                      <InfoCard label="Signals used" value="Hospital or AMC, specialty match, navigator signal, digital monitoring signal, perioperative workflow relevance." />
                    </div>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  title="Select a document"
                  body="Choose a document from the left to inspect the full internal context."
                />
              )}
            </section>
          </section>
        )}

        {activeView === 'Sources' && (
          <section className="panel page-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Research inputs</p>
                  <h3>Sources</h3>
                  <p className="muted">Enable the sources research workflows can use for clinic discovery and verification.</p>
                </div>
                <button className="primary-button" onClick={() => openSourceEditor('create')}>
                  Add source
                </button>
              </div>
            <div className="stack-list">
              {sources.map((source) => (
                <article key={source.id} className="asset-snippet">
                  <div>
                    <h4>{source.name}</h4>
                    <p className="muted">
                      {source.category} • {source.coverage}
                    </p>
                    <p className="muted">{source.website}</p>
                  </div>
                  <div className="stack-list source-meta">
                    <div className="inline-actions wrap">
                      <span className={`status-pill ${source.enabled ? 'stage-ready_for_outreach' : 'priority-low'}`}>
                        {source.enabled ? 'enabled' : 'disabled'}
                      </span>
                      <span className="chip">{source.status}</span>
                      <span className="chip">Synced {formatDate(source.last_synced_at)}</span>
                    </div>
                    <p>{source.notes}</p>
                    <div className="inline-actions wrap">
                      <button className="ghost-button small" onClick={() => toggleSourceEnabled(source.id)}>
                        {source.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button className="ghost-button small" onClick={() => openSourceEditor('edit', source)}>
                        Edit
                      </button>
                      <button className="ghost-button small danger" onClick={() => deleteSource(source.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'Research Workflows' && (
          <section className="workspace-layout assets-layout">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Research workbench</p>
                  <h3>Controlled workflow execution</h3>
                </div>
              </div>
              <RunWorkflowForm
                value={workflowForm}
                sources={sources}
                clinics={clinics}
                onChange={updateWorkflowForm}
                onRun={runWorkflow}
                isRunning={actionStatus === 'Running workflow...'}
              />
            </div>

            <div className="panel asset-editor workflow-output-panel">
              {workflowForm.workflowType === WORKFLOW_TYPES.FIND_CLINICS_BY_REGION ? (
                <WorkflowResultsPreview
                  items={workflowPreview}
                  selectedItemId={selectedWorkflowPreviewId}
                  sourceStatus={workflowSourceStatus}
                  onSelectItem={setSelectedWorkflowPreviewId}
                  onApproveSelected={approveAllPreview}
                  onSaveApproved={saveApprovedPreview}
                  onToggleSelected={togglePreviewSelected}
                  onApprove={approvePreviewItem}
                  onReject={rejectPreviewItem}
                  onChangeField={updatePreviewItemField}
                  isSaving={actionStatus === 'Saving approved clinics...'}
                />
              ) : null}

              {workflowForm.workflowType === WORKFLOW_TYPES.FIND_CONTACTS ? (
                <ContactResultsPreview
                  items={workflowPreview}
                  selectedItemId={selectedWorkflowPreviewId}
                  onSelectItem={setSelectedWorkflowPreviewId}
                  onApproveSelected={approveAllPreview}
                  onSaveApproved={saveApprovedPreview}
                  onToggleSelected={togglePreviewSelected}
                  onApprove={approvePreviewItem}
                  onReject={rejectPreviewItem}
                  onChangeField={updatePreviewItemField}
                  onAddManualContact={addManualContactCandidate}
                  isSaving={actionStatus === 'Saving approved contacts...'}
                  searchLeads={contactResearchContext.searchLeads}
                  searchedPages={contactResearchContext.searchedPages}
                  websiteStatus={contactResearchContext.websiteStatus}
                />
              ) : null}

              <WorkflowHistory
                runs={workflowHistory}
                activeRunId={activeWorkflowRunId}
                onOpenRun={openWorkflowRun}
              />
            </div>
          </section>
        )}
      </main>

      {editor ? (
        <EditorModal
          editor={editor}
          clinics={clinics}
          onChangeField={updateEditorField}
          onClose={closeEditor}
          onSave={saveEditor}
          isSaving={actionStatus.startsWith('Saving ') && actionStatus.endsWith('...')}
        />
      ) : null}

      {clinicImport ? (
        <ClinicImportModal
          clinicImport={clinicImport}
          onClose={() => setClinicImport(null)}
          onChangeRow={updateClinicImportRow}
          onBulkDuplicateAction={applyClinicImportAction}
          onSave={saveClinicImport}
          isSaving={actionStatus === 'Saving imported clinics...'}
        />
      ) : null}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function MetricCard({ label, value, accent = false }) {
  return (
    <div className={`metric-card ${accent ? 'accent' : ''}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="info-card">
      <p className="eyebrow">{label}</p>
      <p>{value}</p>
    </div>
  )
}

function DocContent({ text }) {
  return (
    <div className="doc-content">
      {String(text)
        .split('\n')
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={`${paragraph.slice(0, 12)}-${index}`}>{paragraph}</p>
        ))}
    </div>
  )
}

function EmptyState({ title, body }) {
  return (
    <div className="workflow-empty-state">
      <p className="eyebrow">Ready for input</p>
      <h4>{title}</h4>
      <p>{body}</p>
    </div>
  )
}

function ClinicImportModal({
  clinicImport,
  onClose,
  onChangeRow,
  onBulkDuplicateAction,
  onSave,
  isSaving = false,
}) {
  const newCount = clinicImport.rows.filter((row) => !row.duplicateId).length
  const duplicateCount = clinicImport.rows.filter((row) => row.duplicateId).length
  const saveCount = clinicImport.rows.filter((row) => row.action !== CLINIC_IMPORT_ACTIONS.SKIP).length

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide-modal" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Clinic import</p>
            <h3>Review CSV / Excel upload</h3>
            <p className="muted">
              {clinicImport.fileName} • {newCount} new • {duplicateCount} possible duplicates
            </p>
          </div>
          <button className="ghost-button small" onClick={onClose}>
            Close
          </button>
        </div>

        {duplicateCount ? (
          <div className="import-toolbar">
            <p className="muted">
              Duplicate rows are skipped by default. Choose update only when you want the file to overwrite existing CRM fields.
            </p>
            <div className="inline-actions wrap">
              <button
                className="ghost-button small"
                onClick={() => onBulkDuplicateAction(CLINIC_IMPORT_ACTIONS.SKIP)}
              >
                Skip all duplicates
              </button>
              <button
                className="ghost-button small"
                onClick={() => onBulkDuplicateAction(CLINIC_IMPORT_ACTIONS.UPDATE)}
              >
                Update all duplicates
              </button>
            </div>
          </div>
        ) : null}

        <div className="import-table-wrap">
          <table className="data-table import-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Clinic</th>
                <th>Location</th>
                <th>Type / specialty</th>
                <th>Tier / fit</th>
                <th>Duplicate check</th>
              </tr>
            </thead>
            <tbody>
              {clinicImport.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <select
                      className="text-input compact-select"
                      value={row.action}
                      onChange={(event) => onChangeRow(row.id, { action: event.target.value })}
                    >
                      {!row.duplicateId ? <option value={CLINIC_IMPORT_ACTIONS.CREATE}>Import new</option> : null}
                      {row.duplicateId ? <option value={CLINIC_IMPORT_ACTIONS.SKIP}>Skip</option> : null}
                      {row.canUpdateDuplicate ? (
                        <option value={CLINIC_IMPORT_ACTIONS.UPDATE}>Update existing</option>
                      ) : null}
                    </select>
                  </td>
                  <td>
                    <strong>{row.clinic.name}</strong>
                    <p className="muted">{row.clinic.website || 'No website provided'}</p>
                  </td>
                  <td>
                    <p>{[row.clinic.city, row.clinic.state].filter(Boolean).join(', ') || 'Unknown'}</p>
                  </td>
                  <td>
                    <p>{row.clinic.type || 'Unknown type'}</p>
                    <p className="muted">{row.clinic.specialty_focus}</p>
                  </td>
                  <td>
                    <div className="inline-actions wrap">
                      {row.clinic.priority_tier ? <span className="chip">Tier {row.clinic.priority_tier}</span> : null}
                      <span className="chip accent">Fit {row.clinic.strategic_fit_score}</span>
                    </div>
                  </td>
                  <td>
                    {row.duplicateId ? (
                      <span className="status-pill priority-medium">
                        {row.canUpdateDuplicate ? `Matches ${row.duplicateName}` : 'Duplicate in file'}
                      </span>
                    ) : (
                      <span className="status-pill stage-ready_for_outreach">New</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button className="primary-button" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving import...' : `Save ${saveCount} rows`}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditorModal({ editor, clinics, onChangeField, onClose, onSave, isSaving = false }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">CRM editor</p>
            <h3>{editor.mode === 'edit' ? `Edit ${editor.entity}` : `Add ${editor.entity}`}</h3>
          </div>
          <button className="ghost-button small" onClick={onClose} disabled={isSaving}>
            Close
          </button>
        </div>

        {editor.entity === 'clinic' ? (
          <ClinicEditorFields values={editor.values} onChangeField={onChangeField} />
        ) : null}

        {editor.entity === 'task' ? (
          <TaskEditorFields values={editor.values} clinics={clinics} onChangeField={onChangeField} />
        ) : null}

        {editor.entity === 'contact' ? (
          <ContactEditorFields values={editor.values} clinics={clinics} onChangeField={onChangeField} />
        ) : null}

        {editor.entity === 'interaction' ? (
          <InteractionEditorFields values={editor.values} clinics={clinics} onChangeField={onChangeField} />
        ) : null}

        {editor.entity === 'asset' ? (
          <AssetEditorFields values={editor.values} clinics={clinics} onChangeField={onChangeField} />
        ) : null}

        {editor.entity === 'document' ? (
          <DocumentEditorFields values={editor.values} onChangeField={onChangeField} />
        ) : null}

        {editor.entity === 'source' ? (
          <SourceEditorFields values={editor.values} onChangeField={onChangeField} />
        ) : null}

        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button className="primary-button" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ClinicEditorFields({ values, onChangeField }) {
  return (
    <div className="form-grid">
      <label>
        Clinic name
        <input className="text-input" value={values.name} onChange={(event) => onChangeField('name', event.target.value)} />
      </label>
      <label>
        Website
        <input className="text-input" value={values.website} onChange={(event) => onChangeField('website', event.target.value)} />
      </label>
      <label>
        City
        <input className="text-input" value={values.city} onChange={(event) => onChangeField('city', event.target.value)} />
      </label>
      <label>
        State
        <input className="text-input" value={values.state} onChange={(event) => onChangeField('state', event.target.value)} />
      </label>
      <label>
        Clinic type
        <input className="text-input" value={values.type} onChange={(event) => onChangeField('type', event.target.value)} />
      </label>
      <label>
        Specialty focus
        <input className="text-input" value={values.specialty_focus} onChange={(event) => onChangeField('specialty_focus', event.target.value)} />
      </label>
      <label>
        Size estimate
        <input className="text-input" value={values.size_estimate} onChange={(event) => onChangeField('size_estimate', event.target.value)} />
      </label>
      <label>
        Strategic fit score
        <input
          className="text-input"
          type="number"
          min="0"
          max="10"
          value={values.strategic_fit_score}
          onChange={(event) => onChangeField('strategic_fit_score', event.target.value)}
        />
      </label>
      <label>
        Stage
        <select className="text-input" value={values.stage} onChange={(event) => onChangeField('stage', event.target.value)}>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {formatLabel(stage)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Priority tier
        <select
          className="text-input"
          value={values.priority_tier ?? ''}
          onChange={(event) => onChangeField('priority_tier', event.target.value)}
        >
          <option value="">Unassigned</option>
          <option value="A">Tier A</option>
          <option value="B">Tier B</option>
          <option value="C">Tier C</option>
        </select>
      </label>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={Boolean(values.has_rpm_signals)}
          onChange={(event) => onChangeField('has_rpm_signals', event.target.checked)}
        />
        RPM signals present
      </label>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={Boolean(values.has_nurse_navigator_program)}
          onChange={(event) => onChangeField('has_nurse_navigator_program', event.target.checked)}
        />
        Nurse navigator program present
      </label>
      <label className="full-span">
        Pain hypothesis
        <textarea
          className="editor-area compact"
          value={values.pain_hypothesis}
          onChange={(event) => onChangeField('pain_hypothesis', event.target.value)}
        />
      </label>
      <label className="full-span">
        Why us
        <textarea
          className="editor-area compact"
          value={values.why_us}
          onChange={(event) => onChangeField('why_us', event.target.value)}
        />
      </label>
      <label className="full-span">
        Notes
        <textarea
          className="editor-area compact"
          value={values.notes}
          onChange={(event) => onChangeField('notes', event.target.value)}
        />
      </label>
    </div>
  )
}

function TaskEditorFields({ values, clinics, onChangeField }) {
  return (
    <div className="form-grid">
      <label className="full-span">
        Title
        <input className="text-input" value={values.title} onChange={(event) => onChangeField('title', event.target.value)} />
      </label>
      <label>
        Clinic
        <select className="text-input" value={values.clinic_id} onChange={(event) => onChangeField('clinic_id', event.target.value)}>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Due date
        <input className="text-input" type="date" value={values.due_date} onChange={(event) => onChangeField('due_date', event.target.value)} />
      </label>
      <label>
        Owner
        <input className="text-input" value={values.owner} onChange={(event) => onChangeField('owner', event.target.value)} />
      </label>
      <label>
        Priority
        <select className="text-input" value={values.priority} onChange={(event) => onChangeField('priority', event.target.value)}>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
      </label>
      <label>
        Status
        <select className="text-input" value={values.status} onChange={(event) => onChangeField('status', event.target.value)}>
          <option value="open">open</option>
          <option value="completed">completed</option>
        </select>
      </label>
    </div>
  )
}

function ContactEditorFields({ values, clinics, onChangeField }) {
  return (
    <div className="form-grid">
      <label>
        Full name
        <input className="text-input" value={values.full_name} onChange={(event) => onChangeField('full_name', event.target.value)} />
      </label>
      <label>
        Clinic
        <select className="text-input" value={values.clinic_id} onChange={(event) => onChangeField('clinic_id', event.target.value)}>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Title
        <input className="text-input" value={values.title} onChange={(event) => onChangeField('title', event.target.value)} />
      </label>
      <label>
        Department
        <input className="text-input" value={values.department} onChange={(event) => onChangeField('department', event.target.value)} />
      </label>
      <label>
        Email
        <input className="text-input" value={values.email} onChange={(event) => onChangeField('email', event.target.value)} />
      </label>
      <label>
        Role type
        <input className="text-input" value={values.role_type} onChange={(event) => onChangeField('role_type', event.target.value)} />
      </label>
      <label>
        Influence score
        <input
          className="text-input"
          type="number"
          min="0"
          max="10"
          value={values.influence_score}
          onChange={(event) => onChangeField('influence_score', event.target.value)}
        />
      </label>
      <label>
        Champion probability
        <input
          className="text-input"
          type="number"
          min="0"
          max="100"
          value={values.champion_probability}
          onChange={(event) => onChangeField('champion_probability', event.target.value)}
        />
      </label>
      <label className="full-span">
        Personalization notes
        <textarea
          className="editor-area compact"
          value={values.personalization_notes}
          onChange={(event) => onChangeField('personalization_notes', event.target.value)}
        />
      </label>
    </div>
  )
}

function InteractionEditorFields({ values, clinics, onChangeField }) {
  return (
    <div className="form-grid">
      <label>
        Clinic
        <select className="text-input" value={values.clinic_id} onChange={(event) => onChangeField('clinic_id', event.target.value)}>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Type
        <select className="text-input" value={values.type} onChange={(event) => onChangeField('type', event.target.value)}>
          <option value="email">email</option>
          <option value="call">call</option>
          <option value="linkedin">linkedin</option>
          <option value="meeting">meeting</option>
        </select>
      </label>
      <label>
        Date
        <input className="text-input" type="date" value={values.date} onChange={(event) => onChangeField('date', event.target.value)} />
      </label>
      <label>
        Next step date
        <input className="text-input" type="date" value={values.next_step_date} onChange={(event) => onChangeField('next_step_date', event.target.value)} />
      </label>
      <label className="full-span">
        Summary
        <textarea
          className="editor-area compact"
          value={values.summary}
          onChange={(event) => onChangeField('summary', event.target.value)}
        />
      </label>
      <label className="full-span">
        Outcome
        <textarea
          className="editor-area compact"
          value={values.outcome}
          onChange={(event) => onChangeField('outcome', event.target.value)}
        />
      </label>
      <label className="full-span">
        Next step
        <textarea
          className="editor-area compact"
          value={values.next_step}
          onChange={(event) => onChangeField('next_step', event.target.value)}
        />
      </label>
    </div>
  )
}

function AssetEditorFields({ values, clinics, onChangeField }) {
  return (
    <div className="form-grid">
      <label className="full-span">
        Title
        <input className="text-input" value={values.title} onChange={(event) => onChangeField('title', event.target.value)} />
      </label>
      <label>
        Clinic
        <select className="text-input" value={values.clinic_id} onChange={(event) => onChangeField('clinic_id', event.target.value)}>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Asset type
        <select className="text-input" value={values.asset_type} onChange={(event) => onChangeField('asset_type', event.target.value)}>
          <option value="outreach email">outreach email</option>
          <option value="LinkedIn message">LinkedIn message</option>
          <option value="follow-up">follow-up</option>
          <option value="one-pager">one-pager</option>
          <option value="meeting brief">meeting brief</option>
          <option value="notes">notes</option>
        </select>
      </label>
      <label>
        Status
        <select className="text-input" value={values.status} onChange={(event) => onChangeField('status', event.target.value)}>
          <option value="draft">draft</option>
          <option value="approved">approved</option>
          <option value="sent">sent</option>
        </select>
      </label>
      <label>
        Version
        <input
          className="text-input"
          type="number"
          min="1"
          value={values.version}
          onChange={(event) => onChangeField('version', event.target.value)}
        />
      </label>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={Boolean(values.generated_by_ai)}
          onChange={(event) => onChangeField('generated_by_ai', event.target.checked)}
        />
        Generated by AI
      </label>
      <label className="full-span">
        Content
        <textarea
          className="editor-area"
          value={values.content}
          onChange={(event) => onChangeField('content', event.target.value)}
        />
      </label>
    </div>
  )
}

function DocumentEditorFields({ values, onChangeField }) {
  return (
    <div className="form-grid">
      <label className="full-span">
        Title
        <input className="text-input" value={values.title} onChange={(event) => onChangeField('title', event.target.value)} />
      </label>
      <label>
        Category
        <select className="text-input" value={values.category} onChange={(event) => onChangeField('category', event.target.value)}>
          <option value="Product Overview">Product Overview</option>
          <option value="ICP / Market Notes">ICP / Market Notes</option>
          <option value="Outreach Strategy">Outreach Strategy</option>
          <option value="Product Decisions">Product Decisions</option>
          <option value="Prompt Library">Prompt Library</option>
          <option value="Context Packs">Context Packs</option>
          <option value="Architecture Notes">Architecture Notes</option>
        </select>
      </label>
      <label>
        Tags
        <input
          className="text-input"
          value={values.tags}
          onChange={(event) => onChangeField('tags', event.target.value)}
          placeholder="vision, pitch, icp"
        />
      </label>
      <label className="full-span">
        Summary
        <textarea
          className="editor-area compact"
          value={values.summary}
          onChange={(event) => onChangeField('summary', event.target.value)}
        />
      </label>
      <label className="full-span">
        Content
        <textarea
          className="editor-area"
          value={values.content}
          onChange={(event) => onChangeField('content', event.target.value)}
        />
      </label>
    </div>
  )
}

function SourceEditorFields({ values, onChangeField }) {
  return (
    <div className="form-grid">
      <label>
        Source name
        <input className="text-input" value={values.name} onChange={(event) => onChangeField('name', event.target.value)} />
      </label>
      <label>
        Category
        <input className="text-input" value={values.category} onChange={(event) => onChangeField('category', event.target.value)} />
      </label>
      <label>
        Integration key
        <input
          className="text-input"
          value={values.integration_key}
          onChange={(event) => onChangeField('integration_key', event.target.value)}
          placeholder="cms_npi_registry"
        />
      </label>
      <label>
        Status
        <select className="text-input" value={values.status} onChange={(event) => onChangeField('status', event.target.value)}>
          <option value="active">active</option>
          <option value="draft">draft</option>
          <option value="paused">paused</option>
        </select>
      </label>
      <label className="full-span">
        Website
        <input className="text-input" value={values.website} onChange={(event) => onChangeField('website', event.target.value)} />
      </label>
      <label className="full-span">
        Coverage
        <input className="text-input" value={values.coverage} onChange={(event) => onChangeField('coverage', event.target.value)} />
      </label>
      <label className="toggle-row">
        <input
          type="checkbox"
          checked={Boolean(values.enabled)}
          onChange={(event) => onChangeField('enabled', event.target.checked)}
        />
        Enabled for workflow use
      </label>
      <label className="full-span">
        Notes
        <textarea
          className="editor-area compact"
          value={values.notes}
          onChange={(event) => onChangeField('notes', event.target.value)}
        />
      </label>
    </div>
  )
}

function formatLabel(value) {
  return value.replaceAll('_', ' ')
}

function formatDate(value) {
  const date = value?.includes?.('T') ? new Date(value) : new Date(`${value}T12:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateTime(value) {
  const date = new Date(value)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function addDaysToToday(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function findClinicName(clinics, clinicId) {
  return clinics.find((clinic) => clinic.id === clinicId)?.name ?? 'Unknown clinic'
}

function buildSeedClinics(clinics) {
  const seen = new Set()

  return clinics
    .filter((clinic) => {
      const normalizedName = clinic.name.trim().toLowerCase()
      if (seen.has(normalizedName)) {
        return false
      }

      seen.add(normalizedName)
      return true
    })
    .map((clinic, index) => {
      const createdAt = createSeedTimestamp(index, 14)
      const updatedAt = createSeedTimestamp(index, 3)

      return {
        id: `clinic-import-${index + 1}`,
        name: clinic.name,
        website: clinic.website,
        city: clinic.city,
        state: clinic.state,
        type: clinic.type,
        specialty_focus: clinic.specialty_focus,
        size_estimate: clinic.size_estimate,
        has_rpm_signals: clinic.has_rpm_signals,
        has_nurse_navigator_program: clinic.has_nurse_navigator_program,
        strategic_fit_score: clinic.strategic_fit_score,
        stage: 'researching',
        pain_hypothesis: clinic.pain_hypothesis,
        why_us: clinic.why_us,
        notes: clinic.notes,
        priority_tier: clinic.tier,
        last_activity_at: updatedAt,
        created_at: createdAt,
        updated_at: updatedAt,
      }
    })
}

function mergeClinicsWithSeed(currentClinics = []) {
  const combined = [...currentClinics, ...seedClinics]
  const seen = new Set()

  return combined.filter((clinic) => {
    const key = clinic.name.trim().toLowerCase()
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function buildSeedTasks(clinics) {
  return clinics
    .filter((clinic) => clinic.priority_tier === 'A' || clinic.priority_tier === 'B')
    .map((clinic, index) => ({
      id: `task-import-${index + 1}`,
      clinic_id: clinic.id,
      title: 'Research contacts for this clinic',
      due_date: `2026-04-${String((index % 9) + 7).padStart(2, '0')}`,
      owner: clinic.priority_tier === 'A' ? 'Dan' : 'Jess',
      priority: clinic.priority_tier === 'A' ? 'high' : 'medium',
      status: 'open',
    }))
}

function createSeedTimestamp(index, day) {
  const safeDay = String(day + (index % 7)).padStart(2, '0')
  const hour = String(9 + (index % 6)).padStart(2, '0')
  return `2026-03-${safeDay}T${hour}:00:00.000Z`
}

function createLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function buildClinicImportRow(rawRow, index, currentClinics) {
  const name = getImportedValue(rawRow, ['name', 'clinic name', 'health system', 'organization', 'system'])
  const website = normalizeWebsite(
    getImportedValue(rawRow, ['website', 'websites', 'web site', 'url', 'site']),
  )
  const geography = getImportedValue(rawRow, ['geography', 'location', 'market', 'region'])
  const parsedGeography = parseImportedGeography(geography)
  const tier = normalizeImportedTier(getImportedValue(rawRow, ['tier', 'priority tier', 'priority']))
  const notes = getImportedValue(rawRow, ['notes', 'notes for perioptima', 'notes for perioptima ', 'description'])
  const epicEhr = getImportedValue(rawRow, ['epic ehr', 'ehr', 'epic'])
  const valueBased = getImportedValue(rawRow, ['value-based ori', 'value-based orientation', 'value based', 'value-based'])
  const type = getImportedValue(rawRow, ['type', 'clinic type', 'organization type'])
  const specialty = getImportedValue(rawRow, ['specialty', 'specialty focus', 'service line', 'focus'])
  const fitScore = Number(getImportedValue(rawRow, ['strategic fit score', 'fit score', 'fit'])) || inferFitFromImport(tier, valueBased, type)
  const duplicate = findDuplicateClinic(
    { name, website },
    currentClinics,
  )

  return {
    id: `clinic-import-preview-${index + 1}`,
    duplicateId: duplicate?.id ?? '',
    duplicateName: duplicate?.name ?? '',
    canUpdateDuplicate: false,
    action: duplicate ? CLINIC_IMPORT_ACTIONS.SKIP : CLINIC_IMPORT_ACTIONS.CREATE,
    clinic: {
      name: name.trim(),
      website,
      city: getImportedValue(rawRow, ['city']) || parsedGeography.city,
      state: normalizeState(getImportedValue(rawRow, ['state']) || parsedGeography.state),
      type: type || 'Health System',
      specialty_focus: specialty || 'Surgical programs, perioperative workflows',
      size_estimate: getImportedValue(rawRow, ['size estimate', 'members / scale', 'members/scale', 'scale', 'members']) || 'Unknown',
      has_rpm_signals: parseBoolean(getImportedValue(rawRow, ['has_rpm_signals', 'rpm', 'remote monitoring']), true),
      has_nurse_navigator_program: parseBoolean(
        getImportedValue(rawRow, ['has_nurse_navigator_program', 'nurse navigator', 'navigation']),
        false,
      ),
      strategic_fit_score: Math.min(10, Math.max(0, fitScore)),
      stage: 'researching',
      priority_tier: tier,
      pain_hypothesis:
        getImportedValue(rawRow, ['pain hypothesis', 'pain_hypothesis']) ||
        'Likely perioperative coordination and post-discharge visibility gaps across complex surgical workflows.',
      why_us:
        getImportedValue(rawRow, ['why us', 'why_us']) ||
        'PeriOptima can support structured monitoring, escalation, and recovery workflow continuity.',
      notes: buildImportedClinicNotes({ notes, geography, epicEhr, valueBased }),
    },
  }
}

function getImportedValue(row, aliases) {
  const normalizedAliases = aliases.map(normalizeImportHeader)
  const entry = Object.entries(row).find(([key]) => normalizedAliases.includes(normalizeImportHeader(key)))
  return entry ? String(entry[1] ?? '').trim() : ''
}

function normalizeImportHeader(value) {
  return String(value)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeWebsite(value) {
  const firstUrl = String(value)
    .split(/\s+/)
    .find((part) => /^https?:\/\//i.test(part) || /^www\./i.test(part))
  if (!firstUrl) return ''
  return firstUrl.startsWith('http') ? firstUrl : `https://${firstUrl}`
}

function parseImportedGeography(value) {
  const geography = String(value ?? '').trim()
  const stateMatch = geography.match(/\b[A-Z]{2}\b/)
  const cityMatch = geography.match(/^([^,/()]+),\s*([A-Z]{2})\b/)

  return {
    city: cityMatch?.[1]?.trim() ?? '',
    state: stateMatch?.[0] ?? '',
  }
}

function normalizeState(value) {
  const match = String(value ?? '').toUpperCase().match(/\b[A-Z]{2}\b/)
  return match?.[0] ?? String(value ?? '').trim()
}

function normalizeImportedTier(value) {
  const tier = String(value ?? '').trim().toUpperCase()
  if (tier === '1') return 'A'
  if (tier === '2') return 'B'
  if (tier === '3') return 'C'
  if (['A', 'B', 'C'].includes(tier)) return tier
  return ''
}

function inferFitFromImport(tier, valueBased, type) {
  let score = tier === 'A' ? 10 : tier === 'B' ? 8 : tier === 'C' ? 7 : 7
  if (/very high/i.test(valueBased)) score += 1
  if (/academic|integrated|health system|hospital/i.test(type)) score += 1
  return Math.min(10, score)
}

function parseBoolean(value, fallback) {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (!normalized) return fallback
  if (['yes', 'true', '1', 'y'].includes(normalized)) return true
  if (['no', 'false', '0', 'n'].includes(normalized)) return false
  return fallback
}

function buildImportedClinicNotes({ notes, geography, epicEhr, valueBased }) {
  return [
    notes,
    geography ? `Imported geography: ${geography}` : '',
    epicEhr ? `Epic EHR: ${epicEhr}` : '',
    valueBased ? `Value-based orientation: ${valueBased}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function findDuplicateClinic(importedClinic, clinics) {
  const importedName = normalizeDuplicateKey(importedClinic.name)
  const importedDomain = normalizeWebsiteDomain(importedClinic.website)

  return clinics.find((clinic) => {
    const clinicName = normalizeDuplicateKey(clinic.name)
    const clinicDomain = normalizeWebsiteDomain(clinic.website)

    if (importedName && clinicName === importedName) return true
    if (importedDomain && clinicDomain && clinicDomain === importedDomain) return true
    return false
  })
}

function normalizeDuplicateKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(inc|llc|the)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeWebsiteDomain(value) {
  try {
    return new URL(normalizeWebsite(value)).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value
  }

  return String(value)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function buildFitExplanation(clinic) {
  const reasons = []

  if (/(hospital|academic medical center|teaching hospital|cancer center)/i.test(clinic.type)) {
    reasons.push('hospital or academic-center profile')
  }
  if (clinic.has_nurse_navigator_program) {
    reasons.push('navigator support signal')
  }
  if (clinic.has_rpm_signals) {
    reasons.push('digital monitoring signal')
  }
  if (/(surgery|oncology|transplant|hepatobiliary|gi|perioperative)/i.test(clinic.specialty_focus)) {
    reasons.push('relevant surgical specialty')
  }
  if (/(pre-op|post-op|recovery|discharge|navigation|perioperative)/i.test(`${clinic.pain_hypothesis} ${clinic.why_us} ${clinic.notes}`)) {
    reasons.push('clear perioperative workflow relevance')
  }

  return reasons.length ? reasons.join(', ') : 'Manual founder scoring based on current clinic context.'
}

function compareTasks(left, right, sortBy) {
  if (sortBy === 'due_desc') {
    return toSortableDate(right.due_date) - toSortableDate(left.due_date)
  }

  if (sortBy === 'priority_desc') {
    return getPriorityWeight(right.priority) - getPriorityWeight(left.priority)
  }

  if (sortBy === 'title_asc') {
    return left.title.localeCompare(right.title)
  }

  return toSortableDate(left.due_date) - toSortableDate(right.due_date)
}

function toSortableDate(value) {
  return new Date(`${value || '2099-12-31'}T12:00:00`).getTime()
}

function getPriorityWeight(value) {
  if (value === 'high') return 3
  if (value === 'medium') return 2
  if (value === 'low') return 1
  return 0
}

function formatWorkspaceSyncLabel(status) {
  if (status === 'loading') return 'Loading workspace'
  if (status === 'saving') return 'Saving'
  if (status === 'synced') return 'Shared workspace'
  if (status === 'error') return 'Save error'
  return 'Local only'
}

function getWorkspaceSyncClass(status) {
  if (status === 'synced') return 'stage-ready_for_outreach'
  if (status === 'saving') return 'stage-researching'
  if (status === 'error') return 'priority-high'
  return 'priority-low'
}

export default App
