import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Building2, Globe, Heart, Home, LayoutGrid, MessageSquare, Play, Plus, Users } from 'lucide-react'
import { IMG, PROJECTS } from '../data'
import { Img, Pill } from './ui'

const RAIL = [[Home, '#top', 'Home'], [LayoutGrid, '#projects', 'Projects'], [Bookmark, '#services', 'Services'], [Heart, '#testimonials', 'Clients'], [MessageSquare, '#contact', 'Contact']]

export default function Hero({ fade }) {
  const [i, setI] = useState(0)
  const f = PROJECTS[i]
  const step = (d) => setI((i + d + PROJECTS.length) % PROJECTS.length)
  return (
    <section id="top" className="relative h-screen min-h-[680px] w-full">
      <motion.div style={{ opacity: fade }} className="absolute inset-0">
        <aside aria-label="Quick links" className="glass absolute left-10 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 rounded-full px-2.5 py-4 lg:flex">
          {RAIL.map(([Icon, h, label], n) => (
            <a key={label} href={h} aria-label={label} className={`grid h-11 w-11 place-items-center rounded-full transition ${n === 0 ? 'bg-ink text-sand' : 'hover:bg-white/70'}`}><Icon size={17} /></a>
          ))}
          <Img src={IMG.about} alt="" className="mt-2 h-11 w-11 rounded-full" />
          <a href="#about" className="flex flex-col items-center gap-1.5 text-[10px] leading-tight"><span className="grid h-10 w-10 place-items-center rounded-full border border-ink/70"><Play size={13} fill="currentColor" /></span>Watch<br />Showreel</a>
        </aside>

        <ul aria-label="Design values" className="absolute right-12 top-36 hidden border-r border-ink/40 pr-3 text-right text-[10px] leading-5 tracking-[0.18em] lg:block">
          {['MODERN', 'SUSTAINABLE', 'FUNCTIONAL', 'TIMELESS'].map((t) => <li key={t}>{t}</li>)}
        </ul>

        <div className="absolute left-8 top-[24%] max-w-xl md:left-12 lg:left-36">
          <p className="mb-5 text-[11px] tracking-[0.28em]">ARCHITECTURE — INTERIORS — LANDSCAPES</p>
          <h1 className="font-display text-6xl font-light leading-[0.95] md:text-8xl">Spaces<br />That <span className="text-clay">Inspire</span></h1>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ink/80">We design meaningful spaces that blend architecture, nature and modern living.</p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a href="#projects" className="inline-flex items-center gap-3 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-sand transition hover:bg-clay">Explore Our Work <ArrowRight size={16} /></a>
            <a href="#about" className="inline-flex items-center gap-3 text-sm"><span className="grid h-12 w-12 place-items-center rounded-full border border-ink/70"><Play size={14} fill="currentColor" /></span>Watch Showreel</a>
          </div>
        </div>

        <div className="absolute inset-x-5 bottom-5 flex items-stretch gap-4 lg:left-36 lg:right-5">
          <article className="glass flex flex-1 gap-4 rounded-[2rem] p-3 lg:max-w-md">
            <Img src={f.img} alt={`${f.name}, ${f.place}`} className="hidden h-36 w-36 shrink-0 rounded-3xl sm:block" />
            <div className="flex flex-1 flex-col justify-between py-1 pr-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[9px] tracking-[0.2em] text-ink/60 sm:hidden">FEATURED PROJECT</p>
                  <h2 className="font-display text-2xl leading-tight">{f.name}</h2>
                </div>
                <span className="text-xs text-ink/60">{String(i + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}</span>
              </div>
              <p className="text-xs leading-relaxed text-ink/70">{f.blurb}</p>
              <div className="flex items-center justify-between">
                <Link to={`/projects/${f.slug}`} className="text-xs">View Project <ArrowRight size={12} className="inline" /></Link>
                <div className="flex items-center gap-2">
                  <button onClick={() => step(-1)} aria-label="Previous project" className="grid h-9 w-9 place-items-center rounded-full bg-white/60"><ArrowLeft size={14} /></button>
                  <button onClick={() => step(1)} aria-label="Next project" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sand"><ArrowRight size={14} /></button>
                </div>
              </div>
            </div>
          </article>

          <div className="glass hidden flex-1 items-center justify-around rounded-[2rem] px-4 lg:flex lg:max-w-lg">
            {[[Building2, '250+', 'Projects Complete'], [Users, '120+', 'Happy Clients'], [Globe, '15+', 'Countries Worldwide']].map(([Icon, n, l]) => (
              <div key={l}><Icon size={18} className="mb-2" /><p className="font-display text-3xl leading-none">{n}</p><p className="mt-1 text-[11px] text-ink/70">{l}</p></div>
            ))}
          </div>

          <a href="#contact" className="group hidden w-60 flex-col justify-between rounded-[2rem] bg-ink p-4 text-sand lg:flex">
            <span className="flex items-start justify-between"><Img src={IMG.cta} alt="" className="h-11 w-11 rounded-full" /><span className="grid h-9 w-9 place-items-center rounded-full bg-sand text-ink transition group-hover:bg-clay group-hover:text-sand"><ArrowUpRight size={15} /></span></span>
            <span><span className="font-display text-xl">Bring Your Vision To Life</span><span className="mt-1 block text-[11px] text-sand/60">Let’s create a space that feels like you.</span></span>
          </a>
        </div>
      </motion.div>
    </section>
  )
}
