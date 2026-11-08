import { useEffect, useState } from "react"
import { Navbar } from "./components/Navbar"
import { HeroSection } from "./components/HeroSection"
import { HowItWorksSection } from "./components/HowItWorksSection"
import { KnowTheScamsSection } from "./components/KnowTheScamsSection"
import { ScamSimulatorPreviewSection } from "./components/ScamSimulatorPreviewSection"
import Footer from "./components/Footer"
import { JobOfferCheckerPage } from "./components/JobOfferCheckerPage"
import { ScamSimulatorPage } from "./components/ScamSimulatorPage"
import type { Language } from "./i18n"

export type Page = "home" | "checker" | "simulator"

function pageFromHash(): Page {
  const hash = window.location.hash.replace("#", "")
  return hash === "checker" || hash === "simulator" ? hash : "home"
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>(pageFromHash)
  const [lang, setLang] = useState<Language>("ID")

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
      <Navbar activePage={activePage} onNavigate={navigate} lang={lang} onToggleLang={() => setLang((value) => value === "ID" ? "EN" : "ID")} />
      {activePage === "home" ? (
        <main>
          <HeroSection onCheckJobOffer={() => navigate("checker")} onExploreHowItWorks={() => scrollTo("how-it-works")} lang={lang} />
          <HowItWorksSection onCheckJobOffer={() => navigate("checker")} lang={lang} />
          <KnowTheScamsSection onCheckJobOffer={() => navigate("checker")} lang={lang} />
          <ScamSimulatorPreviewSection onStartSimulation={() => navigate("simulator")} lang={lang} />
        </main>
      ) : activePage === "checker" ? (
        <JobOfferCheckerPage onBackToHome={() => navigate("home")} onNavigate={navigate} lang={lang} />
      ) : (
        <ScamSimulatorPage onBackToHome={() => navigate("home")} lang={lang} />
      )}
      <Footer onNavigate={navigate} onScrollTo={scrollTo} lang={lang} />
    </div>
  )
}
