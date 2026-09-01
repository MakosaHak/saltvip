export function uid(prefix = 'R') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

export function fmtDate(d = new Date()) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function fmtDateLong(d = new Date()) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function fmtTime(d = new Date()) {
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function downloadFile(content: string, filename: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function toCsv(rows: string[][]) {
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function hoursUntil(dateStr: string, heure: string) {
  const [d, m, y] = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-').reverse()
  const target = new Date(`${y}-${m}-${d}T${heure}:00`)
  return (target.getTime() - Date.now()) / 3_600_000
}
