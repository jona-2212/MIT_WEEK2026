import React, { useState } from "react"
import {
  Sparkles,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
} from "lucide-react"

interface ScamSimulatorPreviewSectionProps {
  onStartSimulation: () => void
  lang: "ID" | "EN"
}

export const ScamSimulatorPreviewSection: React.FC<ScamSimulatorPreviewSectionProps> =
  ({ onStartSimulation, lang }) => {
    const [selectedResponse, setSelectedResponse] = useState<number | null>(
      null,
    )

    const sampleResponses = [
      {
        id: 0,
        text:
          lang === "ID"
            ? "Boleh minta verifikasi proses ini melalui website resmi perusahaan?"
            : "Can I verify this recruitment process through the company official website?",
        feedback:
          lang === "ID"
            ? "🛡️ Respon Bijak! Perekrut asli selalu mengarahkan ke portal resmi."
            : "🛡️ Smart choice! Real recruiters always welcome official verification.",
        isSafe: true,
      },
      {
        id: 1,
        text:
          lang === "ID"
            ? "Baik bu, saya transfer sekarang Rp250.000 ke rekening mana?"
            : "Sure, which account should I transfer the Rp250.000 to right now?",
        feedback:
          lang === "ID"
            ? "🚨 Jebakan! Uang Anda akan hilang dan nomor Anda segera diblokir."
            : "🚨 Trap! Your money will be lost and your contact will be blocked.",
        isSafe: false,
      },
      {
        id: 2,
        text:
          lang === "ID"
            ? "Saya akan cek nomor rekening ini dulu di Jeli & CekRekening.id."
            : "I will verify this bank account on Jeli first.",
        feedback:
          lang === "ID"
            ? "🏆 Jurus Pro! Penipu biasanya langsung membatalkan niatnya saat Anda waspada."
            : "🏆 Pro move! Scammers often back down when they see vigilance.",
        isSafe: true,
      },
    ]

    return (
      <section
        id="scam-simulator"
        className="relative py-24 bg-[#EBECE1]/45 text-[#202C2B] overflow-hidden border-t border-[#064B50]/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Headline & Description */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#064B50]/15 mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#087F7A]" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#064B50]">
                {lang === "ID"
                  ? "SIMULATOR INTERAKTIF"
                  : "INTERACTIVE SIMULATOR"}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#064B50] mb-4">
              {lang === "ID"
                ? "Apakah kamu akan terjebak penipuan ini?"
                : "Would you fall for this scam?"}
            </h2>
            <p className="text-base sm:text-lg text-[#202C2B]/80">
              {lang === "ID"
                ? "Latih kemampuanmu mengenali taktik licik perekrut palsu melalui simulasi percakapan interaktif berbasis kasus nyata."
                : "Practice recognizing suspicious recruitment tactics through realistic recruiter conversations."}
            </p>
          </div>

          {/* Main Preview Container */}
          <div className="max-w-3xl mx-auto relative">
            {/* Handwritten Annotation */}
            <div className="absolute -top-5 -right-2 sm:-right-6 bg-[#B8F000] text-[#064B50] font-handwriting text-base sm:text-lg font-bold px-3 py-1 rounded-xl shadow-md transform rotate-4 border border-[#064B50]/20 z-20 pointer-events-none select-none">
              {lang === "ID"
                ? "Coba tebak mana yang jebakan! ✍️"
                : "Spot the red flag before you reply!"}
              <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-[#B8F000] transform rotate-45 border-r border-b border-[#064B50]/20" />
            </div>

            {/* Chat Window Frame */}
            <div className="bg-white border border-[#064B50]/15 rounded-3xl shadow-lg overflow-hidden">
              {/* Chat Header Bar */}
              <div className="px-5 py-4 bg-[#F7F7F0] border-b border-[#064B50]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#064B50] flex items-center justify-center text-white font-bold text-sm">
                      HR
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-[#202C2B]">
                        Dewi Sartika • HR Talent PT Mega Global Indo
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#202C2B]/60">
                      Online • Sedang mengetik...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#064B50]/10 text-[#064B50] border border-[#064B50]/20 px-2.5 py-1 rounded-full">
                    Simulation Preview
                  </span>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="p-5 sm:p-6 space-y-4 bg-[#FAFBF6]">
                {/* Recruiter Message */}
                <div className="flex items-start gap-3 max-w-xl">
                  <div className="w-8 h-8 rounded-full bg-[#EBECE1] flex items-center justify-center text-xs shrink-0 mt-1">
                    👩‍💼
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-[#202C2B]/60 font-semibold ml-1">
                      Perekrut
                    </span>
                    <div className="bg-white border border-[#064B50]/12 rounded-2xl rounded-tl-sm p-4 text-xs sm:text-sm text-[#202C2B] leading-relaxed shadow-2xs relative">
                      &quot;Selamat! Anda telah terpilih untuk tahap akhir
                      wawancara kerja.{" "}
                      <mark className="bg-red-100 text-red-800 border-b-2 border-red-400 font-bold px-1.5 py-0.5 rounded">
                        Mohon transfer Rp250.000 untuk mengamankan slot
                        wawancara Anda
                      </mark>{" "}
                      dan administrasi batch tes kesehatan besok pagi.&quot;
                    </div>

                    {/* Red Flag Warning Indicator Pill */}
                    <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl text-[11px] text-red-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span className="font-bold">Indikator Bahaya:</span>
                      <span>Permintaan transfer uang sebelum wawancara.</span>
                    </div>
                  </div>
                </div>

                {/* Candidate Message */}
                <div className="flex items-start justify-end gap-3 max-w-xl ml-auto pt-2">
                  <div className="space-y-1.5 text-right">
                    <span className="text-[11px] text-[#087F7A] font-semibold mr-1">
                      Kandidat (Kamu)
                    </span>
                    <div className="bg-[#064B50] text-white rounded-2xl rounded-tr-sm p-4 text-xs sm:text-sm leading-relaxed shadow-sm text-left">
                      &quot;Apakah saya dapat memverifikasi proses rekrutmen ini
                      melalui website resmi perusahaan atau email korporat PT
                      Mega Global Indo?&quot;
                    </div>
                    <p className="text-[10px] text-[#202C2B]/50 mr-1">
                      Terkirim • Dibaca 14:21
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#087F7A] text-white flex items-center justify-center text-xs shrink-0 mt-1">
                    🧑‍💻
                  </div>
                </div>

                {/* Interactive Try a Response Pill Selector */}
                <div className="pt-4 border-t border-[#064B50]/10">
                  <p className="text-xs font-bold text-[#202C2B] mb-2.5 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-[#087F7A]" />
                    <span>
                      Bagaimana responmu jika menghadapi situasi di atas?
                    </span>
                  </p>
                  <div className="space-y-2">
                    {sampleResponses.map((res) => (
                      <button
                        key={res.id}
                        onClick={() => setSelectedResponse(res.id)}
                        className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition-all duration-200 border flex items-center justify-between ${
                          selectedResponse === res.id
                            ? res.isSafe
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs"
                              : "bg-red-50 border-red-300 text-red-900 shadow-2xs"
                            : "bg-white border-[#064B50]/12 text-[#202C2B] hover:bg-[#F7F7F0]"
                        }`}
                      >
                        <span>{res.text}</span>
                        {selectedResponse === res.id && (
                          <span className="text-[10px] font-black uppercase tracking-wider shrink-0 ml-2">
                            {res.isSafe ? "AMAN" : "BAHAYA"}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Instant Feedback Callout when option clicked */}
                  {selectedResponse !== null && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-[#064B50]/15 text-xs animate-in fade-in duration-200">
                      <p className="font-semibold text-[#202C2B]">
                        {sampleResponses[selectedResponse].feedback}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Footer Call-To-Action */}
              <div className="p-5 sm:p-6 bg-[#F7F7F0] border-t border-[#064B50]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold text-[#064B50]">
                    {lang === "ID"
                      ? "Ingin mencoba skenario percakapan lengkap?"
                      : "Want to test full branching scenarios?"}
                  </p>
                  <p className="text-[11px] text-[#202C2B]/70 mt-0.5">
                    {lang === "ID"
                      ? "Uji refleksmu di Simulator Penipuan dengan panduan evaluasi Jeli."
                      : "Test your reflexes in our full Simulator with Jeli awareness scoring."}
                  </p>
                </div>

                {/* Primary CTA: Start Simulation */}
                <button
                  onClick={onStartSimulation}
                  className="w-full sm:w-auto bg-[#064B50] hover:bg-[#087F7A] text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 hover:scale-102 active:scale-98 shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-[#B8F000]" />
                  <span>
                    {lang === "ID" ? "Mulai Simulasi" : "Start Simulation"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

export default ScamSimulatorPreviewSection
