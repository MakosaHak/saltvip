import type { LucideIcon } from 'lucide-react'
import { Landmark, Sparkles, PlaneLanding, PlaneTakeoff, Users, Crown } from 'lucide-react'

export const SALONS = [
  {
    name: 'Salon Solidarité',
    desc: 'Espace VIP de référence pour les personnalités institutionnelles et diplomatiques.',
    cap: '45 places',
    icon: Landmark,
    services: ['Service traiteur', 'Wi-Fi haut débit', 'Salle de réunion'],
  },
  {
    name: 'Salon Plus',
    desc: "Cadre exclusif pour les voyageurs d'affaires et cadres supérieurs.",
    cap: '30 places',
    icon: Sparkles,
    services: ['Bar privatif', 'Fauteuils massage', 'Journaux & Magazines'],
  },
  {
    name: 'Salon Paix Arrivée',
    desc: 'Accueil premium pour les passagers en phase d\'arrivée internationale.',
    cap: '25 places',
    icon: PlaneLanding,
    services: ['Douche privée', 'Rafraîchissements', 'Assistance bagages'],
  },
  {
    name: 'Salon Paix Départ',
    desc: 'Confort optimal avant embarquement sur vols internationaux.',
    cap: '25 places',
    icon: PlaneTakeoff,
    services: ['Salon repos', 'Buffet', 'Wi-Fi haut débit'],
  },
  {
    name: 'Salon Union',
    desc: 'Espace convivial pour délégations et missions officielles.',
    cap: '35 places',
    icon: Users,
    services: ['Salle de réunion', 'Service traiteur', 'Accès PMR'],
  },
  {
    name: 'Salon Denyigban',
    desc: 'Salon d\'exception alliant tradition togolaise et confort moderne.',
    cap: '20 places',
    icon: Crown,
    services: ['Ambiance premium', 'Service personnalisé', 'Espace privatif'],
  },
] as const satisfies { name: string; desc: string; cap: string; icon: LucideIcon; services: string[] }[]

/** Salons disponibles à la réservation (formulaire protocole) */
export const RESERVATION_SALONS = ['Salon Solidarité', 'Salon Plus'] as const

export const SALON_NAMES = SALONS.map(s => s.name)
