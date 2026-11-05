import { ArrowUpRight, Building2, ExternalLink, Search, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { BottomNavigation } from "./BottomNavigation"

interface CompanySearchPageProps {
  onNavigate: (page: "home" | "checker" | "simulator" | "company") => void
  lang: "ID" | "EN"
}

export function CompanySearchPage({ onNavigate, lang }: CompanySearchPageProps) {
  const [name, setName] = useState("")
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    if (name.trim().length < 2) {
      setError(lang === "ID" ? "Masukkan minimal 2 karakter nama PT." : "Enter at least 2 characters.")
      return
    }
    setError("")
    setSearched(true)
    const officialUrl = `https://ahu.go.id/pencarian/profil-pt/?tipe=perseroan&nama=${encodeURIComponent(name.trim()).replace(/%20/g, "+")}`
    window.open(officialUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <main className="min-h-screen bg-[#F7F7F0] bg-warm-grid px-4 pb-32 pt-28 text-[#202C2B]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#064B50] text-[#B8F000]"><Building2 /></div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#064B50] sm:text-4xl">{lang === "ID" ? "Pencarian Legalitas Perusahaan (Data AHU)" : "Company Legality Search (AHU Data)"}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#202C2B]/75">{lang === "ID" ? "Cari langsung melalui sumber resmi Ditjen AHU Online. Hasil dan verifikasi tetap dilakukan di situs AHU." : "Search directly through Ditjen AHU Online. Results and verification remain on the official AHU website."}</p>
        </div>

        <section className="rounded-3xl border border-[#064B50]/15 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={name} onChange={(event) => { setName(event.target.value); setError(""); setSearched(false) }} onKeyDown={(event) => { if (event.key === "Enter") void handleSearch() }} placeholder={lang === "ID" ? "Masukkan nama PT, misalnya PT ABC" : "Enter a company name, e.g. PT ABC"} className="min-w-0 flex-1 rounded-xl border border-[#064B50]/15 bg-[#F7F7F0] px-4 py-3 text-sm outline-none focus:border-[#064B50]" />
            <button onClick={() => void handleSearch()} className="flex items-center justify-center gap-2 rounded-xl bg-[#064B50] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#087F7A]">
              <Search className="h-4 w-4" /> {lang === "ID" ? "Cari di AHU" : "Search AHU"}
            </button>
          </div>
          {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
        </section>

        {searched && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-[#064B50]/15 bg-[#064B50] p-6 text-white shadow-md sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#B8F000]"><ShieldCheck className="h-3.5 w-3.5" /> {lang === "ID" ? "Terhubung ke sumber resmi" : "Connected to official source"}</div>
                <h2 className="text-xl font-extrabold">{lang === "ID" ? "Pencarian AHU dibuka" : "AHU search opened"}</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">{lang === "ID" ? "Selesaikan verifikasi jika diminta, lalu lihat Nomor SK, alamat, dan status entitas langsung di halaman AHU." : "Complete verification if requested, then view the registration number, address, and entity status directly on AHU."}</p>
              </div>
              <ArrowUpRight className="hidden h-12 w-12 text-[#B8F000] sm:block" />
            </div>
            <a href={`https://ahu.go.id/pencarian/profil-pt/?tipe=perseroan&nama=${encodeURIComponent(name.trim()).replace(/%20/g, "+")}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B8F000] px-4 py-2.5 text-xs font-extrabold text-[#064B50] hover:bg-white">
              <ExternalLink className="h-4 w-4" /> {lang === "ID" ? "Buka ulang pencarian AHU" : "Reopen AHU search"}
            </a>
          </section>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            [ShieldCheck, lang === "ID" ? "Sumber resmi" : "Official source", lang === "ID" ? "Data ditampilkan langsung oleh AHU." : "Data is displayed directly by AHU."],
            [Search, lang === "ID" ? "Nama otomatis" : "Auto-filled name", lang === "ID" ? "Nama PT dikirim lewat parameter pencarian." : "The company name is sent as a search parameter."],
            [ExternalLink, lang === "ID" ? "Verifikasi aman" : "Safe verification", lang === "ID" ? "Jeli tidak melewati reCAPTCHA." : "Jeli does not bypass reCAPTCHA."],
          ].map(([Icon, title, description]) => (
            <div key={title as string} className="rounded-2xl border border-[#064B50]/10 bg-white p-4">
              <Icon className="mb-3 h-5 w-5 text-[#087F7A]" />
              <h3 className="text-xs font-extrabold text-[#064B50]">{title as string}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[#202C2B]/60">{description as string}</p>
            </div>
          ))}
        </div>
      </div>
      <BottomNavigation activePage="company" onNavigate={onNavigate} lang={lang} />
    </main>
  )
}
