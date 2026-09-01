import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom'
import { useAppStore } from '../store/AppStore'
import { Sun, Moon, Plane, LogOut, CalendarPlus, ClipboardList } from 'lucide-react'

export default function PublicLayout() {
  const { theme, toggleTheme, user, logout } = useAppStore()
  const navigate = useNavigate()

  if (!user) return <Navigate to="/connexion" replace />
  if (user.role !== 'protocole') return <Navigate to="/admin/reservation" replace />

  const signOut = () => { logout(); navigate('/connexion') }

  const links = [
    { to: '/reservation', label: 'Réserver', icon: CalendarPlus },
    { to: '/mes-reservations', label: 'Mes demandes', icon: ClipboardList },
  ]

  return (
    <div style={{ minHeight: '100vh', color: 'var(--fg)', background: 'var(--bg)' }}>
      <header className="sticky top-0 z-50" style={{ background: 'var(--navy)' }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14 md:h-[68px]">
          <div className="flex items-center gap-2.5 text-white">
            <div className="logo-mark"><Plane size={15} /></div>
            <div>
              <p className="font-display text-lg leading-tight">SALT VIP</p>
              <p className="text-[10px] text-white/55 hidden sm:block">{user.name} · Protocole</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {links.map(l => {
              const Icon = l.icon
              return (
                <NavLink key={l.to} to={l.to}
                  className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${isActive ? 'text-[#E8C56B] bg-white/10' : 'text-white/70 hover:text-white'}`}>
                  <Icon size={15} /> {l.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="flex items-center gap-1">
            <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center text-white/75" aria-label="Thème">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={signOut} className="w-9 h-9 flex items-center justify-center text-white/75" aria-label="Déconnexion">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="shell-main"><Outlet /></main>

      <nav className="bottom-nav" aria-label="Navigation mobile">
        {links.map(l => {
          const Icon = l.icon
          return (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'active' : ''}>
              <Icon size={18} />
              {l.label}
            </NavLink>
          )
        })}
        <button type="button" onClick={signOut}>
          <LogOut size={18} />
          Sortir
        </button>
      </nav>
    </div>
  )
}
