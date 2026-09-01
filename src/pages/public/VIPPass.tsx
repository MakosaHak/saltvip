import { useParams, useNavigate } from 'react-router-dom'
import { Plane, Download, Share2, Bell, Clock, BadgeCheck } from 'lucide-react'
import { useAppStore } from '../../store/AppStore'

export default function VIPPass() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { reservations, toast } = useAppStore()
  const pass = reservations.find(r => r.id === id) ?? reservations.find(r => r.statut === 'avenir') ?? reservations[0]

  if (!pass) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center fade-in">
        <div className="card p-10 text-center">
          <p className="mb-4" style={{ color: 'var(--fg-muted)' }}>Aucun pass disponible.</p>
          <button className="btn-primary" onClick={() => navigate('/reservation')}>Créer une réservation</button>
        </div>
      </div>
    )
  }

  const download = () => {
    const text = [
      'SALT VIP — PASS NUMÉRIQUE',
      `N° ${pass.id}`,
      `Passager : ${pass.passager}`,
      `Fonction : ${pass.fonction}`,
      `Vol : ${pass.vol} ${pass.mouvement} ${pass.heure}`,
      `Salon : ${pass.salon}`,
      `Date : ${pass.date}`,
    ].join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${pass.id}-pass-vip.txt`
    a.click()
    toast('Pass téléchargé')
  }

  const share = async () => {
    const payload = { title: 'Pass VIP SALT', text: `${pass.passager} — ${pass.vol} — ${pass.salon}` }
    if (navigator.share) {
      await navigator.share(payload)
    } else {
      await navigator.clipboard.writeText(`${payload.title}\n${payload.text}`)
      toast('Détails copiés dans le presse-papiers', 'info')
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 fade-in">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="page-badge">Accès salon</p>
          <h1 className="font-display text-3xl font-semibold mb-1">Pass numérique VIP</h1>
          <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>Présentez ce pass à l'entrée du salon</p>
        </div>

        <div className="relative rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #1A2330 0%, #0d2040 60%, #1a3a6e 100%)', border: '1px solid var(--gold-light)', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Plane size={12} style={{ color: 'var(--gold-light)' }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--gold-light)' }}>SALT — AIGE</span>
                </div>
                <p className="text-white/50 text-xs">Aéroport International Gnassingbé Eyadema</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40">PASS N°</div>
                <div className="font-mono text-xs font-bold" style={{ color: 'var(--gold-light)' }}>{pass.id}</div>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs text-white/40">PASSAGER VIP</p>
              <h2 className="font-display text-2xl font-semibold text-white leading-tight mt-0.5">{pass.passager}</h2>
              <p className="text-xs mt-0.5 text-white/55">{pass.fonction} · {pass.societe}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                ['VOL', pass.vol, pass.compagnie],
                ['HEURE', pass.heure, pass.mouvement],
                ['ACCÈS', pass.salon.replace('Salon ', ''), pass.date],
              ].map(([k, v, s]) => (
                <div key={k} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] mb-0.5 text-white/40">{k}</p>
                  <p className="font-bold text-white text-sm leading-tight">{v}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{s}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-5 flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(201,166,107,0.35)' }}>
              <BadgeCheck size={48} style={{ color: 'var(--gold-light)' }} strokeWidth={1.2} />
              <p className="text-xs font-semibold mt-3" style={{ color: 'var(--gold-light)' }}>
                {pass.superStatut === 'valide' ? 'PASS VALIDÉ' : 'EN ATTENTE DE VALIDATION'}
              </p>
              <p className="text-xs text-center mt-1 text-white/45">Valide le {pass.date}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl p-3" style={{ background: 'var(--warn-bg)', color: 'var(--warn)' }}>
          <Bell size={14} className="flex-shrink-0" />
          <p className="text-xs">{pass.salon} · {pass.accompagnateurs} accompagnateur(s)</p>
        </div>

        <div className="flex gap-3 mt-4">
          <button className="btn-primary flex-1 py-3" onClick={download}><Download size={15} /> Télécharger</button>
          <button className="btn-secondary px-5 py-3" onClick={share}><Share2 size={15} /></button>
        </div>
        <div className="mt-3 text-center text-xs" style={{ color: 'var(--fg-muted)' }}>
          <Clock size={11} className="inline mr-1" /> Émis le {pass.creeA}
        </div>
      </div>
    </div>
  )
}
