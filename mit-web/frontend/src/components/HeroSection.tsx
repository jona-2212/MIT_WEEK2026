import React from "react"
import { ArrowDown, ArrowRight, Eye, Search, ShieldCheck, Sparkles } from "lucide-react"
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
}) => (
  <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-[#F7F7F0] bg-warm-grid pb-20 pt-28 text-[#202C2B]">
    <div className="pointer-events-none absolute left-1/2 top-1/4 h-[450px] w-[650px] -translate-x-1/2 rounded-full bg-[#B8F000]/10 blur-[110px]" />
    <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#064B50]/15 bg-white px-3.5 py-1.5 shadow-2xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#B8F000] border border-[#064B50]/20" />
            <span className="text-xs font-bold uppercase tracking-wide text-[#064B50]">
              {lang === "ID" ? "Platform Keamanan Digital" : "Digital Safety Platform"}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-extrabold text-[#087F7A]">jeli.</span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-[1.12] tracking-tight text-[#202C2B] sm:text-5xl lg:text-6xl">
            {lang === "ID" ? "Lebih jeli sebelum melangkah." : "Stay sharp before you step forward."}
            <span className="mt-2 block text-[#064B50]">
              {lang === "ID" ? "Latih naluri amanmu." : "Train your safety instincts."}
            </span>
          </h1>
          <div className="mb-8 max-w-xl">
            <p className="mb-2 font-serif-italic text-lg font-bold text-[#087F7A] sm:text-xl">
              {lang === "ID" ? "Kenali yang janggal, putuskan dengan yakin." : "See through the noise. Navigate with confidence."}
            </p>
            <p className="text-base leading-relaxed text-[#202C2B]/80 sm:text-lg">
              {lang === "ID"
                ? "Jeli membantumu memeriksa tawaran kerja, memahami pola manipulasi, dan berlatih mengambil keputusan aman melalui simulasi interaktif."
                : "Jeli helps you inspect job offers, understand manipulation patterns, and practise safer decisions through interactive simulations."}
            </p>
          </div>

          <div className="mb-10 flex w-full flex-col items-stretch gap-3.5 sm:w-auto sm:flex-row sm:items-center">
            <button onClick={onCheckJobOffer} className="group flex items-center justify-center gap-3 rounded-xl bg-[#064B50] px-7 py-3.5 text-base font-extrabold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-[#087F7A]">
              <Search className="h-5 w-5 text-[#B8F000]" />
              {lang === "ID" ? "Cek Tawaran Kerja" : "Check a Job Offer"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={onExploreHowItWorks} className="group flex items-center justify-center gap-2.5 rounded-xl border border-[#064B50]/15 bg-white px-6 py-3.5 text-base font-bold shadow-2xs transition-all hover:bg-[#EBECE1]">
              {lang === "ID" ? "Pelajari Cara Kerjanya" : "Explore How It Works"}
              <ArrowDown className="h-4 w-4 text-[#064B50] transition-transform group-hover:translate-y-0.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-t border-[#064B50]/10 pt-6 text-xs text-[#202C2B]/70">
            <span><b className="text-[#202C2B]">48.200+</b> {lang === "ID" ? "Loker Dianalisis" : "Offers Analyzed"}</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#087F7A]" /><b className="text-[#202C2B]">99.4%</b> {lang === "ID" ? "Akurasi Deteksi" : "Detection Accuracy"}</span>
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#064B50]" />{lang === "ID" ? "Edukasi Praktis" : "Practical Learning"}</span>
          </div>
        </div>

        <div className="relative flex justify-center lg:col-span-5">
          <div className="relative w-full max-w-md rounded-3xl border border-[#064B50]/15 bg-white p-6 shadow-xl">
            <div className="mb-7 flex items-center justify-between border-b border-[#064B50]/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#064B50]/10 text-[#064B50]"><Eye className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs font-extrabold text-[#064B50]">Jeli Awareness Lab</p>
                  <p className="font-mono text-[10px] text-[#202C2B]/55">{lang === "ID" ? "Ruang latihan keputusan" : "Decision practice space"}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">READY</span>
            </div>
            <div className="mb-6 flex justify-center">
              <div className="animate-float-slow"><JeliCompanion state="scanning" size="lg" /></div>
            </div>
            <div className="space-y-3">
              {[
                lang === "ID" ? "Baca sinyal, bukan hanya janji" : "Read signals, not just promises",
                lang === "ID" ? "Latih respons tanpa risiko nyata" : "Practise responses without real-world risk",
                lang === "ID" ? "Bangun kebiasaan verifikasi" : "Build verification habits",
              ].map((label, index) => (
                <div key={label} className="flex items-center gap-3 rounded-xl bg-[#F7F7F0] p-3 text-xs font-bold text-[#202C2B]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B8F000] text-[10px] text-[#064B50]">{index + 1}</span>
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-[#064B50]/10 bg-[#064B50]/5 px-3 py-2 text-[10px] font-bold text-[#064B50]">
              <span>{lang === "ID" ? "Mode latihan aman" : "Safe practice mode"}</span>
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#B8F000]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

export default HeroSection
