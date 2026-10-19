import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import { BRAND } from '../data'
import { Pill } from './ui'
import Logo from './Logo'

const LINKS = [['Home', '/'], ['Projects', '/#projects'], ['Services', '/#services'], ['About', '/#about'], ['Contact', '/#contact']]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const on = (h) => (h === '/' ? pathname === '/' : h === '/#projects' && pathname.startsWith('/projects'))
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-8 pt-8 md:px-12">
      <div className="flex items-center justify-between">
        <Link to="/" aria-label={`${BRAND} home`}><Logo /></Link>
        <nav aria-label="Main" className="glass hidden gap-1 rounded-full p-1.5 md:flex">
          {LINKS.map(([l, h]) => (
            <Link key={l} to={h} className={`rounded-full px-5 py-2.5 text-sm transition ${on(h) ? 'bg-ink text-sand' : 'hover:bg-white/60'}`}>{l}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button aria-label="Search projects" className="glass hidden h-11 w-11 place-items-center rounded-full md:grid"><Search size={17} /></button>
          <div className="hidden md:block"><Pill href="/#contact">Start a Project</Pill></div>
          <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="glass grid h-11 w-11 place-items-center rounded-full md:hidden">{open ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="glass mt-3 flex flex-col rounded-3xl p-3 md:hidden">
          {LINKS.map(([l, h]) => <Link key={l} to={h} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3">{l}</Link>)}
        </nav>
      )}
    </header>
  )
}
