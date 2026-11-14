import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Garde-fou global : au lieu d'une page blanche, affiche l'erreur et propose
 * de réinitialiser les données locales du navigateur (localStorage), qui sont
 * la cause la plus fréquente d'un état incohérent après une mise à jour.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[FacilRESA] erreur de rendu', error, info.componentStack)
  }

  private reset = () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('salt'))
        .forEach(k => localStorage.removeItem(k))
    } catch { /* ignore */ }
    window.location.href = '/connexion'
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', background: '#F3F7FA', color: '#0B2A3C' }}>
        <div style={{ maxWidth: 520, width: '100%', background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 10px 30px rgba(4,43,62,0.12)' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2A9FE0', margin: 0 }}>FacilRESA</p>
          <h1 style={{ fontSize: 22, margin: '8px 0 12px' }}>Une erreur est survenue</h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, margin: '0 0 16px', color: '#3D5466' }}>
            L'affichage a été interrompu. Le plus souvent, des données locales d'une ancienne version
            du navigateur sont en cause. Réinitialiser les données locales ne touche pas à la base
            de données partagée.
          </p>
          <pre style={{ fontSize: 12, background: '#F3F7FA', padding: 12, borderRadius: 8, overflow: 'auto', maxHeight: 160, margin: '0 0 20px' }}>
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={this.reset} style={{ background: 'linear-gradient(90deg,#2A9FE0,#2DBA4B)', color: '#fff', border: 0, borderRadius: 10, padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}>
              Réinitialiser les données locales
            </button>
            <button onClick={() => window.location.reload()} style={{ background: '#E8EEF3', color: '#0B2A3C', border: 0, borderRadius: 10, padding: '10px 16px', fontWeight: 600, cursor: 'pointer' }}>
              Recharger
            </button>
          </div>
        </div>
      </div>
    )
  }
}
