import { Building2, CheckCircle2, Loader2, Search, XCircle } from "lucide-react"
import { useState } from "react"
import { searchCompany, type CompanyResult } from "../services/api"
import { BottomNavigation } from "./BottomNavigation"

interface CompanySearchPageProps {
  onNavigate: (page: "home" | "checker" | "simulator" | "company") => void
  lang: "ID" | "EN"
}

export function CompanySearchPage({ onNavigate, lang }: CompanySearchPageProps) {
  const [name, setName] = useState("")
  const [company, setCompany] = useState<CompanyResult | null>(null)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    if (name.trim().length < 2) {
      setError(lang === "ID" ? "Masukkan minimal 2 karakter nama PT." : "Enter at least 2 characters.")
      return
    }
    setLoading(true)
    setError("")
    setCompany(null)
    try {
      const response = await searchCompany(name.trim())
      setCompany(response.company)
      setSearched(true)
    } catch (requestError) {
      setSearched(false)
      setError(requestError instanceof Error ? requestError.message : "Search failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F7F0] bg-warm-grid px-4 pb-32 pt-28 text-[#202C2B]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#064B50] text-[#B8F000]"><Building2 /></div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#064B50] sm:text-4xl">{lang === "ID" ? "Pencarian Legalitas Perusahaan (Data AHU)" : "Company Legality Search (AHU Data)"}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#202C2B]/75">{lang === "ID" ? "Cari informasi dasar perusahaan berdasarkan nama PT. Data yang ditampilkan masih berupa simulasi untuk pengembangan." : "Search basic company information by name. The displayed data is a development simulation."}</p>
        </div>

        <section className="rounded-3xl border border-[#064B50]/15 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input value={name} onChange={(event) => { setName(event.target.value); setError(""); setSearched(false) }} onKeyDown={(event) => { if (event.key === "Enter") void handleSearch() }} placeholder={lang === "ID" ? "Contoh: PT Karya Digital Nusantara" : "Example: PT Karya Digital Nusantara"} className="min-w-0 flex-1 rounded-xl border border-[#064B50]/15 bg-[#F7F7F0] px-4 py-3 text-sm outline-none focus:border-[#064B50]" />
            <button onClick={() => void handleSearch()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-[#064B50] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#087F7A] disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} {lang === "ID" ? "Cari" : "Search"}
            </button>
          </div>
          {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
        </section>

        {searched && !company && !error && (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800"><XCircle className="mx-auto mb-2 h-8 w-8" />{lang === "ID" ? "Perusahaan tidak ditemukan pada dataset simulasi." : "Company not found in the mock dataset."}</div>
        )}
        {company && (
          <section className="mt-6 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-[#087F7A]">{lang === "ID" ? "Hasil pencarian" : "Search result"}</p><h2 className="text-xl font-extrabold text-[#064B50]">{company.name}</h2></div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" /> {lang === "ID" ? "Aktif" : "Active"}</span>
            </div>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-bold text-[#202C2B]/55">{lang === "ID" ? "Nomor SK" : "Registration number"}</dt><dd className="mt-1 font-semibold">{company.registration_number}</dd></div>
              <div><dt className="text-xs font-bold text-[#202C2B]/55">{lang === "ID" ? "Alamat" : "Address"}</dt><dd className="mt-1 font-semibold">{company.address}</dd></div>
              <div><dt className="text-xs font-bold text-[#202C2B]/55">{lang === "ID" ? "Status entitas" : "Entity status"}</dt><dd className="mt-1 font-semibold text-emerald-700">{lang === "ID" ? "Aktif" : "Active"}</dd></div>
            </dl>
            <p className="mt-5 border-t border-[#064B50]/10 pt-4 text-[11px] text-[#202C2B]/60">{lang === "ID" ? "Data simulasi — bukan hasil verifikasi resmi AHU." : "Mock data — not an official AHU verification."}</p>
          </section>
        )}
      </div>
      <BottomNavigation activePage="company" onNavigate={onNavigate} lang={lang} />
    </main>
  )
}
