import { useMemo, useState } from 'react'
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  Check,
} from 'lucide-react'
import { useAppStore } from '../../store/AppStore'
import PageHeader from '../../components/ui/PageHeader'
import {
  reservationPeople,
  exportToExcel,
  exportToPdf,
  parseDateOnly,
  dateAndTimeToTimestamp,
  formatFrDateLabel,
} from '../../lib/utils'
import { SALON_NAMES } from '../../data/salons'

export default function ExportCenter() {
  const { reservations, toast } = useAppStore()

  // Paramètres de filtrage et de tri
  const [dateMode, setDateMode] = useState<'all' | 'range'>('all')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    d.setDate(0)
    return d.toISOString().split('T')[0]
  })
  const [salon, setSalon] = useState('Tous les Salons')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [downloading, setDownloading] = useState<string | null>(null)

  // Aplatissement des personnes (passagers et accompagnateurs) filtrées par salon et date de vol individuelle
  const scopedPeople = useMemo(() => {
    const from = parseDateOnly(dateFrom)
    const to = parseDateOnly(dateTo)
    const inRange = (dateStr: string) => {
      if (dateMode !== 'range') return true
      const d = parseDateOnly(dateStr)
      if (!d) return true
      return !(from && d < from) && !(to && d > to)
    }
    return reservations.flatMap(r =>
      reservationPeople(r).map(p => ({
        ...p,
        resaId: r.id,
        vol: p.vol || r.vol,
        date: p.date || r.date,
        heure: p.heure || r.heure,
        salon: p.salon || r.salon,
        societe: p.societe || r.societe,
        protocole: r.protocoleCode ? `${r.protocoleNom} — ${r.protocoleCode}` : r.protocoleNom,
        hotesseNom: r.hotesseNom || '—',
        destination: p.destination || r.destination,
      }))
    ).filter(p => (salon === 'Tous les Salons' || p.salon === salon) && inRange(p.date))
  }, [reservations, salon, dateMode, dateFrom, dateTo])

  const filteredReservations = useMemo(
    () => reservations.filter(r => scopedPeople.some(p => p.resaId === r.id)),
    [reservations, scopedPeople]
  )

  // Tri par date
  const sortedPeople = useMemo(() => {
    return [...scopedPeople].sort((a, b) => {
      const timeA = dateAndTimeToTimestamp(a.date, a.heure)
      const timeB = dateAndTimeToTimestamp(b.date, b.heure)
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
    })
  }, [scopedPeople, sortOrder])

  // Calculs statistiques en temps réel pour l'export
  const stats = useMemo(() => {
    const totalPeople = scopedPeople.length
    const totalPassengers = scopedPeople.filter(p => p.kind === 'passager').length
    const totalCompanions = scopedPeople.filter(p => p.kind === 'accompagnateur').length
    const checkedInCount = scopedPeople.filter(p => p.checkedIn).length
    const pendingCount = totalPeople - checkedInCount
    const checkinRate = totalPeople > 0 ? Math.round((checkedInCount / totalPeople) * 100) : 0

    return {
      totalPeople,
      totalPassengers,
      totalCompanions,
      checkedInCount,
      pendingCount,
      checkinRate,
      reservationsCount: filteredReservations.length,
    }
  }, [scopedPeople, filteredReservations])

  // Génération des rapports PDF ou Excel
  const generateExport = async (reportId: string, format: 'excel' | 'pdf') => {
    const key = `${reportId}-${format}`
    setDownloading(key)

    try {
      const timestamp = Date.now()
      const triLabel = sortOrder === 'asc' ? 'Date croissante' : 'Date décroissante'
      const periodeLabel =
        dateMode === 'all'
          ? 'Toutes les dates'
          : `Du ${formatFrDateLabel(dateFrom)} au ${formatFrDateLabel(dateTo)}`

      const metadata = [
        { label: 'Période', value: periodeLabel },
        { label: 'Salon', value: salon },
        { label: 'Ordre du tri', value: triLabel },
        { label: 'Total personnes', value: `${stats.totalPeople} (${stats.totalPassengers} passagers, ${stats.totalCompanions} acc.)` },
        { label: 'Check-in', value: `${stats.checkedInCount} validés / ${stats.pendingCount} en attente (${stats.checkinRate}%)` },
      ]

      if (reportId === 'rapport_activite') {
        const title = "RAPPORT D'ACTIVITÉ & CONTRÔLE DES SALONS VIP"
        const data = [
          ['INDICATEUR', 'VALEUR', 'DÉTAILS'],
          ['Période analysée', periodeLabel, 'Filtre temporel appliqué'],
          ['Salon concerné', salon, 'Périmètre d\'extraction'],
          ['Tri appliqué', triLabel, 'Ordre chronologique'],
          ['Total réservations', String(stats.reservationsCount), 'Dossiers de réservation'],
          ['Total personnes attendues', String(stats.totalPeople), 'Passagers VIP + Accompagnateurs'],
          ['Passagers VIP principaux', String(stats.totalPassengers), 'Titulaires du protocole'],
          ['Accompagnateurs enregistrés', String(stats.totalCompanions), 'Délégations & assistants'],
          ['Entrées validées (Checking effectué)', String(stats.checkedInCount), `${stats.checkinRate}% du total`],
          ['En attente de validation', String(stats.pendingCount), 'Présence non encore enregistrée'],
        ]

        if (format === 'excel') {
          exportToExcel(data, `rapport-activite-salt-${timestamp}.xlsx`, {
            sheetName: 'Activité Salons VIP',
            title,
            metadata,
          })
          toast('Rapport d\'activité exporté avec succès en Excel', 'success')
        } else {
          await exportToPdf(data, `rapport-activite-salt-${timestamp}.pdf`, title, {
            subtitle: 'Bilan officiel d\'exploitation des salons VIP · SALT',
            metadata,
            orientation: 'portrait',
          })
          toast('Rapport d\'activité exporté avec succès en PDF', 'success')
        }
      } else if (reportId === 'etat_passager') {
        const title = 'ÉTAT OFFICIEL DES PASSAGERS & CONTRÔLE DES ENTRÉES'
        const header = [
          'N°',
          'DATE VOL',
          'N° VOL',
          'DESTINATION',
          'NOM & PRÉNOM',
          'PROFESSION',
          'ORGANISATION / SOCIÉTÉ',
          'SALON',
          'PROTOCOLE',
          'CHECK-IN',
        ]

        const body = sortedPeople.map((p, i) => [
          String(i + 1),
          p.date || '—',
          p.vol || '—',
          p.destination || '—',
          `${p.nom} ${p.prenom}`,
          p.profession || '—',
          p.societe || '—',
          p.salon,
          p.protocole,
          p.checkedIn ? `Validé (${p.checkedAt || 'OK'})` : 'En attente',
        ])

        const data = [header, ...body]

        if (format === 'excel') {
          exportToExcel(data, `etat-passagers-salt-${timestamp}.xlsx`, {
            sheetName: 'État Passagers',
            title,
            metadata,
          })
          toast('État des passagers exporté en Excel (trié par date)', 'success')
        } else {
          await exportToPdf(data, `etat-passagers-salt-${timestamp}.pdf`, title, {
            subtitle: 'Registre d\'émargement et de suivi des passagers VIP · SALT',
            metadata,
            orientation: 'landscape',
          })
          toast('État des passagers exporté en PDF (trié par date)', 'success')
        }
      } else {
        // Registre des réservations
        const title = 'REGISTRE OFFICIEL DES RÉSERVATIONS DE VOL'
        const header = [
          'DATE VOL',
          'N° VOL',
          'DESTINATION',
          'SALON',
          'PASSAGER PRINCIPAL',
          'FONCTION',
          'SOCIÉTÉ',
          'ACCOMPAGNATEURS',
          'PROTOCOLE DEMANDEUR',
          'STATUT',
        ]

        // Réservations triées par date
        const sortedResas = [...filteredReservations].sort((a, b) => {
          const timeA = dateAndTimeToTimestamp(a.date, a.heure)
          const timeB = dateAndTimeToTimestamp(b.date, b.heure)
          return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
        })

        const body = sortedResas.map(r => [
          r.date || '—',
          r.vol || '—',
          r.destination || '—',
          r.salon || '—',
          r.passager || `${r.prenom} ${r.nom}`,
          r.fonction || '—',
          r.societe || '—',
          String(r.accompagnateurs || 0),
          r.protocoleNom || '—',
          r.superStatut === 'valide' ? 'Validée' : r.superStatut === 'annule' ? 'Annulée' : 'En attente',
        ])

        const data = [header, ...body]

        if (format === 'excel') {
          exportToExcel(data, `registre-reservations-salt-${timestamp}.xlsx`, {
            sheetName: 'Réservations',
            title,
            metadata,
          })
          toast('Registre des réservations exporté en Excel (trié par date)', 'success')
        } else {
          await exportToPdf(data, `registre-reservations-salt-${timestamp}.pdf`, title, {
            subtitle: 'Suivi officiel des réservations et accès salons VIP · SALT',
            metadata,
            orientation: 'landscape',
          })
          toast('Registre des réservations exporté en PDF (trié par date)', 'success')
        }
      }
    } catch (err) {
      console.error(err)
      toast('Erreur lors de la génération de l\'export', 'error')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="p-6 md:p-8 fade-in space-y-6">
      <PageHeader
        title="Centre d'exportation officiel"
        subtitle="Rapports d'activité et registres certifiés SALT VIP · Formats PDF et Excel structurés"
        badge="Exportations certifiées"
      />

      {/* Paramètres d'exportation avec tri et filtres par date */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter size={15} style={{ color: 'var(--gold)' }} />
            <h2 className="font-semibold text-sm">Paramètres d'export & Critères de tri</h2>
          </div>
          <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>
            Les exports générés appliquent fidèlement ces critères
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Sélection de la période */}
          <div>
            <label className="label">Période d'exportation</label>
            <div className="flex gap-1.5 mt-1">
              <button
                type="button"
                className="btn-secondary py-1.5 px-3 text-xs flex-1"
                onClick={() => setDateMode('all')}
                style={
                  dateMode === 'all'
                    ? { background: 'var(--gold)', color: '#fff', borderColor: 'var(--gold)' }
                    : undefined
                }
              >
                Toutes les dates
              </button>
              <button
                type="button"
                className="btn-secondary py-1.5 px-3 text-xs flex-1"
                onClick={() => setDateMode('range')}
                style={
                  dateMode === 'range'
                    ? { background: 'var(--gold)', color: '#fff', borderColor: 'var(--gold)' }
                    : undefined
                }
              >
                Par plage
              </button>
            </div>
          </div>

          {/* Dates Du / Au */}
          {dateMode === 'range' ? (
            <>
              <div>
                <label className="label">Du</label>
                <input
                  type="date"
                  className="input py-1.5 text-xs"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Au</label>
                <input
                  type="date"
                  className="input py-1.5 text-xs"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2 flex items-center text-xs" style={{ color: 'var(--fg-muted)' }}>
              <span>L'export portera sur l'ensemble de l'historique des réservations enregistrées.</span>
            </div>
          )}

          {/* Salon */}
          <div>
            <label className="label">Salon</label>
            <select
              className="input py-1.5 text-xs"
              value={salon}
              onChange={e => setSalon(e.target.value)}
            >
              <option>Tous les Salons</option>
              {SALON_NAMES.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ligne de Tri par date */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} style={{ color: 'var(--gold)' }} />
            <span className="text-xs font-semibold">Trier les exportations par date :</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                className="btn-secondary py-1 px-3 text-xs"
                onClick={() => setSortOrder('asc')}
                style={
                  sortOrder === 'asc'
                    ? { background: 'var(--gold)', color: '#fff', borderColor: 'var(--gold)' }
                    : undefined
                }
              >
                Date croissante (ordre chronologique)
              </button>
              <button
                type="button"
                className="btn-secondary py-1 px-3 text-xs"
                onClick={() => setSortOrder('desc')}
                style={
                  sortOrder === 'desc'
                    ? { background: 'var(--gold)', color: '#fff', borderColor: 'var(--gold)' }
                    : undefined
                }
              >
                Date décroissante (plus récent d'abord)
              </button>
            </div>
          </div>

          <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>
            Total extrait : <strong style={{ color: 'var(--fg)' }}>{stats.totalPeople}</strong> personne(s)
          </div>
        </div>
      </div>

      {/* Aperçu des statistiques calculées pour l'export */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          className="rounded-2xl p-4 backdrop-blur-md"
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 75%, transparent)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
              Personnes sélectionnées
            </span>
            <Users size={14} style={{ color: 'var(--fg-muted)' }} />
          </div>
          <p className="font-display text-2xl font-bold" style={{ color: 'var(--fg)' }}>
            {stats.totalPeople}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--fg-muted)' }}>
            {stats.totalPassengers} passagers · {stats.totalCompanions} accompagnateurs
          </p>
        </div>

        <div
          className="rounded-2xl p-4 backdrop-blur-md"
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 75%, transparent)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
              Check-in validés
            </span>
            <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
          </div>
          <p className="font-display text-2xl font-bold" style={{ color: 'var(--success)' }}>
            {stats.checkedInCount}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--fg-muted)' }}>
            {stats.checkinRate}% des personnes attendues
          </p>
        </div>

        <div
          className="rounded-2xl p-4 backdrop-blur-md"
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 75%, transparent)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
              En attente d'entrée
            </span>
            <Clock size={14} style={{ color: 'var(--warn)' }} />
          </div>
          <p className="font-display text-2xl font-bold" style={{ color: 'var(--warn)' }}>
            {stats.pendingCount}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--fg-muted)' }}>
            Checking non encore effectué
          </p>
        </div>

        <div
          className="rounded-2xl p-4 backdrop-blur-md"
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 75%, transparent)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
              Dossiers de vol
            </span>
            <Building2 size={14} style={{ color: 'var(--fg-muted)' }} />
          </div>
          <p className="font-display text-2xl font-bold" style={{ color: 'var(--fg)' }}>
            {stats.reservationsCount}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--fg-muted)' }}>
            {salon}
          </p>
        </div>
      </div>

      {/* Cartes des différents types d'exports */}
      <div className="grid md:grid-cols-3 gap-5">
        {/* Rapport 1 : État Passagers */}
        <div className="card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
              >
                <Users size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm font-mono">ÉTAT PASSAGERS & CONTRÔLE</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                  Registre nominatif complet pour l'émargement et la traçabilité des entrées
                </p>
              </div>
            </div>

            <div className="text-xs space-y-1 mb-4" style={{ color: 'var(--fg-muted)' }}>
              <p>• Trié selon la date de vol ({sortOrder === 'asc' ? 'croissant' : 'décroissant'})</p>
              <p>• Détail passagers VIP et accompagnateurs rattachés</p>
              <p>• Statut de checking horodaté avec identité de l'agent</p>
            </div>
          </div>

          <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                onClick={() => generateExport('etat_passager', 'pdf')}
                disabled={downloading === 'etat_passager-pdf'}
              >
                <FileText size={13} />
                {downloading === 'etat_passager-pdf' ? 'Génération…' : 'Exporter PDF'}
              </button>
              <button
                type="button"
                className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                onClick={() => generateExport('etat_passager', 'excel')}
                disabled={downloading === 'etat_passager-excel'}
              >
                <FileSpreadsheet size={13} />
                {downloading === 'etat_passager-excel' ? 'Génération…' : 'Exporter Excel'}
              </button>
            </div>
          </div>
        </div>

        {/* Rapport 2 : Registre Réservations */}
        <div className="card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
              >
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm font-mono">REGISTRE DES RÉSERVATIONS</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                  Suivi chronologique de tous les vols et protocoles demandeurs
                </p>
              </div>
            </div>

            <div className="text-xs space-y-1 mb-4" style={{ color: 'var(--fg-muted)' }}>
              <p>• Tri chronologique par date de vol</p>
              <p>• Suivi du protocole demandeur et de l'organisation</p>
              <p>• Nombre d'accompagnateurs et statut de validation</p>
            </div>
          </div>

          <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                onClick={() => generateExport('reservation', 'pdf')}
                disabled={downloading === 'reservation-pdf'}
              >
                <FileText size={13} />
                {downloading === 'reservation-pdf' ? 'Génération…' : 'Exporter PDF'}
              </button>
              <button
                type="button"
                className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                onClick={() => generateExport('reservation', 'excel')}
                disabled={downloading === 'reservation-excel'}
              >
                <FileSpreadsheet size={13} />
                {downloading === 'reservation-excel' ? 'Génération…' : 'Exporter Excel'}
              </button>
            </div>
          </div>
        </div>

        {/* Rapport 3 : Rapport d'Activité */}
        <div className="card p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
              >
                <FileText size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm font-mono">BILAN D'ACTIVITÉ DES SALONS</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                  Synthèse statistique et indicateurs de fréquentation
                </p>
              </div>
            </div>

            <div className="text-xs space-y-1 mb-4" style={{ color: 'var(--fg-muted)' }}>
              <p>• Indicateurs clés et taux d'occupation</p>
              <p>• Synthèse des présences réelles vs attendues</p>
              <p>• Document officiel de synthèse pour la direction</p>
            </div>
          </div>

          <div className="space-y-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                onClick={() => generateExport('rapport_activite', 'pdf')}
                disabled={downloading === 'rapport_activite-pdf'}
              >
                <FileText size={13} />
                {downloading === 'rapport_activite-pdf' ? 'Génération…' : 'Exporter PDF'}
              </button>
              <button
                type="button"
                className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                onClick={() => generateExport('rapport_activite', 'excel')}
                disabled={downloading === 'rapport_activite-excel'}
              >
                <FileSpreadsheet size={13} />
                {downloading === 'rapport_activite-excel' ? 'Génération…' : 'Exporter Excel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
