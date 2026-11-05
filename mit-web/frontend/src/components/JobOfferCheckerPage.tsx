import React, { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
  Scan,
  Search,
  ShieldCheck,
  Upload,
} from "lucide-react"
import { t } from "../i18n"
import { analyzeJob, type JobAnalysisResponse } from "../services/api"
import { BottomNavigation } from "./BottomNavigation"

interface JobOfferCheckerPageProps {
  onBackToHome: () => void
  onNavigate: (page: "home" | "checker" | "simulator") => void
  lang: "ID" | "EN"
}

type InputMode = "text" | "url" | "image"
type RiskLevel = "low" | "medium" | "high"

interface AnalysisResult {
  score: number
  level: RiskLevel
  flags: string[]
  summary: string
  recommendations: string[]
  disclaimer: string
}

const levelStyles: Record<RiskLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-red-200 bg-red-50 text-red-800",
}

export const JobOfferCheckerPage: React.FC<JobOfferCheckerPageProps> = ({
  onBackToHome,
  onNavigate,
  lang,
}) => {
  const [mode, setMode] = useState<InputMode>("text")
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imageDescription, setImageDescription] = useState("")
  const [imagePreview, setImagePreview] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!image) {
      setImagePreview("")
      return
    }
    const previewUrl = URL.createObjectURL(image)
    setImagePreview(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [image])

  const currentInput = useMemo(() => {
    if (mode === "url") return url
    if (mode === "image") return `${image?.name ?? ""} ${imageDescription}`
    return text
  }, [image, imageDescription, mode, text, url])

  const handleAnalyze = async () => {
    if (!currentInput.trim()) {
      setError(lang === "ID" ? "Masukkan data lowongan terlebih dahulu." : "Enter job-offer data first.")
      return
    }
    if (mode === "url" && !/^https?:\/\/\S+$/i.test(url.trim())) {
      setError(lang === "ID" ? "Masukkan URL yang valid." : "Enter a valid URL.")
      return
    }
    setError("")
    setResult(null)
    setIsScanning(true)
    try {
      const response: JobAnalysisResponse = await analyzeJob(mode, currentInput, lang)
      setResult({
        score: response.score,
        level: response.risk_level,
        flags: response.indicators,
        summary: response.summary,
        recommendations: response.recommendations,
        disclaimer: response.disclaimer,
      })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Analysis failed.")
    } finally {
      setIsScanning(false)
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImage(event.target.files?.[0] ?? null)
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

  const risk = result ?? { score: 0, level: "low" as RiskLevel, flags: [], summary: "", recommendations: [], disclaimer: "" }

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
              ? "Tempel teks, masukkan URL, atau unggah gambar tawaran kerja untuk mendapatkan analisis risiko berbasis indikator."
              : "Paste text, enter a URL, or upload a job-offer image to get an indicator-based risk analysis."}
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-12">
          <section className="rounded-3xl border border-[#064B50]/15 bg-white p-5 shadow-sm sm:p-6 lg:col-span-7">
            <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl bg-[#F7F7F0] p-1">
              {([
                ["text", lang === "ID" ? "Teks" : "Text", Search],
                ["url", "URL", LinkIcon],
                ["image", lang === "ID" ? "Gambar" : "Image", ImageIcon],
              ] as const).map(([value, label, Icon]) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
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
                onChange={(event) => {
                  setText(event.target.value)
                  setResult(null)
                }}
                placeholder={
                  lang === "ID"
                    ? "Tempelkan tawaran kerja atau pesan recruiter secara lengkap di sini..."
                    : "Paste the complete job offer or recruiter message here..."
                }
                className="w-full resize-none rounded-2xl border border-[#064B50]/15 bg-[#F7F7F0] p-4 text-sm leading-relaxed outline-none focus:border-[#064B50]"
              />
            )}
            {mode === "url" && (
              <div>
                <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-[#064B50]">
                  {lang === "ID" ? "URL tawaran kerja" : "Job offer URL"}
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value)
                    setResult(null)
                  }}
                  placeholder="https://contoh-perusahaan.com/careers"
                  className="w-full rounded-2xl border border-[#064B50]/15 bg-[#F7F7F0] p-4 text-sm outline-none focus:border-[#064B50]"
                />
                <p className="mt-2 text-xs text-[#202C2B]/60">
                  {lang === "ID" ? "Jeli memeriksa pola domain dan tautan. Jangan membuka tautan yang mencurigakan." : "Jeli checks domain and URL patterns. Do not open suspicious links."}
                </p>
              </div>
            )}
            {mode === "image" && (
              <div>
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#064B50]/20 bg-[#F7F7F0] p-5 text-center hover:border-[#087F7A]">
                  <Upload className="mb-2 h-7 w-7 text-[#087F7A]" />
                  <span className="text-sm font-bold">{lang === "ID" ? "Unggah screenshot tawaran" : "Upload an offer screenshot"}</span>
                  <span className="mt-1 text-xs text-[#202C2B]/60">PNG, JPG, WEBP</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="hidden" />
                </label>
                {imagePreview && <img src={imagePreview} alt="Job offer preview" className="mt-3 max-h-48 w-full rounded-xl object-contain" />}
                <textarea
                  rows={3}
                  value={imageDescription}
                  onChange={(event) => setImageDescription(event.target.value)}
                  placeholder={lang === "ID" ? "Tambahkan teks penting dari gambar (opsional)..." : "Add important text from the image (optional)..."}
                  className="mt-3 w-full resize-none rounded-xl border border-[#064B50]/15 bg-[#F7F7F0] p-3 text-xs outline-none focus:border-[#064B50]"
                />
                <p className="mt-2 text-xs text-[#202C2B]/60">
                  {lang === "ID" ? "Demo ini tidak mengirim gambar ke layanan pihak ketiga. Tambahkan teks gambar agar indikator dapat dianalisis." : "This demo does not send images to third-party services. Add image text so indicators can be analyzed."}
                </p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isScanning || !currentInput.trim()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#064B50] px-5 py-3 font-extrabold text-white transition-colors hover:bg-[#087F7A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-[#B8F000] ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? (lang === "ID" ? "Menganalisis..." : "Analyzing...") : (lang === "ID" ? "Analisis Tawaran" : "Analyze Offer")}
            </button>
            {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">{error}</p>}
            <p className="mt-3 text-center text-[11px] text-[#202C2B]/55">
              {lang === "ID" ? "Hasil adalah indikasi berbasis aturan, bukan bukti pasti bahwa tawaran aman atau penipuan." : "This is an explainable rule-based indication, not proof that an offer is safe or fraudulent."}
            </p>
          </section>

          <section className={`rounded-3xl border-2 p-5 shadow-md sm:p-6 lg:col-span-5 ${result ? levelStyles[risk.level] : "border-[#064B50]/15 bg-white"}`}>
            {!result ? (
              <div className="flex min-h-72 flex-col items-center justify-center text-center">
                <ShieldCheck className="mb-3 h-12 w-12 text-[#087F7A]" />
                <h2 className="text-lg font-extrabold text-[#064B50]">{lang === "ID" ? "Hasil analisis akan muncul di sini" : "Your analysis will appear here"}</h2>
                <p className="mt-2 text-sm opacity-75">{lang === "ID" ? "Masukkan data lalu tekan Analisis Tawaran." : "Enter data and click Analyze Offer."}</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between border-b border-current/10 pb-3">
                  <span className="flex items-center gap-2 text-xs font-extrabold uppercase"><AlertTriangle className="h-4 w-4" /> {lang === "ID" ? "Hasil Evaluasi Jeli" : "Jeli Evaluation Result"}</span>
                  <span className="text-3xl font-black">{risk.score}<small className="text-sm font-normal">/100</small></span>
                </div>
                <h2 className="mb-2 text-xl font-extrabold">{lang === "ID" ? (risk.level === "high" ? "Risiko Tinggi" : risk.level === "medium" ? "Perlu Waspada" : "Risiko Rendah") : (risk.level === "high" ? "High Risk" : risk.level === "medium" ? "Needs Caution" : "Low Risk")}</h2>
                <p className="mb-5 text-sm leading-relaxed">{risk.summary}</p>
                <div className="mb-5 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase">{lang === "ID" ? "Indikator terdeteksi" : "Detected indicators"}</h3>
                  {risk.flags.map((flag) => <div key={flag} className="rounded-xl border border-current/10 bg-white/60 p-3 text-xs leading-relaxed"><Check className="mr-1 inline h-3.5 w-3.5" />{flag}</div>)}
                </div>
                <div className="mb-5 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase">{lang === "ID" ? "Rekomendasi" : "Recommendations"}</h3>
                  {risk.recommendations.map((recommendation) => <div key={recommendation} className="rounded-xl border border-current/10 bg-white/60 p-3 text-xs leading-relaxed"><Check className="mr-1 inline h-3.5 w-3.5" />{recommendation}</div>)}
                </div>
                <p className="mb-4 text-[11px] opacity-70">{risk.disclaimer}</p>
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
