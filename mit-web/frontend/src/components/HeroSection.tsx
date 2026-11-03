import React, { useState } from "react"
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ArrowDown,
  Search,
} from "lucide-react"
import { JeliCompanion } from "./JeliCompanion"

interface HeroSectionProps {
  onCheckJobOffer: () => void
  onExploreHowItWorks: () => void
  lang: "ID" | "EN"
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onCheckJobOffer,
  onExploreHowItWorks,
  lang,
}) => {
  // Interactive scenario toggle for hero illustration
  const [activeScenario, setActiveScenario] = useState<0 | 1 | 2>(0)
  const [inspectingFlag, setInspectingFlag] = useState(false)

  const scenarios = [
    {
      id: 0,
      title: "Biaya Seragam",
      recruiter: "Ibu Rina • HR PT Surya Indo Sejahtera",
      avatar: "👩‍💼",
      message:
        "Selamat Kak! Lolos tahap berkas Admin WFH. Untuk konfirmasi jadwal interview, silakan transfer Rp350.000 (biaya jaminan seragam & formulir ID card). Akan direfund.",
      highlightPhrase: "transfer Rp350.000 (biaya jaminan seragam)",
      riskScore: 96,
      riskLabel: "HIGH RISK SCAM",
      mascotState: "alert" as const,
      redFlag:
        "Perusahaan resmi TIDAK PERNAH memungut biaya seragam atau deposit formulir!",
      salary: "Rp14.500.000 / bln",
      companyTag: "PT Palsu / Domain Gratisan",
    },
    {
      id: 1,
      title: "Like & Subscribe",
      recruiter: "Admin Task • Global Media Promotor",
      avatar: "🤖",
      message:
        "Pekerjaan Freelance Paruh Waktu: Cukup Like 3 video YouTube & follow IG, komisi langsung cair Rp150.000/hari. Deposit awal Rp200.000 untuk buka level VIP!",
      highlightPhrase: "Deposit awal Rp200.000 untuk buka level VIP",
      riskScore: 98,
      riskLabel: "PONZI TASK SCAM",
      mascotState: "scanning" as const,
      redFlag:
        "Modus tugas berbayar (task scam). Uang deposit awal akan dibawa kabur!",
      salary: "Komisi Harian Rp800.000",
      companyTag: "Grup Telegram Liar",
    },
    {
      id: 2,
      title: "BUMN Travel Fee",
      recruiter: "Panitia Seleksi Rekrutmen BUMN Pertamina",
      avatar: "🏢",
      message:
        "Panggilan Tes Tahap Akhir di Balikpapan. Tiket pesawat & hotel WAJIB dipesan melalui agen travel rekanan resmi PT Buana Wisata Tour. Biaya diganti 100% saat registrasi.",
      highlightPhrase: "WAJIB dipesan melalui agen travel rekanan resmi",
      riskScore: 99,
      riskLabel: "BUMN IMPERSONATION",
      mascotState: "protect" as const,
      redFlag:
        "Pencatutan nama BUMN! Semua tiket BUMN diatur langsung atau tidak pernah lewat agen transfer pribadi.",
      salary: "Management Trainee BUMN",
      companyTag: "Email: rekrutmen.pertamina@gmail.com (PALSU)",
    },
  ]

  const cur = scenarios[activeScenario]

  return (
    <section className="relative min-h-[92vh] pt-28 pb-20 overflow-hidden flex items-center justify-center bg-[#F7F7F0] bg-warm-grid text-[#202C2B]">
      {/* Gentle Warm Ambient Light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-[#087F7A]/10 via-[#B8F000]/10 to-[#064B50]/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & Action */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Brand Positioning Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#064B50]/15 shadow-2xs mb-6">
              <span className="w-2 h-2 rounded-full bg-[#B8F000] border border-[#064B50]/20" />
              <span className="text-xs font-bold tracking-wide uppercase text-[#064B50]">
                {lang === "ID"
                  ? "Platform Keamanan & Kewaspadaan Digital"
                  : "Digital Safety & Critical Awareness"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-extrabold text-[#087F7A]">
                jeli.
              </span>
            </div>

            {/* Primary Headline with Editorial Highlight */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#202C2B] tracking-tight leading-[1.14] mb-6">
              Not every opportunity <br className="hidden sm:inline" />
              is an{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10 text-[#064B50] font-black px-2.5 sm:px-3 py-0.5 rounded-lg bg-[#B8F000]/40 border-b-2 border-[#B8F000]">
                  opportunity.
                </span>
              </span>
            </h1>

            {/* Supporting Tagline & Description */}
            <div className="mb-8 max-w-xl">
              <p className="text-lg sm:text-xl font-bold text-[#087F7A] mb-2 font-serif-italic">
                {lang === "ID"
                  ? "Kenali yang janggal, putuskan dengan yakin."
                  : "See through the noise. Navigate with confidence."}
              </p>
              <p className="text-base sm:text-lg text-[#202C2B]/80 leading-relaxed">
                {lang === "ID"
                  ? "Jeli mendampingi kamu memeriksa tawaran kerja mencurigakan, memverifikasi identitas perekrut, dan membangun naluri kritis saat berinteraksi di dunia digital."
                  : "Jeli helps you inspect suspicious job offers, verify recruiter authenticity, and build critical awareness when navigating digital interactions."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto mb-10">
              {/* Primary CTA */}
              <button
                onClick={onCheckJobOffer}
                className="group relative bg-[#064B50] hover:bg-[#087F7A] text-white font-extrabold text-base px-7 py-3.5 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="w-5 h-5 text-[#B8F000]" />
                <span>
                  {lang === "ID" ? "Cek Tawaran Kerja" : "Check a Job Offer"}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Secondary CTA */}
              <button
                onClick={onExploreHowItWorks}
                className="group bg-white hover:bg-[#EBECE1] text-[#202C2B] font-bold text-base px-6 py-3.5 rounded-xl border border-[#064B50]/15 shadow-2xs transition-all duration-200 flex items-center justify-center gap-2.5 hover:scale-[1.02]"
              >
                <span>
                  {lang === "ID"
                    ? "Pelajari Cara Kerjanya"
                    : "Explore How It Works"}
                </span>
                <ArrowDown className="w-4 h-4 text-[#064B50] group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>

            {/* Social Proof & Trust Badges */}
            <div className="pt-6 border-t border-[#064B50]/10 w-full flex flex-wrap items-center gap-6 text-xs text-[#202C2B]/70">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <span className="font-bold text-[#202C2B]">48.200+</span>{" "}
                {lang === "ID" ? "Loker Dianalisis" : "Offers Analyzed"}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#087F7A]" />
                <span className="font-bold text-[#202C2B]">99.4%</span>{" "}
                {lang === "ID" ? "Akurasi Deteksi Red Flag" : "Red Flag Accuracy"}
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#064B50]" />
                <span className="font-bold text-[#202C2B]">
                  Edukasi Praktis
                </span>{" "}
                Untuk Pemuda
              </div>
            </div>
          </div>

          {/* Right Column: Large Interactive Visual Composition */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            {/* Scenario Quick Selector Pill Bar */}
            <div className="w-full max-w-md mb-4 bg-white border border-[#064B50]/12 p-1.5 rounded-2xl flex items-center justify-between shadow-2xs">
              <span className="text-[11px] font-bold text-[#202C2B]/70 pl-2.5 hidden sm:inline">
                {lang === "ID" ? "Uji Modus:" : "Test Scam:"}
              </span>
              <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveScenario(s.id as 0 | 1 | 2)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-200 ${
                      activeScenario === s.id
                        ? "bg-[#064B50] text-white shadow-xs font-extrabold"
                        : "text-[#202C2B]/70 hover:text-[#064B50] hover:bg-[#F7F7F0]"
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Stage Container */}
            <div className="relative w-full max-w-md bg-white border border-[#064B50]/15 rounded-3xl p-5 sm:p-6 shadow-xl">
              {/* Card Header with Jeli Monitor */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#064B50]/10 border border-[#064B50]/15 text-[#064B50]">
                    <Eye className="w-4 h-4 text-[#064B50]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-[#064B50]">
                        Jeli Live Monitor
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                    </div>
                    <span className="text-[10px] text-[#202C2B]/60 font-mono">
                      Modus: {cur.companyTag}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-xs font-black">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{cur.riskScore}% {lang === "ID" ? "BAHAYA" : "RISK"}</span>
                </div>
              </div>

              {/* Jeli Companion Centerpiece */}
              <div className="flex items-center justify-center my-2 relative">
                <div className="animate-float-slow">
                  <JeliCompanion
                    state={cur.mascotState}
                    size="lg"
                    onInteract={() => setInspectingFlag(!inspectingFlag)}
                  />
                </div>

                {/* Handwritten Floating Annotation Note */}
                <div className="absolute -top-3 -right-2 sm:-right-4 bg-[#B8F000] text-[#064B50] font-handwriting text-base sm:text-lg font-bold px-3 py-1.5 rounded-xl shadow-md transform rotate-6 border border-[#064B50]/20 pointer-events-none select-none z-20">
                  {lang === "ID" ? "Mata jeli dulu, jangan transfer! ✍️" : "Stay sharp, don't transfer! ✍️"}
                  <div className="absolute -bottom-2 left-4 w-3 h-3 bg-[#B8F000] transform rotate-45 border-r border-b border-[#064B50]/20" />
                </div>
              </div>

              {/* Floating Suspicious Message Notification Card */}
              <div className="mt-4 bg-[#F7F7F0] border border-[#064B50]/15 rounded-2xl p-3.5 sm:p-4 shadow-2xs relative group transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cur.avatar}</span>
                    <div>
                      <p className="text-xs font-bold text-[#202C2B] leading-tight">
                        {cur.recruiter}
                      </p>
                      <p className="text-[10px] text-[#202C2B]/60">
                        {lang === "ID" ? "Pesan Masuk WhatsApp / Telegram" : "Incoming WhatsApp / Telegram message"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold">
                    {lang === "ID" ? "Gaji" : "Salary"}: {cur.salary}
                  </span>
                </div>

                {/* Message Body with Highlighted Trap */}
                <div className="bg-white border border-[#064B50]/10 rounded-xl p-3 text-xs text-[#202C2B] leading-relaxed font-sans mb-2.5">
                  {cur.message.split(cur.highlightPhrase)[0]}
                  <mark className="bg-red-100 text-red-800 border-b-2 border-red-400 font-bold px-1 rounded">
                    🚨 {cur.highlightPhrase}
                  </mark>
                  {cur.message.split(cur.highlightPhrase)[1]}
                </div>

                {/* Red Flag Warning Insight */}
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5 text-[11px] text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-red-700 uppercase tracking-wide mr-1">
                      Deteksi Jeli:
                    </span>
                    <span>{cur.redFlag}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Interactive Quick-Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#202C2B]/70">
                <span className="text-[11px]">
                  Punya pesan serupa?{" "}
                  <strong className="text-[#064B50]">Cek dalam 15 detik</strong>
                </span>
                <button
                  onClick={onCheckJobOffer}
                  className="text-xs font-bold text-[#064B50] hover:text-[#087F7A] hover:underline flex items-center gap-1"
                >
                  Cek Sekarang <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
