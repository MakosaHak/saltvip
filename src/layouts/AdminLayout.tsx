import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom'
import { useAppStore, type Role } from '../store/AppStore'
import {
  LayoutGrid, ClipboardList, ShieldCheck, Download,
  BarChart3, Settings, Sun, Moon, Plane, LogOut, Clock,
  CalendarPlus, UserCheck, MoreHorizontal, X,
} from 'lucide-react'

const allNav = [
  { to: '/admin/reservation', icon: CalendarPlus,  label: 'Réservation', roles: ['admin', 'hostess'] as Role[] },
  { to: '/admin/checking',    icon: UserCheck,     label: 'Checking',    roles: ['admin', 'hostess'] as Role[] },
  { to: '/admin/planning',    icon: LayoutGrid,    label: 'Planning',    roles: ['admin', 'hostess'] as Role[] },
  { to: '/admin/registre',    icon: ClipboardList, label: 'Registre',    roles: ['admin', 'hostess'] as Role[] },
  { to: '/admin/supervision', icon: ShieldCheck,   label: 'Supervision', roles: ['admin'] as Role[] },
  { to: '/admin/exports',     icon: Download,      label: 'Exports',     roles: ['admin'] as Role[] },
  { to: '/admin/analytics',   icon: BarChart3,     label: 'Analytics',   roles: ['admin'] as Role[] },
  { to: '/admin/systeme',     icon: Settings,      label: 'Comptes',     roles: ['admin'] as Role[] },
]

export default function AdminLayout() {
  const { theme, toggleTheme, reservations, logout, user } = useAppStore()
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())
  const [moreOpen, setMoreOpen] = useState(false)
  const pending = reservations.flatMap(r => r.passengers ?? []).filter(p => !p.checkedIn).length

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!user) return <Navigate to="/connexion" replace />
  if (user.role === 'protocole') return <Navigate to="/reservation" replace />

  const role = user.role
  const navItems = allNav.filter(n => n.roles.includes(role))
  const mobilePrimary = navItems.slice(0, 4)
  const mobileMore = navItems.slice(4)
  const formatGMT = (d: Date) =>
    d.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Lome', hour: '2-digit', minute: '2-digit' })

  const signOut = () => { logout(); navigate('/connexion') }

  return (
    <div className="flex h-screen overflow-hidden" style={{ color: 'var(--fg)', background: 'var(--bg)' }}>
      <aside className="hidden md:flex flex-col flex-shrink-0" style={{ width: 248, background: 'var(--sidebar)' }}>
        <div className="flex items-center gap-3 px-5 h-[76px]">
          <div className="logo-mark flex-shrink-0"><Plane size={15} /></div>
          <div>
            <div className="font-display font-semibold leading-tight text-white">SALT VIP</div>
            <div className="text-[11px]" style={{ color: '#8FA3BC' }}>{user.name}</div>
          </div>
        </div>

        <div className="px-5 pb-4 mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 text-[#E8C56B]">
            <Clock size={12} />
            <span className="font-mono text-xs font-semibold">GMT {formatGMT(time)}</span>
          </div>
          <p className="text-[11px] mt-1 capitalize" style={{ color: '#8FA3BC' }}>
            {role === 'admin' ? 'Administrateur' : 'Hôtesse'} · {user.salon !== '—' ? user.salon : 'Opérations'}
          </p>
        </div>

        <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <Icon size={17} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {to.includes('checking') && pending > 0 && (
                <span className="text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-bold"
                  style={{ background: '#E8C56B', color: '#0B1C33' }}>{pending}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 flex flex-col gap-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={toggleTheme} className="side-link w-full text-left">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>Thème {theme === 'dark' ? 'clair' : 'sombre'}</span>
          </button>
          <button onClick={signOut} className="side-link w-full text-left">
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14"
          style={{ background: 'var(--navy)', color: '#fff' }}>
          <div className="flex items-center gap-2">
            <div className="logo-mark !w-8 !h-8"><Plane size={13} /></div>
            <div>
              <p className="text-sm font-semibold leading-tight">SALT VIP</p>
              <p className="text-[10px] text-white/60">{user.name.split(' ')[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center text-white/80" aria-label="Thème">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={signOut} className="w-9 h-9 flex items-center justify-center text-white/80" aria-label="Déconnexion">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto shell-main">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Navigation mobile">
        {mobilePrimary.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        {mobileMore.length > 0 && (
          <button type="button" onClick={() => setMoreOpen(true)} className={moreOpen ? 'active' : ''}>
            <MoreHorizontal size={18} />
            Plus
          </button>
        )}
      </nav>

      {moreOpen && (
        <div className="modal-backdrop bottom-nav-extra" onClick={() => setMoreOpen(false)}>
          <div className="card w-full max-w-sm p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">Administration</p>
              <button onClick={() => setMoreOpen(false)}><X size={16} /></button>
            </div>
            <div className="grid gap-1">
              {mobileMore.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm"
                  style={{ background: 'var(--bg-elevated)' }}>
                  <Icon size={16} style={{ color: 'var(--gold)' }} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
