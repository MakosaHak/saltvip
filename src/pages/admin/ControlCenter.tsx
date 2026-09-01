import { useState } from 'react'
import { Plus, Search, UserCheck, X, Clock, Building2, Users, PlaneTakeoff, IdCard } from 'lucide-react'
import { useAppStore, type KanbanStatut } from '../../store/AppStore'
import PageHeader from '../../components/ui/PageHeader'
import { SALON_NAMES } from '../../data/salons'

const columns: { key: KanbanStatut; label: string; color: string }[] = [
  { key: 'attendu', label: 'VIP Attendus', color: 'var(--info)' },
  { key: 'present', label: 'VIP au Salon', color: 'var(--success)' },
  { key: 'embarque', label: 'Embarqués / Partis', color: 'var(--fg-muted)' },
]

const hotesses = ['Akosua', 'Adjoua', 'Koko', 'Efua', 'Afi']

export default function ControlCenter() {
  const { vips, moveVip, addVip, toast } = useAppStore()
  const [search, setSearch] = useState('')
  const [salon, setSalon] = useState('Tous')
  const [showModal, setShowModal] = useState(false)
  const [flash, setFlash] = useState({ nom: '', prenom: '', vol: '', hotesse: hotesses[0], salon: SALON_NAMES[0] as string, societe: '', heure: '' })

  const filtered = vips.filter(v =>
    `${v.nom} ${v.prenom} ${v.vol} ${v.societe}`.toLowerCase().includes(search.toLowerCase()) &&
    (salon === 'Tous' || v.salon.includes(salon))
  )

  const saveFlash = () => {
    if (!flash.nom || !flash.prenom || !flash.vol) return toast('Complétez nom, prénom et vol', 'error')
    addVip({
      nom: flash.nom.toUpperCase(), prenom: flash.prenom, fonction: 'Passager',
      vol: flash.vol.toUpperCase(), heure: flash.heure || new Date().toTimeString().slice(0, 5),
      salon: flash.salon, hotesse: flash.hotesse, societe: flash.societe || '—', accompagnateurs: 0,
    })
    setShowModal(false)
    setFlash({ nom: '', prenom: '', vol: '', hotesse: hotesses[0], salon: SALON_NAMES[0], societe: '', heure: '' })
    toast('Passage enregistré — VIP au salon')
  }

  return (
    <div className="p-6 md:p-8 fade-in">
      <PageHeader
        title="Centre de contrôle"
        subtitle={`Planning salon · ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        badge="Opérations"
        actions={<button className="btn-primary py-2 text-xs" onClick={() => setShowModal(true)}><Plus size={13} /> Check-in Flash</button>}
      />

      <div className="flex items-center gap-2 flex-wrap mb-5">
        {['Tous', ...SALON_NAMES.map(s => s.replace('Salon ', ''))].map(s => (
          <button key={s} onClick={() => setSalon(s)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: salon === s ? 'var(--gold)' : 'var(--bg-card)', color: salon === s ? '#fff' : 'var(--fg-muted)', border: '1px solid var(--border-subtle)' }}>
            {s}
          </button>
        ))}
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-muted)' }} />
        <input className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher nom, vol, société..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => {
          const cards = filtered.filter(v => v.statut === col.key)
          return (
            <div key={col.key} className="rounded-2xl p-4 min-h-[380px]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: col.color }}>{col.label}</span>
                <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" style={{ background: col.color, color: '#fff' }}>{cards.length}</span>
              </div>
              {cards.map(vip => (
                <div key={vip.id} className="card p-4 mb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>{vip.fonction}</p>
                      <p className="font-semibold text-sm">{vip.prenom} {vip.nom}</p>
                      <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>{vip.societe}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: 'var(--bg-elevated)' }}>{vip.vol}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'var(--fg-muted)' }}>
                    <span className="inline-flex items-center gap-1"><Clock size={12} /> {vip.heure}</span>
                    <span className="inline-flex items-center gap-1"><Building2 size={12} /> {vip.salon.replace('Salon ', '')}</span>
                    {vip.accompagnateurs > 0 && <span className="inline-flex items-center gap-1"><Users size={12} /> +{vip.accompagnateurs}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>Hôtesse : {vip.hotesse}</span>
                    <div className="flex gap-1">
                      {col.key === 'attendu' && (
                        <button onClick={() => { moveVip(vip.id, 'present'); toast('Check-in effectué') }} className="chip" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                          <UserCheck size={11} /> Check-in
                        </button>
                      )}
                      {col.key === 'present' && (
                        <button onClick={() => { moveVip(vip.id, 'embarque'); toast('Embarquement enregistré') }} className="chip" style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}>
                          <PlaneTakeoff size={11} /> Embarqué
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {cards.length === 0 && <div className="text-xs text-center py-10" style={{ color: 'var(--fg-muted)' }}>Aucun VIP</div>}
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="card p-6 w-full max-w-md slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Check-in Flash</h2>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nom</label><input className="input" value={flash.nom} onChange={e => setFlash({ ...flash, nom: e.target.value })} /></div>
                <div><label className="label">Prénom</label><input className="input" value={flash.prenom} onChange={e => setFlash({ ...flash, prenom: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Vol</label><input className="input" value={flash.vol} onChange={e => setFlash({ ...flash, vol: e.target.value })} /></div>
                <div><label className="label">Heure</label><input type="time" className="input" value={flash.heure} onChange={e => setFlash({ ...flash, heure: e.target.value })} /></div>
              </div>
              <div>
                <label className="label">Salon</label>
                <select className="input" value={flash.salon} onChange={e => setFlash({ ...flash, salon: e.target.value })}>
                  {SALON_NAMES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Hôtesse</label>
                <select className="input" value={flash.hotesse} onChange={e => setFlash({ ...flash, hotesse: e.target.value })}>
                  {hotesses.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Société</label>
                <input className="input" value={flash.societe} onChange={e => setFlash({ ...flash, societe: e.target.value })} />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--gold-soft)' }}>
                <IdCard size={18} style={{ color: 'var(--gold)' }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>Validation du passager</p>
                  <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>Saisie manuelle du passage impromptu</p>
                </div>
              </div>
              <button onClick={saveFlash} className="btn-primary w-full">Enregistrer le passage</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
