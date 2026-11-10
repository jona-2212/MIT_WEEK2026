import { useEffect, useRef, useState } from "react"
import { ArrowRight, Home, Menu, Mic, Search, Sparkles, X } from "lucide-react"
import { t, type Language, type TranslationKey } from "../i18n"
import JeliLogo from "./JeliLogo"
import type { Page } from "../App"

interface NavbarProps {
  activePage?: Page
  lang?: Language
  onToggleLang?: () => void
}

const links: { href: string; label: TranslationKey; page?: Page; icon?: typeof Mic }[] = [
  { href: "#home", label: "home", page: "home", icon: Home },
  { href: "#simulator", label: "simulator", page: "simulator", icon: Sparkles },
  { href: "#avatar", label: "askJeli", page: "avatar", icon: Mic },
]

export function Navbar({ activePage = "home", lang = "ID", onToggleLang }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const languageAction = lang === "ID" ? "Ganti ke bahasa Inggris" : "Switch to Indonesian"

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const closeMenu = () => setMobileMenuOpen(false)
    window.addEventListener("hashchange", closeMenu)
    return () => window.removeEventListener("hashchange", closeMenu)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-[#064B50]/12 bg-[#F7F7F0]/95 shadow-sm backdrop-blur-md" : "bg-[#F7F7F0]/85"
      }`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && mobileMenuOpen) {
          setMobileMenuOpen(false)
          menuButton.current?.focus()
        }
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2">
          <a href="#home" onClick={() => setMobileMenuOpen(false)} className="shrink-0 rounded-lg" aria-label={t(lang, "home")}>
            <JeliLogo variant="full" size="lg" className="max-sm:h-9" />
          </a>

          <nav aria-label={t(lang, "navigation")} className="hidden items-center gap-1 rounded-2xl border border-[#064B50]/10 bg-white/90 px-2 py-1.5 shadow-sm md:flex">
            {links.map(({ href, label, page, icon: Icon }) => (
              <a
                key={href}
                href={href}
                aria-current={page === activePage ? "page" : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-[#064B50] hover:bg-[#064B50]/5 ${
                  page === activePage ? "bg-[#064B50]/10" : ""
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5 text-[#087F7A]" />}
                {t(lang, label)}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onToggleLang}
              aria-label={languageAction}
              title={languageAction}
              className="mr-2 flex min-h-10 items-center gap-1 rounded-xl border border-[#064B50]/15 bg-white px-2 text-xs font-bold text-[#202C2B] hover:border-[#064B50]/35 sm:mr-3.5 sm:px-3"
            >
              <span className={lang === "ID" ? "font-black text-[#064B50]" : "text-[#202C2B]/70"}>ID</span>
              <span aria-hidden="true">/</span>
              <span className={lang === "EN" ? "font-black text-[#064B50]" : "text-[#202C2B]/70"}>EN</span>
            </button>
            <a
              href="#checker"
              onClick={() => setMobileMenuOpen(false)}
              aria-label={t(lang, "checkOffer")}
              aria-current={activePage === "checker" ? "page" : undefined}
              className="flex min-h-10 items-center gap-1.5 rounded-xl bg-[#064B50] px-2.5 text-xs font-bold text-white hover:bg-[#087F7A] sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Search className="h-4 w-4 text-[#B8F000]" />
              <span className="sm:hidden">{lang === "ID" ? "Cek" : "Check"}</span>
              <span className="hidden sm:inline">{t(lang, "checkOffer")}</span>
              <ArrowRight className="hidden h-3.5 w-3.5 sm:block" />
            </a>
            <button
              type="button"
              ref={menuButton}
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? t(lang, "closeMenu") : t(lang, "openMenu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              className="min-h-10 rounded-xl border border-[#064B50]/15 bg-white p-2 text-[#202C2B] hover:bg-[#F7F7F0] md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav
          id="mobile-navigation"
          hidden={!mobileMenuOpen}
          aria-label={t(lang, "navigation")}
          className="mt-3 max-h-[calc(100dvh-5rem)] space-y-1 overflow-y-auto rounded-2xl border border-[#064B50]/15 bg-white p-2 shadow-lg md:hidden"
        >
          {links.map(({ href, label, page, icon: Icon }) => (
            <a
              key={href}
              href={href}
              aria-current={page === activePage ? "page" : undefined}
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#064B50] hover:bg-[#F7F7F0]"
            >
              {Icon && <Icon className="h-4 w-4 text-[#087F7A]" />}
              {t(lang, label)}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Navbar