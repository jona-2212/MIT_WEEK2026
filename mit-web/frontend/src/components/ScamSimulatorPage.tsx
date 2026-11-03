import React, { useState } from "react"
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Send,
} from "lucide-react"
import { t } from "../i18n"

interface ScamSimulatorPageProps {
  onBackToHome: () => void
  lang: "ID" | "EN"
}

export const ScamSimulatorPage: React.FC<ScamSimulatorPageProps> = ({
  onBackToHome,
  lang,
}) => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0)
  const [chatStep, setChatStep] = useState(0)
  const [score, setScore] = useState(100)
  const [completed, setCompleted] = useState(false)

  const scenarios = [
    {
      id: 0,
      title: "Kasus 1: Biaya Deposit Seragam WFH",
      recruiterName: "Ibu Rina • HR PT Surya Sejahtera",
      dialogues: [
        {
          recruiter:
            "Halo Kak! Selamat, berkas kamu lolos seleksi Admin Data. Gaji Rp14.500.000/bulan. Jadwal interview besok jam 10 pagi. Untuk konfirmasi slot, mohon transfer uang jaminan seragam Rp350.000 ke BCA 8820xxxx atas nama Rahmat (akan dikembalikan hari pertama kerja).",
          options: [
            {
              text: "Maaf Bu, apakah biaya ini bisa dipotong dari gaji pertama saja?",
              feedback:
                "⚠️ Hati-hati: Penipu tetap akan mendesak transfer di awal dengan alasan SOP sistem.",
              penalty: 15,
            },
            {
              text: "Sesuai regulasi ketenagakerjaan, perusahaan resmi tidak memungut biaya apapun. Saya minta verifikasi via email korporat.",
              feedback:
                "🛡️ Tepat sekali! Kamu mengenali red flag biaya di awal dan menolak manipulasi.",
              penalty: 0,
            },
            {
              text: "Baik Bu, saya transfer sekarang juga agar slot interview tidak hangus.",
              feedback:
                "🚨 Bahaya! Kamu baru saja kehilangan Rp350.000 dan nomor penipu akan memblokirmu.",
              penalty: 50,
            },
          ],
        },
        {
          recruiter:
            "Jika tidak transfer dalam 30 menit, posisi ini terpaksa kami berikan kepada kandidat cadangan berikutnya!",
          options: [
            {
              text: "Silakan dialihkan saja. Saya tidak akan mentransfer uang ke rekening pribadi sebelum ada kontrak resmi.",
              feedback:
                "🏆 Keputusan Juara! Kamu tidak panik menghadapi taktik tekanan waktu palsu.",
              penalty: 0,
            },
            {
              text: "Tunggu Bu jangan dibatalkan! Saya pinjam uang teman dulu sekarang.",
              feedback:
                "🚨 Terjebak! Penipu memanfaatkan rasa panik untuk menguras uangmu.",
              penalty: 40,
            },
          ],
        },
      ],
    },
    {
      id: 1,
      title: "Kasus 2: Misi Tugas Telegram Like & Subscribe",
      recruiterName: "Admin Jessica • Global Media Group",
      dialogues: [
        {
          recruiter:
            "Pekerjaan Freelance: Cukup Like 3 video YouTube, langsung ditransfer Rp150.000 ke e-wallet. Mau mulai misi sekarang?",
          options: [
            {
              text: "Boleh, tapi saya tidak akan melakukan deposit uang apapun nanti.",
              feedback:
                "🛡️ Waspada! Ini adalah taktik awal membangun kepercayaan dengan uang receh.",
              penalty: 5,
            },
            {
              text: "Ini modus Task Scam. Saya tidak tertarik dan akan melaporkan grup ini.",
              feedback:
                "🏆 Refleks Pro! Kamu langsung mematikan jebakan sejak awal.",
              penalty: 0,
            },
          ],
        },
        {
          recruiter:
            "Selamat! Komisi pertama Rp150.000 berhasil cair. Sekarang untuk membuka misi VIP komisi Rp1.800.000, silakan transfer deposit jaminan Rp500.000.",
          options: [
            {
              text: "Saya tolak transfer deposit modal. Saya berhenti sampai di sini.",
              feedback:
                "🛡️ Mantap! Kamu tidak terpancing kerakusan dan berhasil keluar tanpa kerugian.",
              penalty: 0,
            },
            {
              text: "Wah menggiurkan, saya transfer Rp500.000 ya.",
              feedback:
                "🚨 Kerugian Finansial! Uang deposit Rp500.000 akan dibawa kabur.",
              penalty: 50,
            },
          ],
        },
      ],
    },
  ]

  const curScenario = scenarios[currentScenarioIndex]
  const curDialogue =
    curScenario.dialogues[chatStep] || curScenario.dialogues[0]

  const handleSelectOption = (penalty: number) => {
    setScore((prev) => Math.max(10, prev - penalty))
    if (chatStep + 1 < curScenario.dialogues.length) {
      setChatStep(chatStep + 1)
    } else {
      setCompleted(true)
    }
  }

  const handleReset = () => {
    setChatStep(0)
    setScore(100)
    setCompleted(false)
  }

  return (
    <div className="min-h-screen bg-[#F7F7F0] bg-warm-grid text-[#202C2B] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#064B50]/10">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#202C2B] hover:text-[#064B50] transition-colors p-2 rounded-xl hover:bg-white border border-transparent hover:border-[#064B50]/15"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {lang === "ID" ? "Kembali ke Beranda" : "Back to Homepage"}
            </span>
          </button>

          <div className="flex items-center gap-2 bg-[#064B50]/10 border border-[#064B50]/20 px-3 py-1.5 rounded-full text-xs font-bold text-[#064B50]">
            <Sparkles className="w-3.5 h-3.5 text-[#087F7A]" />
            <span>Jeli Scam Simulator • Interaktif</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#064B50] tracking-tight mb-2">
            {lang === "ID"
              ? "Scam Simulator Interaktif"
              : "Interactive Scam Simulator"}
          </h1>
          <p className="text-sm sm:text-base text-[#202C2B]/80">
            {lang === "ID"
              ? "Pilih respon terbaikmu saat menghadapi chat perekrut palsu dan uji skor kewaspadaan karirmu!"
              : "Test your reflexes against simulated fraudulent recruiter tactics and build your awareness!"}
          </p>
        </div>

        {/* Scenario Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {scenarios.map((sc, idx) => (
            <button
              key={sc.id}
              onClick={() => {
                setCurrentScenarioIndex(idx)
                handleReset()
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                currentScenarioIndex === idx
                  ? "bg-[#064B50] text-white shadow-sm"
                  : "bg-white text-[#202C2B]/75 hover:text-[#064B50] border border-[#064B50]/15"
              }`}
            >
              {sc.title}
            </button>
          ))}
        </div>

        {/* Main Simulation Window */}
        <div className="bg-white border border-[#064B50]/15 rounded-3xl shadow-lg overflow-hidden mb-8">
          {/* Simulator Header */}
          <div className="p-4 sm:p-5 bg-[#F7F7F0] border-b border-[#064B50]/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-[#064B50]">
                {curScenario.recruiterName}
              </p>
              <p className="text-[10px] text-[#202C2B]/60">
                {t(lang, "status")}
              </p>
            </div>

            {/* Awareness Score Meter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#202C2B]/70">
                {t(lang, "awarenessScore")}
              </span>
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  score > 70
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }`}
              >
                {score} / 100
              </span>
            </div>
          </div>

          {/* Simulator Body */}
          <div className="p-5 sm:p-8 space-y-6 bg-[#FAFBF6]">
            {/* Recruiter Message */}
            <div className="flex items-start gap-3 max-w-xl">
              <div className="w-8 h-8 rounded-full bg-[#EBECE1] flex items-center justify-center text-xs shrink-0 mt-1">
                👩‍💼
              </div>
              <div className="bg-white border border-[#064B50]/12 rounded-2xl rounded-tl-sm p-4 text-xs sm:text-sm text-[#202C2B] leading-relaxed shadow-2xs">
                {curDialogue.recruiter}
              </div>
            </div>

            {/* Candidate Options when not completed */}
            {!completed ? (
              <div className="pt-4 border-t border-[#064B50]/10 space-y-3">
                <p className="text-xs font-bold text-[#064B50]">
                  {t(lang, "chooseReply")}
                </p>
                <div className="space-y-2">
                  {curDialogue.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(opt.penalty)}
                      className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#F7F7F0] border border-[#064B50]/12 text-xs sm:text-sm text-[#202C2B] transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <span>{opt.text}</span>
                      <Send className="w-4 h-4 text-slate-400 group-hover:text-[#064B50] shrink-0 ml-3 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Debrief Completion Card */
              <div className="p-6 rounded-2xl bg-white border border-[#064B50]/15 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-[#064B50] mb-1">
                  {t(lang, "simulationDone")}
                </h3>
                <p className="text-xs text-[#202C2B]/80 mb-4 max-w-md mx-auto">
                  {score >= 80
                    ? "Luar biasa! Naluri keamanan karirmu sangat tajam. Kamu berhasil menangkis jebakan penipuan tanpa kehilangan uang."
                    : "Kamu telah belajar mengenali modus ini. Selalu ingat: perusahaan resmi tidak pernah memungut uang di awal!"}
                </p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl bg-[#F7F7F0] hover:bg-[#EBECE1] text-xs font-bold text-[#202C2B] flex items-center gap-1.5 border border-[#064B50]/15"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t(lang, "tryAgain")}</span>
                  </button>
                  <button
                    onClick={onBackToHome}
                    className="px-5 py-2 rounded-xl bg-[#064B50] hover:bg-[#087F7A] text-xs font-bold text-white shadow-xs"
                  >
                    {t(lang, "backHome")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScamSimulatorPage
