import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/AppStore'
import { Eye, EyeOff, ArrowRight, Lock, Mail } from 'lucide-react'
import BrandLogo from '../../components/BrandLogo'

export default function Auth() {
  const { authenticate, login, toast } = useAppStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const acc = authenticate(email, password)
      if (!acc) {
        toast('Identifiants incorrects ou compte inactif', 'error')
        setLoading(false)
        return
      }
      login({
        id: acc.id,
        name: acc.name,
        role: acc.role,
        email: acc.email,
        societe: acc.societe,
        salon: acc.salon,
        codeProtocole: acc.codeProtocole,
      })
      toast(`Bienvenue, ${acc.name}`)
      if (acc.role === 'protocole') navigate('/reservation')
      else navigate('/admin/reservation')
      setLoading(false)
    }, 350)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: 'var(--bg)' }}>
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(165deg, #042B3E 0%, #063A54 52%, #0A5C2E 100%)' }}>
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full" style={{ background: 'rgba(42, 159, 224, 0.18)' }} />
        <div className="absolute bottom-20 -left-20 w-64 h-64 rounded-full" style={{ background: 'rgba(45, 186, 75, 0.16)' }} />
        <div className="relative">
          <BrandLogo size="lg" className="h-28 w-auto max-w-[240px]" />
        </div>
        <div className="relative text-white max-w-md">
          <p className="text-xs tracking-[0.28em] uppercase mb-4" style={{ color: '#7FD4A0' }}>
            Aéroport Gnassingbé Eyadema
          </p>
          <h2 className="font-display text-5xl font-semibold leading-[1.08] mb-4">
            Accès réservé<br />aux salons.
          </h2>
          <p className="text-sm text-white/65 leading-relaxed">
            Identifiez-vous pour réserver, accueillir ou piloter les opérations VIP.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm fade-in">
          <div className="mb-10 lg:hidden">
            <BrandLogo size="lg" className="h-20 w-auto" />
          </div>
          <p className="page-badge">Espace sécurisé</p>
          <h1 className="font-display text-3xl font-semibold mb-2">Connexion</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--fg-muted)' }}>
            Saisissez votre email et votre mot de passe.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-muted)' }} />
                <input className="input pl-10" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-muted)' }} />
                <input className="input pl-10 pr-10" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" style={{ paddingLeft: '40px' }} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--fg-muted)' }} onClick={() => setShowPwd(v => !v)} aria-label="Afficher le mot de passe">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-3.5" disabled={loading}>
              {loading ? 'Vérification…' : <>Entrer <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
