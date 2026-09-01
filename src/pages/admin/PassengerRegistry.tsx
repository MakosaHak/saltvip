import { useMemo, useState } from 'react'
import { Search, Download } from 'lucide-react'
import { useAppStore } from '../../store/AppStore'
import PageHeader from '../../components/ui/PageHeader'
import { downloadFile, toCsv } from '../../lib/utils'

export default function PassengerRegistry() {
  const { reservations, toast } = useAppStore()
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    let n = 0
    return reservations.flatMap(r => (r.passengers ?? []).map(p => {
      n += 1
      return {
        num: n,
        date: r.date,
        vol: r.vol,
        prov: r.destination,
        nom: p.nomPrenoms,
        nat: p.nationalite,
        prof: p.profession,
        soc: p.societe,
        protocole: r.protocoleNom,
        hotesse: r.hotesseNom || '—',
        salon: r.salon,
        checked: p.checkedIn,
      }
    }))
  }, [reservations])

  const filtered = rows.filter(r =>
    `${r.nom} ${r.vol} ${r.soc} ${r.protocole}`.toLowerCase().includes(search.toLowerCase())
  )

  const exportCsv = () => {
    const csv = toCsv([
      ['DATE', 'NUM', 'VOL', 'PROVENANCE', 'NOMS ET PRÉNOMS', 'NATIONALITÉ', 'PROFESSION', 'SOCIÉTÉ', 'PROTOCOLE', 'HÔTESSE', 'SALON', 'CHECK-IN'],
      ...filtered.map(r => [r.date, String(r.num), r.vol, r.prov, r.nom, r.nat, r.prof, r.soc, r.protocole, r.hotesse, r.salon, r.checked ? 'Oui' : 'Non']),
    ])
    downloadFile('\uFEFF' + csv, `ETAT-PASSAGER-${Date.now()}.csv`)
    toast('État passager exporté (norme SALT)')
  }

  return (
    <div className="p-6 md:p-8 fade-in">
      <PageHeader title="Registre des passagers" subtitle="État officiel de contrôle — une ligne par accompagnateur" badge="Archives"
        actions={<button className="btn-primary py-2 text-xs" onClick={exportCsv}><Download size={13} /> Exporter CSV</button>} />

      <div className="relative mb-4 max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-muted)' }} />
        <input className="input pl-8 py-2 text-xs" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, vol, protocole…" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                {['N°', 'DATE', 'VOL', 'PROVENANCE', 'NOMS ET PRÉNOMS', 'NATIONALITÉ', 'PROFESSION', 'SOCIÉTÉ', 'PROTOCOLE', 'HÔTESSE', 'CHECK-IN'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={`${r.num}-${r.nom}`} style={{ borderBottom: '1px solid var(--border-subtle)', background: i % 2 ? 'var(--bg-elevated)' : 'transparent' }}>
                  <td className="px-3 py-3 font-mono">{r.num}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-3 font-semibold" style={{ color: 'var(--gold)' }}>{r.vol}</td>
                  <td className="px-3 py-3">{r.prov}</td>
                  <td className="px-3 py-3 font-medium">{r.nom}</td>
                  <td className="px-3 py-3">{r.nat}</td>
                  <td className="px-3 py-3">{r.prof}</td>
                  <td className="px-3 py-3 max-w-[140px] truncate">{r.soc}</td>
                  <td className="px-3 py-3">{r.protocole}</td>
                  <td className="px-3 py-3">{r.hotesse}</td>
                  <td className="px-3 py-3">
                    <span className="chip" style={{ background: r.checked ? 'var(--success-bg)' : 'var(--warn-bg)', color: r.checked ? 'var(--success)' : 'var(--warn)' }}>
                      {r.checked ? 'Entrée' : 'Attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 text-xs" style={{ color: 'var(--fg-muted)' }}>{filtered.length} accompagnateur(s)</div>
      </div>
    </div>
  )
}
