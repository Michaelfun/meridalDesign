import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Award, Building2, Globe, Play, Users } from 'lucide-react'
import { IMG, PROJECTS } from '../data'
import { Img } from './ui'

const CARD = 'h-[188px] rounded-[2rem] border border-white/70 bg-[#f6f1e8]/92 shadow-xl backdrop-blur-xl'
const STAT = [[[Building2, '250+', 'Projects complete'], [Users, '120+', 'Happy clients']], [[Globe, '15+', 'Countries worldwide'], [Award, '18', 'Design awards']]]

export default function Hero({ fade }) {
  const [i, setI] = useState(0)
  const f = PROJECTS[i]
  const step = (d) => setI((i + d + PROJECTS.length) % PROJECTS.length)
  return (
    <section id="top" className="relative h-screen min-h-[700px] w-full">
      <motion.div style={{ opacity: fade }} className="absolute inset-0">
        {/* soft wash behind the copy so it stays readable over any part of the scene */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[68%] bg-gradient-to-r from-[#f6f1e8]/80 via-[#f6f1e8]/40 to-transparent" />

        <ul aria-label="Design values" className="absolute right-12 top-36 hidden border-r border-ink/50 pr-3 text-right text-[10px] leading-5 tracking-[0.18em] text-ink lg:block">
          {['MODERN', 'SUSTAINABLE', 'FUNCTIONAL', 'TIMELESS'].map((t) => <li key={t}>{t}</li>)}
        </ul>

        <div className="absolute left-6 top-[21%] max-w-xl md:left-12 lg:left-16">
          <p className="mb-5 text-[11px] font-medium tracking-[0.28em] text-ink">ARCHITECTURE — INTERIORS — LANDSCAPES</p>
          <h1 className="font-display text-6xl font-normal leading-[0.95] text-ink md:text-8xl">Spaces<br />That <span className="text-clay">Inspire</span></h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-ink">We design meaningful spaces that blend architecture, nature and modern living.</p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a href="#projects" className="inline-flex items-center gap-3 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-sand shadow-lg transition hover:bg-clay">Explore Our Work <ArrowRight size={16} /></a>
            <a href="#about" className="inline-flex items-center gap-3 text-sm font-medium text-ink"><span className="grid h-12 w-12 place-items-center rounded-full border border-ink bg-white/60"><Play size={14} fill="currentColor" /></span>Watch Showreel</a>
          </div>
        </div>

        <div className="absolute inset-x-5 bottom-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className={`${CARD} flex gap-3 p-3`}>
            <Img src={f.img} alt={`${f.name}, ${f.place}`} className="hidden h-full w-28 shrink-0 rounded-3xl sm:block" />
            <div className="flex min-w-0 flex-1 flex-col justify-between py-1 pr-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="text-[9px] tracking-[0.2em] text-ink/70">FEATURED PROJECT</p><h2 className="truncate font-display text-2xl font-medium leading-tight">{f.name}</h2></div>
                <span className="shrink-0 text-xs text-ink/70">{String(i + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}</span>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-ink/80">{f.blurb}</p>
              <div className="flex items-center justify-between">
                <Link to={`/projects/${f.slug}`} className="text-xs font-medium">View Project <ArrowRight size={12} className="inline" /></Link>
                <div className="flex items-center gap-2">
                  <button onClick={() => step(-1)} aria-label="Previous project" className="grid h-9 w-9 place-items-center rounded-full bg-white/80"><ArrowLeft size={14} /></button>
                  <button onClick={() => step(1)} aria-label="Next project" className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sand"><ArrowRight size={14} /></button>
                </div>
              </div>
            </div>
          </article>

          {STAT.map((pair, n) => (
            <div key={n} className={`${CARD} hidden grid-cols-2 items-center gap-2 px-6 lg:grid`}>
              {pair.map(([Icon, num, label]) => <div key={label}><Icon size={18} className="mb-3" /><p className="font-display text-4xl font-medium leading-none">{num}</p><p className="mt-1.5 text-xs text-ink/80">{label}</p></div>)}
            </div>
          ))}

          <a href="#contact" className="group hidden h-[188px] flex-col justify-between rounded-[2rem] border border-white/10 bg-[#1f1b17]/94 p-5 text-sand shadow-xl sm:flex">
            <span className="flex items-start justify-between"><Img src={IMG.cta} alt="" className="h-12 w-12 rounded-full" /><span className="grid h-9 w-9 place-items-center rounded-full bg-sand text-ink transition group-hover:bg-clay group-hover:text-sand"><ArrowUpRight size={15} /></span></span>
            <span><span className="font-display text-2xl font-medium leading-tight">Bring Your Vision To Life</span><span className="mt-1 block text-xs text-sand/75">Let’s create a space that feels like you.</span></span>
          </a>
        </div>
      </motion.div>
    </section>
  )
}
