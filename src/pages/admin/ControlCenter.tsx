import { useMemo, useState } from 'react'
import { Plus, Search, UserCheck, X, Clock, Building2, Users, PlaneTakeoff, IdCard, Calendar, CalendarDays, Trash2, Check } from 'lucide-react'
import { useAppStore } from '../../store/AppStore'
import PageHeader from '../../components/ui/PageHeader'
import { SALON_NAMES } from '../../data/salons'
import { reservationPeople, dateAndTimeToTimestamp, formatFrDateLabel } from '../../lib/utils'

const hotesses = ['Akosua', 'Adjoua', 'Koko', 'Efua', 'Afi']

export default function ControlCenter() {
  const { reservations, deleteReservation, toast } = useAppStore()
  const [search, setSearch] = useState('')
  const [salon, setSalon] = useState('Tous')
  const [dateFilter, setDateFilter] = useState('all')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const allPeople = reservations.flatMap(r => reservationPeople(r).map(p => ({ ...p, resaId: r.id, protocole: r.protocoleCode ? `${r.protocoleNom} — ${r.protocoleCode}` : r.protocoleNom })))

  const availableDates = useMemo(() => {
    return Array.from(new Set(allPeople.map(p => p.date).filter(Boolean)))
      .sort((a, b) => dateAndTimeToTimestamp(a) - dateAndTimeToTimestamp(b))
  }, [allPeople])

  const filtered = allPeople.filter(p =>
    `${p.nom} ${p.prenom} ${p.vol} ${p.societe} ${p.protocole}`.toLowerCase().includes(search.toLowerCase()) &&
    (salon === 'Tous' || p.salon.includes(salon)) &&
    (dateFilter === 'all' || p.date === dateFilter)
  )

  return (
    <div className="p-6 md:p-8 fade-in">
      <PageHeader
        title="Réservations"
        subtitle={`Suivi des réservations · ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        badge="Opérations"
      />

      <div className="flex items-center gap-2 flex-wrap mb-5">
        {['Tous', ...SALON_NAMES.map(s => s.replace('Salon ', ''))].map(s => (
          <button key={s} onClick={() => setSalon(s)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: salon === s ? 'var(--gold)' : 'var(--bg-card)', color: salon === s ? '#fff' : 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
            {s}
          </button>
        ))}

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--fg-muted)' }}>
            <CalendarDays size={14} style={{ color: 'var(--gold)' }} /> Date :
          </span>
          <select
            className="input py-1.5 px-2.5 text-xs max-w-[220px]"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          >
            <option value="all">Toutes les dates</option>
            {availableDates.map(d => (
              <option key={d} value={d}>{d} — {formatFrDateLabel(d)}</option>
            ))}
          </select>
          {dateFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className="text-xs text-red-500 hover:underline flex items-center gap-1"
              title="Effacer le filtre de date"
            >
              <X size={12} /> Effacer
            </button>
          )}
        </div>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-muted)' }} />
        <input className="input pl-10" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher nom, vol, société..." style={{ paddingLeft: '40px' }} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                {['VOL', 'DATE', 'NOM', 'PRÉNOM', 'PROFESSION', 'SOCIÉTÉ', 'SALON', 'PROTOCOLE', 'ACTIONS'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={`${p.resaId}-${p.id}`} style={{ borderBottom: '1px solid var(--border-subtle)', background: i % 2 ? 'var(--bg-elevated)' : 'transparent' }}>
                  <td className="px-3 py-3 font-semibold" style={{ color: 'var(--gold)' }}>{p.vol}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{p.date}</td>
                  <td className="px-3 py-3 font-medium">{p.nom}</td>
                  <td className="px-3 py-3">{p.prenom}</td>
                  <td className="px-3 py-3">{p.profession || '—'}</td>
                  <td className="px-3 py-3">{p.societe || '—'}</td>
                  <td className="px-3 py-3">{p.salon}</td>
                  <td className="px-3 py-3">{p.protocole}</td>
                  <td className="px-3 py-3">
                    {deleteConfirmId !== p.resaId ? (
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                        onClick={() => setDeleteConfirmId(p.resaId)}
                        title="Supprimer la réservation"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-red-500/10 p-1 rounded-md">
                        <button
                          type="button"
                          className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-semibold hover:bg-red-700"
                          onClick={() => {
                            deleteReservation(p.resaId)
                            setDeleteConfirmId(null)
                            toast(`Réservation ${p.vol} supprimée définitivement`, 'success')
                          }}
                          title="Confirmer la suppression"
                        >
                          Oui
                        </button>
                        <button
                          type="button"
                          className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[10px]"
                          onClick={() => setDeleteConfirmId(null)}
                          title="Annuler"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 text-xs" style={{ color: 'var(--fg-muted)' }}>{filtered.length} personne(s)</div>
      </div>
    </div>
  )
}
