import { calculateClinicFitScore } from './fitScoring'

function splitTerms(value) {
  return value
    .toLowerCase()
    .split(/[,/]| and |\|/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const MOCK_CLINIC_DATA = [
  {
    id: 'finder-1',
    name: 'UCSF Helen Diller Surgical Oncology Program',
    website: 'https://surgery.ucsf.example/helen-diller',
    city: 'San Francisco',
    state: 'CA',
    type: 'Academic medical center',
    specialty_focus: 'Surgical oncology and hepatobiliary surgery',
    size_estimate: 'Large tertiary referral program',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    pain_hypothesis:
      'Complex cancer surgery pathways likely require high-touch patient readiness, education, and post-discharge coordination.',
    why_us:
      'High-acuity surgical workflows create a strong need for structured perioperative communication and founder-led pilot learning.',
    notes:
      'Academic cancer center with multidisciplinary case flow, nurse navigation, and high patient handoff complexity.',
    source: 'Mock directory: academic surgical oncology programs',
    regionTags: ['west coast', 'northern california', 'california', 'west'],
  },
  {
    id: 'finder-2',
    name: 'Cedars-Sinai GI and HPB Surgery Institute',
    website: 'https://cedars-sinai.example/gi-hpb',
    city: 'Los Angeles',
    state: 'CA',
    type: 'Hospital surgical institute',
    specialty_focus: 'GI surgery and hepatopancreatobiliary surgery',
    size_estimate: 'Large hospital-based specialty institute',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    pain_hypothesis:
      'High-volume abdominal surgery programs often struggle to keep patients prepared across referrals, diagnostics, surgery, and follow-up.',
    why_us:
      'Strong relevance for patient navigation, post-op monitoring, and a more consistent surgical journey.',
    notes:
      'Visible digital health activity and complex care pathways suggest real workflow pain worth testing.',
    source: 'Mock directory: hospital GI surgery institutes',
    regionTags: ['southern california', 'california', 'west coast', 'west'],
  },
  {
    id: 'finder-3',
    name: 'Stanford Digestive Health Surgical Services',
    website: 'https://stanfordhealth.example/digestive-surgery',
    city: 'Palo Alto',
    state: 'CA',
    type: 'Academic medical center',
    specialty_focus: 'Foregut, colorectal, GI, and surgical oncology',
    size_estimate: 'Large academic surgery service line',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    pain_hypothesis:
      'Multiple subspecialties and a referral-heavy patient flow create coordination burden before surgery and after discharge.',
    why_us:
      'Strong fit if the team wants a broad GI surgery context with digital-care relevance.',
    notes:
      'Academic brand plus broad digestive surgery programs make this a high-signal outreach target.',
    source: 'Mock directory: academic digestive surgery programs',
    regionTags: ['bay area', 'northern california', 'california', 'west coast', 'west'],
  },
  {
    id: 'finder-4',
    name: 'Oregon Health Surgical Oncology and GI Surgery Center',
    website: 'https://ohsu.example/surgical-oncology-gi',
    city: 'Portland',
    state: 'OR',
    type: 'Academic medical center',
    specialty_focus: 'GI surgery, surgical oncology, and liver surgery',
    size_estimate: 'Regional referral academic center',
    has_rpm_signals: false,
    has_nurse_navigator_program: true,
    pain_hypothesis:
      'Cancer and GI patients likely need more structured navigation through pre-op workups and recovery.',
    why_us:
      'Navigator support is already present, which can make perioperative workflow tooling more credible.',
    notes:
      'Good Pacific Northwest target with obvious workflow complexity and patient handoffs.',
    source: 'Mock directory: regional academic surgery centers',
    regionTags: ['pacific northwest', 'oregon', 'west coast', 'west'],
  },
  {
    id: 'finder-5',
    name: 'Swedish Cancer and Surgical Specialists',
    website: 'https://swedish.example/cancer-surgery',
    city: 'Seattle',
    state: 'WA',
    type: 'Hospital cancer center',
    specialty_focus: 'Surgical oncology and GI surgery',
    size_estimate: 'Multi-campus hospital surgical program',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    pain_hypothesis:
      'Coordinating surgical cancer patients across urban hospital campuses creates obvious navigation and follow-up friction.',
    why_us:
      'Combines hospital scale, oncology complexity, and patient support infrastructure.',
    notes:
      'Potentially strong fit for post-op monitoring and reducing missed perioperative steps.',
    source: 'Mock directory: hospital cancer centers',
    regionTags: ['pacific northwest', 'washington', 'west coast', 'west'],
  },
  {
    id: 'finder-6',
    name: 'Mayo Clinic Arizona Hepatobiliary Surgery',
    website: 'https://mayoarizona.example/hpb-surgery',
    city: 'Phoenix',
    state: 'AZ',
    type: 'Hospital specialty department',
    specialty_focus: 'Hepatobiliary surgery and surgical oncology',
    size_estimate: 'Large specialty referral program',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    pain_hypothesis:
      'High-acuity abdominal surgery plus referral complexity likely creates strong perioperative coordination needs.',
    why_us:
      'Excellent fit for testing structured patient coordination in a high-trust surgical brand environment.',
    notes:
      'Known for complex care pathways and multidisciplinary surgical planning.',
    source: 'Mock directory: specialty hepatobiliary programs',
    regionTags: ['southwest', 'arizona', 'west'],
  },
  {
    id: 'finder-7',
    name: 'MD Anderson GI Surgical Oncology Clinic',
    website: 'https://mdanderson.example/gi-surgical-oncology',
    city: 'Houston',
    state: 'TX',
    type: 'Academic cancer center',
    specialty_focus: 'GI surgical oncology and hepatobiliary surgery',
    size_estimate: 'Large national referral cancer program',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    pain_hypothesis:
      'Cancer surgery patients require substantial preparation, care coordination, and post-discharge support across long treatment arcs.',
    why_us:
      'One of the strongest theoretical fits for high-touch perioperative orchestration.',
    notes:
      'Compelling strategic target even if pilot complexity may be higher than independent clinics.',
    source: 'Mock directory: academic cancer centers',
    regionTags: ['texas', 'south', 'south central'],
  },
  {
    id: 'finder-8',
    name: 'Texas Digestive and Liver Surgery Group',
    website: 'https://txdigestive.example/liver-surgery',
    city: 'Dallas',
    state: 'TX',
    type: 'Multi-specialty surgical group',
    specialty_focus: 'GI surgery, liver surgery, and colorectal surgery',
    size_estimate: '12 surgeons / 4 clinics',
    has_rpm_signals: false,
    has_nurse_navigator_program: false,
    pain_hypothesis:
      'Growing surgical groups often rely on fragmented calls, PDFs, and staff reminders to move patients through surgery prep.',
    why_us:
      'More founder-reachable than a major hospital while still offering high-value surgical workflows.',
    notes:
      'Lower infrastructure maturity could make a lightweight pilot especially appealing.',
    source: 'Mock directory: multi-specialty surgical groups',
    regionTags: ['texas', 'south', 'south central'],
  },
  {
    id: 'finder-9',
    name: 'Mass General Surgical Oncology and GI Program',
    website: 'https://massgeneral.example/surg-onc-gi',
    city: 'Boston',
    state: 'MA',
    type: 'Academic medical center',
    specialty_focus: 'GI surgery and surgical oncology',
    size_estimate: 'Large academic department',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    pain_hypothesis:
      'High referral volume and multidisciplinary cancer care make patient readiness and follow-up a constant coordination challenge.',
    why_us:
      'Strong strategic signal for a rigorous pilot thesis, even if operational complexity is substantial.',
    notes:
      'Clear perioperative workflow relevance with strong navigation infrastructure.',
    source: 'Mock directory: northeast academic surgery programs',
    regionTags: ['northeast', 'massachusetts', 'east coast', 'east'],
  },
  {
    id: 'finder-10',
    name: 'Johns Hopkins Hepatopancreatobiliary Surgery Program',
    website: 'https://hopkins.example/hpb',
    city: 'Baltimore',
    state: 'MD',
    type: 'Academic medical center',
    specialty_focus: 'Hepatobiliary surgery, pancreatic surgery, and GI oncology',
    size_estimate: 'Large specialty referral service',
    has_rpm_signals: true,
    has_nurse_navigator_program: true,
    pain_hypothesis:
      'High-complexity abdominal surgery patients need strong pre-op preparation and clearer follow-up support.',
    why_us:
      'Extremely strong fit on specialty, acuity, and patient-navigation signals.',
    notes:
      'Could help validate the product story in a top-tier academic setting.',
    source: 'Mock directory: hepatobiliary referral programs',
    regionTags: ['mid-atlantic', 'east coast', 'east'],
  },
  {
    id: 'finder-11',
    name: 'Cleveland Clinic Digestive Disease Surgical Institute',
    website: 'https://clevelandclinic.example/digestive-surgical',
    city: 'Cleveland',
    state: 'OH',
    type: 'Hospital surgical institute',
    specialty_focus: 'Digestive disease surgery, colorectal, and surgical oncology',
    size_estimate: 'Large surgical institute',
    has_rpm_signals: true,
    has_nurse_navigator_program: false,
    pain_hypothesis:
      'National referral complexity increases the need for better perioperative communication and recovery follow-up.',
    why_us:
      'Strong digital-care relevance with broad digestive surgery scope.',
    notes:
      'Useful comparator target for large-institute workflow hypotheses.',
    source: 'Mock directory: digestive disease surgical institutes',
    regionTags: ['midwest', 'ohio', 'central'],
  },
  {
    id: 'finder-12',
    name: 'Emory Winship Surgical Oncology Clinic',
    website: 'https://emorywinship.example/surgical-oncology',
    city: 'Atlanta',
    state: 'GA',
    type: 'Academic cancer center',
    specialty_focus: 'Surgical oncology and GI cancer surgery',
    size_estimate: 'Major academic cancer surgery program',
    has_rpm_signals: false,
    has_nurse_navigator_program: true,
    pain_hypothesis:
      'Cancer surgery episodes involve complex patient communication and readiness checkpoints before and after procedures.',
    why_us:
      'Strong navigator-led workflow environment with visible perioperative coordination needs.',
    notes:
      'Could be a strong southeastern target if the team expands beyond the West.',
    source: 'Mock directory: southeastern cancer surgery programs',
    regionTags: ['southeast', 'georgia', 'south'],
  },
]

function matchesRegion(clinic, region) {
  if (!region) return true
  const normalized = region.toLowerCase()
  return (
    clinic.regionTags.some((tag) => tag.includes(normalized) || normalized.includes(tag)) ||
    clinic.state.toLowerCase() === normalized ||
    clinic.city.toLowerCase().includes(normalized)
  )
}

function matchesSpecialty(clinic, specialty) {
  if (!specialty) return true
  const terms = splitTerms(specialty)
  const haystack = `${clinic.specialty_focus} ${clinic.notes} ${clinic.why_us}`.toLowerCase()
  return terms.some((term) => haystack.includes(term))
}

function matchesClinicType(clinic, clinicType) {
  if (!clinicType) return true
  const terms = splitTerms(clinicType)
  const haystack = clinic.type.toLowerCase()
  return terms.some((term) => haystack.includes(term))
}

export function findClinicsByRegion(criteria) {
  return MOCK_CLINIC_DATA
    .filter((clinic) => matchesRegion(clinic, criteria.region))
    .filter((clinic) => matchesSpecialty(clinic, criteria.specialty))
    .filter((clinic) => matchesClinicType(clinic, criteria.clinicType))
    .map((clinic, index) => {
      const score = calculateClinicFitScore(clinic, criteria.specialty)

      return {
        id: `preview-clinic-${index + 1}-${clinic.id}`,
        approved: false,
        rejected: false,
        selected: false,
        source: clinic.source,
        confidence: score.confidence,
        strategic_fit_score: score.strategicFitScore,
        notes: `${clinic.notes} Evidence: ${score.evidence.join(', ')}.`,
        why_us: `${clinic.why_us} Evidence: ${score.evidence.join(', ')}.`,
        ...clinic,
      }
    })
    .sort((left, right) => right.strategic_fit_score - left.strategic_fit_score)
    .slice(0, Number(criteria.resultLimit) || 5)
}
