import { useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowLeft, ArrowRight, Check, Copy, Lightbulb, LoaderCircle, MessageCircle, ShieldCheck, Square, X } from "lucide-react"
import { getScenarios, roleplayRequest, type Outcome, type RoleplaySession, type Scenario } from "../services/roleplay"

interface Props {
  onBackToHome: () => void
  lang: "ID" | "EN"
}
const outcomes: Record<Outcome, string> = {
  active: "Latihan berlangsung", verified_exit: "Berhenti dan memverifikasi",
  risky_choice: "Memilih tindakan berisiko dalam simulasi",
  needs_clarification: "Masih perlu klarifikasi", stopped: "Latihan dihentikan",
}
const statuses = { observed: "Terlihat", practice: "Perlu dilatih", unobserved: "Belum teramati" }
const drafts = [
  ["Tanya detail", "Bisa jelaskan tahapan seleksi dan alasan syarat tersebut?"],
  ["Minta verifikasi", "Saya akan mencari kanal resmi perusahaan secara mandiri sebelum melanjutkan."],
  ["Tolak permintaan", "Saya tidak menyetujui deposit atau berbagi kredensial untuk proses ini."],
]
const sensitive = /https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\d[\s-]*){9,}|(?:otp|pin|password|kata sandi)\s*(?:saya|adalah|:|=)?\s*\d{4,8}\b/i
const button = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#087F7A] disabled:cursor-not-allowed disabled:opacity-50"

export function ScamSimulatorPage({ onBackToHome, lang }: Props) {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selected, setSelected] = useState("")
  const [session, setSession] = useState<RoleplaySession | null>(null)
  const [draft, setDraft] = useState("")
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [hint, setHint] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [stopped, setStopped] = useState(false)
  const [expired, setExpired] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const request = useRef<AbortController | null>(null)
  const locked = useRef(false)
  const end = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  const reportHeading = useRef<HTMLHeadingElement>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finished = stopped || expired || (session !== null && session.outcome !== "active")
  const scenario = scenarios.find((s) => s.id === selected)

  useEffect(() => {
    const controller = new AbortController()
    getScenarios(controller.signal).then((items) => {
      if (controller.signal.aborted) return
      setScenarios(items)
      setSelected((current) => current || items[0]?.id || "")
      setError("")
    }).catch((e: unknown) => {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Gagal memuat latihan.")
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [reload])

  useEffect(() => () => {
    request.current?.abort()
    if (copyTimer.current) clearTimeout(copyTimer.current)
  }, [])

  useEffect(() => {
    if (!session || finished) return
    const remaining = Math.max(0, session.expires_at * 1000 - Date.now())
    const timer = setTimeout(() => {
      request.current?.abort()
      locked.current = false
      setBusy(false)
      setExpired(true)
    }, remaining)
    return () => clearTimeout(timer)
  }, [session, finished])

  useEffect(() => {
    if (finished) {
      reportHeading.current?.focus({ preventScroll: true })
      reportHeading.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    else end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [session, finished])

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
    if (locked.current || finished || (!session && !consent)) return
    if (session && (!draft.trim() || draft.trim().length > 1000)) return
    if (session && sensitive.test(draft)) {
      setError("Gunakan data rekaan. Hapus kontak, nomor panjang, atau kode kredensial sebelum mengirim.")
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
      } : { scenario_id: selected }, controller.signal)
      if (controller.signal.aborted) return
      setSession(result)
      setDraft("")
      setHint(false)
      if (result.outcome === "active") setTimeout(() => composer.current?.focus(), 0)
    } catch (e: unknown) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Permintaan gagal.")
      else if (controller.signal.reason === "timeout") setError("AI belum merespons. Coba lagi atau akhiri latihan.")
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
      setError("Penyalinan ditolak browser. Pilih dan salin contoh balasan di bawah secara manual.")
    }
  }

  return (
    <main className="min-h-screen bg-warm-grid px-4 pb-20 pt-28 text-[#202C2B]">
      <div className="mx-auto max-w-5xl">
        <button onClick={onBackToHome} className={`${button} mb-6 px-0 text-[#064B50]`}>
          <ArrowLeft size={17} /> {lang === "ID" ? "Kembali ke Beranda" : "Back to Homepage"}
        </button>
        <header className="mb-8 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#087F7A]">Jeli Lakon · Scam Simulator</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#064B50] sm:text-4xl">Latih responsmu, sebelum situasinya nyata.</h1>
          <p className="mt-4 text-sm leading-relaxed text-[#202C2B]/75">Balas perekrut fiktif dengan kalimatmu sendiri. Kenali tekanan, tentukan batas, lalu pahami keputusanmu bersama Jeli.</p>
          <p className="mt-3 text-xs font-semibold text-[#087F7A]">Bahasa latihan: Indonesia · 4–8 balasan · Tanpa transaksi nyata</p>
          {lang === "EN" && <p className="mt-2 text-xs">This training is currently available in Indonesian.</p>}
        </header>

        {loading ? <p role="status" className="flex gap-2 py-8"><LoaderCircle className="animate-spin" /> Memuat latihan…</p> : (
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside aria-label="Pilih skenario" className="space-y-3">
              {scenarios.map((item, index) => (
                <button key={item.id} aria-pressed={selected === item.id}
                  onClick={() => {
                    if (selected === item.id) return
                    if (busy || (session && !finished)) setPendingSelection(item.id)
                    else reset(item.id)
                  }}
                  className={`w-full rounded-2xl border p-5 text-left focus-visible:outline-2 focus-visible:outline-[#087F7A] ${selected === item.id ? "border-[#064B50] bg-[#064B50] text-white" : "border-[#064B50]/15 bg-white hover:border-[#087F7A]"}`}>
                  <span className="text-xs opacity-65">LATIHAN 0{index + 1}</span>
                  <h2 className="mt-2 font-bold">{item.title}</h2>
                  <p className="mt-2 text-xs leading-relaxed opacity-80">{item.description}</p>
                </button>
              ))}
              {!scenarios.length && <button className={`${button} border bg-white`} onClick={() => { setLoading(true); setReload((v) => v + 1) }}>Muat ulang latihan</button>}
              {pendingSelection && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
                <p>Ganti skenario dan akhiri latihan yang sedang berlangsung?</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className={`${button} bg-[#064B50] text-white`} onClick={() => reset(pendingSelection)}>Ganti latihan</button>
                  <button className={button} onClick={() => setPendingSelection(null)}>Lanjut sesi ini</button>
                </div>
              </div>}
            </aside>

            <section className="min-w-0 overflow-hidden rounded-3xl border border-[#064B50]/15 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#064B50]/10 px-5 py-4">
                <span className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-[#064B50]"><MessageCircle size={15} /> SIMULASI · PEREKRUT AI FIKTIF</span>
                {session && !finished && <button onClick={() => { cancel(); setStopped(true); setError("") }} className={`${button} bg-[#F7F7F0] px-3 py-2 text-xs`}><Square size={12} /> Akhiri latihan</button>}
              </div>

              {!session ? <div className="p-6 sm:p-8">
                <ShieldCheck size={36} className="mb-5 text-[#087F7A]" />
                <h2 className="text-xl font-bold text-[#064B50]">Ruang aman untuk berlatih</h2>
                <p className="mt-3 text-sm leading-relaxed">{scenario?.objective}</p>
                <p className="mt-4 text-sm leading-relaxed text-[#202C2B]/75">Kamu akan berbicara dengan perekrut fiktif yang diperankan AI. Gunakan jawaban dan identitas rekaan. Jangan kirim OTP, rekening, nomor identitas, atau data pribadi. Percakapan diproses melalui Gemini.</p>
                <p className="mt-3 text-xs leading-relaxed text-[#202C2B]/65">Kamu bisa berhenti kapan saja. Riwayat hanya ada selama halaman ini terbuka; refresh mengakhiri sesi. Perlakuan data di penyedia AI mengikuti layanan akun pengelola.</p>
                <label className="my-6 flex items-start gap-3 text-sm"><input type="checkbox" checked={consent} disabled={busy} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#064B50]" /> Saya memahami ini simulasi dan akan menggunakan data rekaan.</label>
                <button disabled={busy || !consent || !scenario} onClick={() => void submit()} className={`${button} bg-[#064B50] text-white hover:bg-[#087F7A]`}>{busy ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />} Mulai latihan</button>
                {busy && <button onClick={cancel} className={`${button} ml-2`}>Batalkan</button>}
              </div> : <>
                {session.mode === "mock" && <p role="status" className="bg-amber-100 px-5 py-3 text-sm font-bold text-amber-900">MODE UJI MOCK — respons sintetis, bukan inferensi Gemini live.</p>}
                <p className="px-5 pt-4 text-xs text-[#202C2B]/65" role="status">{session.turn_index} dari {session.max_turns} balasan · {finished ? "Sesi berakhir" : "Perekrut fiktif, keputusan di tanganmu"}</p>
                <div role="log" aria-label="Riwayat percakapan simulasi" aria-live="polite" className="max-h-[520px] space-y-4 overflow-y-auto p-5 sm:p-6">
                  {session.messages.map((message) => <div key={message.id} className={`max-w-[92%] rounded-2xl p-4 ${message.role === "user" ? "ml-auto bg-[#064B50] text-white" : "border border-[#064B50]/10 bg-[#F7F7F0]"}`}>
                    <p className="mb-1 text-[11px] font-bold opacity-65">{message.role === "user" ? "Kamu" : "Perekrut AI · Fiktif"}</p>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>
                  </div>)}
                  <div ref={end} />
                </div>
                {!finished && <div className="border-t border-[#064B50]/10 p-5">
                  <div className="mb-4 flex flex-wrap gap-2">{drafts.map(([label, value]) => <button key={label} disabled={busy} onClick={() => { setDraft(value); composer.current?.focus() }} className="rounded-lg border border-[#064B50]/15 px-3 py-2 text-xs font-semibold hover:bg-[#F7F7F0] disabled:opacity-50">{label}</button>)}</div>
                  <button onClick={() => { if (!hint) setHintsUsed((n) => n + 1); setHint(!hint) }} className="mb-3 flex items-center gap-2 text-xs font-bold text-[#087F7A]"><Lightbulb size={15} /> Petunjuk Jeli</button>
                  {hint && <p className="mb-4 rounded-xl bg-[#EFF7D5] p-3 text-sm">{session.hint}</p>}
                  <form onSubmit={(event) => void submit(event)}>
                    <label htmlFor="roleplay-reply" className="mb-2 block text-sm font-bold">Bagaimana kamu membalasnya?</label>
                    <textarea ref={composer} id="roleplay-reply" value={draft} maxLength={1000} disabled={busy} onChange={(e) => setDraft(e.target.value)} aria-describedby="reply-help" rows={3} className="w-full rounded-xl border border-[#064B50]/25 p-3 text-sm focus:outline-2 focus:outline-[#087F7A]" placeholder="Tulis responsmu dengan kalimat sendiri…" />
                    <div className="mt-2 flex items-center justify-between gap-3"><p id="reply-help" className="text-xs text-[#202C2B]/60">{draft.length}/1.000 · Gunakan data rekaan</p><button type="submit" disabled={busy || !draft.trim()} className={`${button} bg-[#064B50] text-white hover:bg-[#087F7A]`}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <ArrowRight size={16} />} {busy ? "Menunggu AI…" : "Kirim balasan"}</button></div>
                  </form>
                </div>}
                {finished && <div className="border-t border-[#064B50]/10 bg-[#FAFBF6] p-5 sm:p-6">
                  <h2 ref={reportHeading} tabIndex={-1} className="scroll-mt-36 text-xl font-bold text-[#064B50]">{outcomes[stopped || expired ? "stopped" : session.outcome]}</h2>
                  {expired && <p className="mt-2 text-sm">Masa sesi 20 menit telah berakhir.</p>}
                  <p className="mt-2 text-xs text-[#202C2B]/65">Pembahasan berdasarkan {session.turn_index} balasan yang berhasil dievaluasi. Petunjuk dibuka {hintsUsed} kali.</p>
                  {(stopped || expired) && <p className="mt-2 text-xs">Balasan yang belum berhasil diproses tidak dinilai.</p>}
                  <dl className="my-5 space-y-3">{session.report.skills.map((skill) => <div key={skill.code} className="flex flex-wrap justify-between gap-2 border-b border-[#064B50]/10 pb-2 text-sm"><dt>{skill.label}</dt><dd className={`font-bold ${skill.status === "practice" ? "text-amber-800" : "text-[#087F7A]"}`}>{statuses[skill.status]}</dd></div>)}</dl>
                  {session.report.moments.map((moment) => <div key={moment.message_id} className="mb-3 rounded-xl border border-[#064B50]/10 bg-white p-4 text-sm"><p className="text-xs text-[#202C2B]/60">Pemicu: {moment.trigger}</p><blockquote className="my-2 border-l-2 border-[#087F7A] pl-3">“{moment.quote}”</blockquote><p>{moment.explanation}</p></div>)}
                  <p className="my-4 text-sm leading-relaxed">{session.report.next_step}</p>
                  <p className="text-xs text-[#202C2B]/60">Latihan ini tidak membuktikan bahwa suatu lowongan nyata aman atau melanggar hukum.</p>
                  <div className="my-5 rounded-xl bg-white p-4"><p className="mb-2 text-xs font-bold uppercase text-[#087F7A]">Contoh balasan alternatif</p><p className="text-sm leading-relaxed">{session.report.safe_reply}</p><button onClick={() => void copyReply()} className={`${button} mt-2 px-0 text-xs text-[#064B50]`}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Tersalin" : "Salin balasan"}</button></div>
                  <div className="flex flex-wrap gap-2"><button onClick={() => reset()} className={`${button} bg-[#064B50] text-white`}>Ulangi skenario</button><button onClick={() => reset(scenarios[(scenarios.findIndex((s) => s.id === selected) + 1) % scenarios.length]?.id)} className={`${button} border border-[#064B50]/20`}>Latihan berikutnya</button><a href="#checker" className={`${button} text-[#064B50]`}>Cek tawaran kerja <ArrowRight size={14} /></a></div>
                </div>}
              </>}
              {error && <div role="alert" className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p className="flex-1">{error}</p><button aria-label="Tutup pesan kesalahan" onClick={() => setError("")}><X size={16} /></button></div>}
              {busy && <p role="status" className="px-5 pb-4 text-xs text-[#087F7A]">Menunggu respons AI. Kamu tetap bisa membatalkan atau mengakhiri latihan.</p>}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}

export default ScamSimulatorPage
