import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

// Lazy image with a neutral placeholder, so a missing photo never breaks the layout
export function Img({ src, alt = '', className = '', ...rest }) {
  return (
    <div className={`overflow-hidden bg-taupe/50 ${className}`}>
      <img src={src} alt={alt} loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} className="h-full w-full object-cover" {...rest} />
    </div>
  )
}

export function Pill({ href, children, dark = true, className = '' }) {
  return (
    <Link to={href} className={`inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-sm font-medium transition ${dark ? 'bg-ink text-sand hover:bg-clay' : 'bg-sand text-ink hover:bg-white'} ${className}`}>
      {children}
      <span className={`grid h-9 w-9 place-items-center rounded-full ${dark ? 'bg-sand text-ink' : 'bg-ink text-sand'}`}><ArrowRight size={16} /></span>
    </Link>
  )
}
