import * as cheerio from 'cheerio'

const PAGE_KEYWORDS = [
  'leadership',
  'leaders',
  'team',
  'staff',
  'contact',
  'directory',
  'providers',
  'provider',
  'faculty',
  'find-a-doctor',
  'find a doctor',
  'medical staff',
  'our doctors',
  'physicians',
  'care team',
]

const NEGATIVE_PAGE_HINTS = [
  'faq',
  'frequently-asked',
  'visitor',
  'guide',
  'giving',
  'donate',
  'foundation',
  'trial',
  'trials',
  'research',
  'news',
  'story',
  'stories',
  'event',
  'calendar',
  'appointment',
  'billing',
  'financial',
  'volunteer',
  'match',
  'donation',
  'donor',
  'foundation',
  'philanthropy',
  'visitor-guide',
  'patient-story',
  'patient stories',
  'campus-map',
  'map',
  'locations',
  'classes',
  'education',
  'school',
  'alix',
  'giving-to',
]

const COMMON_CONTACT_PATHS = [
  '/leadership',
  '/leaders',
  '/about/leadership',
  '/about-us/leadership',
  '/about/team',
  '/team',
  '/staff',
  '/contact',
  '/contact-us',
  '/directory',
  '/providers',
  '/provider-directory',
  '/find-a-doctor',
  '/faculty',
  '/medical-staff',
  '/our-doctors',
  '/physicians',
  '/care-team',
]

const TARGET_TITLES = [
  'ERAS Coordinator',
  'Director of Perioperative',
  'Chief of Surgery',
  'Chief of Anesthesiology',
  'VP Quality Improvement',
  'Director of Clinical Outcomes',
]

const TITLE_HINTS = [
  'chief',
  'director',
  'vice president',
  'vp',
  'administrator',
  'officer',
  'chair',
  'president',
  'manager',
  'navigator',
  'surgeon',
  'md',
  'm.d.',
  'rn',
  'medical director',
  'service line',
  'perioperative',
  'operations',
]

const BAD_NAME_PHRASES = [
  'clinic',
  'school',
  'visitor guide',
  'strategic initiative fund',
  'be the match',
  'accessed',
  'platform',
  'clinical trials',
  'frequently asked',
  'contact us',
  'about mayo clinic',
  'mayo clinic',
  'visitor guide',
  'care at',
  'find a doctor',
  'patient centered',
  'be the match',
  'president',
  'oncology',
  'hepatobiliary',
  'surgery',
  'department',
  'fund',
  'foundation',
  'unbound',
  'novel therapeutics',
  'advanced diagnostics',
]

const NAME_REGEX =
  /\b([A-Z][a-z]+(?:\s+[A-Z]\.)?(?:\s+[A-Z][a-z]+){1,3})(?:,\s*(?:MD|M\.D\.|DO|RN|PhD))?\b/g

const STRONG_TITLE_REGEX =
  /\b(chief|chair|vice president|vp|medical director|director|administrator|officer|manager|navigator|surgeon)\b/i

function toAbsoluteUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return ''
  }
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function getClinicDomain(website) {
  try {
    return new URL(website).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function buildGoogleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}

function buildRecruitinUrl(title, clinicName) {
  const params = new URLSearchParams({
    country: 'all',
    'job-title': title,
    similar: 'on',
    'include-keywords': clinicName,
    'exclude-keywords': '',
    education: 'all',
    company: clinicName,
    network: 'LinkedIn',
    savedSearchLabel: 'icon-linkedin-square@blank search in All countries',
    submit: 'true',
  })

  return `https://recruitin.net/?${params.toString()}`
}

function buildContactSearchLeads(clinic) {
  const domain = getClinicDomain(clinic.website)
  const specialtyTerms = String(clinic.specialty_focus ?? '')
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 3)

  const titleLeads = TARGET_TITLES.map((title) => {
    const websiteQuery = [
      domain ? `site:${domain}` : '',
      `"${title}"`,
      `"${clinic.name}"`,
      specialtyTerms[0] ? `"${specialtyTerms[0]}"` : '',
    ]
      .filter(Boolean)
      .join(' ')

    const linkedinQuery = [
      'site:linkedin.com/in',
      `"${title}"`,
      `"${clinic.name}"`,
    ]
      .filter(Boolean)
      .join(' ')

    return {
      id: `search-lead-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title,
      roleReason: getTargetTitleReason(title),
      websiteQuery,
      websiteSearchUrl: buildGoogleSearchUrl(websiteQuery),
      linkedinQuery,
      linkedinSearchUrl: buildGoogleSearchUrl(linkedinQuery),
      recruitinUrl: buildRecruitinUrl(title, clinic.name),
    }
  })

  const departmentQueries = [
    domain ? `site:${domain} "${clinic.name}" "perioperative services" leadership` : '',
    domain ? `site:${domain} "${clinic.name}" "surgery" "medical director"` : '',
    domain ? `site:${domain} "${clinic.name}" "quality improvement" "director"` : '',
    domain ? `site:${domain} "${clinic.name}" "clinical outcomes" "director"` : '',
  ].filter(Boolean)

  return {
    targetTitles: TARGET_TITLES,
    titleLeads,
    departmentLeads: departmentQueries.map((query, index) => ({
      id: `department-search-${index + 1}`,
      query,
      searchUrl: buildGoogleSearchUrl(query),
    })),
  }
}

function getTargetTitleReason(title) {
  const normalized = title.toLowerCase()
  if (normalized.includes('eras')) return 'Owns enhanced recovery protocols and perioperative pathway execution.'
  if (normalized.includes('perioperative')) return 'Likely owns operating-room, pre-op, and post-op workflow performance.'
  if (normalized.includes('surgery')) return 'Clinical sponsor for surgical care redesign and pilot credibility.'
  if (normalized.includes('anesthesiology')) return 'Relevant to perioperative risk, protocols, and OR-adjacent workflows.'
  if (normalized.includes('quality')) return 'Economic and quality sponsor for outcomes, readmissions, and workflow improvement.'
  if (normalized.includes('outcomes')) return 'Likely accountable for clinical outcomes measurement and improvement.'
  return 'Potential buyer or champion for perioperative workflow improvement.'
}

function looksRelevantLink(text, href) {
  const haystack = `${text} ${href}`.toLowerCase()
  if (NEGATIVE_PAGE_HINTS.some((keyword) => haystack.includes(keyword))) return false
  return PAGE_KEYWORDS.some((keyword) => haystack.includes(keyword))
}

function isLikelyContactPage(pageUrl, label = '') {
  const haystack = `${pageUrl} ${label}`.toLowerCase()
  if (NEGATIVE_PAGE_HINTS.some((keyword) => haystack.includes(keyword))) return false
  return PAGE_KEYWORDS.some((keyword) => haystack.includes(keyword))
}

function scoreTitle(title) {
  const normalized = title.toLowerCase()
  let score = 0
  if (TITLE_HINTS.some((hint) => normalized.includes(hint))) score += 2
  if (/surgery|oncology|perioperative|operations|care coordination|digital|innovation/.test(normalized)) {
    score += 2
  }
  return score
}

async function fetchPage(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'PeriOptimaResearchBot/1.0',
      accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  const html = await response.text()
  return { $: cheerio.load(html), finalUrl: response.url }
}

function buildFallbackPaths(baseUrl) {
  return COMMON_CONTACT_PATHS.map((path) => ({
    url: toAbsoluteUrl(baseUrl, path),
    text: `guessed path ${path}`,
  })).filter((item) => item.url)
}

function extractRelevantLinks($, baseUrl) {
  const links = []

  $('a[href]').each((_, node) => {
    const href = $(node).attr('href') ?? ''
    const text = normalizeWhitespace($(node).text())
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return

    const absoluteUrl = toAbsoluteUrl(baseUrl, href)
    if (!absoluteUrl || !absoluteUrl.startsWith(baseUrl.split('/').slice(0, 3).join('/'))) return
    if (!looksRelevantLink(text, absoluteUrl)) return

    links.push({ url: absoluteUrl, text })
  })

  const deduped = new Map()
  for (const link of links) {
    if (!deduped.has(link.url)) {
      deduped.set(link.url, link)
    }
  }

  return Array.from(deduped.values()).slice(0, 8)
}

function isAllowedHost(url, clinicWebsite) {
  try {
    const clinicHost = new URL(clinicWebsite).hostname.replace(/^www\./, '')
    const candidateHost = new URL(url).hostname.replace(/^www\./, '')
    return candidateHost === clinicHost || candidateHost.endsWith(`.${clinicHost}`)
  } catch {
    return false
  }
}

function isLikelyPersonName(name) {
  const normalized = name.toLowerCase().trim()
  if (BAD_NAME_PHRASES.some((phrase) => normalized.includes(phrase))) return false
  if (/\d/.test(normalized)) return false
  const parts = normalized.split(/\s+/).filter(Boolean)
  if (parts.length < 2 || parts.length > 4) return false
  if (parts.some((part) => part.length <= 1)) return false
  return parts.every((part) => /^[a-z.'-]+$/.test(part))
}

function isRelevantTitle(title) {
  const normalized = title.toLowerCase()
  if (NEGATIVE_PAGE_HINTS.some((keyword) => normalized.includes(keyword))) return false
  if (/student|resident|fellow|intern|volunteer/.test(normalized)) return false
  if (!STRONG_TITLE_REGEX.test(normalized)) return false
  return scoreTitle(title) >= 2
}

function inferDepartment(title, clinic) {
  const normalized = title.toLowerCase()
  if (/digital|innovation|informatics/.test(normalized)) return 'Digital Health'
  if (/operat|administrator|service line/.test(normalized)) return 'Operations'
  if (/navigator|coordination/.test(normalized)) return 'Care Navigation'
  if (/oncology|cancer/.test(normalized)) return 'Oncology'
  if (/surgery|surgeon|transplant/.test(normalized)) return 'Surgery'
  return clinic.specialty_focus?.split(',')[0] ?? 'Operations'
}

function inferRoleType(title) {
  const normalized = title.toLowerCase()
  if (/chief|chair|surgery|surgeon|medical director/.test(normalized)) return 'Clinical champion'
  if (/digital|innovation|informatics/.test(normalized)) return 'Innovation sponsor'
  if (/navigator|coordination/.test(normalized)) return 'Navigation leader'
  return 'Operational buyer'
}

function inferScores(title) {
  const normalized = title.toLowerCase()
  const influence = /chief|chair|president|officer|vice president|vp/.test(normalized)
    ? 9
    : /director|administrator|manager/.test(normalized)
      ? 8
      : 7
  const champion = /navigator|surgery|oncology|perioperative|medical director/.test(normalized) ? 82 : 68
  return { influence, champion }
}

function extractPeopleFromPage($, pageUrl, clinic) {
  const candidates = []
  if (!isLikelyContactPage(pageUrl)) return candidates

  $('article, section, li, div.card, div[class*="card"], div[class*="profile"], div[class*="person"]').each(
    (_, node) => {
      const block = $(node)
      const text = normalizeWhitespace(block.text())
      if (!text || text.length > 320) return
      if (NEGATIVE_PAGE_HINTS.some((keyword) => text.toLowerCase().includes(keyword))) return

      const names = [...text.matchAll(NAME_REGEX)].map((match) => match[1]).filter(Boolean)
      if (!names.length) return

      const lines = normalizeWhitespace(text)
        .split(/(?<=[.])\s+| \| | - | — /)
        .map((line) => line.trim())
        .filter(Boolean)

      for (const name of names.slice(0, 2)) {
        const title = lines.find((line) => line !== name && scoreTitle(line) > 0) ?? ''
        if (!isLikelyPersonName(name) || !isRelevantTitle(title)) continue

        const { influence, champion } = inferScores(title)
        candidates.push({
          clinic_id: clinic.id,
          clinic_name: clinic.name,
          full_name: name,
          title,
          department: inferDepartment(title, clinic),
          email: '',
          linkedin_url: '',
          phone: '',
          seniority: influence >= 9 ? 'executive' : 'director',
          role_type: inferRoleType(title),
          influence_score: influence,
          champion_probability: champion,
          contact_status: 'researching',
          personalization_notes: `Extracted from ${pageUrl}. Relevant because this title suggests ownership of surgical, operational, or navigation workflows.`,
          source: pageUrl,
        })
      }
    },
  )

  return candidates
}

function extractPeopleFromHeadings($, pageUrl, clinic) {
  const candidates = []
  if (!isLikelyContactPage(pageUrl)) return candidates

  $('h1, h2, h3, h4, strong, b').each((_, node) => {
    const heading = normalizeWhitespace($(node).text())
    if (heading.length > 80) return
    const matches = [...heading.matchAll(NAME_REGEX)].map((match) => match[1]).filter(Boolean)
    if (!matches.length) return

    const parentText = normalizeWhitespace($(node).parent().text())
    if (NEGATIVE_PAGE_HINTS.some((keyword) => parentText.toLowerCase().includes(keyword))) return
    const titleText = parentText
      .replace(heading, '')
      .split(/(?<=[.])\s+| \| | - | — /)
      .map((line) => normalizeWhitespace(line))
      .find((line) => scoreTitle(line) > 0) ?? ''

    if (!titleText || !isRelevantTitle(titleText)) return

    for (const name of matches.slice(0, 1)) {
      if (!isLikelyPersonName(name)) continue
      const { influence, champion } = inferScores(titleText)
      candidates.push({
        clinic_id: clinic.id,
        clinic_name: clinic.name,
        full_name: name,
        title: titleText,
        department: inferDepartment(titleText, clinic),
        email: '',
        linkedin_url: '',
        phone: '',
        seniority: influence >= 9 ? 'executive' : 'director',
        role_type: inferRoleType(titleText),
        influence_score: influence,
        champion_probability: champion,
        contact_status: 'researching',
        personalization_notes: `Extracted from ${pageUrl}. Candidate found via heading + nearby role text on the clinic website.`,
        source: pageUrl,
      })
    }
  })

  return candidates
}

function dedupeCandidates(candidates) {
  const seen = new Set()
  return candidates.filter((candidate) => {
    const key = `${candidate.full_name.toLowerCase()}::${candidate.title.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const clinic = request.body?.clinic
  if (!clinic?.website) {
    response.status(400).json({ error: 'clinic.website is required' })
    return
  }

  try {
    const homepageUrl = clinic.website
    const homepageResult = await fetchPage(homepageUrl)
    if (!isAllowedHost(homepageResult.finalUrl, homepageUrl)) {
      throw new Error('Homepage redirected outside the clinic domain')
    }

    const homepage = homepageResult.$
    const relevantLinks = extractRelevantLinks(homepage, homepageUrl)
    const fallbackLinks = buildFallbackPaths(homepageUrl)
    const mergedLinks = new Map()
    for (const link of [...relevantLinks, ...fallbackLinks]) {
      if (!mergedLinks.has(link.url)) {
        mergedLinks.set(link.url, link)
      }
    }
    const pagesToSearch = [
      { url: homepageUrl, label: 'homepage' },
      ...Array.from(mergedLinks.values()).map((link) => ({
        url: link.url,
        label: link.text || 'related page',
      })),
    ].slice(0, 10)

    const candidates = []
    const searchedPages = []

    for (const page of pagesToSearch) {
      try {
        const pageResult =
          page.url === homepageUrl ? { $: homepage, finalUrl: homepageUrl } : await fetchPage(page.url)
        if (!isAllowedHost(pageResult.finalUrl, homepageUrl)) {
          searchedPages.push({ ...page, skipped: true, reason: 'external redirect' })
          continue
        }

        const pageUrl = pageResult.finalUrl
        if (!isLikelyContactPage(pageUrl, page.label)) {
          searchedPages.push({ ...page, skipped: true, reason: 'low-signal page' })
          continue
        }

        searchedPages.push(page)
        candidates.push(...extractPeopleFromPage(pageResult.$, pageUrl, clinic))
        candidates.push(...extractPeopleFromHeadings(pageResult.$, pageUrl, clinic))
      } catch {
        searchedPages.push({ ...page, failed: true })
      }
    }

    const deduped = dedupeCandidates(candidates)
      .map((candidate, index) => ({
        ...candidate,
        id: `contact-preview-${clinic.id}-${index + 1}`,
        confidence: Number((0.7 + Math.min(0.22, scoreTitle(candidate.title) * 0.04)).toFixed(2)),
        approved: false,
        rejected: false,
        selected: false,
      }))
      .sort((left, right) => right.influence_score - left.influence_score)
      .slice(0, 8)

    response.status(200).json({
      candidates: deduped,
      searchedPages,
      searchLeads: buildContactSearchLeads(clinic),
      sourceStatus: 'website',
    })
  } catch (error) {
    response.status(500).json({
      error: 'Website contact research failed',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
