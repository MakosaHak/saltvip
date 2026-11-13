type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-9 w-auto',
  md: 'h-12 w-auto',
  lg: 'h-16 w-auto max-w-[140px]',
}

export default function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  return (
    <img
      src="/facilresa-logo.png"
      alt="FacilRESA"
      className={`object-contain bg-transparent ${sizes[size]} ${className}`}
    />
  )
}

export function BrandWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      <span style={{ color: 'var(--gold)' }}>Facil</span>
      <span style={{ color: 'var(--brand-green)' }}>RESA</span>
    </span>
  )
}
