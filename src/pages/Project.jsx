import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { BRAND, PROJECTS } from '../data'
import { track } from '../analytics'
import { Img, Pill } from '../components/ui'

export default function Project() {
  const { slug } = useParams()
  const i = PROJECTS.findIndex((p) => p.slug === slug)
  const p = PROJECTS[i]
  const next = PROJECTS[(i + 1) % PROJECTS.length]

  useEffect(() => {
    if (!p) return
    const prev = document.title
    const meta = document.querySelector('meta[name="description"]')
    const prevDesc = meta?.content
    document.title = `${p.name} | ${BRAND}`
    if (meta) meta.content = p.blurb
    track('project_view', { project: p.name })
    return () => { document.title = prev; if (meta) meta.content = prevDesc }
  }, [p])

  if (!p) return (
    <div className="grid min-h-screen place-items-center bg-sand px-6 text-center">
      <div><h1 className="font-display text-6xl">Project not found</h1><Link to="/#projects" className="mt-6 inline-block underline underline-offset-4">Back to all projects</Link></div>
    </div>
  )

  const facts = [['Client', p.client], ['Location', p.place], ['Year', p.year], ['Type', p.type], ['Area', p.area], ['Status', p.status]].filter(([, v]) => v)
  return (
    <article className="bg-sand pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <Link to="/#projects" className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink"><ArrowLeft size={15} /> All projects</Link>
        <h1 className="mt-6 max-w-4xl font-display text-6xl font-light leading-[0.95] md:text-8xl">{p.name}</h1>
        <p className="mt-5 max-w-xl text-lg text-ink/70">{p.blurb}</p>
        <Img src={p.img} alt={`${p.name}, ${p.place}`} className="mt-12 aspect-[16/9] rounded-[2rem]" fetchPriority="high" loading="eager" />

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <dl className="grid h-fit grid-cols-2 gap-x-6 gap-y-6">
            {facts.map(([k, v]) => <div key={k} className="border-t border-ink/20 pt-3"><dt className="text-sm text-ink/60">{k}</dt><dd className="mt-1 font-display text-2xl">{v}</dd></div>)}
          </dl>
          <div className="max-w-2xl space-y-5 text-lg leading-relaxed text-ink/80">
            {p.body.split(/\n\s*\n/).map((t, n) => <p key={n}>{t}</p>)}
          </div>
        </div>

        {p.gallery?.length > 0 && (
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {p.gallery.map((src, n) => <Img key={n} src={src} alt={`${p.name}, view ${n + 1}`} className={`aspect-[4/3] rounded-[2rem] ${n === 0 ? 'md:col-span-2 md:aspect-[16/9]' : ''}`} />)}
          </div>
        )}

        <div className="mt-24 grid items-center gap-8 border-t border-ink/20 pt-10 md:grid-cols-2">
          <Link to={`/projects/${next.slug}`} className="group flex items-center gap-5">
            <Img src={next.img} alt="" className="h-24 w-32 shrink-0 rounded-2xl" />
            <span><span className="text-sm text-ink/60">Next project</span><span className="mt-1 flex items-center gap-2 font-display text-3xl">{next.name}<ArrowUpRight className="transition group-hover:translate-x-1" size={20} /></span></span>
          </Link>
          <div className="md:text-right"><Pill href="/#contact">Start a project like this</Pill></div>
        </div>
      </div>
    </article>
  )
}
