import { Link } from 'react-router-dom'
import { useAppStore } from '../../store/AppStore'
import { PlusCircle, List, BadgeCheck, Phone, Plane, Clock, Sun, Moon, TrendingUp } from 'lucide-react'

const occupancy = [
  { name: 'Salon Solidarité', niveau: 'Calme', pct: 35, color: 'var(--success)' },
  { name: 'Salon Plus', niveau: 'Modéré', pct: 55, color: 'var(--warn)' },
  { name: 'Salon Paix Arrivée', niveau: 'Calme', pct: 28, color: 'var(--success)' },
  { name: 'Salon Paix Départ', niveau: 'Modéré', pct: 62, color: 'var(--warn)' },
  { name: 'Salon Union', niveau: 'Chargé', pct: 78, color: 'var(--danger)' },
  { name: 'Salon Denyigban', niveau: 'Calme', pct: 20, color: 'var(--success)' },
]

export default function ClientDashboard() {
  const { user, theme, toggleTheme, reservations } = useAppStore()
  const mine = reservations.filter(r => !user || r.passager.toLowerCase().includes((user.name.split(' ').pop() ?? '').toLowerCase()) || r.creePar === user.name)
  const active = mine.find(r => r.statut === 'avenir') ?? mine[0]
  const past = mine.filter(r => r.statut === 'passes').slice(0, 2)

  const actions = [
    { icon: PlusCircle, label: 'Nouvelle Réservation', to: '/reservation' },
    { icon: List, label: 'Mes Réservations', to: '/mes-reservations' },
    { icon: BadgeCheck, label: 'Mon Pass VIP', to: active ? `/pass-vip/${active.id}` : '/pass-vip' },
    { icon: Phone, label: 'Contacter Protocole', to: '/profil' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 fade-in">
      <div className="flex items-start justify-between mb-9 flex-wrap gap-4">
        <div>
          <p className="page-badge">Espace VIP</p>
          <h1 className="font-display text-4xl font-semibold">{user?.name ?? 'Bienvenue'}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={toggleTheme} className="btn-secondary w-11 h-11 p-0">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {active && (
        <div className="rounded-3xl p-6 mb-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1A2330 0%, #2A3F5F 100%)', boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Plane size={14} style={{ color: 'var(--gold-light)' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--gold-light)' }}>Vol actif</span>
              </div>
              <div className="font-display text-4xl font-semibold text-white mb-1">{active.vol}</div>
              <div className="text-sm text-white/70">{active.compagnie} · {active.destination}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-white">{active.heure}</div>
              <div className="text-xs text-white/55 mb-2">{active.date}</div>
              <span className="chip" style={{ background: 'rgba(93,184,138,0.2)', color: '#8EE0B3' }}>{active.superStatut === 'valide' ? 'Validé' : 'En attente'}</span>
            </div>
          </div>
          <div className="mt-5 pt-4 flex items-center justify-between flex-wrap gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="flex items-center gap-1.5 text-sm text-white/60"><Clock size={12} /> {active.salon}</span>
            <Link to={`/pass-vip/${active.id}`} className="btn-primary py-2 px-4 text-xs"><BadgeCheck size={13} /> Afficher le Pass</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger">
        {actions.map(({ icon: Icon, label, to }) => (
          <Link key={to} to={to} className="card card-hover p-4 flex flex-col items-center gap-3 text-center">
            <div className="icon-box w-10 h-10"><Icon size={18} strokeWidth={1.7} /></div>
            <span className="text-xs font-semibold">{label}</span>
          </Link>
        ))}
      </div>

      <div className="card p-6 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={16} style={{ color: 'var(--gold)' }} />
          <h2 className="font-semibold text-sm">Affluence en temps réel</h2>
        </div>
        <div className="space-y-4">
          {occupancy.map(s => (
            <div key={s.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs font-semibold" style={{ color: s.color }}>{s.niveau} · {s.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-sm mb-4">Derniers passages</h2>
        {past.length === 0 && <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>Aucun passage précédent.</p>}
        {past.map(r => (
          <div key={r.id} className="flex items-center justify-between py-2.5 text-sm" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <Plane size={13} style={{ color: 'var(--fg-muted)' }} />
              <div>
                <span className="font-semibold">{r.vol}</span>
                <span className="ml-2 text-xs" style={{ color: 'var(--fg-muted)' }}>{r.destination} · {r.salon}</span>
              </div>
            </div>
            <div className="text-xs" style={{ color: 'var(--success)' }}>Terminé</div>
          </div>
        ))}
        <Link to="/mes-reservations" className="block text-center text-xs font-semibold mt-4" style={{ color: 'var(--gold)' }}>
          Voir toutes mes réservations →
        </Link>
      </div>
    </div>
  )
}
