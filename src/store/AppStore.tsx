import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { uid, fmtTime, fmtDate, passengerFullName, splitPassengerName, splitAccountName, countCompanions, generateProtocolCode, getCheckinDateStatus } from '../lib/utils'

export type Role = 'admin' | 'hostess' | 'protocole' | 'supervisor' | 'vip'
export type Theme = 'light' | 'dark'
export type ResaStatut = 'avenir' | 'passes' | 'annulees'
export type KanbanStatut = 'attendu' | 'present' | 'embarque'
export type SuperStatut = 'en_attente' | 'valide' | 'annule'
export type ToastType = 'success' | 'error' | 'info'
export type AccountRole = 'admin' | 'hostess' | 'protocole'

export interface UserSession {
  id: string
  name: string
  role: Role
  societe?: string
  email?: string
  salon?: string
  codeProtocole?: string
}

export interface Account {
  id: string
  name: string
  prenom: string
  nom: string
  profession: string
  nationalite: string
  email: string
  password: string
  role: AccountRole
  societe: string
  salon: string
  telephone: string
  actif: boolean
  codeProtocole: string
}

export interface Companion {
  id: string
  nom: string
  prenom: string
  profession: string
  nationalite: string
  checkedIn: boolean
  checkedAt?: string
  checkedBy?: string
}

export interface Passenger {
  id: string
  nom: string
  prenom: string
  nomPrenoms: string
  profession: string
  nationalite: string
  societe: string
  vol: string
  compagnie: string
  mouvement: string
  destination: string
  date: string
  heure: string
  salon: string
  checkedIn: boolean
  checkedAt?: string
  checkedBy?: string
  accompagnateurs: Companion[]
}

export interface Reservation {
  id: string
  vol: string
  compagnie: string
  mouvement: string
  destination: string
  date: string
  heure: string
  salon: string
  passager: string
  prenom: string
  nom: string
  fonction: string
  societe: string
  nationalite: string
  protocoleId: string
  protocoleNom: string
  protocoleCode: string
  protocoleTel: string
  dateReservation: string
  hotesseNom: string
  accompagnateurs: number
  passengers: Passenger[]
  commentaires: string
  statut: ResaStatut
  superStatut: SuperStatut
  hoursLeft: number
  creePar: string
  creeA: string
  creeRole: AccountRole | string
  modifA?: string
}

export interface VIP {
  id: string
  nom: string
  prenom: string
  fonction: string
  vol: string
  heure: string
  salon: string
  hotesse: string
  statut: KanbanStatut
  societe: string
  accompagnateurs: number
}

export interface Toast { id: string; type: ToastType; message: string }
export interface StaffUser { id: string; nom: string; role: string; salon: string; actif: boolean }
export interface SalonConfig { id: string; nom: string; capacite: number; quota: number; actif: boolean }
export interface Compagnie { id: string; nom: string; code: string }
export interface AuditEntry { time: string; action: string; resa: string; user: string; detail: string }
export interface ProfileData { societe: string; protocole: string; telephone: string; email: string }

export type NewCompanion = Omit<Companion, 'id' | 'checkedIn' | 'checkedAt' | 'checkedBy'>
export type NewPassenger = Omit<Passenger, 'id' | 'checkedIn' | 'checkedAt' | 'checkedBy' | 'accompagnateurs'> & {
  accompagnateurs: NewCompanion[]
}
export type NewReservation = Omit<Reservation, 'id' | 'creeA' | 'hoursLeft' | 'superStatut' | 'statut' | 'passager' | 'prenom' | 'nom' | 'fonction' | 'nationalite' | 'accompagnateurs' | 'passengers'> & {
  passengers: NewPassenger[]
}

interface AppStore {
  theme: Theme
  toggleTheme: () => void
  user: UserSession | null
  login: (u: UserSession) => void
  logout: () => void
  accounts: Account[]
  authenticate: (email: string, password: string) => Account | null
  addAccount: (a: Omit<Account, 'id' | 'prenom' | 'nom' | 'profession' | 'nationalite' | 'codeProtocole'> & Partial<Pick<Account, 'prenom' | 'nom' | 'profession' | 'nationalite' | 'codeProtocole'>>) => Account
  importAccounts: (rows: Array<Partial<Account> & { name: string; email: string }>) => number
  updateAccount: (id: string, patch: Partial<Account>) => void
  removeAccount: (id: string) => void
  reservations: Reservation[]
  addReservation: (r: NewReservation) => Reservation
  updateReservation: (id: string, patch: Partial<Reservation>) => void
  cancelReservation: (id: string) => void
  deleteReservation: (id: string) => void
  validateReservation: (id: string, by: string) => void
  reassignSalon: (id: string, salon: string, by: string) => void
  checkInPassenger: (reservationId: string, passengerId: string, by: string) => boolean | void
  vips: VIP[]
  moveVip: (id: string, to: KanbanStatut) => void
  addVip: (v: Omit<VIP, 'id' | 'statut'>) => void
  staff: StaffUser[]
  addStaff: (u: Omit<StaffUser, 'id'>) => void
  updateStaff: (id: string, patch: Partial<StaffUser>) => void
  removeStaff: (id: string) => void
  salons: SalonConfig[]
  updateSalon: (id: string, patch: Partial<SalonConfig>) => void
  compagnies: Compagnie[]
  addCompagnie: (c: Omit<Compagnie, 'id'>) => void
  updateCompagnie: (id: string, patch: Partial<Compagnie>) => void
  audit: AuditEntry[]
  addAudit: (e: Omit<AuditEntry, 'time'>) => void
  profile: ProfileData
  saveProfile: (p: ProfileData) => void
  twoFA: boolean
  setTwoFA: (v: boolean) => void
  toasts: Toast[]
  toast: (message: string, type?: ToastType) => void
  dismissToast: (id: string) => void
}

const AppContext = createContext<AppStore | null>(null)

function defaultProfession(role: AccountRole) {
  if (role === 'protocole') return 'Officier de Protocole'
  if (role === 'hostess') return 'Hôtesse'
  return 'Administrateur'
}

function normalizeAccount(raw: Partial<Account> & { name: string; role: AccountRole }, existingCodes: string[] = []): Account {
  const split = splitAccountName(raw.name)
  const role = raw.role
  return {
    id: raw.id || uid('A'),
    name: raw.name,
    prenom: raw.prenom || split.prenom,
    nom: raw.nom || split.nom,
    profession: raw.profession || defaultProfession(role),
    nationalite: raw.nationalite || '',
    email: raw.email || '',
    password: raw.password || '',
    role,
    societe: raw.societe || '',
    salon: raw.salon || '—',
    telephone: raw.telephone || '',
    actif: raw.actif !== false,
    codeProtocole: role === 'protocole'
      ? (raw.codeProtocole || generateProtocolCode(existingCodes)).toUpperCase()
      : '',
  }
}

function ensureProtocolCodes(list: Account[]): Account[] {
  const used = new Set(list.map(a => a.codeProtocole).filter(Boolean))
  return list.map(a => {
    const normalized = normalizeAccount(a, [...used])
    if (normalized.codeProtocole) used.add(normalized.codeProtocole)
    return normalized
  })
}

const SEED_ACCOUNTS: Account[] = [
  normalizeAccount({ id: 'A0', name: 'Administrateur SALT', email: 'admin@salt.tg', password: 'SaltAdmin2026', role: 'admin', societe: 'SALT', salon: '—', telephone: '+228 22 23 00 00', actif: true }),
  normalizeAccount({ id: 'A1', name: 'Akosua KPOTO', email: 'akosua@salt.tg', password: 'SaltHostess2026', role: 'hostess', societe: 'SALT', salon: 'Salon Solidarité', telephone: '+228 90 11 11 11', actif: true }),
  normalizeAccount({ id: 'A2', name: 'Adjoua AMEVI', email: 'adjoua@salt.tg', password: 'SaltHostess2026', role: 'hostess', societe: 'SALT', salon: 'Salon Plus', telephone: '+228 90 22 22 22', actif: true }),
  normalizeAccount({ id: 'P1', name: 'Mme AFIA Kodjo', prenom: 'AFIA', nom: 'KODJO', email: 'afia@gouv.tg', password: 'SaltProto2026', role: 'protocole', societe: 'Ministère des Affaires Étrangères', salon: '—', telephone: '+228 90 00 00 00', actif: true, codeProtocole: 'PTC-KODJO1' }),
  normalizeAccount({ id: 'P2', name: 'Amara KOFFI', prenom: 'Amara', nom: 'KOFFI', email: 'amara@boad.org', password: 'SaltProto2026', role: 'protocole', societe: 'BOAD', salon: '—', telephone: '+228 91 00 00 00', actif: true, codeProtocole: 'PTC-KOFFI1' }),
]

function companion(prenom: string, nom: string, profession = '', nationalite = '', checkedIn = false): Companion {
  return { id: uid('C'), prenom, nom, profession, nationalite, checkedIn }
}

function normalizeCompanion(raw: Partial<Companion>): Companion {
  return {
    id: raw.id || uid('C'),
    prenom: (raw.prenom ?? '').trim(),
    nom: (raw.nom ?? '').trim(),
    profession: raw.profession ?? '',
    nationalite: raw.nationalite ?? '',
    checkedIn: Boolean(raw.checkedIn),
    checkedAt: raw.checkedAt,
    checkedBy: raw.checkedBy,
  }
}

function flightFrom(raw: Partial<Passenger>, fallback: Partial<Reservation> = {}) {
  return {
    vol: raw.vol || fallback.vol || '',
    compagnie: raw.compagnie || fallback.compagnie || '',
    mouvement: raw.mouvement || fallback.mouvement || 'Arrivée',
    destination: raw.destination || fallback.destination || '',
    date: raw.date || fallback.date || '',
    heure: raw.heure || fallback.heure || '',
    salon: raw.salon || fallback.salon || 'Salon Solidarité',
  }
}

function pax(prenom: string, nom: string, profession: string, nationalite: string, societe: string, accompagnateurs: Companion[] = [], checkedIn = false, flight: Partial<Passenger> = {}): Passenger {
  return {
    id: uid('P'),
    prenom,
    nom,
    nomPrenoms: `${prenom} ${nom}`.trim(),
    profession,
    nationalite,
    societe,
    ...flightFrom(flight),
    checkedIn,
    accompagnateurs,
  }
}

function normalizePassenger(raw: Partial<Passenger> & { nomPrenoms?: string }): Passenger {
  const prenom = (raw.prenom ?? '').trim()
  const nom = (raw.nom ?? '').trim()
  const fromFull = splitPassengerName(raw.nomPrenoms ?? '')
  const nextPrenom = prenom || fromFull.prenom
  const nextNom = nom || fromFull.nom
  return {
    id: raw.id || uid('P'),
    prenom: nextPrenom,
    nom: nextNom,
    nomPrenoms: passengerFullName({ prenom: nextPrenom, nom: nextNom, nomPrenoms: raw.nomPrenoms }),
    profession: raw.profession ?? '',
    nationalite: raw.nationalite ?? '',
    societe: raw.societe ?? '',
    ...flightFrom(raw),
    checkedIn: Boolean(raw.checkedIn),
    checkedAt: raw.checkedAt,
    checkedBy: raw.checkedBy,
    accompagnateurs: (raw.accompagnateurs ?? []).map(normalizeCompanion),
  }
}

const todayStr = fmtDate(new Date())
const inTwoDaysStr = fmtDate(new Date(Date.now() + 2 * 86400000))
const inFourDaysStr = fmtDate(new Date(Date.now() + 4 * 86400000))

const SEED_RESAS: Reservation[] = [
  {
    id: 'R-2026-TODAY',
    vol: 'AF 714',
    compagnie: 'Air France',
    mouvement: 'Arrivée',
    destination: 'Paris CDG',
    date: todayStr,
    heure: '10:30',
    salon: 'Salon Solidarité',
    passager: 'Kofi AGBEKO',
    prenom: 'Kofi',
    nom: 'AGBEKO',
    fonction: 'Ministre',
    societe: 'Présidence de la République',
    nationalite: 'Togolaise',
    protocoleId: 'P1',
    protocoleNom: 'Mme AFIA Kodjo',
    protocoleTel: '+228 90 00 00 00',
    hotesseNom: 'Akosua KPOTO',
    accompagnateurs: 1,
    commentaires: 'Accompagné de son chargé de mission',
    statut: 'avenir',
    superStatut: 'valide',
    hoursLeft: 2,
    creePar: 'Mme AFIA Kodjo',
    creeA: `${todayStr} 08:00`,
    creeRole: 'protocole',
    protocoleCode: 'PTC-KODJO1',
    dateReservation: todayStr,
    passengers: [
      pax('Kofi', 'AGBEKO', 'Ministre', 'Togolaise', 'Présidence de la République', [companion('Edem', 'MENSAH', 'Chargé de Mission', 'Togolaise')], false, {
        vol: 'AF 714', compagnie: 'Air France', mouvement: 'Arrivée', destination: 'Paris CDG', date: todayStr, heure: '10:30', salon: 'Salon Solidarité',
      }),
    ],
  },
  {
    id: 'R-2026-FUTUR',
    vol: 'KP 022',
    compagnie: 'ASKY Airlines',
    mouvement: 'Arrivée',
    destination: 'Accra',
    date: inTwoDaysStr,
    heure: '14:30',
    salon: 'Salon Plus',
    passager: 'Yawa SAVI',
    prenom: 'Yawa',
    nom: 'SAVI',
    fonction: 'Directrice des Opérations',
    societe: 'BOAD',
    nationalite: 'Togolaise',
    protocoleId: 'P2',
    protocoleNom: 'Amara KOFFI',
    protocoleTel: '+228 91 00 00 00',
    hotesseNom: 'Adjoua AMEVI',
    accompagnateurs: 0,
    commentaires: "Vol dans 2 jours - Validation bloquée jusqu'au jour J",
    statut: 'avenir',
    superStatut: 'valide',
    hoursLeft: 48,
    creePar: 'Akosua KPOTO',
    creeA: `${todayStr} 09:15`,
    creeRole: 'hostess',
    protocoleCode: 'PTC-KOFFI1',
    dateReservation: todayStr,
    passengers: [
      pax('Yawa', 'SAVI', 'Directrice des Opérations', 'Togolaise', 'BOAD', [], false, {
        vol: 'KP 022', compagnie: 'ASKY Airlines', mouvement: 'Arrivée', destination: 'Accra', date: inTwoDaysStr, heure: '14:30', salon: 'Salon Plus',
      }),
    ],
  },
  {
    id: 'R-2026-FUTUR-NOHOUR',
    vol: 'ET 324',
    compagnie: 'Ethiopian Airlines',
    mouvement: 'Départ',
    destination: 'Addis-Abeba',
    date: inFourDaysStr,
    heure: '',
    salon: 'Salon Solidarité',
    passager: 'Marc LAWSON',
    prenom: 'Marc',
    nom: 'LAWSON',
    fonction: 'Directeur Général',
    societe: 'Total Togo',
    nationalite: 'Togolaise',
    protocoleId: 'P1',
    protocoleNom: 'Mme AFIA Kodjo',
    protocoleTel: '+228 90 00 00 00',
    hotesseNom: '',
    accompagnateurs: 0,
    commentaires: 'Heure de vol non précisée (optionnelle)',
    statut: 'avenir',
    superStatut: 'valide',
    hoursLeft: 96,
    creePar: 'Mme AFIA Kodjo',
    creeA: `${todayStr} 10:00`,
    creeRole: 'protocole',
    protocoleCode: 'PTC-KODJO1',
    dateReservation: todayStr,
    passengers: [
      pax('Marc', 'LAWSON', 'Directeur Général', 'Togolaise', 'Total Togo', [], false, {
        vol: 'ET 324', compagnie: 'Ethiopian Airlines', mouvement: 'Départ', destination: 'Addis-Abeba', date: inFourDaysStr, heure: '', salon: 'Salon Solidarité',
      }),
    ],
  },
  {
    id: 'R-2026-0814',
    vol: 'AT 540',
    compagnie: 'Royal Air Maroc',
    mouvement: 'Arrivée',
    destination: 'Casablanca',
    date: '20/08/2026',
    heure: '22:45',
    salon: 'Salon Solidarité',
    passager: 'Afi KPOTO',
    prenom: 'Afi',
    nom: 'KPOTO',
    fonction: 'Conseillère Diplomatique',
    societe: 'Ministère des Affaires Étrangères',
    nationalite: 'Togolaise',
    protocoleId: 'P1',
    protocoleNom: 'Mme AFIA Kodjo',
    protocoleTel: '+228 90 00 00 00',
    hotesseNom: '',
    accompagnateurs: 1,
    commentaires: '',
    statut: 'avenir',
    superStatut: 'valide',
    hoursLeft: 48,
    creePar: 'Mme AFIA Kodjo',
    creeA: '18/08 09:12',
    creeRole: 'protocole',
    protocoleCode: 'PTC-KODJO1',
    dateReservation: '18/08/2026',
    passengers: [
      pax('Afi', 'KPOTO', 'Conseillère Diplomatique', 'Togolaise', 'Ministère des Affaires Étrangères', [companion('Komi', 'AGBODJAN', 'Protocole Adjoint', 'Togolaise')], false, {
        vol: 'AT 540', compagnie: 'Royal Air Maroc', mouvement: 'Arrivée', destination: 'Casablanca', date: '20/08/2026', heure: '22:45', salon: 'Salon Solidarité',
      }),
    ],
  },
]

const SEED_VIPS: VIP[] = [
  { id: 'V001', nom: 'MENSAH', prenom: 'Edem', fonction: 'Ministre', vol: 'AF 714', heure: '22:45', salon: 'Salon Solidarité', hotesse: 'Akosua', statut: 'attendu', societe: 'Min. Finance', accompagnateurs: 1 },
  { id: 'V002', nom: 'KOFFI', prenom: 'Amara', fonction: 'Directeur', vol: 'KP 022', heure: '14:30', salon: 'Salon Plus', hotesse: 'Adjoua', statut: 'attendu', societe: 'BOAD', accompagnateurs: 0 },
  { id: 'V003', nom: 'AGBEKO', prenom: 'Kofi', fonction: 'Ministre', vol: 'ET 324', heure: '10:15', salon: 'Salon Solidarité', hotesse: 'Akosua', statut: 'present', societe: 'Présidence', accompagnateurs: 3 },
  { id: 'V004', nom: 'SAVI', prenom: 'Yawa', fonction: 'Directrice', vol: 'RK 501', heure: '08:00', salon: 'Salon Solidarité', hotesse: 'Koko', statut: 'present', societe: 'BNDE', accompagnateurs: 1 },
  { id: 'V005', nom: 'LAWSON', prenom: 'Marc', fonction: 'Directeur Pays', vol: 'W3 200', heure: '06:30', salon: 'Salon Plus', hotesse: 'Adjoua', statut: 'embarque', societe: 'Total Togo', accompagnateurs: 0 },
  { id: 'V006', nom: 'AMEGA', prenom: 'Ama', fonction: 'Députée', vol: 'TW 090', heure: '07:10', salon: 'Salon Solidarité', hotesse: 'Akosua', statut: 'embarque', societe: 'Assemblée Nationale', accompagnateurs: 2 },
]

const SEED_STAFF: StaffUser[] = [
  { id: 'U1', nom: 'Adzo MENSAH', role: 'Superviseur', salon: 'Salon Solidarité', actif: true },
  { id: 'U2', nom: 'Akosua KPOTO', role: 'Hôtesse', salon: 'Salon Solidarité', actif: true },
  { id: 'U3', nom: 'Adjoua AMEVI', role: 'Hôtesse', salon: 'Salon Plus', actif: true },
  { id: 'U4', nom: 'Koko SAVI', role: 'Hôtesse', salon: 'Salon Plus', actif: true },
  { id: 'U5', nom: 'Efua LAWSON', role: 'Hôtesse', salon: 'Salon Plus', actif: false },
  { id: 'U6', nom: 'Amara KOFFI', role: 'Protocole', salon: '—', actif: true },
]

const SEED_SALONS: SalonConfig[] = [
  { id: 'S1', nom: 'Salon Solidarité', capacite: 45, quota: 50, actif: true },
  { id: 'S2', nom: 'Salon Plus', capacite: 30, quota: 35, actif: true },
]

const SEED_COMPAGNIES: Compagnie[] = [
  { id: 'C1', nom: 'Air France', code: 'AF' },
  { id: 'C2', nom: 'ASKY Airlines', code: 'KP' },
  { id: 'C3', nom: 'Ethiopian Airlines', code: 'ET' },
  { id: 'C4', nom: 'Royal Air Maroc', code: 'AT' },
  { id: 'C5', nom: 'Air Côte d\'Ivoire', code: 'HF' },
  { id: 'C6', nom: 'Brussels Airlines', code: 'SN' },
]

const SEED_AUDIT: AuditEntry[] = [
  { time: '19/08 11:00', action: 'Création', resa: 'R-2026-0815', user: 'Akosua KPOTO', detail: 'Réservation hôtesse pour protocole BOAD' },
  { time: '18/08 09:12', action: 'Création', resa: 'R-2026-0814', user: 'Mme AFIA Kodjo', detail: 'Réservation protocole — 2 passagers' },
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function dedupeIds(passengers: Passenger[]): Passenger[] {
  const seen = new Set<string>()
  const fresh = (id: string, prefix: string) => {
    const next = seen.has(id) ? uid(prefix) : id
    seen.add(next)
    return next
  }
  return passengers.map(p => ({
    ...p,
    id: fresh(p.id, 'P'),
    accompagnateurs: p.accompagnateurs.map(a => ({ ...a, id: fresh(a.id, 'C') })),
  }))
}

function hydrateResas(list: Reservation[]): Reservation[] {
  return list.map(r => {
    const passengers = dedupeIds((r.passengers && r.passengers.length)
      ? r.passengers.map(p => normalizePassenger({ ...p, ...flightFrom(p, r) }))
      : [pax(r.prenom, r.nom, r.fonction, r.nationalite, r.societe, [], false, flightFrom({}, r))])
    const first = passengers[0]
    const passengerName = passengerFullName(first)
    const protocolName = r.protocoleNom ?? ''
    const distinctPassenger = passengerName && passengerName !== protocolName
      ? passengerName
      : passengerFullName({ prenom: r.prenom, nom: r.nom, nomPrenoms: r.passager })
    return {
      ...r,
      passengers,
      vol: first?.vol || r.vol,
      compagnie: first?.compagnie || r.compagnie,
      mouvement: first?.mouvement || r.mouvement,
      destination: first?.destination || r.destination,
      date: first?.date || r.date,
      heure: first?.heure || r.heure,
      salon: first?.salon || r.salon,
      protocoleId: r.protocoleId ?? '',
      protocoleNom: protocolName,
      protocoleCode: r.protocoleCode ?? '',
      dateReservation: r.dateReservation || r.creeA?.split(' ')[0] || '',
      hotesseNom: r.hotesseNom ?? '',
      creeRole: r.creeRole ?? 'protocole',
      passager: distinctPassenger || passengerName,
      prenom: first?.prenom || r.prenom,
      nom: first?.nom || r.nom,
      fonction: first?.profession || r.fonction,
      nationalite: first?.nationalite || r.nationalite,
      societe: first?.societe || r.societe,
      accompagnateurs: countCompanions({ passengers }),
    }
  })
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => load('salt-theme', 'light'))
  const [user, setUser] = useState<UserSession | null>(() => load('salt4-user', null))
  const [accounts, setAccounts] = useState<Account[]>(() => ensureProtocolCodes(load('salt8-accounts', SEED_ACCOUNTS)))
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = load<Reservation[] | null>('salt9-resas', null)
    if (saved && saved.length) return hydrateResas(saved)
    return hydrateResas(SEED_RESAS)
  })
  const [vips, setVips] = useState<VIP[]>(() => load('salt-vips2', SEED_VIPS))
  const [staff, setStaff] = useState<StaffUser[]>(() => load('salt-staff2', SEED_STAFF))
  const [salons, setSalons] = useState<SalonConfig[]>(() => load('salt2-salons', SEED_SALONS))
  const [compagnies, setCompagnies] = useState<Compagnie[]>(() => load('salt-cie', SEED_COMPAGNIES))
  const [audit, setAudit] = useState<AuditEntry[]>(() => load('salt3-audit', SEED_AUDIT))
  const [profile, setProfile] = useState<ProfileData>(() => load('salt-profile', {
    societe: 'République Togolaise — Ministère de l\'Économie',
    protocole: 'Mme Afi KPOTO',
    telephone: '+228 90 12 34 56',
    email: 'protocole@economie.gouv.tg',
  }))
  const [twoFA, setTwoFAState] = useState(() => load('salt-2fa', false))
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark') }, [theme])
  useEffect(() => { localStorage.setItem('salt-theme', JSON.stringify(theme)) }, [theme])
  useEffect(() => { localStorage.setItem('salt4-user', JSON.stringify(user)) }, [user])
  useEffect(() => { localStorage.setItem('salt8-accounts', JSON.stringify(accounts)) }, [accounts])
  useEffect(() => { localStorage.setItem('salt9-resas', JSON.stringify(reservations)) }, [reservations])
  useEffect(() => { localStorage.setItem('salt-vips2', JSON.stringify(vips)) }, [vips])
  useEffect(() => { localStorage.setItem('salt-staff2', JSON.stringify(staff)) }, [staff])
  useEffect(() => { localStorage.setItem('salt2-salons', JSON.stringify(salons)) }, [salons])
  useEffect(() => { localStorage.setItem('salt-cie', JSON.stringify(compagnies)) }, [compagnies])
  useEffect(() => { localStorage.setItem('salt3-audit', JSON.stringify(audit)) }, [audit])
  useEffect(() => { localStorage.setItem('salt-profile', JSON.stringify(profile)) }, [profile])
  useEffect(() => { localStorage.setItem('salt-2fa', JSON.stringify(twoFA)) }, [twoFA])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = uid('T')
    setToasts(t => [...t, { id, type, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3600)
  }, [])

  const dismissToast = (id: string) => setToasts(t => t.filter(x => x.id !== id))
  const addAudit = (e: Omit<AuditEntry, 'time'>) => setAudit(a => [{ time: fmtTime(), ...e }, ...a])

  const store: AppStore = {
    theme,
    toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
    user,
    login: setUser,
    logout: () => setUser(null),
    accounts,
    authenticate: (email, password) => {
      const found = accounts.find(a =>
        a.actif &&
        a.email.toLowerCase() === email.trim().toLowerCase() &&
        a.password === password
      )
      return found ?? null
    },
    addAccount: (a) => {
      const created = normalizeAccount({ ...a, id: uid('A') }, accounts.map(x => x.codeProtocole))
      setAccounts(list => [created, ...list])
      return created
    },
    importAccounts: (rows) => {
      let added = 0
      setAccounts(list => {
        const emails = new Set(list.map(a => a.email.toLowerCase()))
        const codes = list.map(a => a.codeProtocole)
        const next = [...list]
        for (const row of rows) {
          const email = (row.email || '').trim().toLowerCase()
          if (!email || emails.has(email) || !row.name) continue
          const acc = normalizeAccount({
            ...row,
            id: uid('A'),
            role: row.role || 'protocole',
            password: row.password || `Facil${Math.random().toString(36).slice(2, 8)}`,
            actif: row.actif !== false,
          }, codes)
          emails.add(email)
          if (acc.codeProtocole) codes.push(acc.codeProtocole)
          next.unshift(acc)
          added += 1
        }
        return next
      })
      return added
    },
    updateAccount: (id, patch) => setAccounts(list => list.map(x => x.id === id ? { ...x, ...patch } : x)),
    removeAccount: (id) => setAccounts(list => list.filter(x => x.id !== id)),
    reservations,
    addReservation: (r) => {
      const passengers: Passenger[] = r.passengers.map(p => normalizePassenger({
        ...p,
        id: uid('P'),
        checkedIn: false,
        accompagnateurs: (p.accompagnateurs ?? []).map(a => ({
          ...a,
          id: uid('C'),
          checkedIn: false,
        })),
      }))
      const first = passengers[0]
      const created: Reservation = {
        ...r,
        id: uid('R'),
        vol: first?.vol || r.vol,
        compagnie: first?.compagnie || r.compagnie,
        mouvement: first?.mouvement || r.mouvement,
        destination: first?.destination || r.destination,
        date: first?.date || r.date,
        heure: first?.heure || r.heure,
        salon: first?.salon || r.salon,
        statut: 'avenir',
        superStatut: 'valide',
        hoursLeft: 72,
        creeA: fmtTime(),
        dateReservation: r.dateReservation || fmtDate(),
        protocoleCode: r.protocoleCode || '',
        passengers,
        passager: passengerFullName(first),
        prenom: first?.prenom ?? '',
        nom: first?.nom ?? '',
        fonction: first?.profession ?? '',
        nationalite: first?.nationalite ?? '',
        societe: first?.societe || r.societe || '',
        accompagnateurs: countCompanions({ passengers }),
      }
      setReservations(list => [created, ...list])
      addAudit({
        action: 'Création',
        resa: created.id,
        user: r.creePar,
        detail: `Réservation ${created.vol} — ${passengers.length} passager(s), ${created.accompagnateurs} accompagnateur(s) — protocole ${created.protocoleNom}`,
      })
      return created
    },
    updateReservation: (id, patch) => {
      setReservations(list => list.map(r => r.id === id ? { ...r, ...patch, modifA: fmtTime() } : r))
      addAudit({ action: 'Modification', resa: id, user: user?.name ?? 'Utilisateur', detail: 'Réservation mise à jour' })
    },
    cancelReservation: (id) => {
      setReservations(list => list.map(r => r.id === id ? { ...r, statut: 'annulees', superStatut: 'annule', modifA: fmtTime() } : r))
      addAudit({ action: 'Annulation', resa: id, user: user?.name ?? 'Utilisateur', detail: 'Réservation annulée' })
    },
    deleteReservation: (id) => {
      const found = reservations.find(r => r.id === id)
      setReservations(list => list.filter(r => r.id !== id))
      addAudit({
        action: 'Suppression',
        resa: id,
        user: user?.name ?? 'Utilisateur',
        detail: found
          ? `Suppression définitive de la réservation ${found.vol} (${found.passager})`
          : `Suppression réservation ${id}`,
      })
    },
    validateReservation: (id, by) => {
      setReservations(list => list.map(r => r.id === id ? { ...r, superStatut: 'valide', statut: 'avenir', modifA: fmtTime() } : r))
      addAudit({ action: 'Validation', resa: id, user: by, detail: 'Réservation validée' })
    },
    reassignSalon: (id, salon, by) => {
      setReservations(list => list.map(r => r.id === id ? { ...r, salon, modifA: fmtTime() } : r))
      addAudit({ action: 'Réassignation', resa: id, user: by, detail: `Salon réassigné → ${salon}` })
    },
    checkInPassenger: (reservationId, passengerId, by) => {
      const resa = reservations.find(r => r.id === reservationId)
      if (resa?.superStatut === 'annule') {
        toast('Validation impossible : cette réservation a été annulée', 'error')
        return false
      }
      if (resa) {
        let personDate = resa.date
        for (const p of resa.passengers) {
          if (p.id === passengerId) {
            personDate = p.date || resa.date
            break
          }
          const acc = p.accompagnateurs?.find(a => a.id === passengerId)
          if (acc) {
            personDate = p.date || resa.date
            break
          }
        }
        const status = getCheckinDateStatus(personDate)
        if (!status.allowed) {
          toast(`Validation impossible : le checking ne peut être validé qu'à partir du jour J (${personDate})`, 'error')
          return false
        }
      }
      setReservations(list => list.map(r => {
        if (r.id !== reservationId) return r
        return {
          ...r,
          passengers: r.passengers.map(p => {
            if (p.id === passengerId) {
              return { ...p, checkedIn: true, checkedAt: fmtTime(), checkedBy: by }
            }
            return {
              ...p,
              accompagnateurs: p.accompagnateurs.map(a => a.id === passengerId
                ? { ...a, checkedIn: true, checkedAt: fmtTime(), checkedBy: by }
                : a),
            }
          }),
        }
      }))
      addAudit({ action: 'Check-in', resa: reservationId, user: by, detail: 'Personne validée à l\'entrée' })
      return true
    },
    vips,
    moveVip: (id, to) => setVips(vs => vs.map(v => v.id === id ? { ...v, statut: to } : v)),
    addVip: (v) => setVips(vs => [{ ...v, id: uid('V'), statut: 'present' }, ...vs]),
    staff,
    addStaff: (u) => setStaff(s => [{ ...u, id: uid('U') }, ...s]),
    updateStaff: (id, patch) => setStaff(s => s.map(x => x.id === id ? { ...x, ...patch } : x)),
    removeStaff: (id) => setStaff(s => s.filter(x => x.id !== id)),
    salons,
    updateSalon: (id, patch) => setSalons(s => s.map(x => x.id === id ? { ...x, ...patch } : x)),
    compagnies,
    addCompagnie: (c) => setCompagnies(list => [{ ...c, id: uid('C') }, ...list]),
    updateCompagnie: (id, patch) => setCompagnies(list => list.map(x => x.id === id ? { ...x, ...patch } : x)),
    audit,
    addAudit,
    profile,
    saveProfile: setProfile,
    twoFA,
    setTwoFA: setTwoFAState,
    toasts,
    toast,
    dismissToast,
  }

  return <AppContext.Provider value={store}>{children}</AppContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppStore must be used within AppProvider')
  return ctx
}
