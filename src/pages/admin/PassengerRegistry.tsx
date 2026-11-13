import { useMemo, useState } from 'react'
import { Search, Download, FileSpreadsheet, FileText, ArrowUpDown, UserCheck, Users, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '../../store/AppStore'
import PageHeader from '../../components/ui/PageHeader'
import {
  downloadFile,
  toCsv,
  passengerFullName,
  reservationPeople,
  exportToExcel,
  exportToPdf,
  dateAndTimeToTimestamp,
} from '../../lib/utils'

export default function PassengerRegistry() {
  const { reservations, toast } = useAppStore()
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [exportMenu, setExportMenu] = useState(false)

  // Uniquement les personnes ayant déjà validé leur entrée (checkedIn === true)
  const rows = useMemo(() => {
    let n = 0
    return reservations
      .flatMap(r =>
        reservationPeople(r)
          .filter(p => p.checkedIn) // ← Seules les personnes entrées dans le salon
          .map(p => {
            n += 1
            return {
              num: n,
              date: p.date || r.date,
              heure: p.heure || r.heure || '',
              vol: p.vol || r.vol,
              prov: p.destination || r.destination,
              role: p.kind === 'passager' ? 'Passager' : 'Accompagnateur',
              nom: p.nom,
              prenom: p.prenom,
              nomComplet: passengerFullName(p),
              nat: p.nationalite || '—',
              prof: p.profession || '—',
              soc: p.societe || '—',
              protocole: r.protocoleCode ? `${r.protocoleNom} — ${r.protocoleCode}` : r.protocoleNom,
              hotesse: r.hotesseNom || '—',
              salon: p.salon || r.salon,
              checkedAt: p.checkedAt || '—',
              checkedBy: p.checkedBy || '—',
            }
          })
      )
  }, [reservations])

  const filtered = useMemo(() => {
    const list = rows.filter(r =>
      `${r.nom} ${r.prenom} ${r.nomComplet} ${r.vol} ${r.soc} ${r.protocole} ${r.role}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    return [...list].sort((a, b) => {
      const timeA = dateAndTimeToTimestamp(a.date, a.heure)
      const timeB = dateAndTimeToTimestamp(b.date, b.heure)
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
    })
  }, [rows, search, sortOrder])

  // Statistiques rapides
  const totalAll = useMemo(
    () => reservations.flatMap(r => reservationPeople(r)).length,
    [reservations]
  )
  const passagers = filtered.filter(r => r.role === 'Passager').length
  const accompagnateurs = filtered.filter(r => r.role === 'Accompagnateur').length

  const exportData = async (format: 'csv' | 'excel' | 'pdf') => {
    const header = [
      'N°', 'DATE VOL', 'VOL', 'PROVENANCE',
      'NOM', 'PRÉNOM', 'PROFESSION', 'NATIONALITÉ', 'SOCIÉTÉ',
      'PROTOCOLE', 'SALON', 'HEURE D\'ENTRÉE', 'VALIDÉ PAR',
    ]
    const body = filtered.map((r, i) => [
      String(i + 1),
      r.date,
      r.vol,
      r.prov,
      r.nom,
      r.prenom,
      r.prof,
      r.nat,
      r.soc,
      r.protocole,
      r.salon,
      r.checkedAt,
      r.checkedBy,
    ])
    const data = [header, ...body]

    const timestamp = Date.now()
    const metadata = [
      { label: 'Date d\'exportation', value: new Date().toLocaleDateString('fr-FR') },
      { label: 'Ordre de tri', value: sortOrder === 'asc' ? 'Date croissante' : 'Date décroissante' },
      { label: 'Total entrées validées', value: `${filtered.length} personne(s)` },
      { label: 'dont Passagers VIP', value: String(passagers) },
      { label: 'dont Accompagnateurs', value: String(accompagnateurs) },
    ]

    try {
      switch (format) {
        case 'csv': {
          const csv = toCsv(data)
          downloadFile('\uFEFF' + csv, `ETAT-PASSAGER-${timestamp}.csv`)
          toast('État passager exporté en CSV')
          break
        }
        case 'excel':
          exportToExcel(data, `ETAT-PASSAGER-${timestamp}.xlsx`, {
            sheetName: 'État Passagers',
            title: 'État Officiel des Passagers Entrés en Salon — SALT VIP',
            metadata,
          })
          toast('État passager exporté en Excel (trié par date)', 'success')
          break
        case 'pdf':
          await exportToPdf(
            data,
            `ETAT-PASSAGER-${timestamp}.pdf`,
            'État Officiel des Passagers — SALT VIP',
            {
              subtitle: 'Registre mensuel des entrées validées en salon VIP',
              metadata,
              orientation: 'landscape',
            }
          )
          toast('État passager exporté en PDF (trié par date)', 'success')
          break
      }
    } catch (err) {
      console.error(err)
      toast("Erreur lors de l'exportation", 'error')
    }
  }

  return (
    <div className="p-6 md:p-8 fade-in">
      <PageHeader
        title="État passagers"
        subtitle="Registre mensuel des personnes entrées en salon VIP · Checking validé uniquement"
        badge="Entrées validées"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              title="Inverser le tri par date de vol"
            >
              <ArrowUpDown size={12} style={{ color: 'var(--gold)' }} />
              <span>{sortOrder === 'asc' ? 'Date croissante' : 'Date décroissante'}</span>
            </button>
            <div className="relative">
              <button
                type="button"
                className="btn-primary py-2 text-xs flex items-center gap-1.5"
                onClick={() => setExportMenu(!exportMenu)}
              >
                <Download size={13} /> Exporter
              </button>
              {exportMenu && (
                <div className="absolute right-0 mt-2 card p-2 min-w-[140px] z-10 shadow-lg">
                  <button
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                    onClick={() => { exportData('csv'); setExportMenu(false) }}
                  >
                    <FileSpreadsheet size={12} /> CSV
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                    onClick={() => { exportData('excel'); setExportMenu(false) }}
                  >
                    <FileSpreadsheet size={12} /> Excel
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                    onClick={() => { exportData('pdf'); setExportMenu(false) }}
                  >
                    <FileText size={12} /> PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* Bannière de statistiques */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div
          className="card p-4 flex items-center gap-3"
          style={{ borderLeft: '3px solid var(--success)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
          >
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
              {filtered.length}
            </p>
            <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
              Entrées validées
            </p>
          </div>
        </div>

        <div
          className="card p-4 flex items-center gap-3"
          style={{ borderLeft: '3px solid var(--gold)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
          >
            <UserCheck size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>
              {passagers}
            </p>
            <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
              Passagers VIP
            </p>
          </div>
        </div>

        <div
          className="card p-4 flex items-center gap-3"
          style={{ borderLeft: '3px solid var(--fg-muted)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-elevated)', color: 'var(--fg-muted)' }}
          >
            <Users size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold">{accompagnateurs}</p>
            <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
              Accompagnateurs
            </p>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-4 max-w-sm">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--fg-muted)' }}
        />
        <input
          className="input pl-9 py-2 text-xs"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Nom, vol, protocole…"
          style={{ paddingLeft: '38px' }}
        />
      </div>

      {/* Tableau */}
      {filtered.length === 0 ? (
        <div className="card p-14 text-center" style={{ color: 'var(--fg-muted)' }}>
          <CheckCircle2 size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-sm mb-1" style={{ color: 'var(--fg)' }}>
            Aucune entrée validée
          </p>
          <p className="text-xs">
            {search
              ? 'Aucun résultat pour cette recherche.'
              : "Les personnes apparaîtront ici dès qu'elles auront été validées à l'entrée du salon depuis la page Checking."}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr
                  style={{
                    background: 'var(--bg-elevated)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  {[
                    'N°', 'DATE', 'VOL', 'NOM', 'PRÉNOM',
                    'PROFESSION', 'SOCIÉTÉ', 'PROTOCOLE', 'SALON',
                    'HEURE D\'ENTRÉE', 'VALIDÉ PAR',
                  ].map(h => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left font-semibold uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={`${r.num}-${r.nom}-${r.prenom}-${r.role}`}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: i % 2 ? 'var(--bg-elevated)' : 'transparent',
                    }}
                  >
                    <td className="px-3 py-3 font-mono">{i + 1}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-3 font-semibold" style={{ color: 'var(--gold)' }}>
                      {r.vol}
                    </td>
                    <td className="px-3 py-3 font-medium">{r.nom}</td>
                    <td className="px-3 py-3">{r.prenom}</td>
                    <td className="px-3 py-3">{r.prof}</td>
                    <td className="px-3 py-3">{r.soc}</td>
                    <td className="px-3 py-3">{r.protocole}</td>
                    <td className="px-3 py-3">{r.salon}</td>
                    <td className="px-3 py-3">
                      <span
                        className="chip font-semibold"
                        style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
                      >
                        ✓ {r.checkedAt}
                      </span>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--fg-muted)' }}>
                      {r.checkedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs flex items-center justify-between" style={{ color: 'var(--fg-muted)', borderTop: '1px solid var(--border-subtle)' }}>
            <span>{filtered.length} entrée(s) validée(s) · {passagers} passager(s) · {accompagnateurs} accompagnateur(s)</span>
            <span style={{ color: 'var(--fg-muted)' }}>
              {totalAll - filtered.length > 0
                ? `${totalAll - filtered.length} personne(s) non encore entrée(s)`
                : 'Toutes les personnes réservées sont entrées'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
