import { useState } from 'react'
import { FileSpreadsheet, FileText, Download, Calendar } from 'lucide-react'
import { useAppStore } from '../../store/AppStore'
import PageHeader from '../../components/ui/PageHeader'
import { downloadFile, toCsv } from '../../lib/utils'
import { SALON_NAMES } from '../../data/salons'

const files = [
  {
    id: 'reservation',
    icon: FileSpreadsheet,
    title: 'RESERVATION.csv',
    desc: 'Registre quotidien / mensuel des réservations',
    colonnes: ['VOL', 'PROVENANCE', 'NOMS ET PRÉNOMS', 'PROFESSION', 'DATE', 'SOCIÉTÉ', 'HÔTESSE', 'PROTOCOLE'],
    formats: ['CSV', 'TXT'],
  },
  {
    id: 'etat_passager',
    icon: FileSpreadsheet,
    title: 'ETAT PASSAGER.csv',
    desc: 'Registre officiel de contrôle des présences',
    colonnes: ['DATE', 'NUM', 'VOL', 'PROVENANCE', 'NOMS ET PRÉNOMS', 'NATIONALITÉ', 'PROFESSION', 'SOCIÉTÉ', 'ACCOMPAGNATEUR'],
    formats: ['CSV', 'TXT'],
  },
  {
    id: 'rapport_activite',
    icon: FileText,
    title: 'RAPPORT ACTIVITE.txt',
    desc: "Bilan d'activité des salons VIP",
    colonnes: ['Période', 'Salon', 'Total', 'Validées', 'Annulées'],
    formats: ['TXT', 'CSV'],
  },
]

export default function ExportCenter() {
  const { reservations, toast } = useAppStore()
  const [dateFrom, setDateFrom] = useState('2026-08-01')
  const [dateTo, setDateTo] = useState('2026-08-31')
  const [salon, setSalon] = useState('Tous les Salons')
  const [downloading, setDownloading] = useState<string | null>(null)

  const scoped = reservations.filter(r => salon === 'Tous les Salons' || r.salon === salon)

  const generate = (id: string, fmt: string) => {
    setDownloading(id + fmt)
    setTimeout(() => {
      if (id === 'rapport_activite') {
        const lines = [
          `RAPPORT D'ACTIVITÉ SALT VIP`,
          `Période : ${dateFrom} → ${dateTo}`,
          `Salon : ${salon}`,
          '',
          `Total : ${scoped.length}`,
          `Validées : ${scoped.filter(r => r.superStatut === 'valide').length}`,
          `Annulées : ${scoped.filter(r => r.superStatut === 'annule').length}`,
          `En attente : ${scoped.filter(r => r.superStatut === 'en_attente').length}`,
        ]
        downloadFile(lines.join('\n'), `rapport-activite.${fmt.toLowerCase()}`, 'text/plain')
      } else {
        const people = scoped.flatMap(r => (r.passengers ?? []).map(p => ({ r, p })))
        const header = id === 'reservation'
          ? ['VOL', 'PROVENANCE', 'NOMS ET PRÉNOMS', 'PROFESSION', 'DATE', 'SOCIÉTÉ', 'HÔTESSE', 'PROTOCOLE']
          : ['DATE', 'NUM', 'VOL', 'PROVENANCE', 'NOMS ET PRÉNOMS', 'NATIONALITÉ', 'PROFESSION', 'SOCIÉTÉ', 'ACCOMPAGNATEUR']
        const body = people.map(({ r, p }, i) => id === 'reservation'
          ? [r.vol, r.destination, p.nomPrenoms, p.profession, r.date, p.societe, r.hotesseNom || '—', r.protocoleNom]
          : [r.date, String(i + 1), r.vol, r.destination, p.nomPrenoms, p.nationalite, p.profession, p.societe, r.protocoleNom])
        downloadFile('\uFEFF' + toCsv([header, ...body]), `${id}-${dateFrom}-${dateTo}.${fmt.toLowerCase()}`)
      }
      setDownloading(null)
      toast(`${id} généré (${fmt})`)
    }, 700)
  }

  return (
    <div className="p-6 md:p-8 fade-in">
      <PageHeader title="Centre d'exportation" subtitle="Fichiers officiels SALT" badge="Archives" />

      <div className="card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={14} style={{ color: 'var(--gold)' }} />
          <h2 className="font-semibold text-sm">Paramètres d'export</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          <div><label className="label">Du</label><input type="date" className="input py-2 text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
          <div><label className="label">Au</label><input type="date" className="input py-2 text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
          <div>
            <label className="label">Salon</label>
            <select className="input py-2 text-xs" value={salon} onChange={e => setSalon(e.target.value)}>
              <option>Tous les Salons</option>
              {SALON_NAMES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {files.map(f => {
          const Icon = f.icon
          return (
            <div key={f.id} className="card p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="icon-box w-10 h-10"><Icon size={18} /></div>
                <div>
                  <p className="font-semibold text-xs font-mono">{f.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{f.desc}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {f.colonnes.map(c => (
                  <span key={c} className="chip" style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}>{c}</span>
                ))}
              </div>
              <div className="flex gap-2 mt-auto">
                {f.formats.map(fmt => (
                  <button key={fmt} onClick={() => generate(f.id, fmt)} className="btn-primary flex-1 py-2 text-xs">
                    <Download size={12} /> {downloading === f.id + fmt ? 'Génération…' : `.${fmt}`}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
