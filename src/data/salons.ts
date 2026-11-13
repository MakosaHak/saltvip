import type { LucideIcon } from 'lucide-react'
import { Landmark, Sparkles } from 'lucide-react'

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
] as const satisfies { name: string; desc: string; cap: string; icon: LucideIcon; services: string[] }[]

export const RESERVATION_SALONS = ['Salon Solidarité', 'Salon Plus'] as const

export const SALON_NAMES = SALONS.map(s => s.name)
