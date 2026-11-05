import { Building2, BriefcaseBusiness } from "lucide-react"
import { AHU_COMPANY_SEARCH_URL } from "../services/api"

type AppPage = "home" | "checker" | "simulator"

interface BottomNavigationProps {
  activePage: "checker"
  onNavigate: (page: AppPage) => void
  lang: "ID" | "EN"
}

export function BottomNavigation({ activePage, onNavigate, lang }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 flex w-[min(92vw,28rem)] -translate-x-1/2 gap-1 rounded-2xl border border-[#064B50]/15 bg-white/95 p-1.5 shadow-lg backdrop-blur">
      <button type="button" onClick={() => onNavigate("checker")} aria-label={lang === "ID" ? "Buka Cek Loker" : "Open job checker"} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold ${activePage === "checker" ? "bg-[#064B50] text-white" : "text-[#064B50]"}`}>
        <BriefcaseBusiness className="h-4 w-4" /> {lang === "ID" ? "Cek Loker" : "Job Checker"}
      </button>
      <button type="button" onClick={() => { window.location.href = AHU_COMPANY_SEARCH_URL }} aria-label={lang === "ID" ? "Buka pencarian PT AHU" : "Open AHU company search"} className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold text-[#064B50]">
        <Building2 className="h-4 w-4" /> {lang === "ID" ? "Cek PT" : "Company Check"}
      </button>
    </nav>
  )
}
