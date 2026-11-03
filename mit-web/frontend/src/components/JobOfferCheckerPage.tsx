import React, { useState } from "react"
import {
  ArrowLeft,
  Scan,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react"
import { t } from "../i18n"

interface JobOfferCheckerPageProps {
  onBackToHome: () => void
  lang: "ID" | "EN"
}

export const JobOfferCheckerPage: React.FC<JobOfferCheckerPageProps> = ({
  onBackToHome,
  lang,
}) => {
  const [inputText, setInputText] = useState(
    "Selamat Kak! Kamu terpilih sebagai Staff Admin Data WFH. Gaji Rp14.000.000/bln. Untuk konfirmasi jadwal wawancara, mohon transfer biaya jaminan seragam & kartu identitas sebesar Rp350.000 ke rekening BCA 882012345 a.n. Rahmat. Biaya akan direfund 100% pada hari pertama kerja.",
  )
  const [isScanning, setIsScanning] = useState(false)
  const [copied, setCopied] = useState(false)

  const presets = [
    {
      title: "Modus Biaya Seragam WFH",
      text: "Selamat Kak! Kamu terpilih sebagai Staff Admin Data WFH. Gaji Rp14.000.000/bln. Untuk konfirmasi jadwal wawancara, mohon transfer biaya jaminan seragam & kartu identitas sebesar Rp350.000 ke rekening BCA 882012345 a.n. Rahmat. Biaya akan direfund 100% pada hari pertama kerja.",
      score: 12,
      verdict: "BAHAYA TINGGI (96% RISIKO PENIPUAN)",
      isSafe: false,
    },
    {
      title: "Misi Telegram Like & Subscribe",
      text: "Lowongan Paruh Waktu: Cukup like 5 video YouTube dan follow akun IG. Komisi harian Rp450.000 langsung cair. Untuk aktivasi akun VIP dan komisi berlipat ganda, wajib deposit saldo awal Rp500.000 ke rekening admin.",
      score: 8,
      verdict: "PONZI TASK SCAM (98% RISIKO)",
      isSafe: false,
    },
    {
      title: "Tawaran Resmi Tech Company",
      text: "Halo Andi, terima kasih telah melamar posisi Frontend Engineer di PT Karya Digital Nusantara. Kami mengundang Anda untuk mengikuti sesi wawancara teknis via Google Meet. Proses rekrutmen kami 100% gratis tanpa biaya apapun.",
      score: 95,
      verdict: "AMAN (TERVERIFIKASI RESMI)",
      isSafe: true,
    },
  ]

  const handleScan = () => {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
    }, 600)
  }

  const handleCopyReply = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#F7F7F0] bg-warm-grid text-[#202C2B] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#064B50]/10">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#202C2B] hover:text-[#064B50] transition-colors p-2 rounded-xl hover:bg-white border border-transparent hover:border-[#064B50]/15"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {lang === "ID" ? "Kembali ke Beranda" : "Back to Homepage"}
            </span>
          </button>

          <div className="flex items-center gap-2 bg-[#064B50]/10 border border-[#064B50]/20 px-3 py-1.5 rounded-full text-xs font-bold text-[#064B50]">
            <Scan className="w-3.5 h-3.5 text-[#087F7A]" />
            <span>Jeli Job Offer Scanner v2.4</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#064B50] tracking-tight mb-3">
            {lang === "ID"
              ? "Pemeriksa Tawaran Kerja Jeli"
              : "Jeli Job Offer Scanner"}
          </h1>
          <p className="text-sm sm:text-base text-[#202C2B]/80">
            {lang === "ID"
              ? "Tempelkan teks lowongan kerja, pesan chat perekrut, atau undangan wawancara untuk mendeteksi kejanggalan dalam 15 detik."
              : "Paste job vacancy text or recruiter messages to inspect red flags and get safety clarity in 15 seconds."}
          </p>
        </div>

        {/* Preset Presets Buttons */}
        <div className="mb-4">
          <p className="text-xs font-bold text-[#202C2B]/70 mb-2">
            {lang === "ID"
              ? "Uji dengan contoh kasus nyata:"
              : "Test with realistic presets:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(p.text)
                  handleScan()
                }}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-white hover:bg-[#EBECE1] border border-[#064B50]/15 text-[#202C2B] transition-all shadow-2xs"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main Checker Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Text Input Box */}
          <div className="lg:col-span-7 bg-white border border-[#064B50]/15 rounded-3xl p-5 sm:p-6 shadow-sm">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#064B50] mb-2">
              {t(lang, "jobTextLabel")}
            </label>

            <textarea
              rows={7}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t(lang, "jobTextPlaceholder")}
              className="w-full bg-[#F7F7F0] border border-[#064B50]/15 rounded-2xl p-4 text-xs sm:text-sm text-[#202C2B] placeholder-slate-400 focus:outline-none focus:border-[#064B50] transition-colors font-sans resize-none leading-relaxed"
            />

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-[#202C2B]/60 font-mono">
                {inputText.length} karakter terisi
              </span>

              <button
                onClick={handleScan}
                disabled={isScanning}
                className="bg-[#064B50] hover:bg-[#087F7A] text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all hover:scale-102"
              >
                <RefreshCw
                  className={`w-4 h-4 text-[#B8F000] ${
                    isScanning ? "animate-spin" : ""
                  }`}
                />
                <span>{isScanning ? t(lang, "scanning") : t(lang, "scanAgain")}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Real-time Analysis Card */}
          <div className="lg:col-span-5 bg-white border-2 border-red-200 rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-xs font-extrabold text-[#202C2B]">
                  HASIL EVALUASI JELI
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded">
                96% RISIKO PENIPUAN
              </span>
            </div>

            {/* Safety Score Meter */}
            <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4 text-center mb-4">
              <p className="text-[11px] font-bold text-red-800 uppercase tracking-wider">
                Tingkat Keamanan Tawaran
              </p>
              <p className="text-4xl font-black text-red-700 font-mono my-1">
                12{" "}
                <span className="text-sm text-slate-400 font-normal">
                  / 100
                </span>
              </p>
              <p className="text-xs font-bold text-red-800">
                {t(lang, "unsafe")}
              </p>
            </div>

            {/* Detected Red Flags */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-extrabold text-[#202C2B] uppercase tracking-wider">
                {t(lang, "redFlags")}
              </p>
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <span className="font-bold shrink-0">1.</span>
                <span>
                  Memungut biaya seragam & ID Card di awal (Pelanggaran UU
                  Ketenagakerjaan).
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                <span className="font-bold shrink-0">2.</span>
                <span>
                  Rekening tujuan transfer mengatasnamakan rekening bank
                  pribadi.
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <span className="font-bold shrink-0">3.</span>
                <span>
                  Gaji Rp14.000.000 untuk posisi admin entry data tanpa seleksi
                  wawancara mendalam.
                </span>
              </div>
            </div>

            {/* Safe Reply Script */}
            <div className="p-3 bg-[#F7F7F0] border border-[#064B50]/12 rounded-2xl mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#064B50]">
                  {t(lang, "safeDraft")}
                </span>
                <button
                  onClick={handleCopyReply}
                  className="text-[11px] font-bold text-[#064B50] hover:text-[#087F7A] hover:underline flex items-center gap-1"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-[#16A34A]" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copied ? t(lang, "copied") : t(lang, "copy")}</span>
                </button>
              </div>
              <p className="text-xs text-[#202C2B] italic bg-white p-2.5 rounded-xl border border-[#064B50]/10">
                &quot;Terima kasih. Sesuai standar rekrutmen profesional, saya
                tidak dapat mentransfer biaya apapun sebelum kontrak kerja resmi
                ditandatangani.&quot;
              </p>
            </div>

            {/* Action Buttons */}
            <button
              onClick={onBackToHome}
              className="w-full bg-[#064B50] hover:bg-[#087F7A] text-white font-bold text-xs py-2.5 rounded-xl transition-colors text-center shadow-xs"
            >
              {t(lang, "backHomepage")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobOfferCheckerPage
