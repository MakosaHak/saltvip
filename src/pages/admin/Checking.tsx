import { useMemo, useState } from 'react'
import { Search, UserCheck, Check } from 'lucide-react'
import { useAppStore } from '../../store/AppStore'
import PageHeader from '../../components/ui/PageHeader'

export default function Checking() {
  const { reservations, user, checkInPassenger, toast } = useAppStore()
  const [q, setQ] = useState('')
  const [showDone, setShowDone] = useState(false)

  const rows = useMemo(() => {
    return reservations.flatMap(r =>
      (r.passengers ?? []).map(p => ({
        ...p,
        resaId: r.id,
        vol: r.vol,
        date: r.date,
        heure: r.heure,
        salon: r.salon,
        provenance: r.destination,
        protocole: r.protocoleNom,
        hotesse: r.hotesseNom,
      }))
    )
  }, [reservations])

  const pending = rows.filter(r => !r.checkedIn)
  const done = rows.filter(r => r.checkedIn)
  const source = showDone ? done : pending
  const filtered = source.filter(r =>
    `${r.nomPrenoms} ${r.vol} ${r.protocole} ${r.societe}`.toLowerCase().includes(q.trim().toLowerCase())
  )

  const validate = (resaId: string, passengerId: string, name: string) => {
    checkInPassenger(resaId, passengerId, user?.name ?? 'Contrôle entrée')
    toast(`${name} validé — entrée autorisée`)
  }

  return (
    <div className="p-6 md:p-8 fade-in">
      <PageHeader
        title="Checking arrivée"
        subtitle="Rechercher un accompagnateur par nom, puis valider son entrée au salon"
        badge="Contrôle"
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-muted)' }} />
          <input className="input pl-9" value={q} onChange={e => setQ(e.target.value)} placeholder="Nom de l'accompagnateur…" />
        </div>
        <button className="btn-secondary py-2 text-xs" onClick={() => setShowDone(false)}
          style={showDone ? undefined : { background: 'var(--gold)', color: '#fff', borderColor: 'var(--gold)' }}>
          À valider ({pending.length})
        </button>
        <button className="btn-secondary py-2 text-xs" onClick={() => setShowDone(true)}
          style={!showDone ? undefined : { background: 'var(--gold)', color: '#fff', borderColor: 'var(--gold)' }}>
          Déjà entrés ({done.length})
        </button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card p-10 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
            {q ? 'Aucun accompagnateur trouvé pour cette recherche.' : 'Aucun passager en attente de checking.'}
          </div>
        )}
        {filtered.map(r => (
          <div key={r.id} className="card p-4 flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: r.checkedIn ? 'var(--success-bg)' : 'var(--gold-soft)', color: r.checkedIn ? 'var(--success)' : 'var(--gold)' }}>
              {r.checkedIn ? <Check size={16} /> : <UserCheck size={16} />}
            </div>
            <div className="flex-1 min-w-[180px]">
              <p className="font-semibold">{r.nomPrenoms}</p>
              <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                {r.profession} · {r.nationalite} · {r.societe}
              </p>
            </div>
            <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>
              <div className="font-semibold" style={{ color: 'var(--fg)' }}>{r.vol}</div>
              {r.date} {r.heure} · {r.salon}
            </div>
            <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>
              Protocole : {r.protocole}
            </div>
            {r.checkedIn ? (
              <span className="chip" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                Validé {r.checkedAt} {r.checkedBy ? `· ${r.checkedBy}` : ''}
              </span>
            ) : (
              <button className="btn-primary py-2 text-xs" onClick={() => validate(r.resaId, r.id, r.nomPrenoms)}>
                <Check size={13} /> Valider l'entrée
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
