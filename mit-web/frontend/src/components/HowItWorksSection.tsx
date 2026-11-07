import React, { useEffect, useRef, useState } from "react"
import {
  AlertOctagon,
  ArrowRight,
  Building,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  Pause,
  Play,
  Scan,
  ShieldCheck,
  Smartphone,
  Globe,
} from "lucide-react"

interface HowItWorksSectionProps {
  onCheckJobOffer: () => void
  lang: "ID" | "EN"
}

type StoryStep = {
  number: string
  tag: string
  title: string
  description: string
  handwrittenNote: string
  checkpoint: string
  visualType: "receive" | "analyze" | "verify" | "decide"
}

function StoryCharacter({ step }: { step: StoryStep["visualType"] }) {
  return (
    <div className={`story-character story-character-${step}`} aria-hidden="true">
      <div className="story-character-shadow" />
      <div className="story-character-body">
        <div className="story-character-face">
          <span className="story-eye story-eye-left" />
          <span className="story-eye story-eye-right" />
          <span className="story-smile" />
        </div>
        <div className="story-character-arm story-arm-left" />
        <div className="story-character-arm story-arm-right" />
        <div className="story-character-leg story-leg-left" />
        <div className="story-character-leg story-leg-right" />
      </div>
      {step === "receive" && <div className="story-prop story-phone"><Smartphone className="h-7 w-7" /></div>}
      {step === "analyze" && <div className="story-prop story-laptop"><Scan className="h-7 w-7" /></div>}
      {step === "verify" && <div className="story-prop story-document"><FileText className="h-7 w-7" /></div>}
      {step === "decide" && <div className="story-prop story-shield"><ShieldCheck className="h-8 w-8" /></div>}
    </div>
  )
}

function ReceiveVisual({ lang, onCheckJobOffer }: { lang: "ID" | "EN"; onCheckJobOffer: () => void }) {
  return (
    <div className="story-stage-content">
      <div className="story-character-wrap"><StoryCharacter step="receive" /></div>
      <div className="story-popup story-popup-receive">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 text-xs font-bold text-emerald-800">WA</span>
          <div>
            <p className="text-xs font-bold text-[#202C2B]">HR Recruitment PT Sumber Makmur</p>
            <p className="text-[10px] text-[#202C2B]/60">{lang === "ID" ? "Pesan belum tersimpan • Baru saja" : "Unstored message • Just now"}</p>
          </div>
        </div>
        <p className="rounded-xl border border-[#064B50]/10 bg-[#F7F7F0] p-3 text-xs leading-relaxed text-[#202C2B]/85">
          &quot;Halo kak Andi! Profil kamu terpilih untuk posisi <strong className="text-[#064B50]">Staff Admin Operasional</strong>. Gaji Rp12.000.000/bulan + WFH. Silakan balas untuk jadwalkan sesi wawancara.&quot;
        </p>
      </div>
      <div className="story-floating-label story-label-receive"><span className="story-pulse-dot" />{lang === "ID" ? "Pesan tawaran masuk" : "Offer message received"}</div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#064B50]/15 bg-[#064B50]/5 p-3 text-[11px] font-medium text-[#064B50]">
        <Smartphone className="h-4 w-4 shrink-0" />
        {lang === "ID" ? "Tawaran tiba tanpa pernah mengirim lamaran sebelumnya." : "The offer arrived although you never applied."}
      </div>
      <button onClick={onCheckJobOffer} className="mt-3 text-xs font-bold text-[#064B50] underline-offset-2 hover:underline">
        {lang === "ID" ? "Kirim ke Jeli untuk diamati" : "Send it to Jeli to inspect"} <ArrowRight className="ml-1 inline h-3 w-3" />
      </button>
    </div>
  )
}

function AnalyzeVisual({ lang }: { lang: "ID" | "EN" }) {
  return (
    <div className="story-stage-content">
      <div className="story-character-wrap"><StoryCharacter step="analyze" /></div>
      <div className="story-popup story-popup-analyze">
        <div className="mb-3 flex items-center justify-between border-b border-[#064B50]/10 pb-3">
          <div className="flex items-center gap-2"><Scan className="h-4 w-4 animate-pulse text-[#064B50]" /><span className="text-xs font-bold text-[#064B50]">Jeli Deep Pattern Scanner</span></div>
          <span className="rounded border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">{lang === "ID" ? "3 Pola Terdeteksi" : "3 Patterns Detected"}</span>
        </div>
        <div className="story-scan-sheet relative space-y-2 overflow-hidden rounded-2xl border border-[#064B50]/12 bg-white p-3.5 text-xs text-[#202C2B]">
          <div className="story-scan-line" />
          <p className="leading-relaxed">...kandidat diwajibkan melakukan <mark className="rounded border border-red-300 bg-red-100 px-1.5 py-0.5 font-bold text-red-800">{lang === "ID" ? "transfer biaya pelatihan Rp250.000" : "transfer a Rp250,000 training fee"}</mark> ke rekening bendahara pribadi...</p>
          <p className="leading-relaxed">...kandidat <mark className="rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 font-bold text-amber-800">{lang === "ID" ? "langsung diterima tanpa tes teknis" : "accepted without a technical test"}</mark> dan mulai bekerja besok pagi...</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="story-chip story-chip-danger">🚨 {lang === "ID" ? "Permintaan Biaya di Awal" : "Upfront Fee Request"}</span>
          <span className="story-chip story-chip-danger">🚨 {lang === "ID" ? "Rekening Non-Korporat" : "Non-Corporate Account"}</span>
          <span className="story-chip story-chip-warning">⚠️ {lang === "ID" ? "Tanpa Seleksi Kualifikasi" : "No Qualification Screening"}</span>
        </div>
      </div>
    </div>
  )
}

function VerifyVisual({ lang }: { lang: "ID" | "EN" }) {
  return (
    <div className="story-stage-content">
      <div className="story-character-wrap"><StoryCharacter step="verify" /></div>
      <div className="story-popup story-popup-verify">
        <div className="mb-3 flex items-center justify-between border-b border-[#064B50]/10 pb-3">
          <div className="flex items-center gap-2"><Building className="h-4 w-4 text-[#064B50]" /><span className="text-xs font-bold text-[#064B50]">{lang === "ID" ? "Audit Keaslian Pengirim" : "Sender Authenticity Audit"}</span></div>
          <span className="rounded bg-[#064B50]/10 px-2 py-0.5 text-[10px] font-bold text-[#064B50]">{lang === "ID" ? "Verifikasi Mandiri" : "Independent Verification"}</span>
        </div>
        <div className="space-y-2">
          <VerifyRow icon={<Mail className="h-4 w-4 text-red-600" />} title={lang === "ID" ? "Domain Email HR" : "HR Email Domain"} detail="recruitment.pt@gmail.com" status={`❌ ${lang === "ID" ? "Domain Publik" : "Public Domain"}`} tone="danger" />
          <VerifyRow icon={<Building className="h-4 w-4 text-amber-600" />} title={lang === "ID" ? "Database Kemenkumham" : "Company Registry Database"} detail={lang === "ID" ? "Pencarian Nomor NIB / PT" : "Business Registration Search"} status={`⚠️ ${lang === "ID" ? "Data Tidak Cocok" : "Data Mismatch"}`} tone="warning" />
          <VerifyRow icon={<FileText className="h-4 w-4 text-red-600" />} title={lang === "ID" ? "Pemeriksaan Rekening" : "Bank Account Check"} detail={lang === "ID" ? "Bank BCA a.n. Pribadi" : "BCA account under a personal name"} status={`🚨 ${lang === "ID" ? "Riwayat Laporan" : "Reported History"}`} tone="danger" />
        </div>
        <div className="story-verified-stamp"><Globe className="h-4 w-4" /> {lang === "ID" ? "Cek kanal resmi, bukan tautan dari pengirim" : "Use official channels, not sender-provided links"}</div>
      </div>
    </div>
  )
}

function VerifyRow({ icon, title, detail, status, tone }: { icon: React.ReactNode; title: string; detail: string; status: string; tone: "danger" | "warning" }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#064B50]/12 bg-white p-2.5">
      <div className="flex min-w-0 items-center gap-2">{icon}<div className="min-w-0"><p className="text-xs font-bold text-[#202C2B]">{title}</p><p className="truncate text-[10px] text-[#202C2B]/60">{detail}</p></div></div>
      <span className={`ml-2 shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold ${tone === "danger" ? "border-red-200 bg-red-100 text-red-800" : "border-amber-200 bg-amber-100 text-amber-800"}`}>{status}</span>
    </div>
  )
}

function DecideVisual({ lang, onCheckJobOffer }: { lang: "ID" | "EN"; onCheckJobOffer: () => void }) {
  return (
    <div className="story-stage-content">
      <div className="story-character-wrap"><StoryCharacter step="decide" /></div>
      <div className="story-popup story-popup-decide">
        <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-300 bg-red-100 text-red-600"><AlertOctagon className="h-6 w-6" /></div>
          <span className="text-[11px] font-black uppercase tracking-wider text-red-700">{lang === "ID" ? "KESIMPULAN KEWASPADAAN" : "AWARENESS CONCLUSION"}</span>
          <h4 className="mt-0.5 text-xl font-black text-red-900">{lang === "ID" ? "Tingkat Risiko Tinggi" : "High Risk Level"}</h4>
          <p className="mt-1 text-[11px] text-red-800">{lang === "ID" ? "Pesan ini mengindikasikan kuat modus biaya administrasi berkedok rekrutmen." : "This message strongly indicates an administrative-fee scam disguised as recruitment."}</p>
        </div>
        <div className="space-y-2">
          <div className="story-decision-option story-decision-stop"><ShieldCheck className="h-4 w-4" />{lang === "ID" ? "Hentikan komunikasi & amankan data" : "Stop contact & secure your data"}</div>
          <div className="story-decision-option"><CheckCircle className="h-4 w-4" />{lang === "ID" ? "Verifikasi melalui kanal resmi" : "Verify through official channels"}</div>
          <div className="story-decision-option story-decision-muted">↗ {lang === "ID" ? "Lanjutkan tanpa pemeriksaan" : "Continue without checking"}</div>
        </div>
        <button onClick={onCheckJobOffer} className="mt-3 w-full rounded-xl bg-[#064B50] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#087F7A]"><ShieldCheck className="mr-2 inline h-4 w-4 text-[#B8F000]" />{lang === "ID" ? "Hentikan Komunikasi & Amankan Data" : "Stop Contact & Secure Your Data"}</button>
        <button onClick={onCheckJobOffer} className="mt-2 w-full rounded-xl border border-[#064B50]/20 bg-white py-2 text-xs font-bold text-[#202C2B] hover:bg-[#EBECE1]">{lang === "ID" ? "Salin Template Penolakan Tegas & Sopan" : "Copy Firm & Polite Rejection Template"}</button>
      </div>
    </div>
  )
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onCheckJobOffer, lang }) => {
  const [activeStep, setActiveStep] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const chapterRefs = useRef<Array<HTMLElement | null>>([])

  const steps: StoryStep[] = [
    {
      number: "01", tag: "RECEIVE",
      title: lang === "ID" ? "Kamu Menerima Pesan atau Tawaran" : "You receive an unexpected job offer.",
      description: lang === "ID" ? "Sebuah pesan masuk melalui WhatsApp, Telegram, atau email menawarkan posisi menarik dengan gaji tinggi dan syarat instan. Naluri cermatmu merasakan ada sesuatu yang janggal." : "A direct message or vacancy arrives with unusually high compensation and minimal screening requirements.",
      handwrittenNote: lang === "ID" ? "Sering datang saat kita lagi butuh banget 🥺" : "Often arrives when you need an opportunity most!",
      checkpoint: lang === "ID" ? "Fokus Amati: Pengirim tidak dikenal & tawaran tanpa proses lamaran" : "Inbound Check: Unsolicited reachout & zero prior application",
      visualType: "receive",
    },
    {
      number: "02", tag: "ANALYZE",
      title: lang === "ID" ? "Jeli Memindai Pola & Kejanggalan" : "Jeli scans for subtle deceptive patterns.",
      description: lang === "ID" ? "Sistem Jeli menganalisis teks secara mendalam: mendeteksi permintaan biaya tersembunyi, janji komisi tidak rasional, format kalimat mendesak, dan nomor kontak berisiko tinggi." : "Jeli inspects text and conversation details for hidden fee demands, linguistic pressure, and high-risk patterns.",
      handwrittenNote: lang === "ID" ? "Cuma butuh 15 detik, langsung kebaca polanya! ⚡" : "Takes just 15 seconds to spot the red flags!",
      checkpoint: lang === "ID" ? "Analisis Bahasa & Deteksi Permintaan Biaya Tersembunyi" : "Linguistic Inspection & Advance Fee Demand Detection",
      visualType: "analyze",
    },
    {
      number: "03", tag: "VERIFY",
      title: lang === "ID" ? "Verifikasi Entitas Perusahaan & Pengirim" : "Verify organization and sender authenticity.",
      description: lang === "ID" ? "Mencocokkan nama perusahaan dengan registrasi resmi, memeriksa domain email (@gmail vs domain resmi korporat), meninjau kredensial perekrut, dan mengecek nomor rekening terkait." : "We cross-reference organization records, inspect email domain authenticity, and review verified company channels.",
      handwrittenNote: lang === "ID" ? "Perekrut korporat resmi gak pakai email gratisan 🚫" : "Real corporate recruiters never use free webmail!",
      checkpoint: lang === "ID" ? "Standar Pemeriksaan Jeli: Validasi Domain & Database Pengawasan" : "Jeli Verification Standard: Corporate Domain & Registry Audit",
      visualType: "verify",
    },
    {
      number: "04", tag: "DECIDE",
      title: lang === "ID" ? "Pahami Risiko & Ambil Keputusan dengan Yakin" : "Understand risks and decide with confidence.",
      description: lang === "ID" ? "Dapatkan ringkasan kejelasan yang mudah dipahami: indikator risiko, alasan kejanggalan, serta panduan balasan aman agar kamu tidak dirugikan secara finansial maupun data." : "Receive clear, objective risk insights and practical reply guidance to safeguard your money and personal data.",
      handwrittenNote: lang === "ID" ? "Langkah aman, keputusan tenang 🛡️" : "Calm awareness, confident next move!",
      checkpoint: lang === "ID" ? "Rekomendasi Tindakan: Tolak Aman / Verifikasi Langsung / Laporkan" : "Action Guidance: Safe Decline / Direct Verification / Report",
      visualType: "decide",
    },
  ]

  useEffect(() => {
      let frameId = 0

      const updateActiveStep = () => {
        frameId = 0
        const viewportCenter = window.innerHeight / 2
        let closestIndex = 0
        let closestDistance = Number.POSITIVE_INFINITY

        chapterRefs.current.forEach((chapter, index) => {
          if (!chapter) return

          const bounds = chapter.getBoundingClientRect()
          const chapterCenter = Math.min(Math.max(viewportCenter, bounds.top), bounds.bottom)
          const distance = Math.abs(viewportCenter - chapterCenter)
          if (distance < closestDistance) {
            closestDistance = distance
            closestIndex = index
          }
        })

        setActiveStep((current) => current === closestIndex ? current : closestIndex)
      }

      const handleScroll = () => {
        if (frameId === 0) frameId = window.requestAnimationFrame(updateActiveStep)
      }

      updateActiveStep()
      window.addEventListener("scroll", handleScroll, { passive: true })
      window.addEventListener("resize", handleScroll)

      return () => {
        window.removeEventListener("scroll", handleScroll)
        window.removeEventListener("resize", handleScroll)
        if (frameId !== 0) window.cancelAnimationFrame(frameId)
      }
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = window.setInterval(() => setActiveStep((current) => (current + 1) % steps.length), 6000)
    return () => window.clearInterval(timer)
  }, [isAutoPlaying, steps.length])

  const selectStep = (index: number) => {
    setIsAutoPlaying(false)
    setActiveStep(index)
    chapterRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const current = steps[activeStep]
  const renderVisual = (step: StoryStep["visualType"]) => {
    if (step === "receive") return <ReceiveVisual lang={lang} onCheckJobOffer={onCheckJobOffer} />
    if (step === "analyze") return <AnalyzeVisual lang={lang} />
    if (step === "verify") return <VerifyVisual lang={lang} />
    return <DecideVisual lang={lang} onCheckJobOffer={onCheckJobOffer} />
  }

  return (
    <section id="how-it-works" className="relative overflow-x-clip border-t border-[#064B50]/10 bg-[#EBECE1]/50 py-24 text-[#202C2B]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#064B50]/15 bg-white px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#064B50] shadow-2xs">{lang === "ID" ? "ALUR PENGAMATAN CERMAT" : "OBSERVATION WORKFLOW"}</div>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-[#064B50] sm:text-4xl lg:text-5xl">{lang === "ID" ? "Bagaimana Jeli Mendampingimu" : "How Jeli Works"}</h2>
          <p className="text-base text-[#202C2B]/80 sm:text-lg">{lang === "ID" ? "Perjalanan 4 langkah untuk mengenali informasi mencurigakan dan mengambil keputusan aman dengan percaya diri." : "A 4-step journey from spotting anomalies to making safe, informed choices with confidence."}</p>
        </div>

        <div className="mb-8 lg:hidden">
          <div className={`story-scene-shell story-shell-${current.visualType} mx-auto w-full max-w-[520px]`}>
            <div className="story-scene-backdrop" />
            <div className="absolute right-4 top-4 z-20 rounded-full border border-[#064B50]/15 bg-white/90 px-3 py-1.5 text-[10px] font-black tracking-wider text-[#064B50]">{current.number} / 04 • {current.tag}</div>
            <div key={`mobile-${current.visualType}`} className={`story-scene-animated story-scene-${current.visualType}`}>{renderVisual(current.visualType)}</div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#064B50]/10 bg-white p-2.5 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <button onClick={() => selectStep(activeStep === 0 ? steps.length - 1 : activeStep - 1)} className="rounded-xl border border-[#064B50]/10 bg-[#F7F7F0] p-2 text-[#064B50]" aria-label={lang === "ID" ? "Tahap sebelumnya" : "Previous step"}><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => selectStep((activeStep + 1) % steps.length)} className="rounded-xl border border-[#064B50]/10 bg-[#F7F7F0] p-2 text-[#064B50]" aria-label={lang === "ID" ? "Tahap berikutnya" : "Next step"}><ChevronRight className="h-4 w-4" /></button>
              <button onClick={() => setIsAutoPlaying((value) => !value)} className="flex items-center gap-1.5 rounded-xl border border-[#064B50]/10 bg-[#F7F7F0] px-2.5 py-2 text-xs font-semibold text-[#064B50]">{isAutoPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}{isAutoPlaying ? "Pause" : "Auto"}</button>
            </div>
            <span className="text-[10px] font-bold text-[#064B50]/70">{lang === "ID" ? "Scroll untuk lanjut ↓" : "Scroll to continue ↓"}</span>
          </div>
        </div>

        <div className="relative lg:grid lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            {steps.map((step, index) => (
              <article
                key={step.number}
                ref={(element) => { chapterRefs.current[index] = element }}
                data-story-index={index}
                className={`story-chapter flex min-h-[72vh] items-center py-10 transition-opacity duration-500 ${index !== activeStep ? "opacity-55 lg:opacity-45" : "opacity-100"}`}
              >
                <div className="max-w-xl">
                  <button onClick={() => selectStep(index)} className={`mb-4 flex items-center gap-3 text-left ${index === activeStep ? "text-[#064B50]" : "text-[#202C2B]/60"}`}>
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold shadow-sm transition-all ${index === activeStep ? "bg-[#064B50] text-[#B8F000] ring-4 ring-[#064B50]/15" : index < activeStep ? "bg-[#087F7A] text-white" : "border border-[#064B50]/20 bg-white"}`}>{step.number}</span>
                    <span className="text-xs font-black tracking-[0.2em]">{step.tag}</span>
                  </button>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#087F7A]">{lang === "ID" ? `Bab ${step.number} dari perjalananmu` : `Chapter ${step.number} of your journey`}</p>
                  <h3 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-[#064B50] sm:text-4xl">{step.title}</h3>
                  <p className="mb-6 max-w-lg text-base leading-relaxed text-[#202C2B]/80">{step.description}</p>
                  <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#064B50]/15 bg-white p-4 shadow-2xs">
                    <div className="mt-0.5 shrink-0 rounded-xl bg-[#064B50]/10 p-2 text-[#064B50]"><CheckCircle className="h-4 w-4" /></div>
                    <div><p className="text-[11px] font-bold uppercase tracking-wider text-[#064B50]">{lang === "ID" ? "Pedoman Cermat Jeli:" : "Jeli's Safety Guideline:"}</p><p className="mt-0.5 text-xs font-semibold text-[#202C2B]">{step.checkpoint}</p></div>
                  </div>
                  <div className="inline-block rounded-xl border border-[#064B50]/10 bg-[#B8F000] px-3 py-1 font-handwriting text-base font-bold text-[#064B50] shadow-sm">{step.handwrittenNote}</div>
                  {index === 3 && <button onClick={onCheckJobOffer} className="ml-3 rounded-xl bg-[#064B50] px-4 py-2 text-xs font-bold text-white hover:bg-[#087F7A]">{lang === "ID" ? "Coba Periksa Sekarang" : "Check It Now"} <ArrowRight className="ml-1 inline h-3 w-3" /></button>}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden lg:col-span-6 lg:block">
            <div className="sticky top-28 self-start">
              <div className={`story-scene-shell story-shell-${current.visualType} w-full`}>
                <div className="story-scene-backdrop" />
                <div className="absolute right-6 top-5 z-20 rounded-full border border-[#064B50]/15 bg-white/90 px-3 py-1.5 text-[10px] font-black tracking-wider text-[#064B50] shadow-sm">{current.number} / 04 • {current.tag}</div>
                <div key={current.visualType} className={`story-scene-animated story-scene-${current.visualType}`}>{renderVisual(current.visualType)}</div>
                <div className="story-scene-controls z-20 flex items-center justify-between border-t border-[#064B50]/10 bg-white/85 p-2.5 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => selectStep(activeStep === 0 ? steps.length - 1 : activeStep - 1)} className="rounded-xl border border-[#064B50]/10 bg-[#F7F7F0] p-2 text-[#064B50]"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => selectStep((activeStep + 1) % steps.length)} className="rounded-xl border border-[#064B50]/10 bg-[#F7F7F0] p-2 text-[#064B50]"><ChevronRight className="h-4 w-4" /></button>
                    <button onClick={() => setIsAutoPlaying((value) => !value)} className="flex items-center gap-1.5 rounded-xl border border-[#064B50]/10 bg-[#F7F7F0] px-2.5 py-2 text-xs font-semibold text-[#064B50]">{isAutoPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}{isAutoPlaying ? "Pause" : "Auto"}</button>
                  </div>
                  <span className="text-[11px] font-bold text-[#064B50]/70">{lang === "ID" ? "Scroll untuk melanjutkan cerita ↓" : "Scroll to continue the story ↓"}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
