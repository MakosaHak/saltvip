import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { uid, fmtTime } from '../lib/utils'

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
}

export interface Account {
  id: string
  name: string
  email: string
  password: string
  role: AccountRole
  societe: string
  salon: string
  telephone: string
  actif: boolean
}

export interface Passenger {
  id: string
  nomPrenoms: string
  profession: string
  nationalite: string
  societe: string
  checkedIn: boolean
  checkedAt?: string
  checkedBy?: string
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
  protocoleTel: string
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

export type NewReservation = Omit<Reservation, 'id' | 'creeA' | 'hoursLeft' | 'superStatut' | 'statut' | 'passager' | 'prenom' | 'nom' | 'fonction' | 'nationalite' | 'accompagnateurs' | 'passengers'> & {
  passengers: Omit<Passenger, 'id' | 'checkedIn'>[]
}

interface AppStore {
  theme: Theme
  toggleTheme: () => void
  user: UserSession | null
  login: (u: UserSession) => void
  logout: () => void
  accounts: Account[]
  authenticate: (email: string, password: string) => Account | null
  addAccount: (a: Omit<Account, 'id'>) => void
  updateAccount: (id: string, patch: Partial<Account>) => void
  removeAccount: (id: string) => void
  reservations: Reservation[]
  addReservation: (r: NewReservation) => Reservation
  updateReservation: (id: string, patch: Partial<Reservation>) => void
  cancelReservation: (id: string) => void
  validateReservation: (id: string, by: string) => void
  reassignSalon: (id: string, salon: string, by: string) => void
  checkInPassenger: (reservationId: string, passengerId: string, by: string) => void
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

const SEED_ACCOUNTS: Account[] = [
  { id: 'A0', name: 'Administrateur SALT', email: 'admin@salt.tg', password: 'SaltAdmin2026', role: 'admin', societe: 'SALT', salon: '—', telephone: '+228 22 23 00 00', actif: true },
  { id: 'A1', name: 'Akosua KPOTO', email: 'akosua@salt.tg', password: 'SaltHostess2026', role: 'hostess', societe: 'SALT', salon: 'Salon Solidarité', telephone: '+228 90 11 11 11', actif: true },
  { id: 'A2', name: 'Adjoua AMEVI', email: 'adjoua@salt.tg', password: 'SaltHostess2026', role: 'hostess', societe: 'SALT', salon: 'Salon Plus', telephone: '+228 90 22 22 22', actif: true },
  { id: 'P1', name: 'Mme AFIA Kodjo', email: 'afia@gouv.tg', password: 'SaltProto2026', role: 'protocole', societe: 'Ministère des Affaires Étrangères', salon: '—', telephone: '+228 90 00 00 00', actif: true },
  { id: 'P2', name: 'Amara KOFFI', email: 'amara@boad.org', password: 'SaltProto2026', role: 'protocole', societe: 'BOAD', salon: '—', telephone: '+228 91 00 00 00', actif: true },
]

function pax(nomPrenoms: string, profession: string, nationalite: string, societe: string, checkedIn = false): Passenger {
  return { id: uid('P'), nomPrenoms, profession, nationalite, societe, checkedIn }
}

const SEED_RESAS: Reservation[] = [
  {
    id: 'R-2026-0814', vol: 'AF 714', compagnie: 'Air France', mouvement: 'Arrivée', destination: 'Paris CDG',
    date: '20/08/2026', heure: '22:45', salon: 'Salon Solidarité',
    passager: 'Kofi AGBEKO', prenom: 'Kofi', nom: 'AGBEKO', fonction: 'Ministre', societe: 'Présidence', nationalite: 'Togolaise',
    protocoleId: 'P1', protocoleNom: 'Mme AFIA Kodjo', protocoleTel: '+228 90 00 00 00', hotesseNom: '',
    accompagnateurs: 2, commentaires: '', statut: 'avenir', superStatut: 'valide', hoursLeft: 48,
    creePar: 'Mme AFIA Kodjo', creeA: '18/08 09:12', creeRole: 'protocole',
    passengers: [
      pax('Kofi AGBEKO', 'Ministre', 'Togolaise', 'Présidence'),
      pax('Edem MENSAH', 'Conseiller', 'Togolaise', 'Présidence'),
    ],
  },
  {
    id: 'R-2026-0815', vol: 'KP 022', compagnie: 'ASKY Airlines', mouvement: 'Arrivée', destination: 'Accra',
    date: '20/08/2026', heure: '14:30', salon: 'Salon Plus',
    passager: 'Yawa SAVI', prenom: 'Yawa', nom: 'SAVI', fonction: 'Directrice', societe: 'BOAD', nationalite: 'Togolaise',
    protocoleId: 'P2', protocoleNom: 'Amara KOFFI', protocoleTel: '+228 91 00 00 00', hotesseNom: 'Akosua KPOTO',
    accompagnateurs: 1, commentaires: '', statut: 'avenir', superStatut: 'valide', hoursLeft: 24,
    creePar: 'Akosua KPOTO', creeA: '19/08 11:00', creeRole: 'hostess',
    passengers: [
      pax('Yawa SAVI', 'Directrice', 'Togolaise', 'BOAD'),
    ],
  },
]

const SEED_VIPS: VIP[] = [
  { id: 'V001', nom: 'MENSAH', prenom: 'Edem', fonction: 'Ministre', vol: 'AF 714', heure: '22:45', salon: 'Salon Solidarité', hotesse: 'Akosua', statut: 'attendu', societe: 'Min. Finance', accompagnateurs: 1 },
  { id: 'V002', nom: 'KOFFI', prenom: 'Amara', fonction: 'Directeur', vol: 'KP 022', heure: '14:30', salon: 'Salon Plus', hotesse: 'Adjoua', statut: 'attendu', societe: 'BOAD', accompagnateurs: 0 },
  { id: 'V003', nom: 'AGBEKO', prenom: 'Kofi', fonction: 'Ministre', vol: 'ET 324', heure: '10:15', salon: 'Salon Solidarité', hotesse: 'Akosua', statut: 'present', societe: 'Présidence', accompagnateurs: 3 },
  { id: 'V004', nom: 'SAVI', prenom: 'Yawa', fonction: 'Directrice', vol: 'RK 501', heure: '08:00', salon: 'Salon Union', hotesse: 'Koko', statut: 'present', societe: 'BNDE', accompagnateurs: 1 },
  { id: 'V005', nom: 'LAWSON', prenom: 'Marc', fonction: 'Directeur Pays', vol: 'W3 200', heure: '06:30', salon: 'Salon Plus', hotesse: 'Adjoua', statut: 'embarque', societe: 'Total Togo', accompagnateurs: 0 },
  { id: 'V006', nom: 'AMEGA', prenom: 'Ama', fonction: 'Députée', vol: 'TW 090', heure: '07:10', salon: 'Salon Solidarité', hotesse: 'Akosua', statut: 'embarque', societe: 'Assemblée Nationale', accompagnateurs: 2 },
]

const SEED_STAFF: StaffUser[] = [
  { id: 'U1', nom: 'Adzo MENSAH', role: 'Superviseur', salon: 'Salon Solidarité', actif: true },
  { id: 'U2', nom: 'Akosua KPOTO', role: 'Hôtesse', salon: 'Salon Solidarité', actif: true },
  { id: 'U3', nom: 'Adjoua AMEVI', role: 'Hôtesse', salon: 'Salon Plus', actif: true },
  { id: 'U4', nom: 'Koko SAVI', role: 'Hôtesse', salon: 'Salon Union', actif: true },
  { id: 'U5', nom: 'Efua LAWSON', role: 'Hôtesse', salon: 'Salon Plus', actif: false },
  { id: 'U6', nom: 'Amara KOFFI', role: 'Protocole', salon: '—', actif: true },
]

const SEED_SALONS: SalonConfig[] = [
  { id: 'S1', nom: 'Salon Solidarité', capacite: 45, quota: 50, actif: true },
  { id: 'S2', nom: 'Salon Plus', capacite: 30, quota: 35, actif: true },
  { id: 'S3', nom: 'Salon Paix Arrivée', capacite: 25, quota: 30, actif: true },
  { id: 'S4', nom: 'Salon Paix Départ', capacite: 25, quota: 30, actif: true },
  { id: 'S5', nom: 'Salon Union', capacite: 35, quota: 40, actif: true },
  { id: 'S6', nom: 'Salon Denyigban', capacite: 20, quota: 25, actif: true },
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

function hydrateResas(list: Reservation[]): Reservation[] {
  return list.map(r => {
    const passengers = (r.passengers && r.passengers.length)
      ? r.passengers
      : [pax(r.passager || `${r.prenom} ${r.nom}`, r.fonction, r.nationalite, r.societe)]
    const first = passengers[0]
    const [prenom, ...rest] = (first?.nomPrenoms ?? '').split(' ')
    return {
      ...r,
      passengers,
      protocoleId: r.protocoleId ?? '',
      hotesseNom: r.hotesseNom ?? '',
      creeRole: r.creeRole ?? 'protocole',
      passager: first?.nomPrenoms ?? r.passager,
      prenom: prenom ?? r.prenom,
      nom: rest.join(' ') || r.nom,
      fonction: first?.profession ?? r.fonction,
      nationalite: first?.nationalite ?? r.nationalite,
      societe: first?.societe ?? r.societe,
      accompagnateurs: passengers.length,
    }
  })
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => load('salt-theme', 'light'))
  const [user, setUser] = useState<UserSession | null>(() => load('salt4-user', null))
  const [accounts, setAccounts] = useState<Account[]>(() => load('salt4-accounts', SEED_ACCOUNTS))
  const [reservations, setReservations] = useState<Reservation[]>(() => hydrateResas(load('salt3-resas', SEED_RESAS)))
  const [vips, setVips] = useState<VIP[]>(() => load('salt-vips', SEED_VIPS))
  const [staff, setStaff] = useState<StaffUser[]>(() => load('salt-staff', SEED_STAFF))
  const [salons, setSalons] = useState<SalonConfig[]>(() => load('salt-salons', SEED_SALONS))
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
  useEffect(() => { localStorage.setItem('salt4-accounts', JSON.stringify(accounts)) }, [accounts])
  useEffect(() => { localStorage.setItem('salt3-resas', JSON.stringify(reservations)) }, [reservations])
  useEffect(() => { localStorage.setItem('salt-vips', JSON.stringify(vips)) }, [vips])
  useEffect(() => { localStorage.setItem('salt-staff', JSON.stringify(staff)) }, [staff])
  useEffect(() => { localStorage.setItem('salt-salons', JSON.stringify(salons)) }, [salons])
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
    addAccount: (a) => setAccounts(list => [{ ...a, id: uid('A') }, ...list]),
    updateAccount: (id, patch) => setAccounts(list => list.map(x => x.id === id ? { ...x, ...patch } : x)),
    removeAccount: (id) => setAccounts(list => list.filter(x => x.id !== id)),
    reservations,
    addReservation: (r) => {
      const passengers: Passenger[] = r.passengers.map(p => ({
        ...p,
        id: uid('P'),
        checkedIn: false,
      }))
      const first = passengers[0]
      const [prenom, ...rest] = (first?.nomPrenoms ?? '').split(' ')
      const created: Reservation = {
        ...r,
        id: uid('R'),
        statut: 'avenir',
        superStatut: 'valide',
        hoursLeft: 72,
        creeA: fmtTime(),
        passengers,
        passager: first?.nomPrenoms ?? '',
        prenom: prenom ?? '',
        nom: rest.join(' '),
        fonction: first?.profession ?? '',
        nationalite: first?.nationalite ?? '',
        societe: r.societe || first?.societe || '',
        accompagnateurs: passengers.length,
      }
      setReservations(list => [created, ...list])
      addAudit({
        action: 'Création',
        resa: created.id,
        user: r.creePar,
        detail: `Réservation ${created.vol} — ${passengers.length} passager(s) — ${created.protocoleNom}`,
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
    validateReservation: (id, by) => {
      setReservations(list => list.map(r => r.id === id ? { ...r, superStatut: 'valide', statut: 'avenir', modifA: fmtTime() } : r))
      addAudit({ action: 'Validation', resa: id, user: by, detail: 'Réservation validée' })
    },
    reassignSalon: (id, salon, by) => {
      setReservations(list => list.map(r => r.id === id ? { ...r, salon, modifA: fmtTime() } : r))
      addAudit({ action: 'Réassignation', resa: id, user: by, detail: `Salon réassigné → ${salon}` })
    },
    checkInPassenger: (reservationId, passengerId, by) => {
      setReservations(list => list.map(r => {
        if (r.id !== reservationId) return r
        return {
          ...r,
          passengers: r.passengers.map(p => p.id === passengerId
            ? { ...p, checkedIn: true, checkedAt: fmtTime(), checkedBy: by }
            : p),
        }
      }))
      addAudit({ action: 'Check-in', resa: reservationId, user: by, detail: `Passager validé à l'entrée` })
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
