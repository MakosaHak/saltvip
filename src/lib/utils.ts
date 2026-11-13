import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

let uidSeq = 0

export function uid(prefix = 'R') {
  uidSeq = (uidSeq + 1) % 1296
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${uidSeq.toString(36).toUpperCase().padStart(2, '0')}`
}

export function generateProtocolCode(existing: string[] = []) {
  const used = new Set(existing.filter(Boolean).map(c => c.toUpperCase()))
  let code = ''
  do {
    const raw = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '')
    code = `PTC-${(raw + 'X4K9M2').slice(2, 8)}`
  } while (used.has(code))
  return code
}

export function formatProtocolLabel(p: { name: string; codeProtocole?: string; societe?: string }) {
  const code = p.codeProtocole ? ` — ${p.codeProtocole}` : ''
  const societe = p.societe ? ` · ${p.societe}` : ''
  return `${p.name}${code}${societe}`
}

export function compagnieFromVol(vol: string) {
  const code = vol.trim().toUpperCase()
  if (code.startsWith('AF')) return 'Air France'
  if (code.startsWith('KP')) return 'ASKY Airlines'
  if (code.startsWith('ET')) return 'Ethiopian Airlines'
  if (code.startsWith('AT')) return 'Royal Air Maroc'
  if (code.startsWith('HF')) return "Air Côte d'Ivoire"
  if (code.startsWith('SN')) return 'Brussels Airlines'
  return '—'
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

/**
 * Parse une chaîne de date au format DD/MM/YYYY ou YYYY-MM-DD
 * et retourne un objet Date normalisé à minuit.
 */
export function parseDateOnly(dateStr?: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null
  const clean = dateStr.trim()
  if (!clean) return null

  if (clean.includes('/')) {
    const parts = clean.split('/').map(Number)
    if (parts.length >= 3 && !parts.some(isNaN)) {
      const [day, month, year] = parts
      return new Date(year, month - 1, day, 0, 0, 0, 0)
    }
  }

  if (clean.includes('-')) {
    const parts = clean.split('-').map(Number)
    if (parts.length >= 3 && !parts.some(isNaN)) {
      if (parts[0] > 1000) {
        // YYYY-MM-DD
        return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
      } else {
        // DD-MM-YYYY
        return new Date(parts[2], parts[1] - 1, parts[0], 0, 0, 0, 0)
      }
    }
  }

  const d = new Date(clean)
  if (isNaN(d.getTime())) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

/**
 * Convertit une date et une heure optionnelle en timestamp numérique pour trier les réservations.
 */
export function dateAndTimeToTimestamp(dateStr?: string, heureStr?: string): number {
  const d = parseDateOnly(dateStr)
  if (!d) return 0
  let hours = 0
  let minutes = 0
  if (heureStr && typeof heureStr === 'string' && heureStr.includes(':')) {
    const [h, m] = heureStr.split(':').map(Number)
    if (!isNaN(h)) hours = h
    if (!isNaN(m)) minutes = m
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes, 0, 0).getTime()
}

export interface CheckinDateStatus {
  allowed: boolean
  isToday: boolean
  isFuture: boolean
  isPast: boolean
  daysDiff: number
  label: string
}

/**
 * Détermine si le checking peut être validé :
 * La validation est autorisée UNIQUEMENT à partir du jour J (aujourd'hui ou date passée).
 * Si la réservation est dans le futur (avant le jour J), la validation est bloquée.
 */
export function getCheckinDateStatus(dateStr?: string, referenceDate: Date = new Date()): CheckinDateStatus {
  const target = parseDateOnly(dateStr)
  if (!target) {
    return {
      allowed: true,
      isToday: false,
      isFuture: false,
      isPast: false,
      daysDiff: 0,
      label: 'Date non renseignée',
    }
  }

  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 0, 0, 0, 0)
  const diffTime = target.getTime() - today.getTime()
  const daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (daysDiff === 0) {
    return {
      allowed: true,
      isToday: true,
      isFuture: false,
      isPast: false,
      daysDiff: 0,
      label: 'Jour J (Aujourd\'hui)',
    }
  } else if (daysDiff > 0) {
    return {
      allowed: false,
      isToday: false,
      isFuture: true,
      isPast: false,
      daysDiff,
      label: daysDiff === 1 ? 'Demain (Jour J - 1)' : `Dans ${daysDiff} jours`,
    }
  } else {
    const absDays = Math.abs(daysDiff)
    return {
      allowed: true,
      isToday: false,
      isFuture: false,
      isPast: true,
      daysDiff,
      label: absDays === 1 ? 'Hier' : `Il y a ${absDays} jours`,
    }
  }
}

/**
 * Formate une date en français complet (ex: "Mercredi 14 octobre 2026")
 */
export function formatFrDateLabel(dateStr?: string): string {
  const d = parseDateOnly(dateStr)
  if (!d) return dateStr || '—'
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Convertit toute date en chaîne ISO YYYY-MM-DD pour input type="date"
 */
export function toIsoDate(dateStr?: string): string {
  const d = parseDateOnly(dateStr)
  if (!d) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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

export function passengerFullName(p: { prenom?: string; nom?: string; nomPrenoms?: string }) {
  const composed = [p.prenom, p.nom].filter(Boolean).join(' ').trim()
  return composed || (p.nomPrenoms ?? '').trim()
}

export function splitPassengerName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { prenom: '', nom: '' }
  if (parts.length === 1) return { prenom: parts[0], nom: '' }
  return { prenom: parts[0], nom: parts.slice(1).join(' ') }
}

export function splitAccountName(full: string) {
  const cleaned = full.replace(/^(mme|mlles?|mr|m\.|dr|me|hon)\.?\s+/i, '').trim()
  const split = splitPassengerName(cleaned)
  return { prenom: split.prenom, nom: split.nom.toUpperCase() }
}

export interface ListedPerson {
  id: string
  kind: 'passager' | 'accompagnateur'
  nom: string
  prenom: string
  profession: string
  nationalite: string
  societe: string
  vol: string
  destination: string
  date: string
  heure: string
  salon: string
  checkedIn: boolean
  checkedAt?: string
  checkedBy?: string
  passagerNom: string
}

export function reservationPeople(r: {
  vol?: string
  destination?: string
  date?: string
  heure?: string
  salon?: string
  passengers?: Array<{
    id: string
    nom: string
    prenom: string
    nomPrenoms?: string
    profession?: string
    nationalite?: string
    societe?: string
    vol?: string
    destination?: string
    date?: string
    heure?: string
    salon?: string
    checkedIn: boolean
    checkedAt?: string
    checkedBy?: string
    accompagnateurs?: Array<{
      id: string
      nom: string
      prenom: string
      profession?: string
      nationalite?: string
      checkedIn: boolean
      checkedAt?: string
      checkedBy?: string
    }>
  }>
}): ListedPerson[] {
  const rows: ListedPerson[] = []
  for (const p of r.passengers ?? []) {
    const host = passengerFullName(p)
    const vol = p.vol || r.vol || ''
    const destination = p.destination || r.destination || ''
    const date = p.date || r.date || ''
    const heure = p.heure || r.heure || ''
    const salon = p.salon || r.salon || ''
    rows.push({
      id: p.id,
      kind: 'passager',
      nom: p.nom,
      prenom: p.prenom,
      profession: p.profession ?? '',
      nationalite: p.nationalite ?? '',
      societe: p.societe ?? '',
      vol,
      destination,
      date,
      heure,
      salon,
      checkedIn: p.checkedIn,
      checkedAt: p.checkedAt,
      checkedBy: p.checkedBy,
      passagerNom: host,
    })
    for (const a of p.accompagnateurs ?? []) {
      rows.push({
        id: a.id,
        kind: 'accompagnateur',
        nom: a.nom,
        prenom: a.prenom,
        profession: a.profession ?? '',
        nationalite: a.nationalite ?? '',
        societe: p.societe ?? '',
        vol,
        destination,
        date,
        heure,
        salon,
        checkedIn: a.checkedIn,
        checkedAt: a.checkedAt,
        checkedBy: a.checkedBy,
        passagerNom: host,
      })
    }
  }
  return rows
}

export function countCompanions(r: { passengers?: Array<{ accompagnateurs?: unknown[] }> }) {
  return (r.passengers ?? []).reduce((n, p) => n + (p.accompagnateurs?.length ?? 0), 0)
}

export function countPendingCheckins(reservations: Array<Parameters<typeof reservationPeople>[0] & { superStatut?: string }>) {
  return reservations.filter(r => r.superStatut !== 'annule').flatMap(r => reservationPeople(r)).filter(p => !p.checkedIn).length
}

export function hoursUntil(dateStr?: string, heure?: string) {
  if (!dateStr) return 0
  const d = parseDateOnly(dateStr)
  if (!d) return 0
  let hours = 12
  let minutes = 0
  if (heure && heure.includes(':')) {
    const [h, m] = heure.split(':').map(Number)
    if (!isNaN(h)) hours = h
    if (!isNaN(m)) minutes = m
  }
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes, 0)
  return (target.getTime() - Date.now()) / 3_600_000
}

async function loadBase64Image(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            resolve(canvas.toDataURL('image/png'))
            return
          }
        } catch {
          // ignore error
        }
        resolve(null)
      }
      img.onerror = () => resolve(null)
      img.src = url
    } catch {
      resolve(null)
    }
  })
}

export interface ExcelExportOptions {
  sheetName?: string
  title?: string
  metadata?: Array<{ label: string; value: string }>
}

/**
 * Exporte des données structurées sous forme de classeur Excel .xlsx
 * avec largeurs de colonnes optimisées et en-tête soigné.
 */
export function exportToExcel(
  data: (string | number)[][],
  filename: string,
  options: ExcelExportOptions = {}
) {
  try {
    const wb = XLSX.utils.book_new()
    const sheetName = (options.sheetName || 'Données').slice(0, 31)

    const rows: (string | number)[][] = []

    if (options.title) {
      rows.push([options.title.toUpperCase()])
      rows.push([
        `Date d'exportation : ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      ])
      if (options.metadata && options.metadata.length > 0) {
        rows.push([
          options.metadata.map(m => `${m.label}: ${m.value}`).join(' | '),
        ])
      }
      rows.push([]) // Ligne de séparation
    }

    data.forEach(row => rows.push(row))

    const ws = XLSX.utils.aoa_to_sheet(rows)

    // Calcul automatique et intelligent de la largeur des colonnes
    const colCount = Math.max(...rows.map(r => r.length), 1)
    const colWidths = []
    for (let c = 0; c < colCount; c++) {
      let maxLen = 8
      rows.forEach(r => {
        const cell = r[c]
        if (cell !== undefined && cell !== null) {
          const str = String(cell)
          if (str.length > maxLen && str.length < 50) {
            maxLen = str.length
          }
        }
      })
      colWidths.push({ wch: Math.min(Math.max(maxLen + 3, 10), 45) })
    }
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Excel export error:', error)
    throw new Error('Erreur lors de la génération du fichier Excel')
  }
}

export interface PdfExportOptions {
  subtitle?: string
  metadata?: Array<{ label: string; value: string }>
  orientation?: 'portrait' | 'landscape'
}

/**
 * Exporte des données au format PDF officiel SALT VIP avec logo,
 * en-tête institutionnel, métadonnées, pagination et tableau structuré.
 */
export async function exportToPdf(
  data: string[][],
  filename: string,
  title: string,
  options: PdfExportOptions = {}
) {
  try {
    const isLandscape = options.orientation === 'landscape' || (data[0] && data[0].length > 7)
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    // 1. Bandeau supérieur bleu nuit officiel (#063A54)
    doc.setFillColor(6, 58, 84)
    doc.rect(0, 0, pageWidth, 28, 'F')

    // Ligne dorée (#C9A66B)
    doc.setFillColor(201, 166, 107)
    doc.rect(0, 28, pageWidth, 1.5, 'F')

    // 2. Logo officiel
    let textStartX = 14
    try {
      const logoBase64 = await loadBase64Image('/facilresa-logo.png')
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 12, 4.5, 30, 19)
        textStartX = 48
      }
    } catch {
      // continuer si le logo est indisponible
    }

    // 3. Titres et sous-titres officiels
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(title.toUpperCase(), textStartX, 12.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(215, 235, 250)
    doc.text(
      options.subtitle || 'AÉROPORT INTERNATIONAL GNASSINGBÉ EYADEMA · SALONS VIP (SALT)',
      textStartX,
      18
    )

    doc.setFontSize(7.5)
    doc.setTextColor(185, 210, 230)
    doc.text(
      `Document officiel généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      textStartX,
      23.5
    )

    // 4. Cartouche des paramètres et totaux
    let startY = 34
    if (options.metadata && options.metadata.length > 0) {
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(14, startY, pageWidth - 28, 11, 2, 2, 'FD')

      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)

      let metaX = 18
      options.metadata.forEach((m) => {
        doc.setFont('helvetica', 'bold')
        doc.text(`${m.label} :`, metaX, startY + 7)
        const labelWidth = doc.getTextWidth(`${m.label} : `)
        doc.setFont('helvetica', 'normal')
        doc.text(m.value, metaX + labelWidth, startY + 7)
        metaX += labelWidth + doc.getTextWidth(m.value) + 12
      })

      startY += 16
    }

    // 5. Tableau autoTable
    autoTable(doc, {
      head: [data[0]],
      body: data.slice(1),
      startY: startY,
      theme: 'grid',
      styles: {
        fontSize: isLandscape ? 8 : 7.5,
        cellPadding: 2.2,
        overflow: 'linebreak',
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [6, 58, 84],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: isLandscape ? 8.5 : 8,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, top: 32, bottom: 18 },
      didDrawPage: (dataHook) => {
        // Pied de page sur chaque feuille
        doc.setDrawColor(226, 232, 240)
        doc.setLineWidth(0.3)
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12)

        doc.setFontSize(7.5)
        doc.setTextColor(148, 163, 184)
        doc.setFont('helvetica', 'normal')
        doc.text(
          'SALT VIP · Société Aéroportuaire de Lomé-Tokoin — Système officiel FacilRESA',
          14,
          pageHeight - 6.5
        )

        const pageStr = `Page ${dataHook.pageNumber}`
        doc.text(pageStr, pageWidth - 14 - doc.getTextWidth(pageStr), pageHeight - 6.5)
      },
    })

    doc.save(filename)
  } catch (error) {
    console.error('PDF export error:', error)
    throw new Error('Erreur lors de la génération du document PDF')
  }
}

/**
 * Trie une liste d'enregistrements par date et heure de vol.
 */
export function sortRowsByFlightDate<T>(
  list: T[],
  getDate: (item: T) => string | undefined,
  getHeure?: (item: T) => string | undefined,
  ascending = true
): T[] {
  return [...list].sort((a, b) => {
    const timeA = dateAndTimeToTimestamp(getDate(a), getHeure ? getHeure(a) : '')
    const timeB = dateAndTimeToTimestamp(getDate(b), getHeure ? getHeure(b) : '')
    return ascending ? timeA - timeB : timeB - timeA
  })
}
