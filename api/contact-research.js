import * as cheerio from 'cheerio'

const PAGE_KEYWORDS = [
  'leadership',
  'leaders',
  'team',
  'staff',
  'contact',
  'directory',
  'providers',
  'faculty',
  'departments',
  'department',
  'surgery',
  'surgical',
  'oncology',
  'cancer',
  'gastro',
  'digestive',
  'transplant',
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
  '/find-a-doctor',
  '/faculty',
  '/departments',
  '/department/surgery',
  '/services/surgery',
  '/surgery',
  '/surgical-services',
  '/cancer',
  '/oncology',
  '/transplant',
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
]

const NAME_REGEX =
  /\b([A-Z][a-z]+(?:\s+[A-Z]\.)?(?:\s+[A-Z][a-z]+){1,3})(?:,\s*(?:MD|M\.D\.|DO|RN|PhD))?\b/g

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

function looksRelevantLink(text, href) {
  const haystack = `${text} ${href}`.toLowerCase()
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
  return cheerio.load(html)
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

  $('article, section, li, div.card, div[class*="card"], div[class*="profile"], div[class*="person"]').each(
    (_, node) => {
      const block = $(node)
      const text = normalizeWhitespace(block.text())
      if (!text || text.length > 450) return

      const names = [...text.matchAll(NAME_REGEX)].map((match) => match[1]).filter(Boolean)
      if (!names.length) return

      const lines = normalizeWhitespace(text)
        .split(/(?<=[.])\s+| \| | - | — /)
        .map((line) => line.trim())
        .filter(Boolean)

      for (const name of names.slice(0, 2)) {
        const title = lines.find((line) => line !== name && scoreTitle(line) > 0) ?? ''
        if (!title) continue

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

  $('h1, h2, h3, h4, strong, b').each((_, node) => {
    const heading = normalizeWhitespace($(node).text())
    const matches = [...heading.matchAll(NAME_REGEX)].map((match) => match[1]).filter(Boolean)
    if (!matches.length) return

    const parentText = normalizeWhitespace($(node).parent().text())
    const titleText = parentText
      .replace(heading, '')
      .split(/(?<=[.])\s+| \| | - | — /)
      .map((line) => line.trim())
      .find((line) => scoreTitle(line) > 0) ?? ''

    if (!titleText) return

    for (const name of matches.slice(0, 1)) {
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
    const homepage = await fetchPage(homepageUrl)
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
        const pageDom = page.url === homepageUrl ? homepage : await fetchPage(page.url)
        searchedPages.push(page)
        candidates.push(...extractPeopleFromPage(pageDom, page.url, clinic))
        candidates.push(...extractPeopleFromHeadings(pageDom, page.url, clinic))
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
      sourceStatus: 'website',
    })
  } catch (error) {
    response.status(500).json({
      error: 'Website contact research failed',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
