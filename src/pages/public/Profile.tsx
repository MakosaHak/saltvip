import { useState } from 'react'
import { useAppStore } from '../../store/AppStore'
import { Building, Shield, Save, Sun, Moon, KeyRound } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'

export default function Profile() {
  const { user, theme, toggleTheme, profile, saveProfile, twoFA, setTwoFA, toast } = useAppStore()
  const [form, setForm] = useState(profile)
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [pwdOpen, setPwdOpen] = useState(false)

  const save = () => {
    saveProfile(form)
    toast('Profil enregistré')
  }

  const changePwd = () => {
    if (pwd.next.length < 6) return toast('Le nouveau mot de passe doit contenir 6 caractères', 'error')
    if (pwd.next !== pwd.confirm) return toast('Les mots de passe ne correspondent pas', 'error')
    setPwd({ current: '', next: '', confirm: '' })
    setPwdOpen(false)
    toast('Mot de passe mis à jour')
  }

  const history = [
    { mois: 'Juillet 2026', passages: 4, quota: 10, type: 'Abonné Mensuel' },
    { mois: 'Juin 2026', passages: 7, quota: 10, type: 'Abonné Mensuel' },
    { mois: 'Mai 2026', passages: 3, quota: 10, type: 'Abonné Mensuel' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 fade-in">
      <PageHeader title="Profil & paramètres" subtitle={`Connecté en tant que ${user?.name ?? 'invité'}`} badge="Compte" />

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building size={15} style={{ color: 'var(--gold)' }} />
            <h2 className="font-semibold text-sm">Organisation</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">Entité / Société</label>
              <input className="input" value={form.societe} onChange={e => setForm({ ...form, societe: e.target.value })} />
            </div>
            <div>
              <label className="label">Contact protocole</label>
              <input className="input" value={form.protocole} onChange={e => setForm({ ...form, protocole: e.target.value })} />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
            </div>
            <div>
              <label className="label">Email institutionnel</label>
              <input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <button onClick={save} className="btn-primary w-full mt-5"><Save size={14} /> Sauvegarder</button>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-sm mb-4">Affichage</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mode {theme === 'dark' ? 'sombre' : 'clair'}</p>
                <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>Ambiance de l'interface</p>
              </div>
              <button onClick={toggleTheme} className="btn-secondary py-2">
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} Basculer
              </button>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={15} style={{ color: 'var(--gold)' }} />
              <h2 className="font-semibold text-sm">Sécurité</h2>
            </div>
            <div className="space-y-2">
              <button className="btn-secondary w-full justify-start" onClick={() => setPwdOpen(o => !o)}>
                <KeyRound size={14} /> Changer le mot de passe
              </button>
              {pwdOpen && (
                <div className="space-y-2 slide-up">
                  <input className="input" type="password" placeholder="Mot de passe actuel" value={pwd.current} onChange={e => setPwd({ ...pwd, current: e.target.value })} />
                  <input className="input" type="password" placeholder="Nouveau mot de passe" value={pwd.next} onChange={e => setPwd({ ...pwd, next: e.target.value })} />
                  <input className="input" type="password" placeholder="Confirmation" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} />
                  <button className="btn-primary w-full py-2 text-xs" onClick={changePwd}>Valider le changement</button>
                </div>
              )}
              <button className="btn-secondary w-full justify-start" onClick={() => { setTwoFA(!twoFA); toast(twoFA ? 'Double authentification désactivée' : 'Double authentification activée') }}>
                {twoFA ? 'Désactiver' : 'Activer'} la double authentification
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 mt-5">
        <h2 className="font-semibold text-sm mb-5">Historique facturation & quotas</h2>
        <div className="space-y-3">
          {history.map(h => (
            <div key={h.mois} className="flex items-center gap-4 text-sm pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="flex-1">
                <span className="font-medium">{h.mois}</span>
                <span className="ml-2 text-xs" style={{ color: 'var(--fg-muted)' }}>{h.type}</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>{h.passages} / {h.quota}</div>
              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: `${(h.passages / h.quota) * 100}%`, background: 'var(--gold)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
