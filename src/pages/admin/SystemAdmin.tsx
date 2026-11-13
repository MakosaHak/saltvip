import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Shield, Users, Building, Plane, Database, Plus, Edit2, Trash2, X, Download, Upload } from 'lucide-react'
import { useAppStore, type AccountRole } from '../../store/AppStore'
import PageHeader from '../../components/ui/PageHeader'
import { SALON_NAMES } from '../../data/salons'
import { downloadFile, toCsv, exportToExcel, exportToPdf } from '../../lib/utils'

type Tab = 'users' | 'salons' | 'compagnies' | 'logs'

const emptyAcc = {
  open: false as boolean,
  id: undefined as string | undefined,
  name: '',
  email: '',
  password: '',
  role: 'hostess' as AccountRole,
  societe: '',
  salon: '—' as string,
  telephone: '',
  actif: true,
}

export default function SystemAdmin() {
  const {
    accounts, addAccount, importAccounts, updateAccount, removeAccount,
    salons, updateSalon,
    compagnies, addCompagnie, updateCompagnie,
    toast, addAudit, user,
  } = useAppStore()
  const [tab, setTab] = useState<Tab>('users')
  const [accForm, setAccForm] = useState(emptyAcc)
  const [cieForm, setCieForm] = useState<{ open: boolean; id?: string; nom: string; code: string }>({ open: false, nom: '', code: '' })
  const [salonEdit, setSalonEdit] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [exportMenu, setExportMenu] = useState(false)
  const [logs, setLogs] = useState([
    { t: '12/08 11:42', evt: 'Connexion réussie', user: 'Adzo MENSAH', ip: '196.82.45.12', ok: true },
    { t: '12/08 09:15', evt: 'Export déclenché', user: 'Akosua KPOTO', ip: '196.82.45.11', ok: true },
    { t: '11/08 22:03', evt: 'Tentative connexion échouée', user: 'Inconnu', ip: '41.66.200.88', ok: false },
    { t: '11/08 17:30', evt: 'Sauvegarde automatique', user: 'Système', ip: 'localhost', ok: true },
  ])

  if (user?.role !== 'admin') return <Navigate to="/admin/reservation" replace />

  const roles = [
    { label: 'Administrateurs', count: accounts.filter(s => s.role === 'admin').length },
    { label: 'Hôtesses', count: accounts.filter(s => s.role === 'hostess').length },
    { label: 'Protocoles', count: accounts.filter(s => s.role === 'protocole').length },
    { label: 'Salons', count: salons.filter(s => s.actif).length },
    { label: 'Compagnies', count: compagnies.length },
    { label: 'Actifs', count: accounts.filter(s => s.actif).length },
  ]

  const saveAcc = () => {
    if (!accForm.name || !accForm.email || !accForm.password) return toast('Nom, email et mot de passe requis', 'error')
    const payload = {
      name: accForm.name, email: accForm.email, password: accForm.password,
      role: accForm.role, societe: accForm.societe, salon: accForm.salon,
      telephone: accForm.telephone, actif: accForm.actif,
    }
    if (accForm.id) {
      updateAccount(accForm.id, payload)
      toast('Compte mis à jour')
    } else {
      const created = addAccount(payload)
      toast(created.role === 'protocole'
        ? `Protocole créé — code ${created.codeProtocole}`
        : `${created.role === 'hostess' ? 'Hôtesse' : 'Admin'} créé(e)`)
    }
    setAccForm(emptyAcc)
  }

  const saveCie = () => {
    if (!cieForm.nom || !cieForm.code) return toast('Nom et code requis', 'error')
    if (cieForm.id) {
      updateCompagnie(cieForm.id, cieForm)
      toast('Compagnie mise à jour')
    } else {
      addCompagnie(cieForm)
      toast('Compagnie ajoutée')
    }
    setCieForm({ open: false, nom: '', code: '' })
  }

  const exportProtocols = async (format: 'csv' | 'excel' | 'pdf') => {
    const rows = accounts.filter(a => a.role === 'protocole')
    const data = [
      ['NOM', 'PRÉNOM', 'EMAIL', 'TÉLÉPHONE', 'SOCIÉTÉ', 'CODE PROTOCOLE', 'ACTIF'],
      ...rows.map(a => [a.nom, a.prenom, a.email, a.telephone, a.societe, a.codeProtocole, a.actif ? 'Oui' : 'Non']),
    ]
    const timestamp = Date.now()
    const metadata = [
      { label: 'Type de compte', value: 'Officiers de Protocole' },
      { label: 'Total comptes', value: `${rows.length} compte(s)` },
      { label: 'Date d\'exportation', value: new Date().toLocaleDateString('fr-FR') },
    ]

    switch (format) {
      case 'csv': {
        const csv = toCsv(data)
        downloadFile('\uFEFF' + csv, `protocoles-salt-${timestamp}.csv`)
        toast(`${rows.length} protocole(s) exporté(s) en CSV`)
        break
      }
      case 'excel':
        exportToExcel(data, `protocoles-salt-${timestamp}.xlsx`, {
          sheetName: 'Protocoles',
          title: 'Répertoire Officiel des Protocoles Accrédités',
          metadata,
        })
        toast(`${rows.length} protocole(s) exporté(s) en Excel`, 'success')
        break
      case 'pdf':
        await exportToPdf(data, `protocoles-salt-${timestamp}.pdf`, 'Répertoire Officiel des Protocoles - SALT VIP', {
          subtitle: 'Comptes protocolaires officiels habilités aux réservations VIP',
          metadata,
          orientation: 'portrait',
        })
        toast(`${rows.length} protocole(s) exporté(s) en PDF`, 'success')
        break
    }
  }

  const importProtocols = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) return toast('Fichier vide ou invalide', 'error')
      const header = lines[0].toLowerCase()
      const rows = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
        if (header.includes('email')) {
          return {
            nom: cols[0], prenom: cols[1], email: cols[2], telephone: cols[3],
            societe: cols[4], codeProtocole: cols[5], name: `${cols[1] || ''} ${cols[0] || ''}`.trim(),
            role: 'protocole' as const,
          }
        }
        return { name: cols[0], email: cols[1], societe: cols[2], codeProtocole: cols[3], role: 'protocole' as const }
      }).filter(r => r.name && r.email)
      const n = importAccounts(rows)
      toast(n ? `${n} protocole(s) importé(s)` : 'Aucun nouveau protocole (emails déjà connus)', n ? 'success' : 'info')
    }
    reader.readAsText(file)
  }

  const backup = () => {
    const payload = JSON.stringify({ accounts, salons, compagnies, at: new Date().toISOString() }, null, 2)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    a.download = `sauvegarde-salt-${Date.now()}.json`
    a.click()
    setLogs(l => [{ t: new Date().toLocaleString('fr-FR').slice(0, 14), evt: 'Sauvegarde manuelle', user: user?.name ?? 'Système', ip: 'localhost', ok: true }, ...l])
    addAudit({ action: 'Sauvegarde', resa: 'SYS', user: user?.name ?? 'Système', detail: 'Sauvegarde JSON déclenchée' })
    toast('Sauvegarde téléchargée')
  }

  return (
    <div className="p-6 md:p-8 fade-in">
      <PageHeader title="Administration" subtitle="Créer des hôtesses et des protocoles, piloter salons et compagnies" badge="Admin uniquement" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {roles.map(r => (
          <div key={r.label} className="card p-4 text-center">
            <div className="text-xl font-semibold" style={{ color: 'var(--gold)' }}>{r.count}</div>
            <div className="text-xs" style={{ color: 'var(--fg-muted)' }}>{r.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit mb-5 card">
        {([['users', 'Comptes d\'accès', Users], ['salons', 'Salons', Building], ['compagnies', 'Compagnies', Plane], ['logs', 'Sécurité', Database]] as const).map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: tab === k ? 'var(--gold)' : 'transparent', color: tab === k ? '#fff' : 'var(--fg-muted)' }}>
            <Icon size={12} />{l}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 gap-2 flex-wrap" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="text-sm font-semibold">Créer une hôtesse ou un protocole</span>
            <div className="flex gap-2 flex-wrap">
              <input ref={importRef} type="file" accept=".csv,text/csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) importProtocols(f); e.target.value = '' }} />
              <div className="relative">
                <button className="btn-secondary py-1.5 text-xs" onClick={() => setExportMenu(!exportMenu)}><Download size={11} /> Exporter protocoles</button>
                {exportMenu && (
                  <div className="absolute right-0 mt-2 card p-2 min-w-[140px] z-10">
                    <button className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100" onClick={() => { exportProtocols('csv'); setExportMenu(false) }}>CSV</button>
                    <button className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100" onClick={() => { exportProtocols('excel'); setExportMenu(false) }}>Excel</button>
                    <button className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100" onClick={() => { exportProtocols('pdf'); setExportMenu(false) }}>PDF</button>
                  </div>
                )}
              </div>
              <button className="btn-secondary py-1.5 text-xs" onClick={() => importRef.current?.click()}><Upload size={11} /> Importer protocoles</button>
              <button className="btn-primary py-1.5 text-xs" onClick={() => setAccForm({ ...emptyAcc, open: true, role: 'hostess' })}>
                <Plus size={11} /> Nouvel utilisateur
              </button>
            </div>
          </div>
          {accForm.open && (
            <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-2" style={{ background: 'var(--bg-elevated)' }}>
              <input className="input py-2" placeholder="Nom complet" value={accForm.name} onChange={e => setAccForm({ ...accForm, name: e.target.value })} />
              <input className="input py-2" placeholder="Email de connexion" value={accForm.email} onChange={e => setAccForm({ ...accForm, email: e.target.value })} />
              <input className="input py-2" placeholder="Mot de passe" value={accForm.password} onChange={e => setAccForm({ ...accForm, password: e.target.value })} />
              <select className="input py-2" value={accForm.role} onChange={e => setAccForm({ ...accForm, role: e.target.value as AccountRole })}>
                <option value="hostess">Hôtesse</option>
                <option value="protocole">Protocole</option>
                <option value="admin">Administrateur</option>
              </select>
              <input className="input py-2" placeholder="Société / Entité" value={accForm.societe} onChange={e => setAccForm({ ...accForm, societe: e.target.value })} />
              <input className="input py-2" placeholder="Téléphone" value={accForm.telephone} onChange={e => setAccForm({ ...accForm, telephone: e.target.value })} />
              <select className="input py-2" value={accForm.salon} onChange={e => setAccForm({ ...accForm, salon: e.target.value })}>
                <option>—</option>
                {SALON_NAMES.map(s => <option key={s}>{s}</option>)}
              </select>
              <div className="flex gap-2">
                <button className="btn-primary flex-1 py-2 text-xs" onClick={saveAcc}>Enregistrer</button>
                <button className="btn-ghost" onClick={() => setAccForm(emptyAcc)}><X size={14} /></button>
              </div>
            </div>
          )}
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                {['Nom', 'Email', 'Rôle', 'Code', 'Entité', 'Statut', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {accounts.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role === 'hostess' ? 'Hôtesse' : u.role === 'protocole' ? 'Protocole' : 'Admin'}</td>
                  <td className="px-4 py-3 font-mono">{u.codeProtocole || '—'}</td>
                  <td className="px-4 py-3">{u.societe}</td>
                  <td className="px-4 py-3">
                    <button className="chip" style={{ background: u.actif ? 'var(--success-bg)' : 'var(--bg-elevated)', color: u.actif ? 'var(--success)' : 'var(--fg-muted)' }}
                      onClick={() => { updateAccount(u.id, { actif: !u.actif }); toast(u.actif ? 'Compte désactivé' : 'Compte activé') }}>
                      {u.actif ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)' }} onClick={() => setAccForm({ open: true, ...u, salon: u.salon })}><Edit2 size={11} /></button>
                      <button className="p-1.5 rounded-lg" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => { removeAccount(u.id); toast('Compte supprimé', 'info') }}><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'salons' && (
        <div className="grid md:grid-cols-3 gap-4">
          {salons.map(s => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{s.nom}</h3>
                <button className="chip" style={{ background: s.actif ? 'var(--success-bg)' : 'var(--danger-bg)', color: s.actif ? 'var(--success)' : 'var(--danger)' }}
                  onClick={() => { updateSalon(s.id, { actif: !s.actif }); toast(s.actif ? 'Salon fermé' : 'Salon ouvert') }}>
                  {s.actif ? 'Actif' : 'Fermé'}
                </button>
              </div>
              {salonEdit === s.id ? (
                <div className="space-y-2 mb-3">
                  <label className="label">Capacité</label>
                  <input type="number" className="input py-2" defaultValue={s.capacite} onBlur={e => updateSalon(s.id, { capacite: Number(e.target.value) })} />
                  <label className="label">Quota</label>
                  <input type="number" className="input py-2" defaultValue={s.quota} onBlur={e => updateSalon(s.id, { quota: Number(e.target.value) })} />
                  <button className="btn-primary w-full py-2 text-xs" onClick={() => { setSalonEdit(null); toast('Configuration salon enregistrée') }}>OK</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="font-semibold text-lg" style={{ color: 'var(--gold)' }}>{s.capacite}</div>
                    <div style={{ color: 'var(--fg-muted)' }}>Capacité</div>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="font-semibold text-lg">{s.quota}</div>
                    <div style={{ color: 'var(--fg-muted)' }}>Quota</div>
                  </div>
                </div>
              )}
              {salonEdit !== s.id && (
                <button className="btn-secondary w-full py-2 text-xs" onClick={() => setSalonEdit(s.id)}>Modifier la configuration</button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'compagnies' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Compagnies aériennes</h2>
            <button className="btn-primary py-1.5 text-xs" onClick={() => setCieForm({ open: true, nom: '', code: '' })}><Plus size={11} /> Ajouter</button>
          </div>
          {cieForm.open && (
            <div className="grid sm:grid-cols-3 gap-2 mb-4">
              <input className="input py-2" placeholder="Nom" value={cieForm.nom} onChange={e => setCieForm({ ...cieForm, nom: e.target.value })} />
              <input className="input py-2" placeholder="Code" value={cieForm.code} onChange={e => setCieForm({ ...cieForm, code: e.target.value })} />
              <button className="btn-primary py-2 text-xs" onClick={saveCie}>Enregistrer</button>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {compagnies.map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs" style={{ background: 'var(--bg-elevated)' }}>
                <span>{c.nom} ({c.code})</span>
                <button onClick={() => setCieForm({ open: true, id: c.id, nom: c.nom, code: c.code })}><Edit2 size={11} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} style={{ color: 'var(--gold)' }} />
            <h2 className="font-semibold text-sm">Logs de sécurité & sauvegardes</h2>
          </div>
          <div className="space-y-2 mb-6">
            {logs.map((e, i) => (
              <div key={i} className="flex items-center gap-4 text-xs p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                <span className="font-mono">{e.t}</span>
                <span className="font-medium flex-1" style={{ color: e.ok ? 'var(--fg)' : 'var(--danger)' }}>{e.evt}</span>
                <span style={{ color: 'var(--fg-muted)' }}>{e.user}</span>
                <span className="font-mono" style={{ color: 'var(--fg-muted)' }}>{e.ip}</span>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={backup}><Database size={14} /> Déclencher une sauvegarde</button>
        </div>
      )}
    </div>
  )
}
