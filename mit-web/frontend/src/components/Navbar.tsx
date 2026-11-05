import React, { useState, useEffect } from "react"
import { Sparkles, Menu, X, ArrowRight, Search, Building2 } from "lucide-react"
import { t } from "../i18n"
import JeliLogo from "./JeliLogo"
import { AHU_COMPANY_SEARCH_URL } from "../services/api"

interface NavbarProps {
  activePage?: "home" | "checker" | "simulator" | "company"
  onNavigate?: (page: "home" | "checker" | "simulator" | "company") => void
  lang?: "ID" | "EN"
  onToggleLang?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage = "home",
  onNavigate = () => undefined,
  lang = "ID",
  onToggleLang = () => undefined,
}) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false)
    if (activePage !== "home") {
      onNavigate("home")
      setTimeout(() => {
        const el = document.getElementById(sectionId)
        if (el) el.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } else {
      const el = document.getElementById(sectionId)
      if (el) el.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleHomeClick = () => {
    setMobileMenuOpen(false)
    onNavigate("home")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#F7F7F0]/95 backdrop-blur-md border-b border-[#064B50]/12 shadow-sm py-3"
          : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Jeli Brand Logo */}
          <button
            onClick={handleHomeClick}
            className="flex items-center gap-2 group focus:outline-none text-left transition-transform hover:scale-[1.02]"
          >
            <JeliLogo variant="full" size="lg" />
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-white/90 border border-[#064B50]/10 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm">
            <button
              onClick={handleHomeClick}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                activePage === "home"
                  ? "bg-[#064B50]/10 text-[#064B50] font-bold"
                  : "text-[#202C2B]/80 hover:text-[#064B50] hover:bg-[#064B50]/5"
              }`}
            >
              {t(lang, "home")}
            </button>

            <button
              onClick={() => scrollToSection("how-it-works")}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-[#202C2B]/80 hover:text-[#064B50] hover:bg-[#064B50]/5 transition-all duration-200"
            >
              {t(lang, "howItWorks")}
            </button>

            <button
              onClick={() => scrollToSection("know-the-scams")}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-[#202C2B]/80 hover:text-[#064B50] hover:bg-[#064B50]/5 transition-all duration-200 flex items-center gap-1.5"
            >
              {t(lang, "knowScams")}
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8F000]" />
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                window.location.href = AHU_COMPANY_SEARCH_URL
              }}
              className="flex items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-[#202C2B] hover:bg-[#F7F7F0]"
            >
              <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#087F7A]" />{lang === "ID" ? "Cek PT" : "Company Check"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => onNavigate("simulator")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                activePage === "simulator"
                  ? "bg-[#064B50] text-white font-bold shadow-sm"
                  : "text-[#202C2B]/80 hover:text-[#064B50] hover:bg-[#064B50]/5"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#087F7A]" />
              {t(lang, "simulator")}
            </button>
            <button
              onClick={() => { window.location.href = AHU_COMPANY_SEARCH_URL }}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-[#202C2B]/80 transition-all duration-200 hover:bg-[#064B50]/5 hover:text-[#064B50]"
            >
              <Building2 className="h-3.5 w-3.5 text-[#087F7A]" />
              {lang === "ID" ? "Cek PT" : "Company Check"}
            </button>
          </nav>

          {/* Right-side Actions */}
          <div className="flex items-center gap-2.5">
            {/* Language Toggle */}
            <button
              onClick={onToggleLang}
              title="Ganti Bahasa / Switch Language"
              className="px-2.5 py-1 text-xs font-bold rounded-xl border border-[#064B50]/15 bg-white text-[#202C2B] hover:border-[#064B50]/30 transition-colors flex items-center gap-1 shadow-2xs"
            >
              <span
                className={
                  lang === "ID"
                    ? "text-[#064B50] font-black"
                    : "text-[#202C2B]/60"
                }
              >
                ID
              </span>
              <span className="text-slate-300">/</span>
              <span
                className={
                  lang === "EN"
                    ? "text-[#064B50] font-black"
                    : "text-[#202C2B]/60"
                }
              >
                EN
              </span>
            </button>

            {/* Primary CTA */}
            <button
              onClick={() => onNavigate("checker")}
              className="relative group bg-[#064B50] hover:bg-[#087F7A] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-sm transition-all duration-200 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Search className="w-4 h-4 text-[#B8F000]" />
              <span>
                {t(lang, "checkOffer")}
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#202C2B] hover:bg-white border border-[#064B50]/15"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 pb-4 px-3 bg-white border border-[#064B50]/12 backdrop-blur-xl rounded-2xl shadow-xl flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={handleHomeClick}
              className="px-4 py-2.5 text-left text-sm font-semibold rounded-xl text-[#202C2B] hover:bg-[#F7F7F0] flex items-center justify-between"
            >
              <span>{t(lang, "home")}</span>
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="px-4 py-2.5 text-left text-sm font-semibold rounded-xl text-[#202C2B] hover:bg-[#F7F7F0] flex items-center justify-between"
            >
              <span>{t(lang, "howItWorks")}</span>
            </button>
            <button
              onClick={() => scrollToSection("know-the-scams")}
              className="px-4 py-2.5 text-left text-sm font-semibold rounded-xl text-[#202C2B] hover:bg-[#F7F7F0] flex items-center justify-between"
            >
              <span>
                {t(lang, "knowScamsFull")}
              </span>
              <span className="text-[10px] bg-[#064B50]/10 text-[#064B50] px-2 py-0.5 rounded-full font-bold">
                {lang === "ID" ? "5 Tipe" : "5 Types"}
              </span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                onNavigate("simulator")
              }}
              className="px-4 py-2.5 text-left text-sm font-semibold rounded-xl text-[#202C2B] hover:bg-[#F7F7F0] flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#087F7A]" />
                {t(lang, "simulator")}
              </span>
              <span className="text-[10px] bg-[#B8F000]/30 text-[#064B50] px-2 py-0.5 rounded-full font-bold">
                {t(lang, "interactive")}
              </span>
            </button>
            <div className="pt-2 border-t border-slate-100 mt-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onNavigate("checker")
                }}
                className="w-full bg-[#064B50] hover:bg-[#087F7A] text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <Search className="w-4 h-4 text-[#B8F000]" />
                {t(lang, "checkOfferNow")}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
