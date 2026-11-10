import React, { useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
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
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
} from "lucide-react"
import { locales, t, type Language } from "../i18n"
import {
  AHU_COMPANY_SEARCH_URL,
  analyzeJob,
  type IndicatorCode,
  type JobAnalysisResponse,
  type RiskCategory,
} from "../services/api"
import { JeliApiError } from "../services/errors"
import { indicatorLabels, legalSummary, riskLabels } from "../utils/localizeAnalysis"

interface JobOfferCheckerPageProps {
  onBackToHome: () => void
  lang: Language
}

type InputMode = "text" | "url" | "image"

type Scan = { lang: Language; signal: AbortSignal; targetUrl?: string; result?: JobAnalysisResponse }

const riskTheme: Record<
  RiskCategory,
  {
    bannerGradient: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  high: {
    bannerGradient: "from-rose-700 to-red-800",
    icon: ShieldAlert,
  },
  medium: {
    bannerGradient: "from-amber-800 to-orange-800",
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
  const [scan, setScan] = useState<Scan | null>(null)
  const [error, setError] = useState<{ lang: Language; message: string; action?: true } | null>(null)
  const [copied, setCopied] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const request = useRef<AbortController | null>(null)
  const resultHeading = useRef<HTMLHeadingElement>(null)
  const copyTimer = useRef<number>(undefined)
  const current = scan?.lang === lang && !scan.signal.aborted ? scan : null
  const isScanning = Boolean(current && !current.result)
  const result = current?.result
  const needsRescan = Boolean(scan && !current)

  useEffect(() => {
    if (image) return () => URL.revokeObjectURL(image.previewUrl)
  }, [image])

  useEffect(() => () => {
    request.current?.abort()
    request.current = null
  }, [lang])

  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  useEffect(() => {
    if (!result) return
    resultHeading.current?.focus({ preventScroll: true })
    resultHeading.current?.scrollIntoView({ block: "start" })
  }, [result])

  function clearAnalysis() {
    request.current?.abort()
    request.current = null
    window.clearTimeout(copyTimer.current)
    setScan(null)
    setError(null)
    setCopied(false)
  }

  const inputText = mode === "image" ? imageDescription.trim() : (mode === "url" ? urlNote.trim() : text.trim())
  const normalizedUrl = url.trim()
    ? (/^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`)
    : undefined
  const targetUrl = mode === "url" ? normalizedUrl : undefined
  const file = mode === "image" ? image?.file : undefined
  const hasInput = Boolean(inputText || file || targetUrl)
  const isTextALink = /^(?:https?:\/\/|www\.)\S+$/i.test(text.trim())

  const handleAnalyze = async () => {
    if (request.current || !hasInput) return

    clearAnalysis()
    const controller = new AbortController()
    request.current = controller
    const submitted: Scan = { lang, signal: controller.signal, targetUrl }
    setScan(submitted)
    try {
      if (targetUrl) {
        let parsed: URL | undefined
        try {
          parsed = new URL(targetUrl)
        } catch {
          throw new JeliApiError("invalid_url", lang)
        }
        if (!parsed || !["http:", "https:"].includes(parsed.protocol) || !parsed.hostname.includes(".") || /\s/.test(targetUrl)) {
          throw new JeliApiError("invalid_url", lang)
        }
      }
      const data = await analyzeJob({ text: inputText, file, url: targetUrl, lang, signal: controller.signal })
      if (!controller.signal.aborted) setScan({ ...submitted, result: data })
    } catch (requestError) {
      if (controller.signal.aborted) return
      setScan(null)
      setError({
        lang,
        message: requestError instanceof Error
          ? requestError.message
          : (lang === "ID" ? "Analisis gagal. Coba lagi." : "Analysis failed. Try again."),
      })
    } finally {
      if (request.current === controller) request.current = null
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return
    clearAnalysis()
    if (!["image/jpeg", "image/png", "image/webp"].includes(selectedFile.type)) {
      setError({ lang, message: new JeliApiError("unsupported_image_type", lang).message })
      return
    }
    setImage({ file: selectedFile, previewUrl: URL.createObjectURL(selectedFile) })
  }

  const handleCopyReply = async () => {
    const reply =
      lang === "ID"
        ? "Terima kasih. Saya akan memverifikasi tawaran ini melalui kanal resmi perusahaan. Saya tidak akan membayar biaya rekrutmen atau membagikan data sensitif."
        : "Thank you. I will verify this offer through the company's official channels. I will not pay recruitment fees or share sensitive data."
    try {
      setError(null)
      await navigator.clipboard.writeText(reply)
      setCopied(true)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError({ lang, action: true, message: lang === "ID" ? "Penyalinan ditolak oleh browser." : "The browser blocked copying." })
    }
  }

  const handleDownloadPdf = async () => {
    if (!result || !current || isDownloadingPdf) return
    setIsDownloadingPdf(true)
    setError(null)
    try {
      const { generatePdfReport } = await import("../utils/generatePdfReport")
      if (document.documentElement.lang === lang.toLowerCase()) {
        generatePdfReport({ result, targetUrl: current.targetUrl, lang })
      }
    } catch {
      setError({ lang, action: true, message: lang === "ID" ? "PDF gagal dibuat. Coba lagi." : "Could not create the PDF. Try again." })
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const risk = result?.fraud_assessment
  const indicators = risk && risk.risk_category !== "insufficient_data"
    ? risk.indicators.filter(({ state }) => state !== "not_detected")
    : []
  const detectedCount = indicators.filter(({ state }) => state === "detected").length
  const legal = result?.legal_screening
  const currentTheme = risk ? riskTheme[risk.risk_category] : null
  const RiskIcon = currentTheme ? currentTheme.icon : ShieldCheck

  return (
    <main className="min-h-screen bg-[#F7F7F0] bg-warm-grid px-4 pb-20 pt-24 text-[#202C2B]">
      <div className="mx-auto max-w-4xl">
        {/* Top Header & Navigation Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#064B50]/10 pb-4">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-[#064B50] transition-colors hover:bg-white hover:shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" /> {t(lang, "backHome")}
          </button>

          <a
            href={AHU_COMPANY_SEARCH_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-[#064B50]/15 bg-white px-3 py-2 text-xs font-bold text-[#064B50] hover:bg-[#F7F7F0]"
          >
            <Building2 className="h-3.5 w-3.5" />
            {lang === "ID" ? "Cek PT (AHU)" : "Check a Company (AHU)"}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Title & Introduction */}
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 id="checker-title" className="mb-2 text-3xl font-black tracking-tight text-[#064B50] sm:text-4xl">
            {t(lang, "checkOffer")}
          </h1>
          <p className="text-sm text-[#202C2B]/80 sm:text-base">
            {lang === "ID"
              ? "Masukkan teks, tautan, atau tangkapan layar lowongan."
              : "Paste text, enter a link, or upload a job offer screenshot."}
          </p>
        </div>

        <div className="grid gap-6">
          <form aria-labelledby="checker-title" className="min-w-0 rounded-3xl border border-[#064B50]/15 bg-white p-4 shadow-sm sm:p-6" onSubmit={(event) => {
            event.preventDefault()
            void handleAnalyze()
          }}>
            {/* Input Mode Selector */}
            <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl bg-[#F7F7F0] p-1">
              {([
                ["text", lang === "ID" ? "Teks" : "Text", Search],
                ["url", lang === "ID" ? "Tautan" : "Link", Globe],
                ["image", lang === "ID" ? "Gambar" : "Image", ImageIcon],
              ] as const).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mode === value}
                  onClick={() => {
                    if (mode === value) return
                    setMode(value)
                    clearAnalysis()
                  }}
                  className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold transition-colors ${
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
                <label htmlFor="offer-text" className="mb-1.5 block text-sm font-bold text-[#064B50]">
                  {lang === "ID" ? "Teks lowongan" : "Job offer text"}
                </label>
                <textarea
                  id="offer-text"
                  rows={6}
                  maxLength={12_000}
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value)
                    clearAnalysis()
                  }}
                  placeholder={
                    lang === "ID"
                      ? "Tempel teks lowongan, pesan perekrut, atau email tawaran."
                      : "Paste a job posting, recruiter message, or offer email."
                  }
                  className="w-full resize-none rounded-2xl border border-[#064B50]/15 bg-[#F7F7F0] p-4 text-sm leading-relaxed outline-none focus:border-[#064B50] focus:bg-white transition-colors"
                />
                {isTextALink && (
                  <button type="button" className="mt-2.5 flex items-center gap-2 rounded-xl border border-[#064B50]/20 bg-[#064B50]/5 p-2.5 text-xs text-[#064B50]" onClick={() => {
                    clearAnalysis()
                    setUrl(text.trim())
                    setMode("url")
                  }}>
                    <Globe className="h-4 w-4 shrink-0 text-[#087F7A]" />
                    {lang === "ID" ? "Gunakan tautan ini" : "Use this link"}
                  </button>
                )}
              </div>
            )}

            {/* Mode 2: URL Input */}
            {mode === "url" && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="offer-url" className="mb-1.5 block text-sm font-bold text-[#064B50]">
                    {lang === "ID" ? "Tautan lowongan" : "Job offer link"}
                  </label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-3.5 h-4 w-4 text-[#064B50]/50" />
                    <input
                      id="offer-url"
                      type="text"
                      inputMode="url"
                      autoCapitalize="none"
                      maxLength={2048}
                      value={url}
                      onChange={(event) => {
                        setUrl(event.target.value)
                        clearAnalysis()
                      }}
                      placeholder="https://glints.com/…"
                      className="w-full rounded-2xl border border-[#064B50]/15 bg-[#F7F7F0] py-3.5 pl-10 pr-4 text-sm outline-none focus:border-[#064B50] focus:bg-white transition-colors"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-[#202C2B]/75">
                    {lang === "ID"
                      ? "Gunakan tautan yang dapat dibuka tanpa masuk akun."
                      : "Use a link that opens without signing in."}
                  </p>
                </div>

                <div>
                  <label htmlFor="url-notes" className="mb-1.5 block text-sm font-bold text-[#064B50]">
                    {lang === "ID" ? "Catatan (opsional)" : "Notes (optional)"}
                  </label>
                  <textarea
                    id="url-notes"
                    rows={3}
                    maxLength={12_000}
                    value={urlNote}
                    onChange={(event) => {
                      setUrlNote(event.target.value)
                      clearAnalysis()
                    }}
                    placeholder={
                      lang === "ID"
                        ? "Tambahkan pesan atau instruksi dari perekrut."
                        : "Add a message or instructions from the recruiter."
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
                  <label className="group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#064B50]/20 bg-[#F7F7F0] p-6 text-center hover:border-[#087F7A] focus-within:outline-2 focus-within:outline-[#087F7A]">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#064B50]/10 text-[#087F7A] transition-transform group-hover:scale-110">
                      <Upload className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-[#064B50]">
                      {lang === "ID" ? "Pilih tangkapan layar" : "Choose a screenshot"}
                    </span>
                    <span className="mt-1 text-xs text-[#202C2B]/75">PNG, JPG, WebP</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-[#064B50]/20 bg-[#F7F7F0] p-3 shadow-xs">
                    <div className="mb-2.5 flex items-center justify-between border-b border-[#064B50]/10 pb-2">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <ImageIcon className="h-4 w-4 shrink-0 text-[#087F7A]" />
                        <span className="truncate text-xs font-bold text-[#064B50]">{image.file.name}</span>
                        <span className="text-[11px] text-[#202C2B]/75">
                          ({image.file.size >= 1024 * 1024
                            ? `${(image.file.size / (1024 * 1024)).toLocaleString(locales[lang], { maximumFractionDigits: 1 })} MB`
                            : `${Math.round(image.file.size / 1024)} KB`})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <label className="flex cursor-pointer items-center gap-1 rounded-xl bg-[#064B50] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#087F7A] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#087F7A]">
                          <Plus className="h-3.5 w-3.5" />
                          <span>{lang === "ID" ? "Ganti Gambar" : "Change"}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleImageChange}
                            className="sr-only"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setImage(null)
                            clearAnalysis()
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
                        alt={lang === "ID" ? "Pratinjau gambar lowongan" : "Job offer image preview"}
                        className="max-h-64 w-auto rounded-lg object-contain shadow-xs"
                      />
                    </div>
                  </div>
                )}

                <label htmlFor="image-notes" className="block text-sm font-bold text-[#064B50]">
                  {lang === "ID" ? "Catatan (opsional)" : "Notes (optional)"}
                </label>
                <textarea
                  id="image-notes"
                  rows={3}
                  maxLength={12_000}
                  value={imageDescription}
                  onChange={(event) => {
                    setImageDescription(event.target.value)
                    clearAnalysis()
                  }}
                  placeholder={
                    lang === "ID"
                      ? "Tambahkan bagian gambar yang perlu diperhatikan."
                      : "Point out anything in the image Jeli should check."
                  }
                  className="w-full resize-none rounded-2xl border border-[#064B50]/15 bg-[#F7F7F0] p-3 text-xs leading-relaxed outline-none focus:border-[#064B50] focus:bg-white transition-colors"
                />
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
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

            {error?.lang === lang && !error.action && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">
                {error.message}
              </p>
            )}

            {/* Privacy notice */}
            <p className="mt-3 text-center text-xs text-[#202C2B]/75">
              {lang === "ID"
                ? "Hapus data pribadi sensitif sebelum mengirim."
                : "Remove sensitive personal information before sending."}
            </p>
          </form>

          {/* Right Column: Output / Result Panel (Redesigned for optimal readability) */}
          <section
            aria-labelledby="analysis-results"
            className="min-w-0 overflow-hidden rounded-3xl border border-[#064B50]/15 bg-white shadow-sm"
          >
            {!risk ? (
              /* Empty State */
              <div className="p-4 sm:p-6">
                <h2 id="analysis-results" className="text-xl font-extrabold text-[#064B50]">
                  {lang === "ID" ? "Hasil Analisis" : "Analysis Results"}
                </h2>
                <p role="status" className="mt-2 text-sm text-[#202C2B]/80">
                  {isScanning
                    ? (lang === "ID" ? "Jeli sedang memeriksa tawaranmu…" : "Jeli is checking your offer…")
                    : needsRescan
                      ? (lang === "ID" ? "Analisis ulang untuk melihat hasil dalam bahasa Indonesia." : "Run the analysis again to see results in English.")
                      : (lang === "ID" ? "Kirim tawaran kerja untuk melihat hasilnya." : "Submit a job offer to see the result.")}
                </p>
              </div>
            ) : (
              /* Analyzed State */
              <div>
                {/* Result Hero Banner */}
                <div className={`p-5 text-white bg-gradient-to-r ${currentTheme?.bannerGradient}`}>
                  <h2 id="analysis-results" ref={resultHeading} tabIndex={-1} className="text-sm font-bold">
                    {lang === "ID" ? "Hasil Analisis" : "Analysis Results"}
                  </h2>
                  <p className="mt-2 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
                    <RiskIcon className="h-6 w-6 shrink-0" />
                    {riskLabels[risk.risk_category][lang]}
                  </p>
                </div>

                {/* Result Details Container */}
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Executive Summary */}
                  <div className="rounded-2xl border border-[#064B50]/10 bg-[#F7F7F0] p-4 text-sm leading-relaxed">
                    <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#064B50]">
                      {lang === "ID" ? "Ringkasan Penilaian" : "Assessment Summary"}
                    </h3>
                    <p className="font-medium text-[#202C2B] leading-relaxed">
                      {risk.summary}
                    </p>
                  </div>

                  {/* Risk Indicators Section */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#064B50]">
                        {lang === "ID" ? "Indikator Risiko" : "Risk Indicators"}
                      </h3>
                      <span className="rounded-full bg-[#064B50]/10 px-2 py-0.5 text-[11px] font-bold text-[#064B50]">
                        {detectedCount} {lang === "ID" ? "terdeteksi" : "detected"}
                      </span>
                    </div>

                    {indicators.length === 0 && risk.risk_category === "insufficient_data" ? (
                      <p className="text-sm text-[#202C2B]/80">
                        {lang === "ID" ? "Materi belum cukup untuk menilai indikator." : "There is not enough material to assess the indicators."}
                      </p>
                    ) : indicators.length === 0 ? (
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

                              <p className="text-sm leading-relaxed text-[#202C2B]/80">
                                {indicator.reason}
                              </p>

                              {indicator.evidence.map(({ source, quote }) => (
                                <div
                                  key={`${source}-${quote}`}
                                  className="rounded-xl border-l-4 border-red-500 bg-red-50/60 p-2.5 text-xs"
                                >
                                  <p className="break-words italic font-medium text-[#202C2B]">“{quote}”</p>
                                  <span className="mt-1 block text-[11px] font-bold text-[#202C2B]/75">
                                    {source === "image"
                                      ? (lang === "ID" ? "Kutipan dari gambar" : "Quote from image")
                                      : (lang === "ID" ? "Kutipan dari teks" : "Quote from text")}
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
                          className="flex items-start gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-950"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="font-medium">
                            {recommendation}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legal References Section */}
                  {legal && (
                    <div className="space-y-2.5">
                      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#064B50]">
                        <Scale className="h-3.5 w-3.5 text-[#087F7A]" />
                        {lang === "ID" ? "Rujukan Regulasi Ketenagakerjaan RI" : "Indonesian Labor Regulations"}
                      </h3>
                      <p className="text-sm text-[#202C2B]/80">{legalSummary(legal, lang)}</p>
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
                              <span lang="id">{reference.title}{reference.article && ` · ${reference.article}`}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <p lang="id" className="mt-1.5 whitespace-pre-line text-xs text-[#202C2B]/75">
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
                        href="#simulator"
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-[#064B50]/20 bg-[#F7F7F0] px-4 py-2.5 text-xs font-bold text-[#064B50] transition-colors hover:bg-white"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{lang === "ID" ? "Latih respons" : "Practise a response"}</span>
                      </a>
                    </div>

                    {error?.lang === lang && error.action && (
                      <p role="alert" className="text-sm text-red-800">{error.message}</p>
                    )}
                    <p className="text-xs leading-relaxed text-[#202C2B]/75 italic">
                      {result?.disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default JobOfferCheckerPage
