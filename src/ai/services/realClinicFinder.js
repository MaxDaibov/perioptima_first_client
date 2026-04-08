import { calculateClinicFitScore } from './fitScoring'
import { enrichWithProviderDirectory } from './providerDataDirectory'

const STATE_NAME_TO_CODE = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
}

const REGION_PRESETS = {
  'west coast': ['CA', 'OR', 'WA'],
  west: ['CA', 'OR', 'WA', 'AZ', 'NV', 'CO', 'UT'],
  'northern california': ['CA'],
  'southern california': ['CA'],
  'bay area': ['CA'],
  'pacific northwest': ['OR', 'WA'],
  southwest: ['AZ', 'NV', 'NM', 'UT'],
  texas: ['TX'],
  northeast: ['MA', 'NY', 'NJ', 'CT', 'RI', 'NH', 'VT', 'ME', 'PA'],
  southeast: ['GA', 'FL', 'NC', 'SC', 'TN', 'AL'],
  midwest: ['IL', 'OH', 'MI', 'MN', 'WI', 'MO', 'IN', 'IA'],
}

function splitTerms(value) {
  return value
    .toLowerCase()
    .split(/[,/]| and |\|/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getStateCodesFromRegion(region) {
  const normalized = region.trim().toLowerCase()
  if (!normalized) return ['CA', 'OR', 'WA']
  if (REGION_PRESETS[normalized]) return REGION_PRESETS[normalized]
  if (normalized.length === 2) return [normalized.toUpperCase()]
  if (STATE_NAME_TO_CODE[normalized]) return [STATE_NAME_TO_CODE[normalized]]

  return Object.entries(STATE_NAME_TO_CODE)
    .filter(([name]) => normalized.includes(name))
    .map(([, code]) => code)
    .slice(0, 5)
}

function getSearchTerms({ specialty, instruction, clinicType }) {
  const haystack = `${specialty} ${instruction} ${clinicType}`.toLowerCase()
  const terms = new Set(['health', 'medical', 'hospital'])

  if (haystack.includes('oncology') || haystack.includes('cancer')) {
    terms.add('oncology')
    terms.add('cancer')
  }
  if (haystack.includes('gi') || haystack.includes('digestive')) {
    terms.add('digestive')
    terms.add('gastro')
  }
  if (haystack.includes('hepat')) {
    terms.add('liver')
    terms.add('pancreatic')
  }
  if (haystack.includes('academic')) {
    terms.add('university')
  }
  if (haystack.includes('clinic')) {
    terms.add('clinic')
  }

  splitTerms(specialty).forEach((term) => {
    if (term.length >= 3) terms.add(term)
  })

  splitTerms(clinicType).forEach((term) => {
    if (term.length >= 3) terms.add(term)
  })

  return Array.from(terms).slice(0, 8)
}

function getTaxonomyDescriptions(clinicType) {
  const normalized = clinicType.toLowerCase()
  const descriptions = []

  if (normalized.includes('academic') || normalized.includes('hospital')) {
    descriptions.push('General Acute Care Hospital')
  }
  if (normalized.includes('cancer')) {
    descriptions.push('Special Hospital')
  }

  return descriptions
}

function buildEndpoint(state, term, taxonomyDescription, limitPerQuery) {
  const params = new URLSearchParams({
    version: '2.1',
    enumeration_type: 'NPI-2',
    state,
    limit: String(limitPerQuery),
  })

  if (term) params.set('organization_name', term)
  if (taxonomyDescription) params.set('taxonomy_description', taxonomyDescription)

  return `/api/npiregistry/?${params.toString()}`
}

function inferSizeEstimate(type) {
  const normalized = type.toLowerCase()
  if (normalized.includes('hospital')) return 'Large hospital-based program'
  if (normalized.includes('multi-specialty')) return 'Regional multi-specialty group'
  if (normalized.includes('clinic')) return 'Specialty clinic program'
  return 'Provider organization'
}

function inferPainHypothesis(name) {
  return `${name} likely manages surgical patient preparation, care handoffs, and post-procedure follow-up across workflows that still depend on manual coordination.`
}

function inferWhyUs(type, name) {
  return `${name} appears relevant for perioperative workflow support because ${type.toLowerCase()} environments often need better navigation, readiness tracking, and cleaner follow-up execution.`
}

function toTitleCase(value) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function isPlausibleOrganization(result) {
  const orgName = (result.basic?.organization_name ?? '').trim()
  const dbaNames = (result.other_names ?? [])
    .map((item) => item.organization_name ?? '')
    .join(' ')
  const taxonomyText = (result.taxonomies ?? [])
    .map((taxonomy) => taxonomy.desc ?? '')
    .join(' ')
  const haystack = `${orgName} ${dbaNames} ${taxonomyText}`.toLowerCase()

  if (!orgName || /^\d/.test(orgName) || /^[\d\s.-]+$/.test(orgName)) return false

  return /(health|hospital|medical|clinic|center|centre|university|oncology|surgery|surgical|digestive|cancer|care)/.test(
    haystack,
  )
}

function matchesSpecialtyIntent(result, specialty) {
  if (!specialty) return true

  const terms = splitTerms(specialty)
  const dbaNames = (result.other_names ?? [])
    .map((item) => item.organization_name ?? '')
    .join(' ')
  const taxonomyText = (result.taxonomies ?? [])
    .map((taxonomy) => taxonomy.desc ?? '')
    .join(' ')
  const haystack = `${result.basic?.organization_name ?? ''} ${dbaNames} ${taxonomyText}`.toLowerCase()

  const aliases = {
    gi: ['gi', 'gastro', 'digestive', 'gastroenterology'],
    'gi surgery': ['gi', 'gastro', 'digestive'],
    hepatobiliary: ['hepat', 'liver', 'pancrea', 'biliary', 'hpb'],
    oncology: ['oncology', 'cancer', 'tumor'],
    'surgical oncology': ['oncology', 'cancer', 'tumor'],
  }

  return terms.some((term) => {
    if (haystack.includes(term)) return true
    return (aliases[term] ?? []).some((alias) => haystack.includes(alias))
  })
}

function normalizeResult(result, sourceLabel) {
  const location = result.addresses?.find((address) => address.address_purpose === 'LOCATION')
  const mailing = result.addresses?.find((address) => address.address_purpose === 'MAILING')
  const address = location ?? mailing ?? {}
  const primaryTaxonomy = result.taxonomies?.find((taxonomy) => taxonomy.primary) ?? result.taxonomies?.[0]
  const dbaName = result.other_names?.[0]?.organization_name ?? ''
  const orgName = dbaName || result.basic?.organization_name || 'Unknown organization'
  const displayType = primaryTaxonomy?.desc ?? 'Healthcare organization'

  return {
    external_id: result.number,
    name: toTitleCase(orgName),
    website: '',
    city: toTitleCase(address.city ?? ''),
    state: address.state ?? '',
    type: displayType,
    specialty_focus: displayType,
    size_estimate: inferSizeEstimate(displayType),
    has_rpm_signals: /hospital|medical|clinic|surgery|center/i.test(`${orgName} ${displayType}`),
    has_nurse_navigator_program: /oncology|cancer|hospital|center/i.test(`${orgName} ${displayType}`),
    pain_hypothesis: inferPainHypothesis(orgName),
    why_us: inferWhyUs(displayType, orgName),
    notes: `Real search result from CMS NPI Registry for NPI ${result.number}.`,
    source: `${sourceLabel} • NPI ${result.number}`,
  }
}

export async function findClinicsByRegionLive(criteria) {
  const states = getStateCodesFromRegion(criteria.region)
  const terms = getSearchTerms(criteria)
  const taxonomyDescriptions = getTaxonomyDescriptions(criteria.clinicType)
  const limitPerQuery = Math.max(10, Math.min(25, Number(criteria.resultLimit) * 4 || 20))
  const requests = []

  for (const state of states.slice(0, 4)) {
    for (const taxonomyDescription of taxonomyDescriptions) {
      requests.push(fetch(buildEndpoint(state, '', taxonomyDescription, limitPerQuery)))
    }

    for (const term of terms) {
      requests.push(fetch(buildEndpoint(state, term, '', limitPerQuery)))
    }
  }

  const responses = await Promise.all(requests)
  const payloads = await Promise.all(
    responses.filter((response) => response.ok).map((response) => response.json()),
  )

  const deduped = new Map()
  for (const payload of payloads) {
    for (const result of payload.results ?? []) {
      if (
        !deduped.has(result.number) &&
        isPlausibleOrganization(result) &&
        matchesSpecialtyIntent(result, criteria.specialty)
      ) {
        deduped.set(result.number, normalizeResult(result, 'CMS NPI Registry'))
      }
    }
  }

  const normalizedClinics = enrichWithProviderDirectory(Array.from(deduped.values()), criteria.sources)

  return normalizedClinics
    .map((clinic, index) => {
      const score = calculateClinicFitScore(clinic, criteria.specialty)
      return {
        id: `live-preview-clinic-${index + 1}-${clinic.external_id}`,
        approved: false,
        rejected: false,
        selected: false,
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
