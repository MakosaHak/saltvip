import { useMemo, useState } from 'react'
import {
  Search,
  UserCheck,
  Check,
  Calendar,
  Clock,
  Lock,
  ArrowUpDown,
  AlertCircle,
  CalendarDays,
  Plane,
  X,
  SlidersHorizontal,
  Info,
  Download,
  FileSpreadsheet,
  FileText,
  Trash2,
  Building2,
} from 'lucide-react'
import { useAppStore } from '../../store/AppStore'
import { SALON_NAMES } from '../../data/salons'
import {
  passengerFullName,
  reservationPeople,
  getCheckinDateStatus,
  dateAndTimeToTimestamp,
  formatFrDateLabel,
  toIsoDate,
  exportToExcel,
  exportToPdf,
} from '../../lib/utils'
import PageHeader from '../../components/ui/PageHeader'

export default function Checking() {
  const { reservations, user, checkInPassenger, deleteReservation, toast } = useAppStore()
  const [q, setQ] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [dateFilter, setDateFilter] = useState<string>('all') // 'all', 'today', ou date spécifique 'DD/MM/YYYY' ou 'YYYY-MM-DD'
  const [salonFilter, setSalonFilter] = useState('Tous')
  const [deleteResaConfirmId, setDeleteResaConfirmId] = useState<string | null>(null)

  // Aplatissement de toutes les personnes associées aux réservations
  const rows = useMemo(() => {
    return reservations.filter(r => r.superStatut !== 'annule').flatMap(r =>
      reservationPeople(r).map(p => {
        const flightDate = p.date || r.date || ''
        const flightHeure = p.heure || r.heure || ''
        const dateStatus = getCheckinDateStatus(flightDate)
        const timestamp = dateAndTimeToTimestamp(flightDate, flightHeure)

        return {
          ...p,
          resaId: r.id,
          vol: p.vol || r.vol,
          date: flightDate,
          heure: flightHeure,
          salon: p.salon || r.salon,
          protocole: r.protocoleCode ? `${r.protocoleNom} — ${r.protocoleCode}` : r.protocoleNom,
          dateStatus,
          timestamp,
        }
      })
    )
  }, [reservations])

  // KPIs
  const pending = rows.filter(r => !r.checkedIn)
  const done = rows.filter(r => r.checkedIn)
  const todayCount = pending.filter(r => r.dateStatus.isToday).length
  const futureLockedCount = pending.filter(r => r.dateStatus.isFuture).length

  // Liste des dates disponibles avec compteurs pour le filtre
  const availableDates = useMemo(() => {
    const map = new Map<string, { dateStr: string; count: number; isToday: boolean; isFuture: boolean }>()
    for (const r of rows) {
      if (!r.date) continue
      const existing = map.get(r.date)
      if (existing) {
        existing.count += 1
      } else {
        map.set(r.date, {
          dateStr: r.date,
          count: 1,
          isToday: r.dateStatus.isToday,
          isFuture: r.dateStatus.isFuture,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      dateAndTimeToTimestamp(a.dateStr) - dateAndTimeToTimestamp(b.dateStr)
    )
  }, [rows])

  // Filtrage
  const source = showDone ? done : pending
  const filtered = useMemo(() => {
    return source.filter(r => {
      // Filtre texte
      const textMatch = `${passengerFullName(r)} ${r.nom} ${r.prenom} ${r.profession} ${r.vol} ${r.protocole} ${r.passagerNom} ${r.salon}`
        .toLowerCase()
        .includes(q.trim().toLowerCase())
      if (!textMatch) return false

      // Filtre salon (Solidarité ou Plus)
      if (salonFilter !== 'Tous' && !r.salon.includes(salonFilter)) return false

      // Filtre de date
      if (dateFilter === 'today') {
        return r.dateStatus.isToday
      }
      if (dateFilter !== 'all') {
        return r.date === dateFilter || toIsoDate(r.date) === dateFilter
      }

      return true
    })
  }, [source, q, dateFilter, salonFilter])

  // Tri par date
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.timestamp - b.timestamp
      } else {
        return b.timestamp - a.timestamp
      }
    })
  }, [filtered, sortOrder])

  // Regroupement par date pour un affichage hiérarchisé et clair
  const groupedByDate = useMemo(() => {
    const groups: Array<{
      dateKey: string
      dateLabel: string
      dateStatus: ReturnType<typeof getCheckinDateStatus>
      items: typeof sorted
    }> = []

    for (const item of sorted) {
      const key = item.date || 'Non renseignée'
      let grp = groups.find(g => g.dateKey === key)
      if (!grp) {
        grp = {
          dateKey: key,
          dateLabel: formatFrDateLabel(key),
          dateStatus: item.dateStatus,
          items: [],
        }
        groups.push(grp)
      }
      grp.items.push(item)
    }
    return groups
  }, [sorted])

  // Action de validation sécurisée par la règle du Jour J
  const validate = (resaId: string, personId: string, name: string, dateStr?: string) => {
    const status = getCheckinDateStatus(dateStr)
    if (!status.allowed) {
      toast(
        `Validation impossible avant le jour J : cette réservation est prévue pour le ${dateStr} (${status.label.toLowerCase()}). Le checking n'est autorisé que le jour J.`,
        'error'
      )
      return
    }
    const success = checkInPassenger(resaId, personId, user?.name ?? 'Contrôle entrée')
    if (success !== false) {
      toast(`${name} validé — entrée au salon autorisée`, 'success')
    }
  }

  const [exportMenu, setExportMenu] = useState(false)

  const handleExport = async (format: 'pdf' | 'excel') => {
    const timestamp = Date.now()
    const targetDateLabel =
      dateFilter === 'all'
        ? 'Toutes les dates'
        : dateFilter === 'today'
        ? "Aujourd'hui (Jour J)"
        : formatFrDateLabel(dateFilter)

    const metadata = [
      { label: 'Date/Période', value: targetDateLabel },
      { label: 'Salon', value: salonFilter === 'Tous' ? 'Tous les salons' : salonFilter },
      { label: 'Tri appliqué', value: sortOrder === 'asc' ? 'Date croissante' : 'Date décroissante' },
      { label: 'Total personnes', value: `${sorted.length} (${pending.length} en attente, ${done.length} validés)` },
      { label: 'Vue affichée', value: showDone ? 'Déjà entrés' : 'À valider' },
    ]

    const header = [
      'N°',
      'DATE DU VOL',
      'N° VOL',
      'SALON',
      'NOM & PRÉNOM',
      'PROFESSION',
      'SOCIÉTÉ',
      'PROTOCOLE',
      'STATUT CHECKING',
    ]

    const body = sorted.map((r, i) => [
      String(i + 1),
      r.date || '—',
      r.vol || '—',
      r.salon || '—',
      passengerFullName(r),
      r.profession || '—',
      r.societe || '—',
      r.protocole || '—',
      r.checkedIn
        ? `Validé (${r.checkedAt || 'OK'})`
        : r.dateStatus.allowed
        ? 'Attendu Jour J'
        : `Bloqué (${r.dateStatus.label})`,
    ])

    const data = [header, ...body]
    const title = `LISTE DU CHECKING — ${targetDateLabel.toUpperCase()}`

    try {
      if (format === 'excel') {
        exportToExcel(data, `checking-salt-${timestamp}.xlsx`, {
          sheetName: 'Checking VIP',
          title,
          metadata,
        })
        toast('Liste du checking exportée en Excel (triée par date)', 'success')
      } else {
        await exportToPdf(data, `checking-salt-${timestamp}.pdf`, title, {
          subtitle: 'Contrôle officiel d\'accès et émargement en direct · SALT VIP',
          metadata,
          orientation: 'landscape',
        })
        toast('Liste du checking exportée en PDF (triée par date)', 'success')
      }
    } catch (e) {
      console.error(e)
      toast('Erreur lors de l\'exportation', 'error')
    }
    setExportMenu(false)
  }

  return (
    <div className="p-6 md:p-8 fade-in space-y-6">
      <PageHeader
        title="Checking arrivée & départ"
        subtitle="Contrôle d'accès au salon VIP · Validation au jour J et tri par date"
        badge="Contrôle d'accès"
        actions={
          <div className="relative">
            <button
              type="button"
              className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5 shadow-sm"
              onClick={() => setExportMenu(!exportMenu)}
            >
              <Download size={13} /> Exporter la liste
            </button>
            {exportMenu && (
              <div
                className="absolute right-0 mt-2 card p-2 min-w-[170px] z-20 shadow-lg"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
              >
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 font-medium"
                  onClick={() => handleExport('pdf')}
                >
                  <FileText size={13} style={{ color: 'var(--gold)' }} /> Exporter en PDF
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 font-medium"
                  onClick={() => handleExport('excel')}
                >
                  <FileSpreadsheet size={13} style={{ color: 'var(--success)' }} /> Exporter en Excel
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* 4 Cartes statistiques sobres avec effet glassmorphism */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-md"
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 75%, transparent)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
              En attente
            </span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--ink-soft)', color: 'var(--fg-muted)' }}
            >
              <Clock size={14} />
            </div>
          </div>
          <p className="font-display text-2xl font-bold" style={{ color: 'var(--fg)' }}>
            {pending.length}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--fg-muted)' }}>
            Passagers & accompagnateurs
          </p>
        </div>

        <div
          className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-md"
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 75%, transparent)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
              Aujourd'hui (Jour J)
            </span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
            >
              <Calendar size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="font-display text-2xl font-bold" style={{ color: 'var(--fg)' }}>
              {todayCount}
            </p>
            {todayCount > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold"
                style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
              >
                Validables
              </span>
            )}
          </div>
          <p className="text-[11px] mt-1" style={{ color: 'var(--fg-muted)' }}>
            Entrées autorisées ce jour
          </p>
        </div>

        <div
          className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-md"
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 75%, transparent)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
              Dates futures
            </span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--ink-soft)', color: 'var(--fg-muted)' }}
            >
              <Lock size={13} />
            </div>
          </div>
          <p className="font-display text-2xl font-bold" style={{ color: 'var(--fg)' }}>
            {futureLockedCount}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--fg-muted)' }}>
            Bloqués jusqu'au jour J
          </p>
        </div>

        <div
          className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 backdrop-blur-md"
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 75%, transparent)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--fg-muted)' }}>
              Déjà entrés
            </span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--ink-soft)', color: 'var(--fg-muted)' }}
            >
              <UserCheck size={14} />
            </div>
          </div>
          <p className="font-display text-2xl font-bold" style={{ color: 'var(--fg)' }}>
            {done.length}
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--fg-muted)' }}>
            Checkings déjà effectués
          </p>
        </div>
      </div>

      {/* Barre de recherche et de filtres principaux */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Recherche */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--fg-muted)' }}
            />
            <input
              className="input pl-10"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Rechercher passager, accompagnateur, vol, salon..."
              style={{ paddingLeft: '40px' }}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Onglets Statut : À valider / Déjà entrés */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              onClick={() => setShowDone(false)}
              style={
                !showDone
                  ? { background: 'var(--gold)', color: '#fff', boxShadow: 'var(--shadow-sm)' }
                  : { color: 'var(--fg-muted)' }
              }
            >
              À valider ({pending.length})
            </button>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              onClick={() => setShowDone(true)}
              style={
                showDone
                  ? { background: 'var(--gold)', color: '#fff', boxShadow: 'var(--shadow-sm)' }
                  : { color: 'var(--fg-muted)' }
              }
            >
              Déjà entrés ({done.length})
            </button>
          </div>
        </div>

        {/* Ligne des tris et filtres par date */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {/* Filtres par date selon des dates données */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--fg-muted)' }}>
              <CalendarDays size={14} style={{ color: 'var(--gold)' }} /> Filtrer par date :
            </span>

            <button
              type="button"
              className="btn-secondary py-1 px-3 text-xs"
              onClick={() => setDateFilter('all')}
              style={
                dateFilter === 'all'
                  ? { background: 'var(--gold)', color: '#fff', borderColor: 'var(--gold)' }
                  : undefined
              }
            >
              Toutes les dates
            </button>

            <button
              type="button"
              className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5"
              onClick={() => setDateFilter('today')}
              style={
                dateFilter === 'today'
                  ? { background: 'var(--success)', color: '#fff', borderColor: 'var(--success)' }
                  : undefined
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Aujourd'hui (Jour J)
              {todayCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                  {todayCount}
                </span>
              )}
            </button>

            {/* Sélecteur de date précise parmi les vols */}
            {availableDates.length > 0 && (
              <select
                className="input py-1 px-2.5 text-xs max-w-[210px]"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              >
                <option value="all">Date spécifique…</option>
                {availableDates.map(d => (
                  <option key={d.dateStr} value={d.dateStr}>
                    {d.dateStr} {d.isToday ? '(Aujourd\'hui)' : d.isFuture ? '(Futur)' : '(Passé)'} ({d.count})
                  </option>
                ))}
              </select>
            )}

            {dateFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className="text-xs text-red-500 hover:underline flex items-center gap-1 ml-1"
                title="Réinitialiser le filtre de date"
              >
                <X size={12} /> Effacer le filtre
              </button>
            )}
          </div>

          {/* Filtre par salon : Solidarité ou Plus */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--fg-muted)' }}>
              <Building2 size={14} style={{ color: 'var(--gold)' }} /> Salon :
            </span>
            {['Tous', ...SALON_NAMES.map(s => s.replace('Salon ', ''))].map(s => (
              <button
                key={s}
                type="button"
                className="btn-secondary py-1 px-3 text-xs"
                onClick={() => setSalonFilter(s)}
                style={
                  salonFilter === s
                    ? { background: 'var(--gold)', color: '#fff', borderColor: 'var(--gold)' }
                    : undefined
                }
              >
                {s}
              </button>
            ))}
          </div>

          {/* Contrôle de tri par date */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--fg-muted)' }}>
              <ArrowUpDown size={13} style={{ color: 'var(--gold)' }} /> Tri :
            </span>
            <button
              type="button"
              className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5"
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              title="Cliquer pour inverser le tri chronologique"
            >
              <span className="font-medium">
                {sortOrder === 'asc'
                  ? 'Date croissante (ordre chronologique)'
                  : 'Date décroissante (plus récent d\'abord)'}
              </span>
              <span className="text-[10px] opacity-70">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Résumé des filtres actifs */}
      {(dateFilter !== 'all' || salonFilter !== 'Tous') && (
        <div className="flex items-center gap-2 px-1 text-xs" style={{ color: 'var(--fg-muted)' }}>
          <Info size={13} style={{ color: 'var(--gold)' }} />
          <span>
            Affichage des checkings pour :{' '}
            <strong style={{ color: 'var(--fg)' }}>
              {dateFilter === 'all' ? 'Toutes les dates' : dateFilter === 'today' ? "Aujourd'hui (Jour J)" : formatFrDateLabel(dateFilter)}
            </strong>
            {salonFilter !== 'Tous' && (
              <>
                {' '}· Salon <strong style={{ color: 'var(--fg)' }}>{salonFilter}</strong>
              </>
            )}
            {' '}· {sorted.length} personne(s) trouvée(s)
          </span>
        </div>
      )}

      {/* Liste des personnes regroupées par date */}
      <div className="space-y-6">
        {groupedByDate.length === 0 && (
          <div className="card p-12 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
            <Calendar size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-base mb-1" style={{ color: 'var(--fg)' }}>
              Aucune personne trouvée
            </p>
            <p className="text-xs">
              {q || dateFilter !== 'all' || salonFilter !== 'Tous'
                ? 'Aucun passager ne correspond aux critères de recherche, à la date ou au salon sélectionné.'
                : showDone
                ? 'Aucun passager n\'a encore été validé à l\'entrée.'
                : 'Personne en attente de checking pour le moment.'}
            </p>
            {(q || dateFilter !== 'all' || salonFilter !== 'Tous') && (
              <button
                type="button"
                className="btn-secondary mt-4 text-xs py-1.5 px-3 mx-auto"
                onClick={() => {
                  setQ('')
                  setDateFilter('all')
                  setSalonFilter('Tous')
                }}
              >
                Réinitialiser la recherche et les filtres
              </button>
            )}
          </div>
        )}

        {groupedByDate.map(group => {
          const isToday = group.dateStatus.isToday
          const isFuture = group.dateStatus.isFuture

          return (
            <div key={group.dateKey} className="space-y-3">
              {/* En-tête de date du groupe */}
              <div
                className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-xl"
                style={{
                  background: isToday
                    ? 'rgba(93, 184, 138, 0.12)'
                    : isFuture
                    ? 'rgba(234, 88, 12, 0.08)'
                    : 'var(--bg-elevated)',
                  border: isToday
                    ? '1px solid rgba(93, 184, 138, 0.3)'
                    : isFuture
                    ? '1px solid rgba(234, 88, 12, 0.2)'
                    : '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar
                    size={15}
                    style={{
                      color: isToday
                        ? 'var(--success)'
                        : isFuture
                        ? '#ea580c'
                        : 'var(--gold)',
                    }}
                  />
                  <span className="font-bold text-sm capitalize" style={{ color: 'var(--fg)' }}>
                    {group.dateLabel}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
                    ({group.dateKey})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isToday && (
                    <span
                      className="chip text-xs font-semibold"
                      style={{
                        background: 'var(--success-bg)',
                        color: 'var(--success)',
                        border: '1px solid rgba(93, 184, 138, 0.3)',
                      }}
                    >
                      ⭐ Jour J (Validation autorisée)
                    </span>
                  )}

                  {isFuture && (
                    <span
                      className="chip text-xs font-semibold flex items-center gap-1"
                      style={{
                        background: 'rgba(234, 88, 12, 0.12)',
                        color: '#ea580c',
                        border: '1px solid rgba(234, 88, 12, 0.3)',
                      }}
                    >
                      <Lock size={11} /> {group.dateStatus.label} · Validation verrouillée
                    </span>
                  )}

                  {!isToday && !isFuture && (
                    <span
                      className="chip text-xs"
                      style={{ background: 'var(--bg-card)', color: 'var(--fg-muted)' }}
                    >
                      Date passée
                    </span>
                  )}

                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: 'var(--bg-card)', color: 'var(--fg)' }}
                  >
                    {group.items.length} personne(s)
                  </span>
                </div>
              </div>

              {/* Cartes des passagers de cette date */}
              <div className="space-y-2.5">
                {group.items.map(r => {
                  const allowedToValidate = r.dateStatus.allowed

                  return (
                    <div
                      key={`${r.resaId}-${r.id}`}
                      className="card p-4 flex items-center gap-4 flex-wrap transition-all hover:border-[var(--gold)]"
                      style={
                        !allowedToValidate && !r.checkedIn
                          ? { opacity: 0.92, borderColor: 'rgba(234, 88, 12, 0.25)' }
                          : undefined
                      }
                    >
                      {/* Icône du passager */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: r.checkedIn
                            ? 'var(--success-bg)'
                            : !allowedToValidate
                            ? 'rgba(234, 88, 12, 0.1)'
                            : 'var(--gold-soft)',
                          color: r.checkedIn
                            ? 'var(--success)'
                            : !allowedToValidate
                            ? '#ea580c'
                            : 'var(--gold)',
                        }}
                      >
                        {r.checkedIn ? (
                          <Check size={18} strokeWidth={2.5} />
                        ) : !allowedToValidate ? (
                          <Lock size={17} />
                        ) : (
                          <UserCheck size={18} />
                        )}
                      </div>

                      {/* Identité */}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-base" style={{ color: 'var(--fg)' }}>
                            {passengerFullName(r)}
                          </p>
                        </div>

                        <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>
                          {[r.profession, r.societe, r.nationalite].filter(Boolean).join(' · ')}
                        </p>

                        <p className="text-[11px] mt-1" style={{ color: 'var(--fg-muted)' }}>
                          Demandé par protocole :{' '}
                          <span className="font-medium" style={{ color: 'var(--fg)' }}>
                            {r.protocole}
                          </span>
                        </p>
                      </div>

                      {/* Détails du vol : Numéro, date et salon */}
                      <div className="text-xs min-w-[150px] space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--fg)' }}>
                          <Plane size={13} style={{ color: 'var(--gold)' }} />
                          <span style={{ color: 'var(--gold)' }}>{r.vol}</span>
                          <span className="font-normal" style={{ color: 'var(--fg-muted)' }}>
                            · {r.salon}
                          </span>
                        </div>

                        <div className="flex items-center gap-2" style={{ color: 'var(--fg-muted)' }}>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {r.date}
                          </span>
                        </div>
                      </div>

                      {/* Bloc de validation / État du checking */}
                      <div className="flex flex-col items-end gap-1.5 min-w-[170px]">
                        {r.checkedIn ? (
                          <div className="text-right">
                            <span
                              className="chip font-semibold text-xs inline-flex items-center gap-1.5"
                              style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
                            >
                              <Check size={13} strokeWidth={2.5} /> Validé
                            </span>
                            <p className="text-[10px] mt-1" style={{ color: 'var(--fg-muted)' }}>
                              {r.checkedAt} {r.checkedBy ? `par ${r.checkedBy}` : ''}
                            </p>
                          </div>
                        ) : allowedToValidate ? (
                          /* Jour J atteint : Validation permise */
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              className="btn-primary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                              onClick={() => validate(r.resaId, r.id, passengerFullName(r), r.date)}
                            >
                              <Check size={14} strokeWidth={2.5} /> Valider l'entrée
                            </button>
                            {r.dateStatus.isToday && (
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                Jour J · Entrée autorisée
                              </span>
                            )}
                          </div>
                        ) : (
                          /* Avant le Jour J : Validation strictement bloquée */
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              disabled
                              className="btn-secondary py-2 px-3 text-xs opacity-65 cursor-not-allowed flex items-center gap-1.5"
                              style={{
                                background: 'rgba(234, 88, 12, 0.08)',
                                color: '#ea580c',
                                borderColor: 'rgba(234, 88, 12, 0.3)',
                              }}
                              onClick={() =>
                                validate(r.resaId, r.id, passengerFullName(r), r.date)
                              }
                              title={`Validation bloquée avant le jour J (${r.date})`}
                            >
                              <Lock size={13} /> Bloqué avant jour J
                            </button>
                            <span
                              className="text-[10px] font-medium"
                              style={{ color: '#ea580c' }}
                            >
                              {r.dateStatus.label} ({r.date})
                            </span>
                          </div>
                        )}

                        {/* Bouton supprimer la réservation */}
                        <div className="mt-1">
                          {deleteResaConfirmId !== r.resaId ? (
                            <button
                              type="button"
                              className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors"
                              onClick={() => setDeleteResaConfirmId(r.resaId)}
                              title="Supprimer définitivement cette réservation"
                            >
                              <Trash2 size={11} /> Supprimer
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-1.5 py-1 rounded-lg">
                              <span className="text-[10px] text-red-600 font-medium px-1">
                                Confirmer ?
                              </span>
                              <button
                                type="button"
                                className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-semibold hover:bg-red-700"
                                onClick={() => {
                                  deleteReservation(r.resaId)
                                  setDeleteResaConfirmId(null)
                                  toast(`Réservation ${r.vol} supprimée définitivement`, 'success')
                                }}
                                title="Confirmer la suppression"
                              >
                                Oui
                              </button>
                              <button
                                type="button"
                                className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[10px] hover:bg-black/20"
                                onClick={() => setDeleteResaConfirmId(null)}
                                title="Annuler"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
