import { useEffect, useState } from 'react'
import { GA_ID, loadGA } from '../analytics'

const read = () => { try { return localStorage.getItem('consent') } catch { return null } }

// Only shown when Google Analytics is configured. Plausible needs no consent.
export default function Consent() {
  const [choice, setChoice] = useState(read)
  useEffect(() => { if (choice === 'yes') loadGA() }, [choice])
  if (!GA_ID || choice) return null
  const set = (v) => { try { localStorage.setItem('consent', v) } catch { /* private mode */ } setChoice(v) }
  return (
    <div role="dialog" aria-label="Cookie consent" className="glass fixed bottom-4 left-4 right-4 z-50 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5 md:left-auto md:max-w-md">
      <p className="text-sm">We use analytics cookies to understand how the site is used. You can decline.</p>
      <div className="flex gap-2">
        <button onClick={() => set('no')} className="rounded-full bg-white/60 px-5 py-2 text-sm">Decline</button>
        <button onClick={() => set('yes')} className="rounded-full bg-ink px-5 py-2 text-sm text-sand">Accept</button>
      </div>
    </div>
  )
}
