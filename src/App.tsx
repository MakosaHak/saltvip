import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './store/AppStore'
import ToastContainer from './components/ui/Toast'
import RequireAuth, { GuestOnly, HomeRedirect } from './components/RequireAuth'

import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'

import Auth from './pages/public/Auth'
import Reservation from './pages/public/Reservation'
import MyReservations from './pages/public/MyReservations'

import ControlCenter from './pages/admin/ControlCenter'
import PassengerRegistry from './pages/admin/PassengerRegistry'
import Supervision from './pages/admin/Supervision'
import ExportCenter from './pages/admin/ExportCenter'
import Analytics from './pages/admin/Analytics'
import SystemAdmin from './pages/admin/SystemAdmin'
import AdminReservation from './pages/admin/AdminReservation'
import Checking from './pages/admin/Checking'

export { useAppStore } from './store/AppStore'
export type { UserSession } from './store/AppStore'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/connexion" element={<GuestOnly><Auth /></GuestOnly>} />

          <Route element={<RequireAuth roles={['protocole']}><PublicLayout /></RequireAuth>}>
            <Route path="/reservation" element={<Reservation />} />
            <Route path="/mes-reservations" element={<MyReservations />} />
          </Route>

          <Route path="/admin" element={<RequireAuth roles={['admin', 'hostess']}><AdminLayout /></RequireAuth>}>
            <Route index element={<Navigate to="/admin/reservation" replace />} />
            <Route path="reservation" element={<AdminReservation />} />
            <Route path="checking" element={<Checking />} />
            <Route path="planning" element={<ControlCenter />} />
            <Route path="registre" element={<PassengerRegistry />} />
            <Route path="supervision" element={<RequireAuth roles={['admin']}><Supervision /></RequireAuth>} />
            <Route path="exports" element={<RequireAuth roles={['admin']}><ExportCenter /></RequireAuth>} />
            <Route path="analytics" element={<RequireAuth roles={['admin']}><Analytics /></RequireAuth>} />
            <Route path="systeme" element={<RequireAuth roles={['admin']}><SystemAdmin /></RequireAuth>} />
          </Route>

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </AppProvider>
  )
}
