import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Plane, Users, Plus, Minus, UserPlus } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import { RESERVATION_SALONS } from '../data/salons'
import { FONCTIONS, NATIONALITES, MOUVEMENTS } from '../data/constants'

interface PaxForm {
  nomPrenoms: string
  profession: string
  nationalite: string
  societe: string
}

const emptyPax = (): PaxForm => ({ nomPrenoms: '', profession: '', nationalite: '', societe: '' })

export default function ReservationForm({ variant }: { variant: 'protocole' | 'hostess' }) {
  const { user, accounts, addReservation, toast } = useAppStore()
  const navigate = useNavigate()
  const protocols = accounts.filter(a => a.role === 'protocole' && a.actif)
  const isHostess = variant === 'hostess'

  const [vol, setVol] = useState('')
  const [mouvement, setMouvement] = useState('Arrivée')
  const [provenance, setProvenance] = useState('')
  const [date, setDate] = useState('')
  const [heure, setHeure] = useState('')
  const [salon, setSalon] = useState<string>(RESERVATION_SALONS[0])
  const [protocoleId, setProtocoleId] = useState(isHostess ? '' : (user?.id ?? ''))
  const [count, setCount] = useState(1)
  const [pax, setPax] = useState<PaxForm[]>([emptyPax()])
  const [includeSelf, setIncludeSelf] = useState(!isHostess)
  const [done, setDone] = useState(false)
  const [createdId, setCreatedId] = useState('')

  const selectedProtocol = protocols.find(p => p.id === protocoleId)
    ?? (user?.role === 'protocole' ? { id: user.id, name: user.name, societe: user.societe ?? '', telephone: '' } : null)

  useEffect(() => {
    setPax(prev => {
      const next = [...prev]
      if (count > next.length) {
        while (next.length < count) next.push(emptyPax())
      } else {
        next.length = count
      }
      return next
    })
  }, [count])

  useEffect(() => {
    if (!isHostess && user?.id) setProtocoleId(user.id)
  }, [isHostess, user?.id])

  useEffect(() => {
    if (!isHostess && user?.role === 'protocole' && includeSelf) {
      setPax(prev => {
        const copy = [...prev]
        if (!copy[0]) copy[0] = emptyPax()
        if (!copy[0].nomPrenoms) {
          copy[0] = {
            nomPrenoms: user.name,
            profession: 'Officier de Protocole',
            nationalite: 'Togolaise',
            societe: user.societe ?? '',
          }
        }
        return copy
      })
    }
  }, [includeSelf, isHostess, user])

  const updatePax = (i: number, patch: Partial<PaxForm>) =>
    setPax(list => list.map((p, idx) => idx === i ? { ...p, ...patch } : p))

  const canSubmit =
    vol && provenance && date && heure && salon &&
    (isHostess ? protocoleId : true) &&
    pax.length > 0 &&
    pax.every(p => p.nomPrenoms && p.profession && p.nationalite && p.societe)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      toast('Complétez le vol et tous les accompagnateurs', 'error')
      return
    }
    const proto = selectedProtocol
    if (!proto) {
      toast('Sélectionnez un protocole', 'error')
      return
    }
    const created = addReservation({
      vol: vol.toUpperCase(),
      compagnie: vol.toUpperCase().startsWith('AF') ? 'Air France' : vol.toUpperCase().startsWith('KP') ? 'ASKY Airlines' : '—',
      mouvement,
      destination: provenance,
      date: date.includes('-') ? date.split('-').reverse().join('/') : date,
      heure,
      salon,
      societe: proto.societe,
      protocoleId: proto.id,
      protocoleNom: proto.name,
      protocoleTel: 'telephone' in proto ? proto.telephone : '',
      hotesseNom: isHostess ? (user?.name ?? '') : '',
      commentaires: '',
      creePar: user?.name ?? 'Système',
      creeRole: isHostess ? 'hostess' : 'protocole',
      passengers: pax,
    })
    setCreatedId(created.id)
    setDone(true)
    toast(`Réservation enregistrée — ${pax.length} passager(s)`)
  }

  if (done) {
    return (
      <div className="card p-10 text-center max-w-lg mx-auto fade-in">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--gold-soft)' }}>
          <Check size={28} style={{ color: 'var(--gold)' }} />
        </div>
        <h2 className="font-display text-3xl font-semibold mb-2">Réservation enregistrée</h2>
        <p className="text-sm mb-1" style={{ color: 'var(--fg-muted)' }}>Référence {createdId}</p>
        <p className="text-sm mb-6" style={{ color: 'var(--fg-muted)' }}>
          Les accompagnateurs apparaissent désormais dans le registre et la liste de checking.
        </p>
        <div className="flex gap-2 justify-center">
          <button className="btn-secondary" onClick={() => { setDone(false); setVol(''); setPax([emptyPax()]); setCount(1) }}>Nouvelle réservation</button>
          <button className="btn-primary" onClick={() => navigate(isHostess ? '/admin/registre' : '/mes-reservations')}>
            {isHostess ? 'Voir le registre' : 'Mes réservations'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6 fade-in">
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Plane size={16} style={{ color: 'var(--gold)' }} />
          <h2 className="font-semibold">Vol & salon</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Numéro de vol *</label>
            <input className="input" value={vol} onChange={e => setVol(e.target.value)} placeholder="AF 714" />
          </div>
          <div>
            <label className="label">Mouvement *</label>
            <select className="input" value={mouvement} onChange={e => setMouvement(e.target.value)}>
              {MOUVEMENTS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Provenance / Destination *</label>
            <input className="input" value={provenance} onChange={e => setProvenance(e.target.value)} placeholder="Paris CDG" />
          </div>
          <div>
            <label className="label">Salon *</label>
            <select className="input" value={salon} onChange={e => setSalon(e.target.value)}>
              {RESERVATION_SALONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Heure *</label>
            <input type="time" className="input" value={heure} onChange={e => setHeure(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users size={16} style={{ color: 'var(--gold)' }} />
          <h2 className="font-semibold">Protocole & accompagnateurs</h2>
        </div>

        {isHostess ? (
          <div className="mb-5">
            <label className="label">Protocole (au nom de) *</label>
            <select className="input" value={protocoleId} onChange={e => setProtocoleId(e.target.value)}>
              <option value="">Sélectionner un protocole…</option>
              {protocols.map(p => <option key={p.id} value={p.id}>{p.name} — {p.societe}</option>)}
            </select>
            <p className="text-xs mt-2" style={{ color: 'var(--fg-muted)' }}>
              Réservation enregistrée pour ce protocole. Renseignez ensuite chaque accompagnateur / passager.
            </p>
          </div>
        ) : (
          <div className="mb-5 rounded-xl p-3 text-sm" style={{ background: 'var(--gold-soft)', color: 'var(--fg-muted)' }}>
            Protocole : <strong style={{ color: 'var(--fg)' }}>{user?.name}</strong>
            {user?.societe ? ` · ${user.societe}` : ''}
            <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs">
              <input type="checkbox" checked={includeSelf} onChange={e => setIncludeSelf(e.target.checked)} />
              M'inclure comme premier accompagnateur
            </label>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold">Nombre de personnes</p>
            <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>Passagers / accompagnateurs à accueillir</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary w-10 h-10 p-0" onClick={() => setCount(c => Math.max(1, c - 1))}><Minus size={14} /></button>
            <span className="w-8 text-center font-semibold">{count}</span>
            <button type="button" className="btn-primary w-10 h-10 p-0" onClick={() => setCount(c => Math.min(20, c + 1))}><Plus size={14} /></button>
          </div>
        </div>

        <div className="space-y-4">
          {pax.map((person, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2 mb-3">
                <UserPlus size={14} style={{ color: 'var(--gold)' }} />
                <span className="text-xs font-semibold uppercase tracking-wide">Accompagnateur {i + 1}</span>
                {i === 0 && includeSelf && !isHostess && (
                  <span className="chip" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>Vous</span>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">Noms et prénoms *</label>
                  <input className="input" value={person.nomPrenoms} onChange={e => updatePax(i, { nomPrenoms: e.target.value })} placeholder="AGBEKO Kofi" />
                </div>
                <div>
                  <label className="label">Profession *</label>
                  <select className="input" value={person.profession} onChange={e => updatePax(i, { profession: e.target.value })}>
                    <option value="">Sélectionner…</option>
                    {FONCTIONS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Nationalité *</label>
                  <select className="input" value={person.nationalite} onChange={e => updatePax(i, { nationalite: e.target.value })}>
                    <option value="">Sélectionner…</option>
                    {NATIONALITES.map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Société *</label>
                  <input className="input" value={person.societe} onChange={e => updatePax(i, { societe: e.target.value })} placeholder="Ministère / Ambassade / Entreprise" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="btn-primary w-full py-3" disabled={!canSubmit}>
        <Check size={16} /> Enregistrer la réservation
      </button>
    </form>
  )
}
