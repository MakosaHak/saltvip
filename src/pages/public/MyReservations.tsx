import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plane, Users, Clock, Trash2, AlertTriangle, Check, X } from 'lucide-react'
import { useAppStore } from '../../store/AppStore'
import { passengerFullName } from '../../lib/utils'
import PageHeader from '../../components/ui/PageHeader'

export default function MyReservations() {
  const { user, reservations, deleteReservation, toast } = useAppStore()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const mine = reservations.filter(r =>
    r.protocoleId === user?.id || r.protocoleNom === user?.name || r.creePar === user?.name
  )

  const handleDelete = (id: string, vol: string) => {
    deleteReservation(id)
    setConfirmDeleteId(null)
    toast(`Réservation ${vol} supprimée définitivement`, 'success')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 fade-in">
      <PageHeader title="Mes réservations" subtitle="Demandes déposées au nom de votre protocole" badge="Protocole"
        actions={<Link to="/reservation" className="btn-primary py-2 text-sm">Nouvelle réservation</Link>} />

      <div className="space-y-3">
        {mine.length === 0 && (
          <div className="card p-10 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
            Aucune réservation pour le moment.
          </div>
        )}
        {mine.map(r => (
          <div key={r.id} className="card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="icon-box w-10 h-10"><Plane size={16} /></div>
                <div>
                  <p className="font-semibold">{r.passengers?.length ?? 1} passager(s) · {r.id}</p>
                  <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                    Enregistré le {r.dateReservation || r.creeA}
                    {r.protocoleCode ? ` · ${r.protocoleCode}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>{r.superStatut === 'valide' ? 'Validée' : r.superStatut}</span>
                {confirmDeleteId !== r.id ? (
                  <button
                    type="button"
                    className="btn-secondary py-1 px-2.5 text-xs text-red-600 hover:bg-red-500/10 flex items-center gap-1"
                    onClick={() => setConfirmDeleteId(r.id)}
                    title="Supprimer cette réservation"
                  >
                    <Trash2 size={12} /> Supprimer
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
                    <span className="text-[11px] text-red-600 font-medium px-1">Confirmer ?</span>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 flex items-center gap-1"
                      onClick={() => handleDelete(r.id, r.vol)}
                    >
                      <Check size={11} /> Oui
                    </button>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-xs hover:bg-black/20"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      <X size={11} /> Non
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {(r.passengers ?? []).map(p => (
                <div key={p.id} className="pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users size={12} style={{ color: 'var(--gold)' }} />
                      <span className="font-medium">{passengerFullName(p)}</span>
                      <span style={{ color: 'var(--fg-muted)' }}>· {p.profession} · {p.vol || r.vol} · {p.date || r.date}{p.heure || r.heure ? ` à ${p.heure || r.heure}` : ''}</span>
                      <span className="chip" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>Passager</span>
                    </span>
                    <span className="text-xs" style={{ color: p.checkedIn ? 'var(--success)' : 'var(--warn)' }}>
                      {p.checkedIn ? `Entré ${p.checkedAt ?? ''}` : 'En attente'}
                    </span>
                  </div>
                  {(p.accompagnateurs ?? []).length === 0 ? (
                    <p className="text-xs mt-1 pl-6" style={{ color: 'var(--fg-muted)' }}>Aucun accompagnateur</p>
                  ) : (
                    <div className="pl-6 mt-1 space-y-1">
                      {p.accompagnateurs.map(a => (
                        <div key={a.id} className="flex items-center justify-between text-xs">
                          <span>Accompagnateur : {passengerFullName(a)}{a.profession ? ` · ${a.profession}` : ''}</span>
                          <span style={{ color: a.checkedIn ? 'var(--success)' : 'var(--warn)' }}>
                            {a.checkedIn ? `Entré ${a.checkedAt ?? ''}` : 'En attente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] mt-3 flex items-center gap-1" style={{ color: 'var(--fg-muted)' }}>
              <Clock size={11} /> Enregistré le {r.creeA} par {r.creePar}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
