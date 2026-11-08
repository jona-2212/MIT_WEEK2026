import React from "react"
import { ArrowUp } from "lucide-react"
import JeliLogo from "./JeliLogo"
import { t } from "../i18n"

interface FooterProps {
  onNavigate: (page: "home" | "checker" | "simulator") => void
  onScrollTo: (id: string) => void
  lang: "ID" | "EN"
}

const Footer: React.FC<FooterProps> = ({ onNavigate, onScrollTo, lang }) => (
  <footer className="bg-[#032528] px-4 py-12 text-xs text-slate-300">
    <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 md:flex-row md:items-start">
      {/* Kolom 1: Profil Jeli */}
      <div className="max-w-md">
        <JeliLogo variant="full" theme="dark" size="md" />
        <p className="mt-4 leading-relaxed text-slate-300/90">
          {lang === "ID"
            ? "Mata cermat untuk langkah digital yang lebih aman. Platform pendamping pencari kerja muda dalam mengenali risiko rekrutmen dan melatih respons kritis."
            : "A sharper eye for safer digital moves. Empowering job seekers to spot recruitment red flags and practise critical responses safely."}
        </p>
        <p className="mt-3 text-[11px] text-[#B8F000]/80">
          {lang === "ID"
            ? "🛡️ Privacy-first: Tanpa kewajiban pembuatan akun & tanpa penyimpanan data pribadi."
            : "🛡️ Privacy-first: No account required & no personal data retention."}
        </p>
      </div>

      {/* Kolom 2: Navigasi */}
      <div className="min-w-[180px]">
        <h4 className="mb-3.5 text-sm font-extrabold text-white">{t(lang, "navigation")}</h4>
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onScrollTo("how-it-works")}
            className="text-left text-slate-300 transition-colors hover:text-white"
          >
            {t(lang, "howItWorks")}
          </button>
          <button
            type="button"
            onClick={() => onScrollTo("know-the-scams")}
            className="text-left text-slate-300 transition-colors hover:text-white"
          >
            {t(lang, "knowScamsFull")}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("simulator")}
            className="text-left font-medium text-slate-300 transition-colors hover:text-[#B8F000]"
          >
            {t(lang, "simulator")}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("checker")}
            className="text-left font-medium text-slate-300 transition-colors hover:text-[#B8F000]"
          >
            {t(lang, "checkOffer")}
          </button>
        </div>
      </div>
    </div>

    {/* Bottom Bar: Hak Cipta & Tombol Kembali ke Atas */}
    <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
      <p>© {new Date().getFullYear()} Jeli Indonesia. All rights reserved.</p>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-all hover:border-white/25 hover:bg-white/10 hover:text-white"
      >
        <ArrowUp className="h-3.5 w-3.5 text-[#B8F000]" />
        {t(lang, "backTop")}
      </button>
    </div>
  </footer>
)

export default Footer
