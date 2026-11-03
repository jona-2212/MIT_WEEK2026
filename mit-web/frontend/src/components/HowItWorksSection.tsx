import React, { useState, useEffect } from "react"
import {
  Smartphone,
  Scan,
  CheckCircle,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Building,
  Mail,
  FileText,
} from "lucide-react"

interface HowItWorksSectionProps {
  onCheckJobOffer: () => void
  lang: "ID" | "EN"
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  onCheckJobOffer,
  lang,
}) => {
  const [activeStep, setActiveStep] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const steps = [
    {
      number: "01",
      tag: "RECEIVE",
      title:
        lang === "ID"
          ? "Kamu Menerima Pesan atau Tawaran"
          : "You receive an unexpected job offer.",
      description:
        lang === "ID"
          ? "Sebuah pesan masuk melalui WhatsApp, Telegram, atau email menawarkan posisi menarik dengan gaji tinggi dan syarat instan. Naluri cermatmu merasakan ada sesuatu yang janggal."
          : "A direct message or vacancy arrives with unusually high compensation and minimal screening requirements.",
      handwrittenNote:
        lang === "ID"
          ? "Sering datang saat kita lagi butuh banget 🥺"
          : "Often arrives when you need an opportunity most!",
      checkpoint:
        lang === "ID"
          ? "Fokus Amati: Pengirim tidak dikenal & tawaran tanpa proses lamaran"
          : "Inbound Check: Unsolicited reachout & zero prior application",
      visualType: "receive",
    },
    {
      number: "02",
      tag: "ANALYZE",
      title:
        lang === "ID"
          ? "Jeli Memindai Pola & Kejanggalan"
          : "Jeli scans for subtle deceptive patterns.",
      description:
        lang === "ID"
          ? "Sistem Jeli menganalisis teks secara mendalam: mendeteksi permintaan biaya tersembunyi, janji komisi tidak rasional, format kalimat mendesak, dan nomor kontak berisiko tinggi."
          : "Jeli inspects text and conversation details for hidden fee demands, linguistic pressure, and high-risk patterns.",
      handwrittenNote:
        lang === "ID"
          ? "Cuma butuh 15 detik, langsung kebaca polanya! ⚡"
          : "Takes just 15 seconds to spot the red flags!",
      checkpoint:
        lang === "ID"
          ? "Analisis Bahasa & Deteksi Permintaan Biaya Tersembunyi"
          : "Linguistic Inspection & Advance Fee Demand Detection",
      visualType: "analyze",
    },
    {
      number: "03",
      tag: "VERIFY",
      title:
        lang === "ID"
          ? "Verifikasi Entitas Perusahaan & Pengirim"
          : "Verify organization and sender authenticity.",
      description:
        lang === "ID"
          ? "Mencocokkan nama perusahaan dengan registrasi resmi, memeriksa domain email (@gmail vs domain resmi korporat), meninjau kredensial perekrut, dan mengecek nomor rekening terkait."
          : "We cross-reference organization records, inspect email domain authenticity, and review verified company channels.",
      handwrittenNote:
        lang === "ID"
          ? "Perekrut korporat resmi gak pakai email gratisan 🚫"
          : "Real corporate recruiters never use free webmail!",
      checkpoint:
        lang === "ID"
          ? "Standar Pemeriksaan Jeli: Validasi Domain & Database Pengawasan"
          : "Jeli Verification Standard: Corporate Domain & Registry Audit",
      visualType: "verify",
    },
    {
      number: "04",
      tag: "DECIDE",
      title:
        lang === "ID"
          ? "Pahami Risiko & Ambil Keputusan dengan Yakin"
          : "Understand risks and decide with confidence.",
      description:
        lang === "ID"
          ? "Dapatkan ringkasan kejelasan yang mudah dipahami: indikator risiko, alasan kejanggalan, serta panduan balasan aman agar kamu tidak dirugikan secara finansial maupun data."
          : "Receive clear, objective risk insights and practical reply guidance to safeguard your money and personal data.",
      handwrittenNote:
        lang === "ID"
          ? "Langkah aman, keputusan tenang 🛡️"
          : "Calm awareness, confident next move!",
      checkpoint:
        lang === "ID"
          ? "Rekomendasi Tindakan: Tolak Aman / Verifikasi Langsung / Laporkan"
          : "Action Guidance: Safe Decline / Direct Verification / Report",
      visualType: "decide",
    },
  ]

  // Autoplay step progression
  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isAutoPlaying, steps.length])

  const current = steps[activeStep]

  return (
    <section
      id="how-it-works"
      className="relative py-24 bg-[#EBECE1]/50 text-[#202C2B] overflow-hidden border-t border-[#064B50]/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#064B50]/15 mb-4 shadow-2xs">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#064B50]">
              {lang === "ID"
                ? "ALUR PENGAMATAN CERMAT"
                : "OBSERVATION WORKFLOW"}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#064B50] mb-4">
            {lang === "ID" ? "Bagaimana Jeli Mendampingimu" : "How Jeli Works"}
          </h2>
          <p className="text-base sm:text-lg text-[#202C2B]/80">
            {lang === "ID"
              ? "Perjalanan 4 langkah untuk mengenali informasi mencurigakan dan mengambil keputusan aman dengan percaya diri."
              : "A 4-step journey from spotting anomalies to making safe, informed choices with confidence."}
          </p>
        </div>

        {/* Horizontal Numbered Progress Journey Indicator */}
        <div className="mb-14 max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting Track Line */}
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-[#064B50]/15 rounded-full z-0 hidden sm:block">
              <div
                className="h-full bg-[#064B50] rounded-full transition-all duration-500"
                style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Step Nodes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
              {steps.map((st, idx) => {
                const isActive = activeStep === idx
                const isPast = activeStep > idx

                return (
                  <button
                    key={st.number}
                    onClick={() => {
                      setActiveStep(idx)
                      setIsAutoPlaying(false)
                    }}
                    className={`flex flex-col sm:items-center text-left sm:text-center p-3 sm:p-2 rounded-2xl transition-all duration-300 group ${
                      isActive
                        ? "bg-white sm:bg-transparent border border-[#064B50]/20 sm:border-transparent scale-102"
                        : "opacity-75 hover:opacity-100"
                    }`}
                  >
                    {/* Circle Node Badge */}
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-extrabold text-sm mb-2.5 transition-all duration-300 shadow-sm ${
                        isActive
                          ? "bg-[#064B50] text-[#B8F000] ring-4 ring-[#064B50]/15 shadow-md scale-110"
                          : isPast
                            ? "bg-[#087F7A] text-white"
                            : "bg-white text-[#202C2B]/70 border border-[#064B50]/20 group-hover:border-[#064B50]/40"
                      }`}
                    >
                      {st.number}
                    </div>

                    {/* Step Stage Label */}
                    <span
                      className={`text-xs font-extrabold tracking-wider uppercase ${
                        isActive ? "text-[#064B50]" : "text-[#202C2B]/70"
                      }`}
                    >
                      {st.tag}
                    </span>
                    <span className="text-[11px] text-[#202C2B]/70 font-medium hidden sm:block mt-0.5 line-clamp-1">
                      {idx === 0
                        ? "Pesan Masuk"
                        : idx === 1
                          ? "Pindai Pola"
                          : idx === 2
                            ? "Audit Keabsahan"
                            : "Keputusan Yakin"}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Interactive Stage Showcase Card */}
        <div className="bg-white border border-[#064B50]/15 rounded-3xl p-6 sm:p-10 shadow-lg max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Narrative Explanations */}
            <div className="lg:col-span-6 flex flex-col items-start">
              {/* Stage Counter Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-[#064B50]/10 text-[#064B50] border border-[#064B50]/20 text-xs font-black font-mono">
                  TAHAP {current.number} / 04
                </span>
                <span className="text-xs font-bold text-[#087F7A] tracking-wider uppercase">
                  {current.tag}
                </span>
              </div>

              {/* Step Title */}
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#064B50] tracking-tight mb-4 leading-snug">
                {current.title}
              </h3>

              {/* Step Description */}
              <p className="text-base text-[#202C2B]/80 leading-relaxed mb-6">
                {current.description}
              </p>

              {/* Security Checkpoint Box */}
              <div className="w-full bg-[#F7F7F0] border border-[#064B50]/15 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#064B50]/10 text-[#064B50] shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#064B50]">
                    Pedoman Cermat Jeli:
                  </p>
                  <p className="text-xs font-semibold text-[#202C2B] mt-0.5">
                    {current.checkpoint}
                  </p>
                </div>
              </div>

              {/* Interactive Navigation Controls */}
              <div className="flex items-center justify-between w-full pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsAutoPlaying(false)
                      setActiveStep((prev) =>
                        prev === 0 ? steps.length - 1 : prev - 1,
                      )
                    }}
                    className="p-2 rounded-xl bg-[#F7F7F0] hover:bg-[#EBECE1] text-[#202C2B] transition-colors border border-[#064B50]/10"
                    title="Tahap Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsAutoPlaying(false)
                      setActiveStep((prev) => (prev + 1) % steps.length)
                    }}
                    className="p-2 rounded-xl bg-[#F7F7F0] hover:bg-[#EBECE1] text-[#202C2B] transition-colors border border-[#064B50]/10"
                    title="Tahap Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#F7F7F0] hover:bg-[#EBECE1] text-[#202C2B] text-xs font-semibold flex items-center gap-1.5 border border-[#064B50]/10"
                  >
                    {isAutoPlaying ? (
                      <Pause className="w-3 h-3 text-[#064B50]" />
                    ) : (
                      <Play className="w-3 h-3 text-[#064B50]" />
                    )}
                    <span>{isAutoPlaying ? "Pause" : "Auto"}</span>
                  </button>
                </div>

                <button
                  onClick={onCheckJobOffer}
                  className="text-xs font-bold text-[#064B50] hover:text-[#087F7A] hover:underline flex items-center gap-1"
                >
                  <span>Coba Periksa Sekarang</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Right Column: Custom Interactive Visual Stage Illustration */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              {/* Handwritten Note */}
              <div className="absolute -top-3 sm:-top-5 -right-2 sm:-right-4 bg-[#B8F000] text-[#064B50] font-handwriting text-base sm:text-lg font-bold px-3 py-1 rounded-xl shadow-md transform rotate-3 border border-[#064B50]/20 z-20 pointer-events-none select-none">
                {current.handwrittenNote}
                <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-[#B8F000] transform rotate-45 border-r border-b border-[#064B50]/20" />
              </div>

              {/* Stage Visual 1: RECEIVE (Smartphone Notification) */}
              {current.visualType === "receive" && (
                <div className="w-full max-w-sm bg-[#F7F7F0] border-2 border-[#064B50]/15 rounded-3xl p-4 shadow-md relative animate-in fade-in duration-300">
                  <div className="w-20 h-3 bg-[#064B50]/20 rounded-full mx-auto mb-4" />

                  <div className="bg-white border border-[#064B50]/12 rounded-2xl p-4 mb-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs">
                        WA
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#202C2B]">
                          HR Recruitment PT Sumber Makmur
                        </p>
                        <p className="text-[10px] text-[#202C2B]/60">
                          Pesan belum tersimpan • Baru saja
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[#202C2B]/85 leading-relaxed bg-[#F7F7F0] p-3 rounded-xl border border-[#064B50]/10">
                      &quot;Halo kak Andi! Profil kamu terpilih untuk posisi{" "}
                      <strong className="text-[#064B50]">
                        Staff Admin Operasional
                      </strong>
                      . Gaji Rp12.000.000/bulan + WFH. Silakan balas untuk
                      jadwalkan sesi wawancara.&quot;
                    </p>
                  </div>

                  <div className="bg-[#064B50]/5 border border-[#064B50]/15 rounded-xl p-3 flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-[#064B50] shrink-0" />
                    <p className="text-[11px] text-[#064B50] font-medium">
                      Tawaran tiba tanpa pernah mengirim lamaran sebelumnya.
                    </p>
                  </div>
                </div>
              )}

              {/* Stage Visual 2: ANALYZE (Scanner & Highlighted Phrases) */}
              {current.visualType === "analyze" && (
                <div className="w-full max-w-sm bg-[#F7F7F0] border-2 border-[#064B50]/15 rounded-3xl p-4 shadow-md relative animate-in fade-in duration-300">
                  <div className="flex items-center justify-between pb-3 border-b border-[#064B50]/10 mb-3">
                    <div className="flex items-center gap-2">
                      <Scan className="w-4 h-4 text-[#064B50] animate-pulse" />
                      <span className="text-xs font-bold text-[#064B50]">
                        Jeli Deep Pattern Scanner
                      </span>
                    </div>
                    <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200">
                      3 Pola Terdeteksi
                    </span>
                  </div>

                  {/* Scanned Document Lines */}
                  <div className="space-y-2 text-xs text-[#202C2B] bg-white p-3.5 rounded-2xl border border-[#064B50]/12 relative overflow-hidden">
                    {/* Laser Scanner Bar */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[#087F7A] shadow-[0_0_8px_#087F7A] animate-pulse" />

                    <p className="leading-relaxed">
                      ...kandidat diwajibkan melakukan{" "}
                      <mark className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded border border-red-300 font-bold">
                        transfer biaya pelatihan Rp250.000
                      </mark>{" "}
                      ke rekening bendahara pribadi...
                    </p>
                    <p className="leading-relaxed">
                      ...kandidat{" "}
                      <mark className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300 font-bold">
                        langsung diterima tanpa tes teknis
                      </mark>{" "}
                      dan mulai bekerja besok pagi...
                    </p>
                  </div>

                  {/* Red Flag Chips */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
                      🚨 Permintaan Biaya di Awal
                    </span>
                    <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
                      🚨 Rekening Non-Korporat
                    </span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
                      ⚠️ Tanpa Seleksi Kualifikasi
                    </span>
                  </div>
                </div>
              )}

              {/* Stage Visual 3: VERIFY (Company Registry & Domain Verification) */}
              {current.visualType === "verify" && (
                <div className="w-full max-w-sm bg-[#F7F7F0] border-2 border-[#064B50]/15 rounded-3xl p-4 shadow-md relative animate-in fade-in duration-300">
                  <div className="flex items-center justify-between pb-3 border-b border-[#064B50]/10 mb-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#064B50]" />
                      <span className="text-xs font-bold text-[#064B50]">
                        Audit Keaslian Pengirim
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#064B50]/10 text-[#064B50] font-bold px-2 py-0.5 rounded">
                      Verifikasi Mandiri
                    </span>
                  </div>

                  {/* Verification Ledger Items */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#064B50]/12">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-red-600" />
                        <div>
                          <p className="text-xs font-bold text-[#202C2B]">
                            Domain Email HR
                          </p>
                          <p className="text-[10px] text-[#202C2B]/60">
                            recruitment.pt@gmail.com
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200">
                        ❌ Domain Publik
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#064B50]/12">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="text-xs font-bold text-[#202C2B]">
                            Database Kemenkumham
                          </p>
                          <p className="text-[10px] text-[#202C2B]/60">
                            Pencarian Nomor NIB / PT
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                        ⚠️ Data Tidak Cocok
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#064B50]/12">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-600" />
                        <div>
                          <p className="text-xs font-bold text-[#202C2B]">
                            Pemeriksaan Rekening
                          </p>
                          <p className="text-[10px] text-[#202C2B]/60">
                            Bank BCA a.n. Pribadi
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200">
                        🚨 Riwayat Laporan
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage Visual 4: DECIDE (Decision Shield & Safe Action Dashboard) */}
              {current.visualType === "decide" && (
                <div className="w-full max-w-sm bg-[#F7F7F0] border-2 border-[#064B50]/15 rounded-3xl p-4 shadow-md relative animate-in fade-in duration-300">
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-center mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-300 flex items-center justify-center text-red-600 mx-auto mb-2">
                      <AlertOctagon className="w-6 h-6 text-red-600" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-red-700">
                      KESIMPULAN KEWASPADAAN
                    </span>
                    <h4 className="text-xl font-black text-red-900 mt-0.5">
                      Tingkat Risiko Tinggi
                    </h4>
                    <p className="text-[11px] text-red-800 mt-1">
                      Pesan ini mengindikasikan kuat modus biaya administrasi
                      berkedok rekrutmen.
                    </p>
                  </div>

                  {/* Action Recommendation Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={onCheckJobOffer}
                      className="w-full bg-[#064B50] hover:bg-[#087F7A] text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#B8F000]" />
                      <span>Hentikan Komunikasi & Amankan Data</span>
                    </button>
                    <button
                      onClick={onCheckJobOffer}
                      className="w-full bg-white hover:bg-[#EBECE1] text-[#202C2B] font-bold text-xs py-2 rounded-xl border border-[#064B50]/20"
                    >
                      Salin Template Penolakan Tegas & Sopan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
