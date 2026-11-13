import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Plane, Users, Plus, Minus, UserPlus, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import { RESERVATION_SALONS } from '../data/salons'
import { MOUVEMENTS } from '../data/constants'
import { compagnieFromVol, formatProtocolLabel } from '../lib/utils'

interface CompanionForm {
  nom: string
  prenom: string
  profession: string
  nationalite: string
}

interface PaxForm {
  nom: string
  prenom: string
  profession: string
  nationalite: string
  societe: string
  vol: string
  mouvement: string
  provenance: string
  salon: string
  date: string
  heure: string
  hasCompanions: boolean
  companions: CompanionForm[]
}

const emptyCompanion = (): CompanionForm => ({ nom: '', prenom: '', profession: '', nationalite: '' })

const emptyPax = (): PaxForm => ({
  nom: '',
  prenom: '',
  profession: '',
  nationalite: '',
  societe: '',
  vol: '',
  mouvement: 'Arrivée',
  provenance: '',
  salon: RESERVATION_SALONS[0],
  date: '',
  heure: '',
  hasCompanions: false,
  companions: [],
})

function resizeList<T>(list: T[], size: number, factory: () => T) {
  const next = list.slice(0, size)
  while (next.length < size) next.push(factory())
  return next
}

function toFrDate(iso: string) {
  return iso.includes('-') ? iso.split('-').reverse().join('/') : iso
}

export default function ReservationForm({ variant }: { variant: 'protocole' | 'hostess' }) {
  const { user, accounts, addReservation, toast } = useAppStore()
  const navigate = useNavigate()
  const protocols = accounts.filter(a => a.role === 'protocole' && a.actif)
  const isHostess = variant === 'hostess'

  const [protocoleId, setProtocoleId] = useState(isHostess ? '' : (user?.id ?? ''))
  const [pax, setPax] = useState<PaxForm[]>([emptyPax()])
  const [done, setDone] = useState(false)
  const [createdId, setCreatedId] = useState('')

  const selectedProtocol = useMemo(() => {
    return protocols.find(p => p.id === protocoleId)
      ?? accounts.find(a => a.id === protocoleId && a.role === 'protocole')
      ?? (!isHostess && user?.role === 'protocole'
        ? accounts.find(a => a.id === user.id) ?? null
        : null)
  }, [accounts, isHostess, protocoleId, protocols, user])

  useEffect(() => {
    if (!isHostess && user?.id) setProtocoleId(user.id)
  }, [isHostess, user?.id])

  const updatePax = (i: number, patch: Partial<PaxForm>) =>
    setPax(list => list.map((p, idx) => idx === i ? { ...p, ...patch } : p))

  const setHasCompanions = (i: number, yes: boolean) => {
    setPax(list => list.map((p, idx) => {
      if (idx !== i) return p
      if (!yes) return { ...p, hasCompanions: false, companions: [] }
      return {
        ...p,
        hasCompanions: true,
        companions: p.companions.length ? p.companions : [emptyCompanion()],
      }
    }))
  }

  const setCompanionCount = (i: number, count: number) => {
    const size = Math.min(10, Math.max(1, count))
    setPax(list => list.map((p, idx) => idx === i
      ? { ...p, hasCompanions: true, companions: resizeList(p.companions, size, emptyCompanion) }
      : p))
  }

  const updateCompanion = (i: number, j: number, patch: Partial<CompanionForm>) =>
    setPax(list => list.map((p, idx) => idx === i
      ? { ...p, companions: p.companions.map((c, cj) => cj === j ? { ...c, ...patch } : c) }
      : p))

  const addPassenger = () => setPax(list => [...list, emptyPax()].slice(0, 15))
  const removePassenger = (i: number) => setPax(list => list.length === 1 ? list : list.filter((_, idx) => idx !== i))

  const passengerOk = (p: PaxForm) =>
    Boolean(p.nom && p.prenom && p.profession && p.vol && p.provenance && p.date && p.salon)
    && (!p.hasCompanions || (p.companions.length > 0 && p.companions.every(c => c.nom && c.prenom && c.profession)))

  const canSubmit =
    (isHostess ? Boolean(protocoleId) : true) &&
    pax.length > 0 &&
    pax.every(passengerOk)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      toast('Complétez chaque passager (identité + vol) et la profession de chaque accompagnateur', 'error')
      return
    }
    const proto = selectedProtocol
    if (!proto) {
      toast('Sélectionnez un protocole', 'error')
      return
    }
    const first = pax[0]
    const created = addReservation({
      vol: first.vol.toUpperCase(),
      compagnie: compagnieFromVol(first.vol),
      mouvement: first.mouvement,
      destination: first.provenance,
      date: toFrDate(first.date),
      heure: first.heure,
      salon: first.salon,
      societe: first.societe || proto.societe,
      protocoleId: proto.id,
      protocoleNom: proto.name,
      protocoleCode: proto.codeProtocole,
      protocoleTel: proto.telephone,
      dateReservation: '',
      hotesseNom: isHostess ? (user?.name ?? '') : '',
      commentaires: '',
      creePar: user?.name ?? 'Système',
      creeRole: isHostess ? 'hostess' : 'protocole',
      passengers: pax.map(person => ({
        nom: person.nom.trim().toUpperCase(),
        prenom: person.prenom.trim(),
        nomPrenoms: `${person.prenom.trim()} ${person.nom.trim().toUpperCase()}`.trim(),
        profession: person.profession.trim(),
        nationalite: person.nationalite.trim(),
        societe: person.societe.trim() || proto.societe,
        vol: person.vol.trim().toUpperCase(),
        compagnie: compagnieFromVol(person.vol),
        mouvement: person.mouvement,
        destination: person.provenance.trim(),
        date: toFrDate(person.date),
        heure: person.heure,
        salon: person.salon,
        accompagnateurs: person.hasCompanions
          ? person.companions.map(c => ({
              nom: c.nom.trim().toUpperCase(),
              prenom: c.prenom.trim(),
              profession: c.profession.trim(),
              nationalite: c.nationalite.trim(),
            }))
          : [],
      })),
    })
    setCreatedId(created.id)
    setDone(true)
    const extras = created.accompagnateurs
    toast(`Réservation enregistrée — ${pax.length} passager(s)${extras ? `, ${extras} accompagnateur(s)` : ''}`)
  }

  const resetForm = () => {
    setDone(false)
    setPax([emptyPax()])
    if (isHostess) setProtocoleId('')
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
          Chaque passager a son vol. Les accompagnateurs sont rattachés à leur passager.
        </p>
        <div className="flex gap-2 justify-center">
          <button className="btn-secondary" onClick={resetForm}>Nouvelle réservation</button>
          <button className="btn-primary" onClick={() => navigate(isHostess ? '/admin/planning' : '/mes-reservations')}>
            {isHostess ? "Voir les réservations" : 'Mes réservations'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6 fade-in">
      {isHostess && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} style={{ color: 'var(--gold)' }} />
            <h2 className="font-semibold">Protocole demandeur</h2>
          </div>
          <div>
            <label className="label">Protocole (au nom de) *</label>
            <select className="input" value={protocoleId} onChange={e => setProtocoleId(e.target.value)}>
              <option value="">Sélectionner un protocole…</option>
              {protocols.map(p => <option key={p.id} value={p.id}>{formatProtocolLabel(p)}</option>)}
            </select>
            <p className="text-xs mt-2" style={{ color: 'var(--fg-muted)' }}>
              Le protocole réserve pour un ou plusieurs passagers. Il n'est pas le voyageur.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {pax.map((person, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus size={16} style={{ color: 'var(--gold)' }} />
                <h2 className="font-semibold">Passager {i + 1}</h2>
              </div>
              {pax.length > 1 && (
                <button type="button" className="btn-secondary py-1.5 text-xs" onClick={() => removePassenger(i)}>
                  <Trash2 size={13} /> Retirer
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Nom *</label>
                <input className="input" value={person.nom} onChange={e => updatePax(i, { nom: e.target.value })} placeholder="AGBEKO" />
              </div>
              <div>
                <label className="label">Prénom *</label>
                <input className="input" value={person.prenom} onChange={e => updatePax(i, { prenom: e.target.value })} placeholder="Kofi" />
              </div>
              <div>
                <label className="label">Profession *</label>
                <input className="input" value={person.profession} onChange={e => updatePax(i, { profession: e.target.value })} placeholder="Ministre, Directeur…" />
              </div>
              <div>
                <label className="label">Nationalité</label>
                <input className="input" value={person.nationalite} onChange={e => updatePax(i, { nationalite: e.target.value })} placeholder="Optionnel" />
              </div>
            </div>

            <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Plane size={16} style={{ color: 'var(--gold)' }} />
                <h3 className="font-semibold text-sm">Vol du passager</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Numéro de vol *</label>
                  <input className="input" value={person.vol} onChange={e => updatePax(i, { vol: e.target.value })} placeholder="AF 714" />
                </div>
                <div>
                  <label className="label">Mouvement *</label>
                  <select className="input" value={person.mouvement} onChange={e => updatePax(i, { mouvement: e.target.value })}>
                    {MOUVEMENTS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Provenance / Destination *</label>
                  <input className="input" value={person.provenance} onChange={e => updatePax(i, { provenance: e.target.value })} placeholder="Paris CDG" />
                </div>
                <div>
                  <label className="label">Salon *</label>
                  <select className="input" value={person.salon} onChange={e => updatePax(i, { salon: e.target.value })}>
                    {RESERVATION_SALONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date du vol *</label>
                  <input type="date" className="input" value={person.date} onChange={e => updatePax(i, { date: e.target.value })} />
                </div>
                <div>
                  <label className="label">
                    Heure du vol <span className="text-xs font-normal" style={{ color: 'var(--fg-muted)' }}>(optionnel)</span>
                  </label>
                  <input type="time" className="input" value={person.heure} onChange={e => updatePax(i, { heure: e.target.value })} />
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--fg-muted)' }}>
                La date de réservation est enregistrée automatiquement à l'envoi.
              </p>
            </div>

            <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p className="label mb-2">Ce passager a-t-il des accompagnateurs ?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setHasCompanions(i, false)}
                  style={!person.hasCompanions ? { background: 'var(--gold)', color: '#fff', borderColor: 'var(--gold)' } : undefined}
                >
                  Non
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setHasCompanions(i, true)}
                  style={person.hasCompanions ? { background: 'var(--gold)', color: '#fff', borderColor: 'var(--gold)' } : undefined}
                >
                  Oui
                </button>
              </div>

              {person.hasCompanions && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm font-semibold">Nombre d'accompagnateurs</p>
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn-secondary w-10 h-10 p-0" onClick={() => setCompanionCount(i, person.companions.length - 1)}><Minus size={14} /></button>
                      <span className="w-8 text-center font-semibold">{person.companions.length}</span>
                      <button type="button" className="btn-primary w-10 h-10 p-0" onClick={() => setCompanionCount(i, person.companions.length + 1)}><Plus size={14} /></button>
                    </div>
                  </div>
                  {person.companions.map((c, j) => (
                    <div key={j} className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-3">Accompagnateur {j + 1}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="label">Nom *</label>
                          <input className="input" value={c.nom} onChange={e => updateCompanion(i, j, { nom: e.target.value })} placeholder="MENSAH" />
                        </div>
                        <div>
                          <label className="label">Prénom *</label>
                          <input className="input" value={c.prenom} onChange={e => updateCompanion(i, j, { prenom: e.target.value })} placeholder="Edem" />
                        </div>
                        <div>
                          <label className="label">Profession *</label>
                          <input className="input" value={c.profession} onChange={e => updateCompanion(i, j, { profession: e.target.value })} placeholder="Assistant, Conseiller…" />
                        </div>
                        <div>
                          <label className="label">Nationalité</label>
                          <input className="input" value={c.nationalite} onChange={e => updateCompanion(i, j, { nationalite: e.target.value })} placeholder="Optionnel" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <button type="button" className="btn-secondary w-full py-3" onClick={addPassenger}>
          <Plus size={16} /> Ajouter un autre passager
        </button>
      </div>

      <button type="submit" className="btn-primary w-full py-3" disabled={!canSubmit}>
        <Check size={16} /> Enregistrer la réservation
      </button>
    </form>
  )
}
