import { Link } from 'react-router-dom'
import { Plane, Users, Clock } from 'lucide-react'
import { useAppStore } from '../../store/AppStore'
import PageHeader from '../../components/ui/PageHeader'

export default function MyReservations() {
  const { user, reservations } = useAppStore()
  const mine = reservations.filter(r =>
    r.protocoleId === user?.id || r.protocoleNom === user?.name || r.creePar === user?.name
  )

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
                  <p className="font-semibold">{r.vol} · {r.salon}</p>
                  <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>{r.mouvement} · {r.destination} · {r.date} {r.heure}</p>
                </div>
              </div>
              <span className="chip" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>{r.id}</span>
            </div>
            <div className="mt-4 space-y-1.5">
              {(r.passengers ?? []).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm py-1.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="flex items-center gap-2"><Users size={12} style={{ color: 'var(--gold)' }} /> {p.nomPrenoms}</span>
                  <span className="text-xs" style={{ color: p.checkedIn ? 'var(--success)' : 'var(--warn)' }}>
                    {p.checkedIn ? `Entré ${p.checkedAt ?? ''}` : 'En attente de checking'}
                  </span>
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
