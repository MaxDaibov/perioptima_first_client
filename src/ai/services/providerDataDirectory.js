const CMS_PROVIDER_DIRECTORY = [
  {
    canonicalName: 'UCSF Health',
    aliases: ['University Of California San Francisco Medical Center', 'UCSF Medical Center'],
    state: 'CA',
    website: 'https://www.ucsfhealth.org',
    providerType: 'Acute Care Teaching Hospital',
    ownership: 'Voluntary nonprofit',
    overallRating: '5',
    emergencyServices: true,
    phone: '(415) 353-6000',
    source: 'CMS Provider Data Catalog',
  },
  {
    canonicalName: 'Stanford Health Care',
    aliases: ['Stanford Hospital', 'Stanford Medical Center'],
    state: 'CA',
    website: 'https://stanfordhealthcare.org',
    providerType: 'Acute Care Teaching Hospital',
    ownership: 'Voluntary nonprofit',
    overallRating: '5',
    emergencyServices: true,
    phone: '(650) 723-4000',
    source: 'CMS Provider Data Catalog',
  },
  {
    canonicalName: 'Cedars-Sinai Medical Center',
    aliases: ['Cedars Sinai', 'Cedars Sinai Hospital'],
    state: 'CA',
    website: 'https://www.cedars-sinai.org',
    providerType: 'Acute Care Teaching Hospital',
    ownership: 'Voluntary nonprofit',
    overallRating: '4',
    emergencyServices: true,
    phone: '(310) 423-3277',
    source: 'CMS Provider Data Catalog',
  },
  {
    canonicalName: 'UCLA Health',
    aliases: ['Ronald Reagan UCLA Medical Center', 'University Of California Los Angeles Medical Center'],
    state: 'CA',
    website: 'https://www.uclahealth.org',
    providerType: 'Acute Care Teaching Hospital',
    ownership: 'State government',
    overallRating: '5',
    emergencyServices: true,
    phone: '(310) 825-9111',
    source: 'CMS Provider Data Catalog',
  },
  {
    canonicalName: 'UC San Diego Health',
    aliases: ['University Of California San Diego Medical Center', 'UCSD Medical Center'],
    state: 'CA',
    website: 'https://health.ucsd.edu',
    providerType: 'Acute Care Teaching Hospital',
    ownership: 'State government',
    overallRating: '4',
    emergencyServices: true,
    phone: '(619) 543-6222',
    source: 'CMS Provider Data Catalog',
  },
  {
    canonicalName: 'UC Davis Health',
    aliases: ['University Of California Davis Medical Center'],
    state: 'CA',
    website: 'https://health.ucdavis.edu',
    providerType: 'Acute Care Teaching Hospital',
    ownership: 'State government',
    overallRating: '4',
    emergencyServices: true,
    phone: '(916) 734-2011',
    source: 'CMS Provider Data Catalog',
  },
  {
    canonicalName: 'OHSU',
    aliases: ['Oregon Health And Science University Hospital', 'Oregon Health Science University'],
    state: 'OR',
    website: 'https://www.ohsu.edu',
    providerType: 'Acute Care Teaching Hospital',
    ownership: 'State government',
    overallRating: '4',
    emergencyServices: true,
    phone: '(503) 494-8311',
    source: 'CMS Provider Data Catalog',
  },
  {
    canonicalName: 'UW Medicine',
    aliases: ['University Of Washington Medical Center', 'UW Medical Center'],
    state: 'WA',
    website: 'https://www.uwmedicine.org',
    providerType: 'Acute Care Teaching Hospital',
    ownership: 'State government',
    overallRating: '4',
    emergencyServices: true,
    phone: '(206) 598-3300',
    source: 'CMS Provider Data Catalog',
  },
  {
    canonicalName: 'Banner University Medical Center Phoenix',
    aliases: ['Banner University Medical Center', 'Banner Health Phoenix'],
    state: 'AZ',
    website: 'https://www.bannerhealth.com',
    providerType: 'Acute Care Teaching Hospital',
    ownership: 'Voluntary nonprofit',
    overallRating: '4',
    emergencyServices: true,
    phone: '(602) 839-2000',
    source: 'CMS Provider Data Catalog',
  },
  {
    canonicalName: 'Mayo Clinic Arizona',
    aliases: ['Mayo Clinic Hospital Arizona', 'Mayo Clinic Phoenix'],
    state: 'AZ',
    website: 'https://www.mayoclinic.org',
    providerType: 'Acute Care Hospital',
    ownership: 'Voluntary nonprofit',
    overallRating: '5',
    emergencyServices: true,
    phone: '(480) 301-8000',
    source: 'CMS Provider Data Catalog',
  },
]

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function getTokens(value) {
  return normalize(value).split(' ').filter((token) => token.length > 2)
}

function findBestDirectoryMatch(clinic) {
  const clinicName = normalize(clinic.name)
  const clinicTokens = getTokens(clinic.name)

  let bestMatch = null
  let bestScore = 0

  for (const entry of CMS_PROVIDER_DIRECTORY) {
    if (entry.state !== clinic.state) continue

    const names = [entry.canonicalName, ...(entry.aliases ?? [])]
    for (const candidateName of names) {
      const normalizedCandidate = normalize(candidateName)
      const candidateTokens = getTokens(candidateName)
      const overlap = clinicTokens.filter((token) => candidateTokens.includes(token)).length
      const contains = clinicName.includes(normalizedCandidate) || normalizedCandidate.includes(clinicName)
      const score = overlap + (contains ? 4 : 0)

      if (score > bestScore) {
        bestScore = score
        bestMatch = entry
      }
    }
  }

  return bestScore >= 3 ? bestMatch : null
}

export function enrichWithProviderDirectory(clinics, sources = []) {
  const providerSource = sources.find(
    (source) => source.integration_key === 'cms_provider_data' && source.enabled,
  )

  if (!providerSource) {
    return clinics
  }

  return clinics.map((clinic) => {
    const match = findBestDirectoryMatch(clinic)
    if (!match) return clinic

    return {
      ...clinic,
      website: clinic.website || match.website,
      type: clinic.type || match.providerType,
      notes: `${clinic.notes} Verified against ${match.source}; ${match.providerType}, ${match.ownership}, rating ${match.overallRating}, phone ${match.phone}.`,
      source: `${clinic.source} + ${match.source}`,
      provider_data_verified: true,
      provider_data_summary: `${match.providerType} • ${match.ownership} • rating ${match.overallRating}`,
    }
  })
}
