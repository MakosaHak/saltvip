import ReservationForm from '../../components/ReservationForm'
import PageHeader from '../../components/ui/PageHeader'
import { useAppStore } from '../../store/AppStore'

export default function AdminReservation() {
  const { user } = useAppStore()
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Réservation"
        subtitle="Enregistrer une réservation pour un protocole — appel téléphonique ou passage au salon"
        badge={user?.role === 'admin' ? 'Administrateur' : 'Hôtesse'}
      />
      <div className="max-w-3xl">
        <ReservationForm variant="hostess" />
      </div>
    </div>
  )
}
