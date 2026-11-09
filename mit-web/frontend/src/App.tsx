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

function pageFromHash(): Page {
  const hash = window.location.hash.replace("#", "")
  if (hash === "checker" || hash === "simulator" || hash === "avatar" || hash === "roleplay") {
    return hash === "roleplay" ? "avatar" : (hash as Page)
  }
  return "home"
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>(pageFromHash)
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("jeli_lang")
      if (saved === "EN" || saved === "ID") return saved
    } catch {}
    return "ID"
  })

  useEffect(() => {
    const handleHashChange = () => setActivePage(pageFromHash())
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [activePage])

  const navigate = (page: Page) => {
    setActivePage(page)
    window.history.pushState(null, "", page === "home" ? window.location.pathname : `#${page}`)
  }

  const handleToggleLang = () => {
    setLang((prev) => {
      const next: Language = prev === "ID" ? "EN" : "ID"
      try {
        localStorage.setItem("jeli_lang", next)
      } catch {}
      return next
    })
  }

  const scrollTo = (id: string) => {
    if (activePage !== "home") {
      setActivePage("home")
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100)
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F0] font-sans text-[#202C2B]">
      <Navbar
        activePage={activePage}
        onNavigate={navigate}
        lang={lang}
        onToggleLang={handleToggleLang}
      />
      {activePage === "home" ? (
        <main>
          <HeroSection
            onCheckJobOffer={() => navigate("checker")}
            onExploreHowItWorks={() => scrollTo("how-it-works")}
            onOpenAvatar={() => navigate("avatar")}
            lang={lang}
          />
          <HowItWorksSection onCheckJobOffer={() => navigate("checker")} lang={lang} />
          <KnowTheScamsSection onCheckJobOffer={() => navigate("checker")} lang={lang} />
          <ScamSimulatorPreviewSection onStartSimulation={() => navigate("simulator")} lang={lang} />
        </main>
      ) : activePage === "checker" ? (
        <JobOfferCheckerPage onBackToHome={() => navigate("home")} onNavigate={navigate} lang={lang} />
      ) : activePage === "simulator" ? (
        <ScamSimulatorPage
          onBackToHome={() => navigate("home")}
          onOpenAvatar={() => navigate("avatar")}
          lang={lang}
        />
      ) : (
        <LiveAvatarRoleplayPage
          onBackToHome={() => navigate("home")}
          onOpenSimulator={() => navigate("simulator")}
          lang={lang}
        />
      )}
      <Footer onNavigate={navigate} onScrollTo={scrollTo} lang={lang} />
    </div>
  )
}
