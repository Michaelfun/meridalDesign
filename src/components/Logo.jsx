import { BRAND } from '../data'

// Meridian mark: a globe with a meridian line, and an "M" whose peaks read as roof pitches
export function LogoMark({ className = 'h-10 w-10', accent = '#9b5a33' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="2" />
      <path d="M32 3V61" stroke={accent} strokeWidth="1.8" />
      <path d="M14 48V22L32 38L50 22V48" stroke="currentColor" strokeWidth="3.4" />
    </svg>
  )
}

export default function Logo({ light = false, className = '' }) {
  const [first, ...rest] = BRAND.split(' ')
  return (
    <span className={`inline-flex items-center gap-3 ${light ? 'text-[#efe9dd]' : 'text-ink'} ${className}`}>
      <LogoMark accent={light ? '#d9a47a' : '#9b5a33'} />
      <span className="leading-none">
        <span className="block font-display text-[28px] font-medium tracking-tight">{first}</span>
        {rest.length > 0 && <span className={`mt-1 block text-[10px] uppercase tracking-[0.34em] ${light ? 'text-[#d9a47a]' : 'text-clay'}`}>{rest.join(' ')}</span>}
      </span>
    </span>
  )
}
