import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, Users, Building, Star } from 'lucide-react'

const weekly = [
  { jour: 'Lun', solidarite: 12, plus: 8, paix: 5 },
  { jour: 'Mar', solidarite: 18, plus: 10, paix: 7 },
  { jour: 'Mer', solidarite: 15, plus: 12, paix: 4 },
  { jour: 'Jeu', solidarite: 22, plus: 9, paix: 8 },
  { jour: 'Ven', solidarite: 28, plus: 14, paix: 11 },
  { jour: 'Sam', solidarite: 20, plus: 11, paix: 6 },
  { jour: 'Dim', solidarite: 10, plus: 6, paix: 3 },
]

const monthly = [
  { mois: 'Jan', passages: 280 }, { mois: 'Fév', passages: 310 },
  { mois: 'Mar', passages: 295 }, { mois: 'Avr', passages: 340 },
  { mois: 'Mai', passages: 320 }, { mois: 'Jun', passages: 380 },
  { mois: 'Jul', passages: 410 }, { mois: 'Aoû', passages: 390 },
]

const repartition = [
  { name: 'Invités SALT',        value: 38, color: '#C5A059' },
  { name: 'Abonnés',             value: 45, color: '#3B82F6' },
  { name: 'Passages Ponctuels',  value: 17, color: '#8B5CF6' },
]

const entites = [
  { nom: 'Présidence', passages: 48 },
  { nom: 'Min. Affaires Étrangères', passages: 42 },
  { nom: 'BOAD', passages: 37 },
  { nom: 'Ambassades', passages: 29 },
  { nom: 'Total Togo', passages: 24 },
  { nom: 'Autres', passages: 61 },
]

const kpis = [
  { icon: Users,     label: 'Passagers Août', value: '390', sub: '+5% vs juil.', color: '#C5A059' },
  { icon: TrendingUp,label: 'Taux Occupation Moyen', value: '67%', sub: 'Salon Solidarité', color: '#3B82F6' },
  { icon: Star,      label: 'Invités SALT', value: '148', sub: '38% du total', color: '#8B5CF6' },
  { icon: Building,  label: 'Entités Actives', value: '34', sub: 'ce mois', color: '#10B981' },
]

const GOLD = '#C5A059'
const BLUE = '#3B82F6'
const VIOLET = '#8B5CF6'

export default function Analytics() {
  const tooltipStyle = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 11,
    color: 'var(--fg)',
  }

  return (
    <div className="p-6 fade-in">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Tableau de bord exécutif</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>Analytics & KPIs — Salons VIP SALT · Août 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${k.color}18`, color: k.color }}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-0.5" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs font-medium" style={{ color: 'var(--fg)' }}>{k.label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{k.sub}</div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Weekly bar */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--fg)' }}>Fréquentation Hebdomadaire (semaine en cours)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekly} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="jour" tick={{ fontSize: 11, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="solidarite" name="Solidarité" fill={GOLD} radius={[4,4,0,0]} />
              <Bar dataKey="plus" name="Plus" fill={BLUE} radius={[4,4,0,0]} />
              <Bar dataKey="paix" name="Paix" fill={VIOLET} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="card p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--fg)' }}>Répartition des Passages</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={repartition} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                dataKey="value" paddingAngle={3}>
                {repartition.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {repartition.map(r => (
              <div key={r.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <span style={{ color: 'var(--fg-muted)' }}>{r.name}</span>
                </div>
                <span className="font-semibold" style={{ color: r.color }}>{r.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Monthly trend */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--fg)' }}>Tendance Mensuelle 2026</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="passages" stroke={GOLD} fill="url(#goldGrad)" strokeWidth={2} dot={{ fill: GOLD, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top entities */}
        <div className="card p-5">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--fg)' }}>Bilan par Entité</h2>
          <div className="space-y-3">
            {entites.map(e => (
              <div key={e.nom}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="truncate" style={{ color: 'var(--fg)' }}>{e.nom}</span>
                  <span className="font-semibold ml-2 flex-shrink-0" style={{ color: 'var(--gold)' }}>{e.passages}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(e.passages / 61) * 100}%`, background: GOLD }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
