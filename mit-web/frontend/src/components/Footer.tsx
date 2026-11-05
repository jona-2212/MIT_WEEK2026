import React from "react"
import { ArrowUp, ExternalLink } from "lucide-react"
import JeliLogo from "./JeliLogo"
import { t } from "../i18n"
import { AHU_COMPANY_SEARCH_URL } from "../services/api"

interface FooterProps {
  onNavigate: (page: "home" | "checker" | "simulator" | "company") => void
  onScrollTo: (id: string) => void
  lang: "ID" | "EN"
}

const Footer: React.FC<FooterProps> = ({ onNavigate, onScrollTo, lang }) => (
  <footer className="bg-[#032528] px-4 py-12 text-xs text-slate-300">
    <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3">
      <div>
        <JeliLogo variant="full" theme="dark" size="md" />
        <p className="mt-4 max-w-sm leading-relaxed">{lang === "ID" ? "Mata cermat untuk langkah digital yang lebih aman." : "A sharper eye for safer digital moves."}</p>
      </div>
      <div>
        <h4 className="mb-3 font-bold text-white">{t(lang, "navigation")}</h4>
        <div className="flex flex-col gap-2">
          <button onClick={() => onScrollTo("how-it-works")} className="text-left hover:text-white">{t(lang, "howItWorks")}</button>
          <button onClick={() => onScrollTo("know-the-scams")} className="text-left hover:text-white">{t(lang, "knowScamsFull")}</button>
          <button onClick={() => onNavigate("simulator")} className="text-left hover:text-[#B8F000]">{t(lang, "simulator")}</button>
          <button onClick={() => onNavigate("checker")} className="text-left hover:text-[#B8F000]">{t(lang, "checkOffer")}</button>
          <button onClick={() => { window.location.href = AHU_COMPANY_SEARCH_URL }} className="text-left hover:text-[#B8F000]">{lang === "ID" ? "Cek PT" : "Company Check"}</button>
        </div>
      </div>
      <div>
        <h4 className="mb-3 font-bold text-white">{t(lang, "officialChannels")}</h4>
        <a href="https://cekrekening.id" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white">CekRekening.id <ExternalLink className="h-3 w-3" /></a>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="mt-5 flex items-center gap-1 hover:text-white"><ArrowUp className="h-3 w-3" /> {t(lang, "backTop")}</button>
      </div>
    </div>
    <p className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-5">© {new Date().getFullYear()} Jeli Indonesia. All rights reserved.</p>
  </footer>
)

export default Footer
