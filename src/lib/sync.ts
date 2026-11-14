import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

type Row = { id: string; data: unknown; updated_at?: string }

/**
 * Sérialisation stable (clés triées récursivement). Postgres réordonne les
 * clés des colonnes jsonb : comparer avec JSON.stringify brut créerait des
 * faux écarts et une boucle d'écritures entre les postes.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).filter(k => obj[k] !== undefined).sort()
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}

export type SyncStatus = 'local' | 'connecting' | 'online' | 'error'

interface Options<T> {
  /** Nom de la table Supabase. */
  table: string
  /** État React de la collection et son setter. */
  state: T[]
  setState: Dispatch<SetStateAction<T[]>>
  /** Clé unique d'un élément (par défaut `item.id`). */
  key?: (item: T) => string
  /** Transformation appliquée aux données reçues du serveur (ex. hydratation). */
  hydrate?: (rows: T[]) => T[]
  /** Si la table est vide au premier chargement, y pousser l'état courant (seed). */
  seedIfEmpty?: boolean
  onStatus?: (status: SyncStatus) => void
}

/**
 * Synchronise une collection React avec une table Supabase :
 *  1. au montage, charge la table (ou y pousse le seed si elle est vide) ;
 *  2. à chaque changement d'état, envoie uniquement les lignes ajoutées,
 *     modifiées ou supprimées ;
 *  3. s'abonne au temps réel pour recevoir les changements des autres postes.
 *
 * Sans client Supabase configuré, le hook ne fait rien : l'application
 * conserve son fonctionnement local.
 */
export function useSyncedCollection<T>({ table, state, setState, key, hydrate, seedIfEmpty = true, onStatus }: Options<T>) {
  const keyOf = key ?? ((item: T) => (item as { id: string }).id)
  const serverRef = useRef<Map<string, string>>(new Map())
  /** Dernier état vu par l'effet d'écriture : sert à détecter les retraits locaux. */
  const prevStateRef = useRef<Set<string> | null>(null)
  const loadedRef = useRef(false)
  const [loaded, setLoaded] = useState(false)

  // 1. Chargement initial + 3. abonnement temps réel
  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    let channel: RealtimeChannel | null = null
    onStatus?.('connecting')

    const applyRemoteRows = (rows: Row[]) => {
      const map = new Map<string, string>()
      const items = rows.map(r => {
        map.set(r.id, stableStringify(r.data))
        return r.data as T
      })
      serverRef.current = map
      prevStateRef.current = new Set(map.keys())
      setState(hydrate ? hydrate(items) : items)
    }

    ;(async () => {
      const { data, error } = await supabase!.from(table).select('id,data').order('updated_at', { ascending: false })
      if (cancelled) return
      if (error) {
        console.error(`[sync:${table}] chargement impossible`, error.message)
        onStatus?.('error')
        return
      }
      const rows = (data ?? []) as Row[]
      if (rows.length === 0 && seedIfEmpty && state.length > 0) {
        const seed = state.map(item => ({ id: keyOf(item), data: item }))
        const { error: seedErr } = await supabase!.from(table).upsert(seed)
        if (seedErr) console.error(`[sync:${table}] seed impossible`, seedErr.message)
        else serverRef.current = new Map(seed.map(s => [s.id, stableStringify(s.data)]))
        prevStateRef.current = new Set(seed.map(s => s.id))
      } else {
        applyRemoteRows(rows)
      }
      loadedRef.current = true
      setLoaded(true)
      onStatus?.('online')
    })()

    channel = supabase
      .channel(`sync:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
        console.debug(`[sync:${table}] event`, payload.eventType, (payload.new as Row)?.id ?? (payload.old as Row)?.id)
        if (!loadedRef.current) return
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as Row).id
          if (!serverRef.current.has(id)) return
          serverRef.current.delete(id)
          setState(list => list.filter(item => keyOf(item) !== id))
          return
        }
        const row = payload.new as Row
        const json = stableStringify(row.data)
        if (serverRef.current.get(row.id) === json) return // écho de notre propre écriture
        serverRef.current.set(row.id, json)
        const incoming = hydrate ? hydrate([row.data as T])[0] : (row.data as T)
        setState(list => {
          const idx = list.findIndex(item => keyOf(item) === row.id)
          if (idx === -1) return [incoming, ...list]
          const next = list.slice()
          next[idx] = incoming
          return next
        })
      })
      .subscribe(status => console.debug(`[sync:${table}] channel`, status))

    return () => {
      cancelled = true
      channel?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  // 2. Écriture différentielle
  useEffect(() => {
    if (!supabase || !loadedRef.current) return
    const current = new Map<string, { item: T; json: string }>()
    for (const item of state) current.set(keyOf(item), { item, json: stableStringify(item) })

    // Ajouts / modifications : tout ce qui diffère de la copie serveur connue.
    const upserts: Row[] = []
    for (const [id, { item, json }] of current) {
      if (serverRef.current.get(id) !== json) upserts.push({ id, data: item })
    }
    // Suppressions : uniquement les retraits faits localement (présents dans
    // l'état précédent, absents maintenant, et encore connus du serveur).
    // Jamais déduites de la copie serveur : une ligne créée par un autre
    // poste ne peut donc pas être effacée par ce poste.
    const deletes: string[] = []
    if (prevStateRef.current) {
      for (const id of prevStateRef.current) {
        if (!current.has(id) && serverRef.current.has(id)) deletes.push(id)
      }
    }
    prevStateRef.current = new Set(current.keys())
    if (upserts.length === 0 && deletes.length === 0) return

    // Mémoriser immédiatement pour ignorer l'écho temps réel.
    for (const u of upserts) serverRef.current.set(u.id, stableStringify(u.data))
    for (const id of deletes) serverRef.current.delete(id)

    ;(async () => {
      if (upserts.length) {
        const { error } = await supabase!.from(table).upsert(upserts)
        if (error) { console.error(`[sync:${table}] écriture impossible`, error.message); onStatus?.('error') }
      }
      if (deletes.length) {
        const { error } = await supabase!.from(table).delete().in('id', deletes)
        if (error) { console.error(`[sync:${table}] suppression impossible`, error.message); onStatus?.('error') }
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return loaded
}
