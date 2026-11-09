import React from "react"
import { ArrowRight, Search, ShieldCheck, Sparkles } from "lucide-react"
import JeliCompanion from "./JeliCompanion"
import { t } from "../i18n"

interface ClosingCtaSectionProps {
  onCheckJobOffer: () => void
  onStartSimulation: () => void
  lang: "ID" | "EN"
}

export const ClosingCtaSection: React.FC<ClosingCtaSectionProps> = ({
  onCheckJobOffer,
  onStartSimulation,
  lang,
}) => (
  <section className="bg-[#064B50] py-24 text-white">
    <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
      <div className="lg:col-span-8">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#B8F000]">
          <ShieldCheck className="h-4 w-4" /> MATA JELI, LANGKAH PASTI
        </div>
        <h2 className="mb-5 text-3xl font-extrabold sm:text-5xl">
          {lang === "ID" ? "Lindungi langkah karirmu." : "Start your next move safely."}
        </h2>
        <p className="mb-8 max-w-2xl text-slate-200">
          {lang === "ID" ? "Periksa tawaran mencurigakan sebelum membagikan data atau mentransfer uang." : "Check suspicious offers before sharing sensitive details or transferring money."}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={onCheckJobOffer} className="flex items-center justify-center gap-2 rounded-xl bg-[#B8F000] px-6 py-3 font-bold text-[#064B50]">
            <Search className="h-4 w-4" /> {t(lang, "checkOffer")} <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={onStartSimulation} className="flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 font-bold">
            <Sparkles className="h-4 w-4 text-[#B8F000]" /> {t(lang, "simulator")}
          </button>
        </div>
      </div>
      <div className="flex justify-center lg:col-span-4">
        <JeliCompanion state="celebrate" size="xl" lang={lang} />
      </div>
    </div>
  </section>
)

export default ClosingCtaSection
