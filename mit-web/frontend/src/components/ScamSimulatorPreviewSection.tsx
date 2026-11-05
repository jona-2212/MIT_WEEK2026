import React, { useState } from "react"
import { ArrowRight, Brain, CheckCircle2, Sparkles, Target } from "lucide-react"

interface ScamSimulatorPreviewSectionProps {
  onStartSimulation: () => void
  lang: "ID" | "EN"
}

export const ScamSimulatorPreviewSection: React.FC<ScamSimulatorPreviewSectionProps> = ({ onStartSimulation, lang }) => {
  const [active, setActive] = useState(0)
  const steps = lang === "ID"
    ? ["Amati pola", "Pilih respons", "Pahami risikonya"]
    : ["Spot the pattern", "Choose a response", "Understand the risk"]

  return (
    <section id="scam-simulator" className="relative overflow-hidden border-t border-[#064B50]/10 bg-[#EBECE1]/45 py-24 text-[#202C2B]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#064B50]/15 bg-white px-3.5 py-1.5 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-[#087F7A]" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#064B50]">{lang === "ID" ? "Simulator Interaktif" : "Interactive Simulator"}</span>
            </div>
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-[#064B50] sm:text-4xl">
              {lang === "ID" ? "Belajar merespons, tanpa takut salah." : "Practise your response, without the real-world risk."}
            </h2>
            <p className="mb-7 text-base leading-relaxed text-[#202C2B]/80">
              {lang === "ID"
                ? "Masuk ke ruang latihan Jeli untuk menguji refleks, mengenali tekanan, dan memahami konsekuensi dari setiap keputusan."
                : "Enter Jeli's practice space to test your reflexes, recognise pressure tactics, and understand the consequences of each decision."}
            </p>
            <button onClick={onStartSimulation} className="group flex items-center gap-2.5 rounded-xl bg-[#064B50] px-6 py-3 font-extrabold text-white shadow-sm transition-all hover:bg-[#087F7A]">
              <Sparkles className="h-4 w-4 text-[#B8F000]" />
              {lang === "ID" ? "Masuk ke Simulator" : "Enter Simulator"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-[#064B50]/15 bg-white p-5 shadow-lg sm:p-7">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#064B50]">{lang === "ID" ? "Rute latihanmu" : "Your practice route"}</p>
                  <p className="mt-1 text-sm text-[#202C2B]/60">{lang === "ID" ? "Satu langkah kecil untuk jadi lebih siap." : "One small step towards staying ready."}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#B8F000]/40 text-[#064B50]"><Target className="h-5 w-5" /></div>
              </div>
              <div className="mb-6 grid grid-cols-3 gap-2">
                {steps.map((step, index) => (
                  <button key={step} onClick={() => setActive(index)} className={`rounded-xl px-2 py-3 text-center text-[11px] font-bold transition-all ${active === index ? "bg-[#064B50] text-white shadow-sm" : "bg-[#F7F7F0] text-[#202C2B]/60 hover:text-[#064B50]"}`}>
                    <span className="mb-1 block text-lg font-black">{String(index + 1).padStart(2, "0")}</span>
                    {step}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl bg-[#064B50] p-5 text-white">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Brain className="h-5 w-5 text-[#B8F000]" /></div>
                  <div>
                    <p className="text-sm font-extrabold">{steps[active]}</p>
                    <p className="text-[11px] text-white/60">{lang === "ID" ? "Jeli memandumu selangkah demi selangkah" : "Jeli guides you step by step"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-[#B8F000]" />
                  {lang === "ID" ? "Aman untuk mencoba, dirancang untuk belajar." : "Safe to try, designed to teach."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ScamSimulatorPreviewSection
