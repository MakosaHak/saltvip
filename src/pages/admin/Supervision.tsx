import { useState } from 'react'
import { Check, X, RefreshCw, UserX, AlertCircle, Clock } from 'lucide-react'
import { useAppStore, type SuperStatut } from '../../store/AppStore'
import PageHeader from '../../components/ui/PageHeader'
import { SALON_NAMES } from '../../data/salons'

const statConfig = {
  en_attente: { label: 'En attente', color: 'var(--warn)', bg: 'var(--warn-bg)', icon: Clock },
  valide:     { label: 'Validée',    color: 'var(--success)', bg: 'var(--success-bg)', icon: Check },
  annule:     { label: 'Annulée',    color: 'var(--danger)', bg: 'var(--danger-bg)', icon: X },
}

export default function Supervision() {
  const { reservations, user, validateReservation, cancelReservation, reassignSalon, toast } = useAppStore()
  const [filterStatut, setFilterStatut] = useState<SuperStatut | 'all'>('all')
  const [reassignId, setReassignId] = useState<string | null>(null)

  const filtered = reservations.filter(r => filterStatut === 'all' || r.superStatut === filterStatut)
  const by = user?.name ?? 'Superviseure Adzo MENSAH'

  return (
    <div className="p-6 md:p-8 fade-in">
      <PageHeader title="Supervision" subtitle="Validation, réassignation et journal d'audit" badge="Contrôle" />

      <div className="grid grid-cols-3 gap-3 mb-6">
        {Object.entries(statConfig).map(([key, cfg]) => {
          const Icon = cfg.icon
          const count = reservations.filter(r => r.superStatut === key).length
          return (
            <div key={key} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: cfg.bg, color: cfg.color }}><Icon size={16} /></div>
              <div>
                <div className="text-xl font-semibold" style={{ color: cfg.color }}>{count}</div>
                <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>{cfg.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit mb-4 card">
        {(['all', 'en_attente', 'valide', 'annule'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatut(s)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: filterStatut === s ? 'var(--gold)' : 'transparent', color: filterStatut === s ? '#fff' : 'var(--fg-muted)' }}>
            {s === 'all' ? 'Toutes' : statConfig[s].label}
          </button>
        ))}
      </div>

      <div className="card mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                {['Référence', 'Passager', 'Vol', 'Salon', 'Statut', 'Créé par', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const cfg = statConfig[r.superStatut]
                const Icon = cfg.icon
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td className="px-3 py-3 font-mono" style={{ color: 'var(--gold)' }}>{r.id}</td>
                    <td className="px-3 py-3 font-medium">{r.passager}<div className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>{r.societe}</div></td>
                    <td className="px-3 py-3">{r.vol}<div className="text-[10px]" style={{ color: 'var(--fg-muted)' }}>{r.date}</div></td>
                    <td className="px-3 py-3">
                      {reassignId === r.id ? (
                        <select className="input py-1 text-xs" defaultValue={r.salon} onChange={e => { reassignSalon(r.id, e.target.value, by); setReassignId(null); toast('Salon réassigné') }}>
                          {SALON_NAMES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      ) : r.salon}
                    </td>
                    <td className="px-3 py-3">
                      <span className="chip" style={{ background: cfg.bg, color: cfg.color }}><Icon size={10} />{cfg.label}</span>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--fg-muted)' }}>{r.creePar}<div className="text-[10px]">{r.creeA}</div></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {r.superStatut === 'en_attente' && (
                          <>
                            <button className="p-1.5 rounded-lg" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
                              onClick={() => { validateReservation(r.id, by); toast('Réservation validée') }}><Check size={12} /></button>
                            <button className="p-1.5 rounded-lg" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                              onClick={() => { cancelReservation(r.id); toast('Réservation refusée', 'info') }}><X size={12} /></button>
                          </>
                        )}
                        <button className="p-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)' }} title="Réassigner le salon"
                          onClick={() => setReassignId(reassignId === r.id ? null : r.id)}><RefreshCw size={12} /></button>
                        <button className="p-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)' }} title="Révoquer"
                          onClick={() => { cancelReservation(r.id); toast('Accès révoqué', 'info') }}><UserX size={12} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AuditPanel />
    </div>
  )
}

function AuditPanel() {
  const { audit } = useAppStore()
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle size={14} style={{ color: 'var(--gold)' }} />
        <h2 className="font-semibold text-sm">Journal d'audit</h2>
      </div>
      <div className="space-y-2">
        {audit.map((e, i) => (
          <div key={i} className="flex items-start gap-4 text-xs p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
            <span className="font-mono whitespace-nowrap" style={{ color: 'var(--fg-muted)' }}>{e.time}</span>
            <span className="font-semibold chip" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>{e.action}</span>
            <span className="font-mono" style={{ color: 'var(--gold)' }}>{e.resa}</span>
            <span className="flex-1">{e.detail}</span>
            <span style={{ color: 'var(--fg-muted)' }}>par {e.user}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
