import React, { useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Image as ImageIcon,
  RefreshCw,
  Scan,
  Search,
  ShieldCheck,
  Upload,
} from "lucide-react"
import { t } from "../i18n"
import { analyzeJob, type IndicatorCode, type JobAnalysisResponse, type RiskCategory } from "../services/api"
import { BottomNavigation } from "./BottomNavigation"

interface JobOfferCheckerPageProps {
  onBackToHome: () => void
  onNavigate: (page: "home" | "checker" | "simulator") => void
  lang: "ID" | "EN"
}

type InputMode = "text" | "image"

const levelStyles: Record<RiskCategory, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-red-200 bg-red-50 text-red-800",
  insufficient_data: "border-[#064B50]/15 bg-white",
}

const riskLabels: Record<RiskCategory, Record<"ID" | "EN", string>> = {
  low: { ID: "Risiko Rendah", EN: "Low Risk" },
  medium: { ID: "Perlu Waspada", EN: "Needs Caution" },
  high: { ID: "Risiko Tinggi", EN: "High Risk" },
  insufficient_data: { ID: "Data Belum Cukup", EN: "Insufficient Data" },
}

const indicatorLabels: Record<IndicatorCode, Record<"ID" | "EN", string>> = {
  upfront_payment: { ID: "Pembayaran di muka", EN: "Upfront payment" },
  credential_request: { ID: "Permintaan kredensial", EN: "Credential request" },
  premature_sensitive_data: { ID: "Permintaan data sensitif terlalu dini", EN: "Premature request for sensitive data" },
  urgency_pressure: { ID: "Tekanan waktu", EN: "Time pressure" },
  unrealistic_offer: { ID: "Tawaran tidak wajar", EN: "Unrealistic offer" },
  unofficial_channel: { ID: "Kanal perekrut meragukan", EN: "Questionable recruitment channel" },
}

export const JobOfferCheckerPage: React.FC<JobOfferCheckerPageProps> = ({
  onBackToHome,
  onNavigate,
  lang,
}) => {
  const [mode, setMode] = useState<InputMode>("text")
  const [text, setText] = useState("")
  const [image, setImage] = useState<{ file: File; previewUrl: string } | null>(null)
  const [imageDescription, setImageDescription] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<JobAnalysisResponse | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (image) return () => URL.revokeObjectURL(image.previewUrl)
  }, [image])

  const inputText = (mode === "image" ? imageDescription : text).trim()
  const file = mode === "image" ? image?.file : undefined
  const hasInput = Boolean(inputText || file)

  const handleAnalyze = async () => {
    if (isScanning || !hasInput) return

    setError("")
    setResult(null)
    setIsScanning(true)
    try {
      setResult(await analyzeJob({ text: inputText, file }))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : (lang === "ID" ? "Analisis gagal." : "Analysis failed."))
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
        ? "Terima kasih. Saya akan memverifikasi proses ini melalui kanal resmi perusahaan dan tidak dapat membayar biaya sebelum kontrak resmi."
        : "Thank you. I will verify this process through the company's official channels and cannot pay any fee before an official contract."
    await navigator.clipboard.writeText(reply)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const risk = result?.fraud_assessment
  const indicators = risk?.indicators.filter(({ state }) => state !== "not_detected") ?? []
  const legal = result?.legal_screening

  return (
    <div className="min-h-screen bg-[#F7F7F0] bg-warm-grid px-4 pb-20 pt-24 text-[#202C2B]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between border-b border-[#064B50]/10 pb-4">
          <button onClick={onBackToHome} className="flex items-center gap-2 rounded-xl p-2 text-sm font-bold hover:bg-white hover:text-[#064B50]">
            <ArrowLeft className="h-4 w-4" /> {t(lang, "backHome")}
          </button>
          <div className="flex items-center gap-2 rounded-full border border-[#064B50]/20 bg-[#064B50]/10 px-3 py-1.5 text-xs font-bold text-[#064B50]">
            <Scan className="h-3.5 w-3.5 text-[#087F7A]" /> Jeli Job Offer Scanner
          </div>
          <BottomNavigation activePage="checker" onNavigate={onNavigate} lang={lang} />
        </div>

        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-[#064B50] sm:text-4xl">
            {lang === "ID" ? "Cek Tawaran Kerja" : "Check a Job Offer"}
          </h1>
          <p className="text-sm text-[#202C2B]/80 sm:text-base">
            {lang === "ID"
              ? "Tempel teks atau unggah screenshot tawaran kerja untuk mendapatkan analisis risiko berbasis indikator."
              : "Paste text or upload a job-offer screenshot to get an indicator-based risk analysis."}
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-12">
          <section className="rounded-3xl border border-[#064B50]/15 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#F7F7F0] p-1">
              {([
                ["text", lang === "ID" ? "Teks" : "Text", Search],
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
                  className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-bold ${mode === value ? "bg-[#064B50] text-white" : "text-[#202C2B]/70"}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {mode === "text" && (
              <textarea
                rows={10}
                value={text}
                disabled={isScanning}
                onChange={(event) => {
                  setText(event.target.value)
                  setResult(null)
                  setError("")
                }}
                placeholder={
                  lang === "ID"
                    ? "Tempelkan tawaran kerja atau pesan recruiter secara lengkap di sini..."
                    : "Paste the complete job offer or recruiter message here..."
                }
                className="w-full resize-none rounded-2xl border border-[#064B50]/15 bg-[#F7F7F0] p-4 text-sm leading-relaxed outline-none focus:border-[#064B50]"
              />
            )}
            {mode === "image" && (
              <div>
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#064B50]/20 bg-[#F7F7F0] p-5 text-center hover:border-[#087F7A]">
                  <Upload className="mb-2 h-7 w-7 text-[#087F7A]" />
                  <span className="text-sm font-bold">{lang === "ID" ? "Unggah screenshot tawaran" : "Upload an offer screenshot"}</span>
                  <span className="mt-1 text-xs text-[#202C2B]/60">PNG atau JPG</span>
                  <input type="file" accept="image/png,image/jpeg" disabled={isScanning} onChange={handleImageChange} className="hidden" />
                </label>
                {image && <img src={image.previewUrl} alt="Job offer preview" className="mt-3 max-h-48 w-full rounded-xl object-contain" />}
                <textarea
                  rows={3}
                  value={imageDescription}
                  disabled={isScanning}
                  onChange={(event) => {
                    setImageDescription(event.target.value)
                    setResult(null)
                    setError("")
                  }}
                  placeholder={lang === "ID" ? "Tambahkan teks penting dari gambar (opsional)..." : "Add important text from the image (optional)..."}
                  className="mt-3 w-full resize-none rounded-xl border border-[#064B50]/15 bg-[#F7F7F0] p-3 text-xs outline-none focus:border-[#064B50]"
                />
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isScanning || !hasInput}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#064B50] px-5 py-3 font-extrabold text-white transition-colors hover:bg-[#087F7A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-[#B8F000] ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? (lang === "ID" ? "Menganalisis..." : "Analyzing...") : (lang === "ID" ? "Analisis Tawaran" : "Analyze Offer")}
            </button>
            {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">{error}</p>}
            <p className="mt-3 text-center text-[11px] text-[#202C2B]/55">
              {lang === "ID" ? "Gemini menganalisis materi yang dikirim. Samarkan data pribadi sebelum menganalisis." : "Gemini analyzes submitted material. Redact personal data before analyzing."}
            </p>
          </section>

          <section aria-live="polite" aria-busy={isScanning} className={`rounded-3xl border-2 p-5 shadow-md sm:p-6 lg:col-span-5 ${risk ? levelStyles[risk.risk_category] : "border-[#064B50]/15 bg-white"}`}>
            {!risk ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <ShieldCheck className="mb-3 h-12 w-12 text-[#087F7A]" />
                <h2 className="text-lg font-extrabold text-[#064B50]">{lang === "ID" ? "Hasil analisis akan muncul di sini" : "Your analysis will appear here"}</h2>
                <p className="mt-2 text-sm opacity-75">{lang === "ID" ? "Masukkan data lalu tekan Analisis Tawaran." : "Enter data and click Analyze Offer."}</p>
              </div>
            ) : (
              <>
                <div className="mb-4 border-b border-current/10 pb-3">
                  <span className="flex items-center gap-2 text-xs font-extrabold uppercase"><AlertTriangle className="h-4 w-4" /> {lang === "ID" ? "Hasil Evaluasi Jeli" : "Jeli Evaluation Result"}</span>
                </div>
                <h2 className="mb-2 text-xl font-extrabold">{riskLabels[risk.risk_category][lang]}</h2>
                <p className="mb-5 text-sm leading-relaxed">{risk.summary}</p>
                <div className="mb-5 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase">{lang === "ID" ? "Indikator risiko" : "Risk indicators"}</h3>
                  {indicators.length === 0 && (
                    <p className="text-xs">{lang === "ID" ? "Belum ada indikator yang terdeteksi." : "No indicators were detected."}</p>
                  )}
                  {indicators.map((indicator) => (
                    <div key={indicator.code} className="rounded-xl border border-current/10 bg-white/60 p-3 text-xs leading-relaxed">
                      <p className="font-bold">
                        {indicatorLabels[indicator.code][lang]}
                        {indicator.state === "uncertain" && (
                          <span className="ml-1 font-normal">({lang === "ID" ? "Belum pasti" : "Uncertain"})</span>
                        )}
                      </p>
                      <p>{indicator.reason}</p>
                      {indicator.evidence.map(({ source, quote }) => (
                        <blockquote key={`${source}-${quote}`} className="mt-2 break-words border-l-2 border-current/20 pl-2">
                          “{quote}”
                          <p className="opacity-75">{source === "image" ? (lang === "ID" ? "Dari screenshot" : "From screenshot") : (lang === "ID" ? "Dari teks" : "From text")}</p>
                        </blockquote>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mb-5 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase">{lang === "ID" ? "Rekomendasi" : "Recommendations"}</h3>
                  {risk.recommendations.map((recommendation) => <div key={recommendation} className="rounded-xl border border-current/10 bg-white/60 p-3 text-xs leading-relaxed"><Check className="mr-1 inline h-3.5 w-3.5" />{recommendation}</div>)}
                </div>
                {legal && (
                  <div className="mb-5 space-y-2">
                    <h3 className="text-xs font-extrabold uppercase">{lang === "ID" ? "Referensi hukum" : "Legal references"}</h3>
                    {legal.status === "reference_unavailable" && <p className="text-xs font-bold">{legal.status}</p>}
                    <p className="text-xs leading-relaxed">{legal.summary}</p>
                    {legal.references.map((reference) => (
                      <div key={reference.chunk_id} className="rounded-xl border border-current/10 bg-white/60 p-3 text-xs leading-relaxed">
                        <a href={reference.official_url} target="_blank" rel="noreferrer" className="font-bold underline">
                          {reference.title}{reference.article && ` · ${reference.article}`}
                        </a>
                        <p className="mt-1 whitespace-pre-line break-words">{reference.excerpt}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mb-4 text-[11px] opacity-70">{result?.disclaimer}</p>
                <button onClick={handleCopyReply} className="flex items-center gap-2 rounded-xl border border-current/20 bg-white/60 px-3 py-2 text-xs font-bold">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t(lang, "copied") : (lang === "ID" ? "Salin balasan aman" : "Copy safe reply")}
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default JobOfferCheckerPage
