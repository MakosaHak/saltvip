import { Link } from 'react-router-dom'
import { ArrowRight, Building2 } from 'lucide-react'
import { SALONS } from '../../data/salons'

export default function Landing() {
  return (
    <div className="fade-in">
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <p className="text-xs tracking-[0.22em] uppercase font-semibold mb-4" style={{ color: 'var(--gold)' }}>
          Aéroport International Gnassingbé Eyadema
        </p>
        <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[1.08] max-w-3xl mb-6">
          Le salon s'ouvre<br />
          <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>sur une réservation nette.</em>
        </h1>
        <p className="text-lg max-w-xl mb-8 leading-relaxed" style={{ color: 'var(--fg-muted)' }}>
          Les protocoles déposent leurs passagers. Les hôtesses enregistrent les appels. Le checking à l'arrivée confirme chaque nom — sans QR, sans flou.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/connexion" className="btn-primary">Accéder au portail <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 mb-20">
        <div>
          <img
            src="https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1400&h=800&fit=crop"
            alt="Salon VIP Lomé"
            className="w-full h-72 object-cover rounded-3xl"
            style={{ border: '1px solid var(--border-subtle)' }}
          />
          <p className="text-xs mt-3 flex items-center gap-2" style={{ color: 'var(--fg-muted)' }}>
            <Building2 size={13} style={{ color: 'var(--gold)' }} /> Photo du salon — AIGE Lomé
          </p>
        </div>
        <div className="grid gap-4 content-center">
          {[
            ['01', 'Le protocole dépose la demande', 'Nombre de personnes, vol, et fiche de chaque accompagnateur.'],
            ['02', 'La SALT reçoit et accueille', 'L\'hôtesse peut aussi enregistrer l\'appel. Le checking valide l\'entrée.'],
          ].map(s => (
            <div key={s[0]} className="card p-6">
              <p className="font-display text-3xl mb-2" style={{ color: 'var(--gold)', opacity: 0.4 }}>{s[0]}</p>
              <h3 className="font-semibold mb-1">{s[1]}</h3>
              <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>{s[2]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl font-semibold mb-2">Six salons</h2>
          <p className="text-sm mb-8" style={{ color: 'var(--fg-muted)' }}>Solidarité, Plus, Paix Arrivée, Paix Départ, Union, Denyigban</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SALONS.map(s => {
              const Icon = s.icon
              return (
                <div key={s.name} className="card p-5">
                  <div className="icon-box w-9 h-9 mb-3"><Icon size={16} /></div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--fg-muted)' }}>{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
