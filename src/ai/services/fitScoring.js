function includesAny(text, terms) {
  const normalized = text.toLowerCase()
  return terms.some((term) => normalized.includes(term.toLowerCase()))
}

export function calculateClinicFitScore(clinic, specialtyFilter = '') {
  const haystack = [
    clinic.type,
    clinic.specialty_focus,
    clinic.notes,
    clinic.why_us,
    clinic.pain_hypothesis,
  ]
    .filter(Boolean)
    .join(' ')

  let score = 0
  const evidence = []

  if (includesAny(clinic.type, ['hospital', 'academic medical center'])) {
    score += 3
    evidence.push('hospital or academic center')
  }

  if (
    specialtyFilter &&
    includesAny(`${clinic.specialty_focus} ${clinic.notes}`, [specialtyFilter])
  ) {
    score += 3
    evidence.push(`specialty match: ${specialtyFilter}`)
  }

  if (clinic.has_nurse_navigator_program) {
    score += 2
    evidence.push('navigation signal')
  }

  if (clinic.has_rpm_signals) {
    score += 2
    evidence.push('digital monitoring signal')
  }

  if (
    includesAny(haystack, [
      'pre-op',
      'post-op',
      'discharge',
      'recovery',
      'perioperative',
      'navigation',
      'readiness',
      'patient journey',
    ])
  ) {
    score += 2
    evidence.push('clear perioperative workflow relevance')
  }

  return {
    strategicFitScore: mapScoreToTenPointScale(score),
    confidence: Number(Math.min(0.96, 0.58 + score * 0.05).toFixed(2)),
    evidence,
    rawScore: score,
  }
}

function mapScoreToTenPointScale(score) {
  if (score >= 11) return 10
  if (score >= 10) return 9
  if (score >= 8) return 8
  if (score >= 7) return 7
  if (score >= 6) return 6
  if (score >= 4) return 5
  if (score >= 3) return 4
  if (score >= 2) return 3
  if (score >= 1) return 2
  return 1
}
