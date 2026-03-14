const rtf = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' })

export function formatRelativeTime(isoDate: string): string {
  const diff = (new Date(isoDate).getTime() - Date.now()) / 1000 // negative = past
  const abs = Math.abs(diff)
  if (abs < 60)    return rtf.format(Math.round(diff), 'second')
  if (abs < 3600)  return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 604800) return rtf.format(Math.round(diff / 86400), 'day')
  return rtf.format(Math.round(diff / 604800), 'week')
}
