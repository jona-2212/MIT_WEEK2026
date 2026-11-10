import React from "react"
import { ArrowDown, ArrowRight, Building2, Layers, Search, ShieldCheck } from "lucide-react"
import { JeliCompanion } from "./JeliCompanion"

interface HeroSectionProps {
  onCheckJobOffer: () => void
  onOpenAvatar?: () => void
  lang: "ID" | "EN"
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onCheckJobOffer,
  onOpenAvatar,
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
            <p className="mb-2 font-serif-italic text-lg font-bold text-[#064B50] sm:text-xl">
              {lang === "ID" ? "Kenali yang janggal, putuskan dengan yakin." : "See through the noise. Navigate with confidence."}
            </p>
            <p className="text-base leading-relaxed text-[#202C2B]/80 sm:text-lg">
              {lang === "ID"
                ? "Jeli membantumu memeriksa tawaran kerja, memahami pola manipulasi, dan berlatih mengambil keputusan aman melalui simulasi interaktif."
                : "Jeli helps you inspect job offers, understand manipulation patterns, and practise safer decisions through interactive simulations."}
            </p>
          </div>

          <div className="mb-10 flex w-full flex-col items-stretch gap-3.5 sm:w-auto sm:flex-row sm:items-center sm:flex-wrap">
            <button onClick={onCheckJobOffer} className="group flex items-center justify-center gap-3 rounded-xl bg-[#064B50] px-7 py-3.5 text-base font-extrabold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-[#087F7A]">
              <Search className="h-5 w-5 text-[#B8F000]" />
              {lang === "ID" ? "Cek Tawaran Kerja" : "Check a Job Offer"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a href="#how-it-works" className="group flex items-center justify-center gap-2.5 rounded-xl border border-[#064B50]/15 bg-white px-6 py-3.5 text-base font-bold shadow-2xs transition-all hover:bg-[#EBECE1]">
              {lang === "ID" ? "Pelajari Cara Kerjanya" : "Explore How It Works"}
              <ArrowDown className="h-4 w-4 text-[#064B50] transition-transform group-hover:translate-y-0.5" />
            </a>
            {onOpenAvatar && (
              <button
                onClick={onOpenAvatar}
                className="group flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#087F7A]/40 bg-[#EFF7D5]/70 px-5 py-3.5 text-sm font-extrabold text-[#064B50] shadow-2xs transition-all hover:bg-[#EFF7D5] hover:border-[#087F7A]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#087F7A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#087F7A]"></span>
                </span>
                <span>
                  {lang === "ID" ? "Tanya Jeli" : "Ask Jeli"}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>

        <div className="relative flex items-center justify-center lg:col-span-5">
          {/* Ambient Glow & Soft Decorative Rings */}
          <div className="pointer-events-none absolute -inset-6 flex items-center justify-center">
            <div className="h-64 w-64 rounded-full bg-gradient-to-tr from-[#087F7A]/20 via-[#B8F000]/25 to-[#064B50]/15 blur-3xl animate-pulse-soft" />
            <div className="absolute h-72 w-72 rounded-full border border-[#064B50]/10" />
            <div className="absolute h-96 w-96 rounded-full border border-dashed border-[#064B50]/10" />
          </div>

          <div className="relative flex w-full max-w-sm flex-col items-center justify-center py-8 sm:py-12">
            {/* Mascot in the Center */}
            <div className="relative z-10 animate-float-slow transition-transform hover:scale-105">
              <JeliCompanion state="scanning" size="lg" onInteract={onOpenAvatar} lang={lang} />
            </div>

            {/* Floating Badge 1: Multi-Format (Top-Left) */}
            <div className="absolute -top-1 left-0 z-20 sm:-left-6 animate-float-gentle">
              <div className="flex items-center gap-2.5 rounded-2xl border border-[#064B50]/10 bg-white/85 px-3.5 py-2.5 shadow-lg shadow-[#064B50]/5 backdrop-blur-md transition-all hover:bg-white hover:shadow-xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#064B50]/10 text-[#064B50]">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-[#064B50]">
                    {lang === "ID" ? "Beragam Format" : "Multiple Formats"}
                  </p>
                  <p className="text-[10px] font-medium text-[#202C2B]/65">
                    {lang === "ID" ? "Teks • Gambar • URL" : "Text • Image • URL"}
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Badge 2: Legalitas AHU (Right / Top-Right) */}
            <div className="absolute top-10 -right-2 z-20 sm:-right-8 animate-float-reverse">
              <div className="flex items-center gap-2.5 rounded-2xl border border-[#064B50]/10 bg-white/85 px-3.5 py-2.5 shadow-lg shadow-[#064B50]/5 backdrop-blur-md transition-all hover:bg-white hover:shadow-xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-[#064B50]">
                    {lang === "ID" ? "Cek Perusahaan" : "Company Check"}
                  </p>
                  <p className="text-[10px] font-medium text-[#202C2B]/65">
                    {lang === "ID" ? "Lewat portal AHU" : "Via the AHU portal"}
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Badge 3: Privasi Terjaga (Bottom-Left) */}
            <div className="absolute -bottom-2 left-0 z-20 sm:-left-4 animate-float-gentle" style={{ animationDelay: "0.6s" }}>
              <div className="flex items-center gap-2.5 rounded-2xl border border-[#064B50]/10 bg-white/85 px-3.5 py-2.5 shadow-lg shadow-[#064B50]/5 backdrop-blur-md transition-all hover:bg-white hover:shadow-xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#B8F000]/40 text-[#064B50]">
                  <ShieldCheck className="h-4 w-4 text-[#064B50]" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold text-[#064B50]">
                    {lang === "ID" ? "Privat & Aman" : "Private & Secure"}
                  </p>
                  <p className="text-[10px] font-medium text-[#202C2B]/65">
                    {lang === "ID" ? "Tanpa registrasi akun" : "No account needed"}
                  </p>
                </div>
              </div>
            </div>

            {/* Micro Badge 4: Status Ready (Bottom-Right) */}
            <div className="absolute -bottom-3 right-0 z-20 sm:-right-4 animate-float-reverse" style={{ animationDelay: "1.4s" }}>
              <div className="flex items-center gap-2 rounded-full border border-[#064B50]/10 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#B8F000] animate-pulse" />
                <span className="text-[10px] font-bold text-[#064B50]">
                  {lang === "ID" ? "Siap Menganalisis" : "Ready to Inspect"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
)

export default HeroSection
