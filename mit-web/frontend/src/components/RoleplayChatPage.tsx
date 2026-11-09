import { useEffect, useEffectEvent, useId, useRef, useState, type FormEvent } from "react"
import { ArrowLeft, ArrowRight, Check, Copy, Lightbulb, LoaderCircle, MessageCircle, ShieldCheck, Square, X } from "lucide-react"
import { getChatScenarios, roleplayRequest, type Outcome, type RoleplaySession, type Scenario } from "../services/roleplay"
import { JeliApiError } from "../services/errors"
import { locales, t, type Language } from "../i18n"

interface Props {
  onBackToHome: () => void
  lang: Language
  active: boolean
}
const outcomes: Record<Language, Record<Outcome, string>> = {
  ID: {
    active: "Latihan berlangsung",
    verified_exit: "Berhenti untuk memverifikasi",
    risky_choice: "Memilih tindakan berisiko dalam simulasi",
    needs_clarification: "Masih perlu klarifikasi",
    stopped: "Latihan dihentikan",
  },
  EN: {
    active: "Practice in progress",
    verified_exit: "Stopped to verify the offer",
    risky_choice: "Chose a risky action in the simulation",
    needs_clarification: "More clarification needed",
    stopped: "Practice ended",
  },
}
const statuses = {
  ID: { observed: "Terlihat", practice: "Perlu dilatih", unobserved: "Belum teramati" },
  EN: { observed: "Demonstrated", practice: "Needs practice", unobserved: "Not observed" },
}
const drafts = {
  ID: [
    ["Tanya detail", "Bisa jelaskan tahapan seleksi dan alasan syarat tersebut?"],
    ["Verifikasi mandiri", "Saya akan mencari kanal resmi perusahaan secara mandiri sebelum melanjutkan."],
    ["Tolak permintaan", "Saya tidak akan membayar deposit atau membagikan kredensial."],
  ],
  EN: [
    ["Ask for details", "Can you explain the recruitment steps and why this is required?"],
    ["Verify independently", "I will find an official company channel myself before proceeding."],
    ["Decline the request", "I will not pay a deposit or share my credentials."],
  ],
}
const sensitive = /https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\d[\s-]*){9,}|(?:otp|pin|password|kata sandi)\s*(?:saya|adalah|is|:|=)?\s*\d{4,8}\b/i
const button = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#087F7A] disabled:cursor-not-allowed disabled:opacity-50"

export function RoleplayChatPage({ onBackToHome, lang, active }: Props) {
  const id = useId()
  const en = lang === "EN"
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selected, setSelected] = useState("")
  const [session, setSession] = useState<RoleplaySession | null>(null)
  const [draft, setDraft] = useState("")
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [catalogError, setCatalogError] = useState("")
  const [error, setError] = useState("")
  const [hint, setHint] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [stopped, setStopped] = useState(false)
  const [expired, setExpired] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<string | null>(null)
  const request = useRef<AbortController | null>(null)
  const locked = useRef(false)
  const end = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  const reportHeading = useRef<HTMLHeadingElement>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finished = stopped || expired || (session !== null && session.outcome !== "active")
  const scenario = scenarios.find((s) => s.id === selected)

  useEffect(() => {
    if (!active || !loading) return
    const controller = new AbortController()
    getChatScenarios(controller.signal, lang).then((items) => {
      if (controller.signal.aborted) return
      setScenarios(items)
      setSelected((current) => current || items[0]?.id || "")
      setCatalogError("")
    }).catch((e: unknown) => {
      if (!controller.signal.aborted) setCatalogError(e instanceof JeliApiError ? e.message : new JeliApiError("invalid_response", lang).message)
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [active, lang, loading])

  useEffect(() => {
    if (active) return () => request.current?.abort()
  }, [active])

  useEffect(() => () => {
    request.current?.abort()
    if (copyTimer.current) clearTimeout(copyTimer.current)
  }, [])

  useEffect(() => {
    if (!session || finished) return
    const remaining = Math.max(0, session.expires_at * 1000 - Date.now())
    const timer = setTimeout(() => {
      request.current?.abort()
      request.current = null
      locked.current = false
      setBusy(false)
      setExpired(true)
    }, remaining)
    return () => clearTimeout(timer)
  }, [session, finished])

  const focusSession = useEffectEvent(() => {
    if (!active) return
    if (finished) {
      reportHeading.current?.focus({ preventScroll: true })
      reportHeading.current?.scrollIntoView({ block: "start" })
    }
    else end.current?.scrollIntoView({ block: "nearest" })
  })

  useEffect(() => focusSession(), [session, finished])

  function cancel() {
    request.current?.abort()
    request.current = null
    locked.current = false
    setBusy(false)
  }

  function reset(id = selected) {
    cancel()
    setSelected(id)
    setSession(null)
    setDraft("")
    setError("")
    setConsent(false)
    setStopped(false)
    setExpired(false)
    setHint(false)
    setHintsUsed(0)
    setCopied(false)
    setPendingSelection(null)
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!active || locked.current || finished || (!session && !consent)) return
    if (session && (!draft.trim() || draft.trim().length > 1000)) return
    if (session && sensitive.test(draft)) {
      setError(new JeliApiError("sensitive_input", lang).message)
      return
    }
    const controller = new AbortController()
    request.current = controller
    locked.current = true
    setBusy(true)
    setError("")
    const timeout = setTimeout(() => controller.abort("timeout"), 45000)
    try {
      const result = await roleplayRequest(session ? "turn" : "start", session ? {
        session_token: session.session_token, client_turn_id: crypto.randomUUID(), message: draft.trim(),
      } : { scenario_id: selected, language: lang }, controller.signal, lang)
      if (controller.signal.aborted) return
      setSession(result)
      setDraft("")
      setHint(false)
      if (result.outcome === "active") setTimeout(() => composer.current?.focus(), 0)
    } catch (e: unknown) {
      if (!controller.signal.aborted) {
        if (e instanceof JeliApiError && e.code === "session_expired") setExpired(true)
        setError(e instanceof Error ? e.message : new JeliApiError("invalid_response", lang).message)
      } else if (controller.signal.reason === "timeout") {
        setError(new JeliApiError("provider_timeout", lang).message)
      }
    } finally {
      clearTimeout(timeout)
      if (request.current === controller) {
        request.current = null
        locked.current = false
        setBusy(false)
      }
    }
  }

  async function copyReply() {
    if (!session) return
    try {
      await navigator.clipboard.writeText(session.report.safe_reply)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 1800)
    } catch {
      setError(en ? "The browser blocked copying. Select and copy the example reply manually." : "Penyalinan ditolak browser. Pilih dan salin contoh balasan secara manual.")
    }
  }

  if (!active) return null

  return (
    <main className="min-h-screen bg-warm-grid px-4 pb-20 pt-8 text-[#202C2B]">
      <div className="mx-auto max-w-5xl">
        <button onClick={onBackToHome} className={`${button} mb-6 px-0 text-[#064B50]`}>
          <ArrowLeft size={17} /> {lang === "ID" ? "Kembali ke Beranda" : "Back to Homepage"}
        </button>
        <header className="mb-8 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#087F7A]">Jeli Lakon · {t(lang, "simulator")}</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#064B50] sm:text-4xl">
            {en ? "Practise with a fictional recruiter" : "Berlatih dengan perekrut fiktif"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#202C2B]/80">
            {en ? "Reply in your own words. Jeli will show which decisions helped you stay safe." : "Balas dengan kalimatmu sendiri. Jeli akan membahas keputusan yang membantumu tetap aman."}
          </p>
        </header>

        {loading ? <p role="status" className="flex gap-2 py-8"><LoaderCircle className="animate-spin" /> {en ? "Loading scenarios…" : "Memuat latihan…"}</p> : (
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside aria-label={en ? "Choose a scenario" : "Pilih skenario"} className="space-y-3">
              {scenarios.map((item, index) => (
                <button key={item.id} aria-pressed={selected === item.id}
                  onClick={() => {
                    if (selected === item.id) return
                    if (busy || (session && !finished)) setPendingSelection(item.id)
                    else reset(item.id)
                  }}
                  className={`w-full rounded-2xl border p-5 text-left focus-visible:outline-2 focus-visible:outline-[#087F7A] ${selected === item.id ? "border-[#064B50] bg-[#064B50] text-white" : "border-[#064B50]/15 bg-white hover:border-[#087F7A]"}`}>
                  <span className="text-xs opacity-80">{en ? "PRACTICE" : "LATIHAN"} 0{index + 1}</span>
                  <h2 className="mt-2 font-bold">{item.title}</h2>
                  <p className="mt-2 text-xs leading-relaxed opacity-80">{item.description}</p>
                </button>
              ))}
              {!scenarios.length && <button className={`${button} border bg-white`} onClick={() => setLoading(true)}>{en ? "Reload scenarios" : "Muat ulang latihan"}</button>}
              {catalogError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{catalogError}</p>}
              {pendingSelection && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
                <p>{en ? "Switch scenarios and end the current session?" : "Ganti skenario dan akhiri latihan ini?"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className={`${button} bg-[#064B50] text-white`} onClick={() => reset(pendingSelection)}>{en ? "Switch scenario" : "Ganti latihan"}</button>
                  <button className={button} onClick={() => setPendingSelection(null)}>{en ? "Keep practising" : "Lanjutkan latihan"}</button>
                </div>
              </div>}
            </aside>

            <section className="min-w-0 overflow-hidden rounded-3xl border border-[#064B50]/15 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#064B50]/10 px-5 py-4">
                <span className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-[#064B50]"><MessageCircle size={15} /> {en ? "FICTIONAL AI RECRUITER" : "PEREKRUT AI FIKTIF"}</span>
                {session && !finished && <button onClick={() => { cancel(); setStopped(true); setError("") }} className={`${button} bg-[#F7F7F0] px-3 py-2 text-xs`}><Square size={12} /> {en ? "End practice" : "Akhiri latihan"}</button>}
              </div>

              {!session ? <div className="p-6 sm:p-8">
                <ShieldCheck size={36} className="mb-5 text-[#087F7A]" />
                <h2 className="text-xl font-bold text-[#064B50]">{en ? "Before you start" : "Sebelum mulai"}</h2>
                <p className="mt-3 text-sm leading-relaxed">{scenario?.objective}</p>
                <p className="mt-4 text-sm leading-relaxed text-[#202C2B]/80">
                  {en ? "Gemini processes your replies. Use fictional details and leave out codes, account numbers, and personal data." : "Gemini memproses balasanmu. Gunakan data rekaan dan hapus kode, nomor rekening, serta data pribadi."}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-[#202C2B]/75">
                  {en ? "You can stop at any time. Refreshing ends your session." : "Kamu bisa berhenti kapan saja. Memuat ulang halaman mengakhiri sesi."}
                </p>
                <label className="my-6 flex items-start gap-3 text-sm">
                  <input type="checkbox" checked={consent} disabled={busy} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#064B50]" />
                  {en ? "I understand this is a simulation and will use fictional details." : "Saya memahami ini simulasi dan akan menggunakan data rekaan."}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button disabled={busy || !consent || !scenario} onClick={() => void submit()} className={`${button} bg-[#064B50] text-white hover:bg-[#087F7A]`}>
                    {busy ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}
                    {en ? "Start practice" : "Mulai latihan"}
                  </button>
                  {busy && <button onClick={cancel} className={button}>{en ? "Cancel" : "Batalkan"}</button>}
                </div>
              </div> : <>
                {session.mode === "mock" && <p role="status" className="bg-amber-100 px-5 py-3 text-sm font-bold text-amber-900">{en ? "TEST MODE · Synthetic replies" : "MODE UJI · Balasan sintetis"}</p>}
                <p className="px-5 pt-4 text-xs text-[#202C2B]/75" role="status">
                  {en ? `${session.turn_index} of ${session.max_turns} replies` : `${session.turn_index} dari ${session.max_turns} balasan`}
                  {" · "}{outcomes[lang][finished ? "stopped" : "active"]}
                </p>
                <div role="log" aria-label={en ? "Practice conversation" : "Riwayat percakapan simulasi"} className="max-h-[520px] space-y-4 overflow-y-auto p-5 sm:p-6">
                  {session.messages.map((message) => <div key={message.id} className={`max-w-[92%] rounded-2xl p-4 ${message.role === "user" ? "ml-auto bg-[#064B50] text-white" : "border border-[#064B50]/10 bg-[#F7F7F0]"}`}>
                    <p className="mb-1 text-[11px] font-bold opacity-80">
                      {message.role === "user" ? (en ? "You" : "Kamu") : (en ? "Fictional recruiter" : "Perekrut fiktif")}
                    </p>
                    <p className="whitespace-pre-wrap wrap-anywhere text-sm leading-relaxed">{message.text}</p>
                  </div>)}
                  <div ref={end} />
                </div>
                {!finished && <div className="border-t border-[#064B50]/10 p-5">
                  <div className="mb-4 flex flex-wrap gap-2">{drafts[lang].map(([label, value]) => <button key={label} disabled={busy} onClick={() => { setDraft(value); composer.current?.focus() }} className="rounded-lg border border-[#064B50]/15 px-3 py-2 text-xs font-semibold hover:bg-[#F7F7F0] disabled:opacity-50">{label}</button>)}</div>
                  <button aria-expanded={hint} onClick={() => { if (!hint) setHintsUsed((n) => n + 1); setHint(!hint) }} className="mb-3 flex items-center gap-2 text-xs font-bold text-[#064B50]"><Lightbulb size={15} /> {en ? "Jeli's hint" : "Petunjuk Jeli"}</button>
                  {hint && <p className="mb-4 rounded-xl bg-[#EFF7D5] p-3 text-sm">{session.hint}</p>}
                  <form onSubmit={(event) => void submit(event)}>
                    <label htmlFor={`${id}-reply`} className="mb-2 block text-sm font-bold">{en ? "How would you respond?" : "Bagaimana kamu membalasnya?"}</label>
                    <textarea ref={composer} id={`${id}-reply`} value={draft} maxLength={1000} disabled={busy} onChange={(e) => setDraft(e.target.value)} aria-describedby={`${id}-help`} rows={3} className="w-full rounded-xl border border-[#064B50]/25 p-3 text-sm focus:outline-2 focus:outline-[#087F7A]" placeholder={en ? "Write a reply in your own words…" : "Tulis balasan dengan kalimatmu sendiri…"} />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <p id={`${id}-help`} className="text-xs text-[#202C2B]/75">
                        {draft.length.toLocaleString(locales[lang])}/{(1000).toLocaleString(locales[lang])} · {en ? "Use fictional details" : "Gunakan data rekaan"}
                      </p>
                      <button type="submit" disabled={busy || !draft.trim()} className={`${button} bg-[#064B50] text-white hover:bg-[#087F7A]`}>
                        {busy ? <LoaderCircle className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                        {busy ? (en ? "Waiting…" : "Menunggu…") : (en ? "Send reply" : "Kirim balasan")}
                      </button>
                    </div>
                  </form>
                </div>}
                {finished && <div className="border-t border-[#064B50]/10 bg-[#FAFBF6] p-5 sm:p-6">
                  <h2 ref={reportHeading} tabIndex={-1} className="text-xl font-bold text-[#064B50]">{outcomes[lang][stopped || expired ? "stopped" : session.outcome]}</h2>
                  {expired && <p className="mt-2 text-sm">{en ? "Your 20-minute session expired." : "Masa sesi 20 menit telah berakhir."}</p>}
                  <p className="mt-2 text-xs text-[#202C2B]/75">
                    {en ? `Replies evaluated: ${session.turn_index} · Hints used: ${hintsUsed}` : `Balasan dinilai: ${session.turn_index} · Petunjuk dibuka: ${hintsUsed}`}
                  </p>
                  <dl className="my-5 space-y-3">{session.report.skills.map((skill) => <div key={skill.code} className="flex flex-wrap justify-between gap-2 border-b border-[#064B50]/10 pb-2 text-sm"><dt>{skill.label}</dt><dd className={`font-bold ${skill.status === "practice" ? "text-amber-800" : "text-[#087F7A]"}`}>{statuses[lang][skill.status]}</dd></div>)}</dl>
                  {session.report.moments.map((moment) => <div key={moment.message_id} className="mb-3 rounded-xl border border-[#064B50]/10 bg-white p-4 text-sm"><p className="text-xs text-[#202C2B]/75">{en ? "Recruiter message" : "Pesan perekrut"}: {moment.trigger}</p><blockquote className="my-2 wrap-anywhere border-l-2 border-[#087F7A] pl-3">“{moment.quote}”</blockquote><p>{moment.explanation}</p></div>)}
                  <p className="my-4 text-sm leading-relaxed">{session.report.next_step}</p>
                  <p className="text-xs text-[#202C2B]/75">{en ? "This exercise does not determine whether a real job offer is safe or lawful." : "Latihan ini tidak menentukan apakah lowongan nyata aman atau sah."}</p>
                  <div className="my-5 rounded-xl bg-white p-4">
                    <p className="mb-2 text-xs font-bold uppercase text-[#064B50]">{en ? "Example reply" : "Contoh balasan"}</p>
                    <p className="text-sm leading-relaxed">{session.report.safe_reply}</p>
                    <button onClick={() => void copyReply()} className={`${button} mt-2 px-0 text-xs text-[#064B50]`}>
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? t(lang, "copied") : (en ? "Copy reply" : "Salin balasan")}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => reset()} className={`${button} bg-[#064B50] text-white`}>{en ? "Retry scenario" : "Ulangi skenario"}</button>
                    <button onClick={() => reset(scenarios[(scenarios.findIndex((s) => s.id === selected) + 1) % scenarios.length]?.id)} className={`${button} border border-[#064B50]/20`}>{en ? "Next scenario" : "Latihan berikutnya"}</button>
                    <a href="#checker" className={`${button} text-[#064B50]`}>{t(lang, "checkOffer")} <ArrowRight size={14} /></a>
                  </div>
                </div>}
              </>}
              {error && <div role="alert" className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="flex-1">{error}</p><button aria-label={en ? "Dismiss error" : "Tutup pesan kesalahan"} onClick={() => setError("")}><X size={16} /></button></div>}
              {busy && <div className="flex flex-wrap items-center gap-2 px-5 pb-4 text-xs text-[#064B50]">
                <p role="status">{en ? "Waiting for Jeli…" : "Menunggu Jeli…"}</p>
                {session && <button className="rounded-lg px-2 py-1 font-bold underline" onClick={cancel}>{en ? "Cancel reply" : "Batalkan balasan"}</button>}
              </div>}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}

export default RoleplayChatPage
