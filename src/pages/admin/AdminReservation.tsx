import ReservationForm from '../../components/ReservationForm'
import PageHeader from '../../components/ui/PageHeader'
import { useAppStore } from '../../store/AppStore'

export default function AdminReservation() {
  const { user } = useAppStore()
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Faire une réservation"
        subtitle="Enregistrez chaque passager avec son vol. Un même protocole peut réserver plusieurs passagers sur des vols différents."
        badge={user?.role === 'admin' ? 'Administrateur' : 'Hôtesse'}
      />
      <div className="max-w-3xl">
        <ReservationForm variant="hostess" />
      </div>
    </div>
  )
}
