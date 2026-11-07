import React, { useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  KeyRound,
  Lock,
  MessageCircle,
  Plus,
  RefreshCw,
  Scale,
  Scan,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
} from "lucide-react"
import { t } from "../i18n"
import {
  AHU_COMPANY_SEARCH_URL,
  analyzeJob,
  type IndicatorCode,
  type JobAnalysisResponse,
  type RiskCategory,
} from "../services/api"
import { generatePdfReport } from "../utils/generatePdfReport"

interface JobOfferCheckerPageProps {
  onBackToHome: () => void
  onNavigate: (page: "home" | "checker" | "simulator") => void
  lang: "ID" | "EN"
}

type InputMode = "text" | "url" | "image"

const riskLabels: Record<RiskCategory, Record<"ID" | "EN", string>> = {
  low: { ID: "Risiko Rendah", EN: "Low Risk" },
  medium: { ID: "Perlu Waspada", EN: "Needs Caution" },
  high: { ID: "Risiko Tinggi", EN: "High Risk" },
  insufficient_data: { ID: "Data Belum Cukup", EN: "Insufficient Data" },
}

const riskTheme: Record<
  RiskCategory,
  {
    bannerGradient: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  high: {
    bannerGradient: "from-rose-600 via-red-600 to-rose-700",
    icon: ShieldAlert,
  },
  medium: {
    bannerGradient: "from-amber-500 via-orange-500 to-amber-600",
    icon: AlertTriangle,
  },
  low: {
    bannerGradient: "from-[#064B50] via-[#087F7A] to-emerald-700",
    icon: ShieldCheck,
  },
  insufficient_data: {
    bannerGradient: "from-slate-600 via-slate-700 to-zinc-700",
    icon: HelpCircle,
  },
}

const indicatorLabels: Record<IndicatorCode, Record<"ID" | "EN", string>> = {
  upfront_payment: { ID: "Permintaan Pembayaran Awal", EN: "Upfront Payment Request" },
  credential_request: { ID: "Permintaan Kredensial / OTP", EN: "Credential / OTP Request" },
  premature_sensitive_data: { ID: "Data Sensitif Terlalu Dini", EN: "Premature Sensitive Data" },
  urgency_pressure: { ID: "Tekanan Waktu / Larangan Verifikasi", EN: "Urgency Pressure" },
  unrealistic_offer: { ID: "Tawaran Gaji Tidak Wajar", EN: "Unrealistic Offer" },
  unofficial_channel: { ID: "Kanal Komunikasi Meragukan", EN: "Suspicious Channel" },
}

const indicatorIcons: Record<IndicatorCode, React.ComponentType<{ className?: string }>> = {
  upfront_payment: Lock,
  credential_request: KeyRound,
  premature_sensitive_data: Lock,
  urgency_pressure: Clock,
  unrealistic_offer: TrendingUp,
  unofficial_channel: MessageCircle,
}

export const JobOfferCheckerPage: React.FC<JobOfferCheckerPageProps> = ({
  onBackToHome,
  lang,
}) => {
  const [mode, setMode] = useState<InputMode>("text")
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const [urlNote, setUrlNote] = useState("")
  const [image, setImage] = useState<{ file: File; previewUrl: string } | null>(null)
  const [imageDescription, setImageDescription] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<JobAnalysisResponse | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  useEffect(() => {
    if (image) return () => URL.revokeObjectURL(image.previewUrl)
  }, [image])

  const inputText = mode === "image" ? imageDescription.trim() : (mode === "url" ? urlNote.trim() : text.trim())
  const targetUrl = mode === "url" ? url.trim() : undefined
  const file = mode === "image" ? image?.file : undefined
  const hasInput = Boolean(inputText || file || targetUrl)

  const handleAnalyze = async () => {
    if (isScanning || !hasInput) return

    setError("")
    setResult(null)
    setIsScanning(true)
    try {
      setResult(await analyzeJob({ text: inputText, file, url: targetUrl }))
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : (lang === "ID" ? "Analisis gagal diproses." : "Analysis failed to process.")
      )
    } finally {
      setIsScanning(false)
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    setImage(selectedFile ? { file: selectedFile, previewUrl: URL.createObjectURL(selectedFile) } : null)
    setResult(null)
    setError("")
  }

  const handleCopyReply = async () => {
    const reply =
      lang === "ID"
        ? "Terima kasih. Saya akan memverifikasi proses seleksi ini melalui kanal resmi perusahaan dan tidak dapat melakukan transfer biaya apa pun sebelum ada kontrak kerja resmi."
        : "Thank you. I will verify this recruitment process through the company's official channels and cannot pay any fees before an official employment contract."
    await navigator.clipboard.writeText(reply)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadPdf = () => {
    if (!result) return
    setIsDownloadingPdf(true)
    try {
      generatePdfReport({
        result,
        targetUrl: mode === "url" ? url.trim() : undefined,
        lang,
      })
    } catch (err) {
      console.error("Gagal membuat PDF:", err)
    } finally {
      setTimeout(() => setIsDownloadingPdf(false), 800)
    }
  }

  const risk = result?.fraud_assessment
  const indicators = risk?.indicators.filter(({ state }) => state !== "not_detected") ?? []
  const legal = result?.legal_screening
  const currentTheme = risk ? riskTheme[risk.risk_category] : null
  const RiskIcon = currentTheme ? currentTheme.icon : ShieldCheck

  return (
    <div className="min-h-screen bg-[#F7F7F0] bg-warm-grid px-4 pb-20 pt-20 text-[#202C2B]">
      <div className="mx-auto max-w-5xl">
        {/* Top Header & Navigation Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#064B50]/10 pb-4">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[#064B50] transition-colors hover:bg-white hover:shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" /> {t(lang, "backHome")}
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-[#064B50]/20 bg-[#064B50]/10 px-3 py-1.5 text-xs font-bold text-[#064B50] md:flex">
              <Scan className="h-3.5 w-3.5 text-[#087F7A]" /> Jeli Job Scanner
            </div>

            {/* Grounded Navigation Pills: Cek Loker & Cek PT (Replaces floating bottom bar) */}
            <div className="flex items-center gap-1 rounded-2xl border border-[#064B50]/15 bg-white p-1 shadow-xs">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-[#064B50] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs"
              >
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                {lang === "ID" ? "Cek Loker" : "Job Checker"}
              </button>
              <a
                href={AHU_COMPANY_SEARCH_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-extrabold text-[#064B50] transition-colors hover:bg-[#F7F7F0]"
              >
                <Building2 className="h-3.5 w-3.5" />
                {lang === "ID" ? "Cek PT (AHU)" : "Verify PT (AHU)"}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </div>
          </div>
        </div>

        {/* Title & Introduction */}
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="mb-2 text-3xl font-black tracking-tight text-[#064B50] sm:text-4xl">
            {lang === "ID" ? "Cek Tawaran Kerja" : "Check a Job Offer"}
          </h1>
          <p className="text-sm text-[#202C2B]/80 sm:text-base">
            {lang === "ID"
              ? "Periksa indikasi penipuan rekrutmen melalui teks pesan, tautan lowongan kerja, atau screenshot poster tawaran."
              : "Check for recruitment scam indicators using text messages, job links, or offer poster screenshots."}
          </p>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* Left Column: Input Card */}
          <section className="rounded-3xl border border-[#064B50]/15 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
            {/* Input Mode Selector */}
            <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl bg-[#F7F7F0] p-1">
              {([
                ["text", lang === "ID" ? "Teks" : "Text", Search],
                ["url", lang === "ID" ? "Tautan / URL" : "Link / URL", Globe],
                ["image", lang === "ID" ? "Gambar" : "Image", ImageIcon],
              ] as const).map(([value, label, Icon]) => (
                <button
                  key={value}
                  aria-pressed={mode === value}
                  disabled={isScanning}
                  onClick={() => {
                    if (mode === value) return
                    setMode(value)
                    setResult(null)
                    setError("")
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition-all ${
                    mode === value
                      ? "bg-[#064B50] text-white shadow-xs"
                      : "text-[#202C2B]/70 hover:text-[#064B50]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Mode 1: Text Input */}
            {mode === "text" && (
              <div>
                <textarea
                  rows={9}
                  value={text}
                  disabled={isScanning}
                  onChange={(event) => {
                    setText(event.target.value)
                    setResult(null)
                    setError("")
                  }}
                  placeholder={
                    lang === "ID"
                      ? "Tempelkan teks lowongan kerja, pesan chat recruiter (WhatsApp/Telegram), atau email penawaran di sini..."
                      : "Paste the complete job offer, recruiter chat (WhatsApp/Telegram), or offer email here..."
                  }
                  className="w-full resize-none rounded-2xl border border-[#064B50]/15 bg-[#F7F7F0] p-4 text-sm leading-relaxed outline-none focus:border-[#064B50] focus:bg-white transition-colors"
                />
                {text.trim().startsWith("http") && (
                  <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-[#064B50]/20 bg-[#064B50]/5 p-2.5 text-xs text-[#064B50]">
                    <Globe className="h-4 w-4 shrink-0 text-[#087F7A]" />
                    <span>
                      {lang === "ID"
                        ? "Tautan terdeteksi: AI akan otomatis mengambil dan mengekstrak rincian pekerjaan dari halaman web ini."
                        : "Link detected: AI will automatically fetch and extract job details from this URL."}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: URL Input */}
            {mode === "url" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#064B50]">
                    {lang === "ID" ? "Tautan / URL Lowongan Kerja" : "Job Offer Link / URL"}
                  </label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-3.5 h-4 w-4 text-[#064B50]/50" />
                    <input
                      type="url"
                      value={url}
                      disabled={isScanning}
                      onChange={(event) => {
                        setUrl(event.target.value)
                        setResult(null)
                        setError("")
                      }}
                      placeholder="https://glints.com/... atau tautan lowongan kerja lainnya"
                      className="w-full rounded-2xl border border-[#064B50]/15 bg-[#F7F7F0] py-3.5 pl-10 pr-4 text-sm outline-none focus:border-[#064B50] focus:bg-white transition-colors"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#202C2B]/60">
                    {lang === "ID"
                      ? "Mendukung portal karir resmi (Glints, Jobstreet, LinkedIn, Kalibrr, dll.) maupun website perusahaan."
                      : "Supports official portals (Glints, Jobstreet, LinkedIn, Kalibrr, etc.) or company career sites."}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#064B50]">
                    {lang === "ID" ? "Catatan Tambahan (Opsional)" : "Additional Notes (Optional)"}
                  </label>
                  <textarea
                    rows={4}
                    value={urlNote}
                    disabled={isScanning}
                    onChange={(event) => {
                      setUrlNote(event.target.value)
                      setResult(null)
                      setError("")
                    }}
                    placeholder={
                      lang === "ID"
                        ? "Misal: pesan recruiter yang membagikan tautan, nomor kontak pengirim, atau petunjuk seleksi..."
                        : "E.g. message from recruiter who sent the link, sender contact number, or selection instructions..."
                    }
                    className="w-full resize-none rounded-2xl border border-[#064B50]/15 bg-[#F7F7F0] p-3 text-xs leading-relaxed outline-none focus:border-[#064B50] focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Mode 3: Image Input (Cleaned up: Dropzone disappears once image is selected) */}
            {mode === "image" && (
              <div className="space-y-3">
                {!image ? (
                  <label className="group flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#064B50]/20 bg-[#F7F7F0] p-6 text-center transition-all hover:border-[#087F7A] hover:bg-white">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#064B50]/10 text-[#087F7A] transition-transform group-hover:scale-110">
                      <Upload className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-[#064B50]">
                      {lang === "ID" ? "Pilih atau Tarik Screenshot Tawaran ke Sini" : "Choose or Drag Offer Screenshot Here"}
                    </span>
                    <span className="mt-1 text-xs text-[#202C2B]/60">Format PNG, JPG, atau WebP (Maks. 5 MB)</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={isScanning}
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-[#064B50]/20 bg-[#F7F7F0] p-3 shadow-xs">
                    <div className="mb-2.5 flex items-center justify-between border-b border-[#064B50]/10 pb-2">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <ImageIcon className="h-4 w-4 shrink-0 text-[#087F7A]" />
                        <span className="truncate text-xs font-bold text-[#064B50]">{image.file.name}</span>
                        <span className="text-[11px] text-[#202C2B]/60">
                          ({image.file.size >= 1024 * 1024
                            ? `${(image.file.size / (1024 * 1024)).toFixed(1)} MB`
                            : `${Math.round(image.file.size / 1024)} KB`})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <label className="flex cursor-pointer items-center gap-1 rounded-xl bg-[#064B50] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#087F7A]">
                          <Plus className="h-3.5 w-3.5" />
                          <span>{lang === "ID" ? "Ganti Gambar" : "Change"}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            disabled={isScanning}
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={isScanning}
                          onClick={() => {
                            setImage(null)
                            setResult(null)
                            setError("")
                          }}
                          className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-1.5 text-red-600 transition-colors hover:bg-red-100"
                          title={lang === "ID" ? "Hapus gambar" : "Remove image"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-center rounded-xl border border-[#064B50]/10 bg-white/80 p-2">
                      <img
                        src={image.previewUrl}
                        alt="Job offer preview"
                        className="max-h-64 w-auto rounded-lg object-contain shadow-xs"
                      />
                    </div>
                  </div>
                )}

                <textarea
                  rows={3}
                  value={imageDescription}
                  disabled={isScanning}
                  onChange={(event) => {
                    setImageDescription(event.target.value)
                    setResult(null)
                    setError("")
                  }}
                  placeholder={
                    lang === "ID"
                      ? "Catatan tambahan dari gambar (opsional, misal bagian teks tertentu atau nomor kontak)..."
                      : "Additional notes from the image (optional)..."
                  }
                  className="w-full resize-none rounded-2xl border border-[#064B50]/15 bg-[#F7F7F0] p-3 text-xs leading-relaxed outline-none focus:border-[#064B50] focus:bg-white transition-colors"
                />
              </div>
            )}

            {/* Submit Action Button */}
            <button
              onClick={handleAnalyze}
              disabled={isScanning || !hasInput}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#064B50] px-5 py-3.5 font-extrabold text-white transition-all hover:bg-[#087F7A] disabled:cursor-not-allowed disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`h-4 w-4 text-[#B8F000] ${isScanning ? "animate-spin" : ""}`} />
              {isScanning
                ? (lang === "ID"
                    ? (mode === "url" ? "Membaca URL & Menganalisis..." : "Menganalisis...")
                    : (mode === "url" ? "Reading URL & Analyzing..." : "Analyzing..."))
                : (lang === "ID" ? "Analisis Tawaran" : "Analyze Offer")}
            </button>

            {error && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">
                {error}
              </p>
            )}

            {/* Privacy notice */}
            <p className="mt-3 text-center text-[11px] font-medium text-[#202C2B]/60">
              {lang === "ID"
                ? "Privasi terjaga. Jangan sertakan data pribadi sensitif."
                : "Privacy protected. Do not include sensitive personal data."}
            </p>
          </section>

          {/* Right Column: Output / Result Panel (Redesigned for optimal readability) */}
          <section
            aria-live="polite"
            aria-busy={isScanning}
            className="rounded-3xl border border-[#064B50]/15 bg-white shadow-sm overflow-hidden lg:col-span-5"
          >
            {!risk ? (
              /* Empty State */
              <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#064B50]/10 text-[#087F7A]">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h2 className="text-lg font-black text-[#064B50]">
                  {lang === "ID" ? "Hasil Analisis Risiko Akan Muncul di Sini" : "Analysis Result Will Appear Here"}
                </h2>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#202C2B]/70">
                  {lang === "ID"
                    ? "Pilih metode input (Teks, Tautan URL, atau Gambar), isi materi tawaran kerja, lalu tekan tombol 'Analisis Tawaran'."
                    : "Choose an input method (Text, URL, or Image), provide offer material, and click 'Analyze Offer'."}
                </p>
              </div>
            ) : (
              /* Analyzed State */
              <div>
                {/* Result Hero Banner */}
                <div className={`p-5 text-white bg-gradient-to-r ${currentTheme?.bannerGradient}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase opacity-95">
                      <RiskIcon className="h-4 w-4" />
                      {lang === "ID" ? "Hasil Evaluasi Jeli AI" : "Jeli AI Evaluation"}
                    </span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-black backdrop-blur-xs">
                      {riskLabels[risk.risk_category][lang]}
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                    {riskLabels[risk.risk_category][lang]}
                  </h2>
                </div>

                {/* Result Details Container */}
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Executive Summary */}
                  <div className="rounded-2xl border border-[#064B50]/10 bg-[#F7F7F0] p-4 text-sm leading-relaxed">
                    <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#064B50]">
                      {lang === "ID" ? "Ringkasan Penilaian" : "Assessment Summary"}
                    </h3>
                    <p className="font-medium text-[#202C2B] leading-relaxed">{risk.summary}</p>
                  </div>

                  {/* Risk Indicators Section */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#064B50]">
                        {lang === "ID" ? "Indikator Risiko" : "Risk Indicators"}
                      </h3>
                      <span className="rounded-full bg-[#064B50]/10 px-2 py-0.5 text-[11px] font-bold text-[#064B50]">
                        {indicators.length} {lang === "ID" ? "terdeteksi" : "detected"}
                      </span>
                    </div>

                    {indicators.length === 0 ? (
                      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs font-medium text-emerald-800">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                        <span>
                          {lang === "ID"
                            ? "Tidak ada indikator penipuan eksplisit yang terdeteksi pada materi yang Anda periksa."
                            : "No explicit scam indicators detected in the provided material."}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {indicators.map((indicator) => {
                          const IndicatorIcon = indicatorIcons[indicator.code] || AlertTriangle
                          const isDetected = indicator.state === "detected"
                          return (
                            <div
                              key={indicator.code}
                              className="rounded-2xl border border-[#064B50]/15 bg-white p-4 shadow-xs space-y-2.5 transition-all hover:border-[#064B50]/30"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                                      isDetected ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                                    }`}
                                  >
                                    <IndicatorIcon className="h-4 w-4" />
                                  </div>
                                  <h4 className="text-xs font-bold text-[#202C2B] sm:text-sm">
                                    {indicatorLabels[indicator.code][lang]}
                                  </h4>
                                </div>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase shrink-0 ${
                                    isDetected
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {isDetected
                                    ? (lang === "ID" ? "Terdeteksi" : "Detected")
                                    : (lang === "ID" ? "Perlu Bukti" : "Uncertain")}
                                </span>
                              </div>

                              <p className="text-xs leading-relaxed text-[#202C2B]/80">{indicator.reason}</p>

                              {indicator.evidence.map(({ source, quote }) => (
                                <div
                                  key={`${source}-${quote}`}
                                  className="rounded-xl border-l-4 border-red-500 bg-red-50/60 p-2.5 text-xs"
                                >
                                  <p className="italic font-medium text-[#202C2B]">“{quote}”</p>
                                  <span className="mt-1 block text-[10px] font-bold uppercase text-[#202C2B]/50">
                                    {source === "image"
                                      ? (lang === "ID" ? "Bukti dari Screenshot" : "Evidence from Screenshot")
                                      : (lang === "ID" ? "Bukti dari Teks/URL" : "Evidence from Text/URL")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Recommendations Section */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#064B50]">
                      {lang === "ID" ? "Langkah Tindakan Aman" : "Recommended Actions"}
                    </h3>
                    <div className="space-y-2">
                      {risk.recommendations.map((recommendation, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-xs leading-relaxed text-emerald-950"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="font-medium">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legal References Section */}
                  {legal && legal.references.length > 0 && (
                    <div className="space-y-2.5">
                      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#064B50]">
                        <Scale className="h-3.5 w-3.5 text-[#087F7A]" />
                        {lang === "ID" ? "Rujukan Regulasi Ketenagakerjaan RI" : "Indonesian Labor Regulations"}
                      </h3>
                      <p className="text-xs text-[#202C2B]/80">{legal.summary}</p>
                      <div className="space-y-2">
                        {legal.references.map((reference) => (
                          <div
                            key={reference.chunk_id}
                            className="rounded-xl border border-[#064B50]/15 bg-[#F7F7F0] p-3 text-xs leading-relaxed"
                          >
                            <a
                              href={reference.official_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-[#064B50] hover:underline"
                            >
                              <span>{reference.title}{reference.article && ` · ${reference.article}`}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <p className="mt-1.5 whitespace-pre-line text-[11px] text-[#202C2B]/75">
                              {reference.excerpt}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Actions & Attributions */}
                  <div className="space-y-2.5 border-t border-[#064B50]/10 pt-4">
                    {/* Primary Action: Download Official PDF Report */}
                    <button
                      onClick={handleDownloadPdf}
                      disabled={isDownloadingPdf}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#064B50] px-4 py-3 text-xs font-extrabold text-white transition-all hover:bg-[#087F7A] shadow-xs cursor-pointer"
                    >
                      <Download className={`h-4 w-4 ${isDownloadingPdf ? "animate-bounce text-[#B8F000]" : "text-[#B8F000]"}`} />
                      <span>
                        {isDownloadingPdf
                          ? (lang === "ID" ? "Membuat Dokumen PDF..." : "Generating PDF Report...")
                          : (lang === "ID" ? "Unduh Hasil Analisis (PDF)" : "Download Analysis Report (PDF)")}
                      </span>
                    </button>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleCopyReply}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#064B50]/20 bg-[#F7F7F0] px-4 py-2.5 text-xs font-bold text-[#064B50] transition-colors hover:bg-white cursor-pointer"
                      >
                        {copied ? <Check className="h-4 w-4 text-[#087F7A]" /> : <Copy className="h-4 w-4" />}
                        {copied
                          ? t(lang, "copied")
                          : (lang === "ID" ? "Salin Draf Balasan Aman" : "Copy Safe Reply")}
                      </button>
                      <a
                        href={AHU_COMPANY_SEARCH_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-[#064B50]/20 bg-[#F7F7F0] px-4 py-2.5 text-xs font-bold text-[#064B50] transition-colors hover:bg-white"
                      >
                        <Building2 className="h-4 w-4" />
                        <span>{lang === "ID" ? "Verifikasi PT di AHU" : "Verify in AHU"}</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    </div>

                    <p className="text-[11px] leading-relaxed text-[#202C2B]/60 italic">
                      {result?.disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default JobOfferCheckerPage
