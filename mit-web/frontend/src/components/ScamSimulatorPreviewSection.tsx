import React, { useState } from "react"
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Brain,
  Target,
  Zap,
  Building2,
  Bot,
  UserCheck,
} from "lucide-react"

interface ScamSimulatorPreviewSectionProps {
  onStartSimulation: () => void
  lang: "ID" | "EN"
}

interface OptionItem {
  id: "trap" | "safe"
  text: { id: string; en: string }
  isSafe: boolean
  feedbackTitle: { id: string; en: string }
  feedbackBody: { id: string; en: string }
  lesson: { id: string; en: string }
}

interface PreviewScenario {
  id: string
  tabLabel: { id: string; en: string }
  category: { id: string; en: string }
  senderName: { id: string; en: string }
  senderPlatform: string
  avatarIcon: "user" | "bot" | "building"
  message: { id: string; en: string }
  highlightPhrase: { id: string; en: string }
  redFlagTag: { id: string; en: string }
  options: OptionItem[]
}

const PREVIEW_SCENARIOS: PreviewScenario[] = [
  {
    id: "uniform-fee",
    tabLabel: {
      id: "01 Seragam WFH",
      en: "01 WFH Uniform",
    },
    category: {
      id: "Modus Biaya Administrasi di Muka",
      en: "Upfront Admin Fee Pattern",
    },
    senderName: {
      id: "Ibu Rina • HR PT Surya Perkasa",
      en: "Mrs. Rina • HR PT Surya Perkasa",
    },
    senderPlatform: "WhatsApp",
    avatarIcon: "user",
    message: {
      id: "Selamat Kak! Anda lolos berkas Admin WFH (gaji Rp14.500.000). Untuk kunci jadwal interview besok, wajib transfer uang jaminan seragam Rp350.000 ke rekening BCA atas nama Rahmat. Uang direfund 100% di hari pertama kerja. Kuota slot tinggal 2 jam lagi!",
      en: "Congratulations! You passed the WFH Admin screening (salary Rp14.5M). To lock your interview slot tomorrow, please transfer a Rp350,000 uniform guarantee fee to BCA under Rahmat. 100% refunded on day one. Only 2 hours left!",
    },
    highlightPhrase: {
      id: "transfer uang jaminan seragam Rp350.000",
      en: "transfer a Rp350,000 uniform guarantee fee",
    },
    redFlagTag: {
      id: "Pungutan di Muka + Urgensi Waktu",
      en: "Upfront Fee + Fake Urgency",
    },
    options: [
      {
        id: "trap",
        isSafe: false,
        text: {
          id: "Transfer Rp350.000 sekarang agar jadwal interview tidak hangus",
          en: "Transfer Rp350,000 now so the interview slot isn't cancelled",
        },
        feedbackTitle: {
          id: "🚨 Terjebak Penipuan Biaya Awal!",
          en: "🚨 Trapped by Upfront Fee Scam!",
        },
        feedbackBody: {
          id: "Uang Rp350.000 Anda hilang seketika dan nomor penipu langsung memblokir WhatsApp Anda. Tidak pernah ada lowongan kerja nyata.",
          en: "Your Rp350,000 is lost immediately and the recruiter blocks your number. No genuine job ever existed.",
        },
        lesson: {
          id: "Perusahaan bonafide TIDAK PERNAH memungut uang seragam, materai, atau deposit formulir dari calon pelamar.",
          en: "Legitimate employers NEVER charge applicants for uniforms, stamps, or application deposits.",
        },
      },
      {
        id: "safe",
        isSafe: true,
        text: {
          id: "Tolak transfer & minta verifikasi via email korporat resmi perusahaan",
          en: "Refuse payment & request verification through an official company email",
        },
        feedbackTitle: {
          id: "🛡️ Keputusan Tepat & Aman (100% Terlindungi)!",
          en: "🛡️ Smart & Safe Decision (100% Protected)!",
        },
        feedbackBody: {
          id: "Refleks juara! Anda menggagalkan upaya manipulasi penipu yang memanfaatkan urgensi palsu dan iming-iming gaji tinggi.",
          en: "Outstanding reflex! You defeated a scam attempt engineered with fake urgency and inflated salary bait.",
        },
        lesson: {
          id: "Menolak segala pungutan di awal dan menuntut kanal resmi mematahkan 99% modus penipuan lowongan kerja.",
          en: "Refusing upfront charges and demanding official corporate channels defeats 99% of recruitment scams.",
        },
      },
    ],
  },
  {
    id: "telegram-task",
    tabLabel: {
      id: "02 Tugas Telegram",
      en: "02 Telegram Task",
    },
    category: {
      id: "Modus Skema Ponzi / Tugas Berbayar",
      en: "Ponzi / Paid Task Scam Pattern",
    },
    senderName: {
      id: "Admin Jessica • Global Media VIP",
      en: "Jessica Admin • Global Media VIP",
    },
    senderPlatform: "Telegram",
    avatarIcon: "bot",
    message: {
      id: "Peluang kerja sampingan dari rumah! Cukup like 3 video YouTube & follow toko, komisi Rp150.000 langsung cair. Untuk naik ke paket VIP dengan komisi Rp800.000/hari, silakan transfer deposit awal Rp200.000 sekarang ya kak.",
      en: "Easy remote gig! Simply like 3 YouTube videos & follow a store to get Rp150,000 directly. To upgrade to VIP with Rp800,000/day commission, please deposit an initial Rp200,000 now.",
    },
    highlightPhrase: {
      id: "transfer deposit awal Rp200.000 sekarang",
      en: "deposit an initial Rp200,000 now",
    },
    redFlagTag: {
      id: "Deposit Modal untuk Buka Tugas",
      en: "Cash Deposit to Unlock Tasks",
    },
    options: [
      {
        id: "trap",
        isSafe: false,
        text: {
          id: "Kirim deposit Rp200.000 karena tergiur potensi komisi harian Rp800.000",
          en: "Send Rp200,000 deposit attracted by the Rp800,000 daily commission",
        },
        feedbackTitle: {
          id: "🚨 Terperangkap Jeratan Task Scam!",
          en: "🚨 Trapped in a Task Scam Spiral!",
        },
        feedbackBody: {
          id: "Setelah Anda transfer Rp200.000, komisi palsu di aplikasi akan terkunci. Anda akan dipaksa deposit jutaan rupiah lagi untuk mencairkannya.",
          en: "After depositing Rp200,000, fake earnings freeze. Scammers then demand millions more to 'withdraw' your funds.",
        },
        lesson: {
          id: "Pekerjaan legal membayar Anda, bukan meminta uang Anda sebagai syarat mengerjakan tugas.",
          en: "Legitimate employment pays you; it never requires you to pay to work.",
        },
      },
      {
        id: "safe",
        isSafe: true,
        text: {
          id: "Tolak deposit, tinggalkan percakapan, dan laporkan grup ke Telegram",
          en: "Refuse deposit, leave the chat, and report the channel to Telegram",
        },
        feedbackTitle: {
          id: "🛡️ Refleks Kritis yang Sempurna!",
          en: "🛡️ Perfect Critical Reflex!",
        },
        feedbackBody: {
          id: "Langkah cerdas! Anda memotong siklus manipulasi psikologis penipu sejak langkah pertama sebelum ada kerugian materi.",
          en: "Brilliant move! You cut the scammer's psychological manipulation loop before any financial loss occurred.",
        },
        lesson: {
          id: "Iming-iming komisi mudah untuk tugas sepele adalah ciri klasik modus penipuan berantai.",
          en: "Effortless high earnings for trivial tasks are the classic trademark of snowball task scams.",
        },
      },
    ],
  },
  {
    id: "soe-travel",
    tabLabel: {
      id: "03 Undangan BUMN",
      en: "03 SOE Invitation",
    },
    category: {
      id: "Pencatutan BUMN / Modus Travel Rekanan",
      en: "SOE Impersonation / Travel Partner Scam",
    },
    senderName: {
      id: "Panitia Rekrutmen BUMN (rekrutmen.bumn@gmail.com)",
      en: "SOE Recruitment Team (rekrutmen.bumn@gmail.com)",
    },
    senderPlatform: "Email / PDF",
    avatarIcon: "building",
    message: {
      id: "Panggilan Tes Akhir BUMN di Balikpapan. Demi kepatuhan akreditasi, seluruh tiket pesawat & hotel WAJIB dipesan melalui agen travel rekanan 'Angkasa Tour'. Biaya perjalanan diganti 100% tunai saat registrasi di lokasi.",
      en: "SOE Final Stage Interview in Balikpapan. For accreditation compliance, all flights & hotel MUST be booked via partner agency 'Angkasa Tour'. 100% reimbursed in cash upon venue arrival.",
    },
    highlightPhrase: {
      id: "WAJIB dipesan melalui agen travel rekanan",
      en: "MUST be booked via partner agency",
    },
    redFlagTag: {
      id: "Email Publik + Pemaksaan Biro Travel",
      en: "Public Email + Forced Travel Partner",
    },
    options: [
      {
        id: "trap",
        isSafe: false,
        text: {
          id: "Pesan tiket lewat agen rekanan karena yakin akan direimburse penuh",
          en: "Book via partner agency trusting the full reimbursement promise",
        },
        feedbackTitle: {
          id: "🚨 Modus Klasik Penipuan Tiket Travel BUMN!",
          en: "🚨 Classic Travel Booking Fraud!",
        },
        feedbackBody: {
          id: "Biro travel tersebut adalah komplotan penipu. Undangan tes palsu dan uang jutaan rupiah untuk tiket pesawat lenyap selamanya.",
          en: "The travel agency is the scammer's front. The interview is bogus and ticket payments vanish forever.",
        },
        lesson: {
          id: "FHCI dan BUMN menegaskan bahwa seleksi resmi TIDAK PERNAH memungut biaya transportasi via biro travel tertentu.",
          en: "FHCI and SOEs firmly affirm that recruitment NEVER demands travel booking fees via designated agents.",
        },
      },
      {
        id: "safe",
        isSafe: true,
        text: {
          id: "Verifikasi via portal resmi fhcibumn.id dan tolak mentransfer dana",
          en: "Verify via official fhcibumn.id portal and refuse all transfers",
        },
        feedbackTitle: {
          id: "🛡️ Verifikasi Cerdas & Sukses!",
          en: "🛡️ Smart & Successful Verification!",
        },
        feedbackBody: {
          id: "Tepat sekali! Anda memeriksa ke sumber otoritas resmi sebelum terpengaruh kop surat palsu dan logo institusi.",
          en: "Spot on! You checked official sources before being swayed by forged letterheads and corporate logos.",
        },
        lesson: {
          id: "Pengumuman seleksi BUMN resmi hanya disalurkan melalui sistem terpadu resmi, bukan akun email gratisan.",
          en: "Official SOE candidate notices are delivered only through official central portals, never free webmail.",
        },
      },
    ],
  },
]

export const ScamSimulatorPreviewSection: React.FC<ScamSimulatorPreviewSectionProps> = ({
  onStartSimulation,
  lang,
}) => {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<"trap" | "safe" | null>(null)

  const currentScenario = PREVIEW_SCENARIOS[activeScenarioIdx]
  const selectedOption = currentScenario.options.find((opt) => opt.id === selectedOptionId)

  const handleScenarioChange = (idx: number) => {
    setActiveScenarioIdx(idx)
    setSelectedOptionId(null)
  }

  // Helper to highlight red flag phrase in message
  const renderMessageWithHighlight = (fullText: string, phrase: string) => {
    const parts = fullText.split(phrase)
    if (parts.length < 2) return <span>{fullText}</span>

    return (
      <span>
        {parts[0]}
        <mark className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-100/90 px-1.5 py-0.5 font-bold text-rose-900 shadow-2xs">
          <AlertTriangle className="inline h-3.5 w-3.5 shrink-0 text-rose-600" />
          {phrase}
        </mark>
        {parts.slice(1).join(phrase)}
      </span>
    )
  }

  return (
    <section id="scam-simulator" className="relative overflow-hidden border-t border-[#064B50]/10 bg-[#EBECE1]/45 py-20 text-[#202C2B] sm:py-24">
      {/* Decorative ambient blobs */}
      <div className="pointer-events-none absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-[#B8F000]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#087F7A]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Heading, Value Props, CTA */}
          <div className="lg:col-span-5">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#064B50]/15 bg-white px-3.5 py-1.5 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-[#087F7A]" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#064B50]">
                {lang === "ID" ? "Simulator Interaktif" : "Interactive Simulator"}
              </span>
            </div>

            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-[#064B50] sm:text-4xl">
              {lang === "ID" ? "Belajar merespons, tanpa takut salah." : "Practise your response, without the real-world risk."}
            </h2>

            <p className="mb-6 text-base leading-relaxed text-[#202C2B]/85">
              {lang === "ID"
                ? "Bukan sekadar teori. Uji refleksmu langsung di sini menghadapi pesan manipulatif perekrut palsu dan ketahui konsekuensinya dalam hitungan detik."
                : "Not just theory. Test your reflexes right here against manipulative fake recruiter messages and see the real consequences in seconds."}
            </p>

            {/* Quick feature checklist */}
            <div className="mb-8 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-[#064B50]/10 bg-white/70 p-3 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#064B50]/10 text-[#064B50]">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#064B50]">
                    {lang === "ID" ? "3 Langkah Latihan Terarah" : "3 Structured Practice Steps"}
                  </p>
                  <p className="text-[11px] text-[#202C2B]/70">
                    {lang === "ID" ? "Amati pola red flag → Pilih respons taktis → Pahami risikonya." : "Spot the red flag → Choose your response → Understand the real risk."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[#064B50]/10 bg-white/70 p-3 shadow-2xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#B8F000]/40 text-[#064B50]">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#064B50]">
                    {lang === "ID" ? "Evaluasi Konsekuensi Instan" : "Instant Consequence Evaluation"}
                  </p>
                  <p className="text-[11px] text-[#202C2B]/70">
                    {lang === "ID" ? "Lihat apa yang terjadi di dunia nyata jika kamu salah mengambil keputusan." : "See what actually happens in real life when a wrong move is made."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onStartSimulation}
                className="group flex items-center justify-center gap-2.5 rounded-xl bg-[#064B50] px-6 py-3.5 font-extrabold text-white shadow-md transition-all hover:bg-[#087F7A] hover:shadow-lg"
              >
                <Sparkles className="h-4 w-4 text-[#B8F000]" />
                {lang === "ID" ? "Masuk ke Simulator Lengkap" : "Enter Full Simulator"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Right Column: Live Interactive Simulation Playground Card */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-[#064B50]/15 bg-white p-5 shadow-xl sm:p-7">
              {/* Card Header: Live badge + Title */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#064B50]/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#087F7A]">
                      {lang === "ID" ? "UJI REFLEKS CEPAT • LIVE PREVIEW" : "QUICK REFLEX TEST • LIVE PREVIEW"}
                    </span>
                    <h3 className="text-sm font-extrabold text-[#064B50]">
                      {currentScenario.category[lang === "ID" ? "id" : "en"]}
                    </h3>
                  </div>
                </div>

                <div className="rounded-full bg-[#B8F000]/30 px-3 py-1 text-[11px] font-bold text-[#064B50]">
                  {lang === "ID" ? "Coba Langsung ⚡" : "Try It Live ⚡"}
                </div>
              </div>

              {/* Scenario Switcher Tabs */}
              <div className="mb-5 grid grid-cols-3 gap-2">
                {PREVIEW_SCENARIOS.map((scen, idx) => {
                  const isActive = activeScenarioIdx === idx
                  return (
                    <button
                      key={scen.id}
                      type="button"
                      onClick={() => handleScenarioChange(idx)}
                      className={`rounded-xl px-2.5 py-2.5 text-center transition-all ${
                        isActive
                          ? "bg-[#064B50] text-white shadow-sm ring-2 ring-[#064B50]/20"
                          : "bg-[#F7F7F0] text-[#202C2B]/70 hover:bg-[#EBECE1] hover:text-[#064B50]"
                      }`}
                    >
                      <span className="block text-xs font-bold sm:text-sm">
                        {scen.tabLabel[lang === "ID" ? "id" : "en"]}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* 3-Step Guided Breadcrumbs */}
              <div className="mb-4 flex items-center justify-between rounded-xl bg-[#F7F7F0] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#202C2B]/60 sm:text-[11px]">
                <div className={`flex items-center gap-1.5 ${!selectedOption ? "font-black text-[#064B50]" : ""}`}>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#064B50]/10 text-[9px] text-[#064B50]">1</span>
                  {lang === "ID" ? "Amati Pola" : "Spot Pattern"}
                </div>
                <span>→</span>
                <div className={`flex items-center gap-1.5 ${!selectedOption ? "font-black text-[#087F7A]" : ""}`}>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#087F7A]/15 text-[9px] text-[#087F7A]">2</span>
                  {lang === "ID" ? "Pilih Respons" : "Choose Response"}
                </div>
                <span>→</span>
                <div className={`flex items-center gap-1.5 ${selectedOption ? "font-black text-emerald-700" : ""}`}>
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${selectedOption ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"}`}>3</span>
                  {lang === "ID" ? "Pahami Risiko" : "Understand Risk"}
                </div>
              </div>

              {/* Chat Message Box */}
              <div className="mb-5 rounded-2xl border border-slate-200 bg-[#FBFBFA] p-4 shadow-2xs">
                {/* Sender info */}
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#064B50] text-white">
                      {currentScenario.avatarIcon === "user" && <UserCheck className="h-4 w-4 text-[#B8F000]" />}
                      {currentScenario.avatarIcon === "bot" && <Bot className="h-4 w-4 text-[#B8F000]" />}
                      {currentScenario.avatarIcon === "building" && <Building2 className="h-4 w-4 text-[#B8F000]" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#064B50]">
                        {currentScenario.senderName[lang === "ID" ? "id" : "en"]}
                      </p>
                      <p className="text-[10px] text-slate-500">{currentScenario.senderPlatform}</p>
                    </div>
                  </div>

                  <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    ⚠️ {currentScenario.redFlagTag[lang === "ID" ? "id" : "en"]}
                  </span>
                </div>

                {/* Message Content */}
                <div className="text-xs leading-relaxed text-[#202C2B] sm:text-[13px]">
                  {renderMessageWithHighlight(
                    currentScenario.message[lang === "ID" ? "id" : "en"],
                    currentScenario.highlightPhrase[lang === "ID" ? "id" : "en"]
                  )}
                </div>
              </div>

              {/* Interactive Decision Options */}
              <div className="space-y-2.5">
                <p className="text-xs font-extrabold text-[#064B50]">
                  {lang === "ID" ? "Bagaimana respons taktis Anda?" : "How would you respond?"}
                </p>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {currentScenario.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? opt.isSafe
                              ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20"
                              : "border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/20"
                            : "border-slate-200 bg-white hover:border-[#087F7A] hover:bg-[#F7F7F0]"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                              isSelected
                                ? opt.isSafe
                                  ? "bg-emerald-600 text-white"
                                  : "bg-rose-600 text-white"
                                : "bg-slate-100 text-slate-600 group-hover:bg-[#064B50] group-hover:text-white"
                            }`}
                          >
                            {opt.id === "trap" ? "A" : "B"}
                          </span>
                          <span className="text-xs font-medium leading-snug text-[#202C2B]">
                            {opt.text[lang === "ID" ? "id" : "en"]}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Outcome Feedback Card (Appears upon option selection) */}
              {selectedOption ? (
                <div
                  className={`mt-5 rounded-2xl border p-4.5 transition-all duration-300 animate-in fade-in-50 zoom-in-95 ${
                    selectedOption.isSafe
                      ? "border-emerald-500/40 bg-gradient-to-br from-[#064B50] to-[#043337] text-white shadow-lg"
                      : "border-rose-300 bg-rose-50/90 text-rose-950 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          selectedOption.isSafe
                            ? "bg-[#B8F000] text-[#064B50]"
                            : "bg-rose-600 text-white"
                        }`}
                      >
                        {selectedOption.isSafe ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4
                          className={`text-sm font-black ${
                            selectedOption.isSafe ? "text-[#B8F000]" : "text-rose-900"
                          }`}
                        >
                          {selectedOption.feedbackTitle[lang === "ID" ? "id" : "en"]}
                        </h4>
                        <p
                          className={`text-[11px] font-bold ${
                            selectedOption.isSafe ? "text-emerald-200" : "text-rose-700"
                          }`}
                        >
                          {selectedOption.isSafe
                            ? lang === "ID"
                              ? "Refleks Teruji: Anda Aman 100%"
                              : "Reflex Tested: 100% Safe"
                            : lang === "ID"
                              ? "Konsekuensi Fatal di Dunia Nyata"
                              : "Fatal Real-World Consequence"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOptionId(null)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        selectedOption.isSafe
                          ? "bg-white/10 text-white hover:bg-white/20"
                          : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-100"
                      }`}
                    >
                      <RotateCcw className="h-3 w-3" />
                      {lang === "ID" ? "Ulangi" : "Reset"}
                    </button>
                  </div>

                  <p
                    className={`mt-3 text-xs leading-relaxed ${
                      selectedOption.isSafe ? "text-white/90" : "text-rose-900"
                    }`}
                  >
                    {selectedOption.feedbackBody[lang === "ID" ? "id" : "en"]}
                  </p>

                  <div
                    className={`mt-3 flex items-start gap-2 rounded-xl p-2.5 text-[11px] font-medium leading-relaxed ${
                      selectedOption.isSafe
                        ? "bg-white/10 text-emerald-100"
                        : "bg-white/80 text-rose-800 border border-rose-200/80"
                    }`}
                  >
                    <CheckCircle2
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                        selectedOption.isSafe ? "text-[#B8F000]" : "text-rose-600"
                      }`}
                    />
                    <div>
                      <strong className="font-bold">
                        {lang === "ID" ? "Pelajaran Kunci: " : "Key Takeaway: "}
                      </strong>
                      {selectedOption.lesson[lang === "ID" ? "id" : "en"]}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F7F7F0] px-3.5 py-2.5 text-xs text-[#202C2B]/75">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Target className="h-3.5 w-3.5 text-[#087F7A]" />
                    {lang === "ID"
                      ? "Pilih opsi A atau B di atas untuk menguji refleksmu."
                      : "Select option A or B above to test your reflexes."}
                  </span>
                  <span className="hidden text-[11px] font-bold text-[#064B50] sm:inline">
                    {lang === "ID" ? "Gratis & Tanpa Risiko" : "Zero Risk Practice"}
                  </span>
                </div>
              )}

              {/* Bottom Simulator Teaser Footer */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
                <span className="text-[#202C2B]/70">
                  {lang === "ID"
                    ? "Tersedia 5+ kasus interaktif bertahap di ruang simulasi"
                    : "5+ multi-step interactive cases available in the full room"}
                </span>
                <button
                  type="button"
                  onClick={onStartSimulation}
                  className="flex items-center gap-1.5 font-extrabold text-[#064B50] transition-colors hover:text-[#087F7A]"
                >
                  {lang === "ID" ? "Buka Simulator Lengkap" : "Open Full Simulator"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ScamSimulatorPreviewSection
