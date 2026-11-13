import ReservationForm from '../../components/ReservationForm'

export default function Reservation() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="page-badge">Protocole</p>
        <h1 className="page-title">Nouvelle réservation</h1>
        <p className="page-subtitle">Vous réservez pour un ou plusieurs passagers. Chaque passager peut avoir 0 ou plusieurs accompagnateurs.</p>
      </div>
      <ReservationForm variant="protocole" />
    </div>
  )
}
