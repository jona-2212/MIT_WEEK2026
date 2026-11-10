import { useEffect, useState } from "react"
import { Navbar } from "./components/Navbar"
import { HeroSection } from "./components/HeroSection"
import { HowItWorksSection } from "./components/HowItWorksSection"
import { KnowTheScamsSection } from "./components/KnowTheScamsSection"
import { ScamSimulatorPreviewSection } from "./components/ScamSimulatorPreviewSection"
import Footer from "./components/Footer"
import { JobOfferCheckerPage } from "./components/JobOfferCheckerPage"
import { ScamSimulatorPage } from "./components/ScamSimulatorPage"
import { LiveAvatarRoleplayPage } from "./components/LiveAvatarRoleplayPage"
import type { Language } from "./i18n"

export type Page = "home" | "checker" | "simulator" | "avatar"
const languages = ["ID", "EN"] as const

function pageFromHash(hash: string): Page {
  if (hash === "roleplay") return "avatar"
  if (hash === "checker" || hash === "simulator" || hash === "avatar") return hash
  return "home"
}

const readHash = () => window.location.hash.slice(1)

export default function App() {
  const [avatarVoiceEnabled, setAvatarVoiceEnabled] = useState(true)
  const [hash, setHash] = useState(readHash)
  const activePage = pageFromHash(hash)
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("jeli_lang")
      if (saved === "EN" || saved === "ID") return saved
    } catch {
      // Language preference still works when browser storage is unavailable.
    }
    return "ID"
  })

  useEffect(() => {
    const handleHashChange = () => setHash(readHash())
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  useEffect(() => {
    if (hash === "how-it-works" || hash === "know-the-scams") {
      const heading = document.getElementById(hash)?.querySelector("h2")
      heading?.focus({ preventScroll: true })
      heading?.scrollIntoView({ block: "start" })
    } else {
      window.scrollTo({ top: 0, behavior: "instant" })
    }
  }, [hash])

  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase()
    document.title = lang === "ID" ? "Jeli — Keamanan Lowongan Kerja" : "Jeli — Job Offer Safety"
    try {
      localStorage.setItem("jeli_lang", lang)
    } catch {
      // Language selection still works without browser storage.
    }
  }, [lang])

  const navigate = (page: Page) => {
    window.location.hash = page
  }

  const handleToggleLang = () => {
    setLang((prev) => prev === "ID" ? "EN" : "ID")
  }

  return (
    <div className="min-h-screen bg-[#F7F7F0] font-sans text-[#202C2B]">
      <Navbar
        activePage={activePage}
        lang={lang}
        onToggleLang={handleToggleLang}
      />
      {activePage === "home" ? (
        <main>
          <HeroSection
            onCheckJobOffer={() => navigate("checker")}
            onOpenAvatar={() => navigate("avatar")}
            lang={lang}
          />
          <HowItWorksSection onCheckJobOffer={() => navigate("checker")} lang={lang} />
          <KnowTheScamsSection onCheckJobOffer={() => navigate("checker")} lang={lang} />
          <ScamSimulatorPreviewSection onStartSimulation={() => navigate("simulator")} lang={lang} />
        </main>
      ) : activePage === "checker" ? (
        <JobOfferCheckerPage onBackToHome={() => navigate("home")} lang={lang} />
      ) : activePage === "simulator" ? (
        <ScamSimulatorPage
          onBackToHome={() => navigate("home")}
          onOpenAvatar={() => navigate("avatar")}
          lang={lang}
        />
      ) : (
        languages.map((locale) => (
          <LiveAvatarRoleplayPage
            key={locale}
            active={locale === lang}
            voiceEnabled={avatarVoiceEnabled}
            onVoiceChange={setAvatarVoiceEnabled}
            onBackToHome={() => navigate("home")}
            onOpenSimulator={() => navigate("simulator")}
            lang={locale}
          />
        ))
      )}
      <Footer lang={lang} />
    </div>
  )
}
