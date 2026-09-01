import { Navigate } from 'react-router-dom'
import { useAppStore, type Role } from '../store/AppStore'

function homeFor(role?: Role) {
  if (role === 'protocole') return '/reservation'
  return '/admin/reservation'
}

export default function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: Role[]
}) {
  const { user } = useAppStore()
  if (!user) return <Navigate to="/connexion" replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />
  }
  return <>{children}</>
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore()
  if (user) return <Navigate to={homeFor(user.role)} replace />
  return <>{children}</>
}

export function HomeRedirect() {
  const { user } = useAppStore()
  if (!user) return <Navigate to="/connexion" replace />
  return <Navigate to={homeFor(user.role)} replace />
}
