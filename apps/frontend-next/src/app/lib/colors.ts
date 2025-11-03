// Shared color helpers for consistent, dynamic color assignment
export type ColorTag = 'blue' | 'green' | 'orange' | 'pink' | 'violet'
export const COLOR_TAGS: ReadonlyArray<ColorTag> = ['blue','green','orange','pink','violet'] as const

// Persist a subject -> color mapping so each new subject gets the next unused color
export function subjectColor(subject: string): ColorTag {
  const key = (subject || '').trim().toLowerCase()
  // Fallback if localStorage is unavailable for any reason
  try {
    const raw = localStorage.getItem('school:subjectColors')
    const map: Record<string, ColorTag> = raw ? JSON.parse(raw) : {}
    if (map && map[key]) return map[key]

    // Choose next unused color from palette, then rotate
    const used = new Set(Object.values(map || {}))
    let chosen: ColorTag | null = null
    for (const c of COLOR_TAGS) {
      if (!used.has(c as ColorTag)) { chosen = c as ColorTag; break }
    }
    if (!chosen) {
      const idxRaw = localStorage.getItem('school:subjectColors:next')
      const idx = idxRaw ? (parseInt(idxRaw, 10) % COLOR_TAGS.length) : 0
      chosen = COLOR_TAGS[idx] as ColorTag
      localStorage.setItem('school:subjectColors:next', String((idx + 1) % COLOR_TAGS.length))
    }
    const nextMap = { ...map, [key]: chosen }
    localStorage.setItem('school:subjectColors', JSON.stringify(nextMap))
    return chosen
  } catch {
    // Hash fallback if localStorage fails
    const h = Array.from(key).reduce((s, c) => s + c.charCodeAt(0), 0)
    return COLOR_TAGS[h % COLOR_TAGS.length] as ColorTag
  }
}

