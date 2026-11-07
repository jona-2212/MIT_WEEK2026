import { jsPDF } from "jspdf"
import type { JobAnalysisResponse, RiskCategory, IndicatorCode } from "../services/api"

interface GeneratePdfReportOptions {
  result: JobAnalysisResponse
  targetUrl?: string
  lang: "ID" | "EN"
}

const riskTitles: Record<RiskCategory, Record<"ID" | "EN", string>> = {
  high: { ID: "RISIKO TINGGI (HIGH RISK)", EN: "HIGH RISK" },
  medium: { ID: "PERLU WASPADA (MEDIUM RISK)", EN: "NEEDS CAUTION (MEDIUM RISK)" },
  low: { ID: "RISIKO RENDAH (LOW RISK)", EN: "LOW RISK" },
  insufficient_data: { ID: "DATA BELUM CUKUP", EN: "INSUFFICIENT DATA" },
}

const riskColors: Record<RiskCategory, [number, number, number]> = {
  high: [220, 38, 38], // #dc2626
  medium: [217, 119, 6], // #d97706
  low: [8, 127, 122], // #087F7A
  insufficient_data: [75, 85, 99], // #4b5563
}

const indicatorTitles: Record<IndicatorCode, Record<"ID" | "EN", string>> = {
  upfront_payment: { ID: "Permintaan Pembayaran Awal", EN: "Upfront Payment Request" },
  credential_request: { ID: "Permintaan Kredensial / OTP", EN: "Credential / OTP Request" },
  premature_sensitive_data: { ID: "Data Sensitif Terlalu Dini", EN: "Premature Sensitive Data" },
  urgency_pressure: { ID: "Tekanan Waktu / Larangan Verifikasi", EN: "Urgency Pressure" },
  unrealistic_offer: { ID: "Tawaran Gaji Tidak Wajar", EN: "Unrealistic Offer" },
  unofficial_channel: { ID: "Kanal Komunikasi Meragukan", EN: "Suspicious Channel" },
}

export function generatePdfReport({ result, targetUrl, lang }: GeneratePdfReportOptions): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = 210
  const pageHeight = 297
  const margin = 16
  const contentWidth = pageWidth - margin * 2
  let y = margin

  function ensureSpace(requiredHeight: number) {
    if (y + requiredHeight > pageHeight - margin - 10) {
      doc.addPage()
      y = margin + 5
    }
  }

  // --- 1. HEADER / LETTERHEAD ---
  // Top brand band
  doc.setFillColor(6, 75, 80) // #064B50
  doc.rect(0, 0, pageWidth, 5, "F")

  y = 16
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(6, 75, 80)
  doc.text("JELI AI", margin, y)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(
    lang === "ID"
      ? "Sistem Cerdas Evaluasi Risiko Rekrutmen & Perlindungan Pencari Kerja"
      : "Intelligent Job Scam Recognition & Job Seeker Guardian",
    margin,
    y + 5
  )

  // Document metadata box on top right
  const now = new Date()
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`${lang === "ID" ? "Tanggal" : "Date"}: ${dateStr}`, pageWidth - margin, y, { align: "right" })
  const reqId = result.request_id || `SCAN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  doc.text(`ID: ${reqId.slice(0, 18)}...`, pageWidth - margin, y + 4, { align: "right" })

  y += 12

  // Divider line
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)

  y += 6

  // --- 2. REPORT TITLE ---
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(32, 44, 43)
  doc.text(
    lang === "ID"
      ? "LAPORAN HASIL EVALUASI RISIKO LOWONGAN KERJA"
      : "JOB OFFER RISK ASSESSMENT REPORT",
    margin,
    y
  )
  y += 6

  if (targetUrl) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(8, 127, 122)
    doc.text(`Tautan Sumber: ${targetUrl.slice(0, 85)}${targetUrl.length > 85 ? "..." : ""}`, margin, y)
    y += 5
  }

  // --- 3. RISK ASSESSMENT BANNER ---
  const risk = result.fraud_assessment
  const [r, g, b] = riskColors[risk.risk_category]

  ensureSpace(22)
  doc.setFillColor(r, g, b)
  doc.roundedRect(margin, y, contentWidth, 18, 3, 3, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(riskTitles[risk.risk_category][lang], margin + 6, y + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  const categoryNote =
    risk.risk_category === "high"
      ? (lang === "ID"
          ? "Terdapat indikasi kuat pola penipuan kerja. Sangat disarankan tidak melanjutkan proses."
          : "Strong indicators of job scam detected. Strictly avoid proceeding.")
      : risk.risk_category === "medium"
      ? (lang === "ID"
          ? "Terdapat tanda yang mencurigakan dan perlu diverifikasi melalui kontak resmi perusahaan."
          : "Suspicious flags detected. Verify thoroughly via official company contacts.")
      : risk.risk_category === "low"
      ? (lang === "ID"
          ? "Tidak terdeteksi indikasi bahaya yang mencolok. Tetap verifikasi kontrak kerja."
          : "No immediate danger signals detected. Continue with standard diligence.")
      : (lang === "ID"
          ? "Materi belum cukup untuk menyimpulkan risiko secara pasti."
          : "Insufficient information to determine risk level.");

  doc.text(categoryNote, margin + 6, y + 14)
  y += 24

  // --- 4. RINGKASAN ANALISIS (EXECUTIVE SUMMARY) ---
  ensureSpace(25)
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(6, 75, 80)
  doc.text(lang === "ID" ? "RINGKASAN PENILAIAN JELI AI" : "EXECUTIVE SUMMARY", margin + 4, y + 5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(30, 41, 59)
  const summaryLines = doc.splitTextToSize(risk.summary, contentWidth - 8)
  doc.text(summaryLines, margin + 4, y + 10)

  y += 24

  // --- 5. INDIKATOR RISIKO TERDETEKSI ---
  const activeIndicators = risk.indicators.filter((item) => item.state !== "not_detected")
  ensureSpace(15)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.5)
  doc.setTextColor(6, 75, 80)
  doc.text(
    lang === "ID"
      ? `INDIKATOR RISIKO TERDETEKSI (${activeIndicators.length})`
      : `DETECTED RISK INDICATORS (${activeIndicators.length})`,
    margin,
    y
  )
  y += 5

  if (activeIndicators.length === 0) {
    ensureSpace(12)
    doc.setFillColor(240, 253, 244)
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F")
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8.5)
    doc.setTextColor(22, 101, 52)
    doc.text(
      lang === "ID"
        ? "✓ Tidak ada indikator penipuan eksplisit yang ditemukan pada materi ini."
        : "✓ No explicit scam indicators detected in this material.",
      margin + 4,
      y + 6.5
    )
    y += 14
  } else {
    for (const indicator of activeIndicators) {
      const isDetected = indicator.state === "detected"
      const reasonLines = doc.splitTextToSize(indicator.reason, contentWidth - 12)
      const evidenceLines = indicator.evidence.map((ev) =>
        doc.splitTextToSize(`“${ev.quote}” (${ev.source === "image" ? "Screenshot" : "Teks"})`, contentWidth - 16)
      )
      const totalEvidenceHeight = evidenceLines.reduce((acc, lines) => acc + lines.length * 3.8, 0)
      const itemHeight = 12 + reasonLines.length * 3.8 + (indicator.evidence.length > 0 ? totalEvidenceHeight + 6 : 0)

      ensureSpace(itemHeight + 4)

      // Item box
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(margin, y, contentWidth, itemHeight, 2, 2, "FD")

      // Indicator Title & State Pill
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(30, 41, 59)
      doc.text(indicatorTitles[indicator.code][lang], margin + 4, y + 5.5)

      doc.setFontSize(7.5)
      if (isDetected) {
        doc.setTextColor(220, 38, 38)
        doc.text(lang === "ID" ? "[ TERDETEKSI ]" : "[ DETECTED ]", pageWidth - margin - 4, y + 5.5, { align: "right" })
      } else {
        doc.setTextColor(217, 119, 6)
        doc.text(lang === "ID" ? "[ PERLU WASPADA ]" : "[ UNCERTAIN ]", pageWidth - margin - 4, y + 5.5, { align: "right" })
      }

      // Reason text
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text(reasonLines, margin + 4, y + 10)

      let innerY = y + 10 + reasonLines.length * 3.8

      // Evidence quote
      for (let i = 0; i < indicator.evidence.length; i++) {
        const evLines = evidenceLines[i]
        const evBoxHeight = evLines.length * 3.8 + 3

        doc.setFillColor(254, 242, 242)
        doc.setDrawColor(252, 165, 165)
        doc.roundedRect(margin + 4, innerY, contentWidth - 8, evBoxHeight, 1, 1, "FD")

        doc.setFont("helvetica", "italic")
        doc.setFontSize(7.5)
        doc.setTextColor(153, 27, 27)
        doc.text(evLines, margin + 6, innerY + 3.5)

        innerY += evBoxHeight + 2
      }

      y += itemHeight + 3
    }
  }

  y += 2

  // --- 6. REKOMENDASI TINDAKAN AMAN ---
  if (risk.recommendations.length > 0) {
    ensureSpace(12)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10.5)
    doc.setTextColor(6, 75, 80)
    doc.text(
      lang === "ID" ? "PANDUAN LANGKAH TINDAKAN AMAN" : "RECOMMENDED ACTION GUIDANCE",
      margin,
      y
    )
    y += 5

    for (const rec of risk.recommendations) {
      const recLines = doc.splitTextToSize(`• ${rec}`, contentWidth - 8)
      const recHeight = recLines.length * 3.8 + 2
      ensureSpace(recHeight)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8.5)
      doc.setTextColor(30, 41, 59)
      doc.text(recLines, margin + 2, y + 3)
      y += recHeight
    }
    y += 3
  }

  // --- 7. RUJUKAN HUKUM & REGULASI ---
  const legal = result.legal_screening
  if (legal && legal.references.length > 0) {
    ensureSpace(15)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10.5)
    doc.setTextColor(6, 75, 80)
    doc.text(
      lang === "ID" ? "DASAR REGULASI KETENAGAKERJAAN RI" : "LEGAL & REGULATORY REFERENCES",
      margin,
      y
    )
    y += 5

    for (const ref of legal.references) {
      const titleText = `${ref.title}${ref.article ? ` (${ref.article})` : ""}`
      const excerptLines = doc.splitTextToSize(ref.excerpt, contentWidth - 8)
      const refHeight = 6 + excerptLines.length * 3.5

      ensureSpace(refHeight + 3)
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(margin, y, contentWidth, refHeight, 1.5, 1.5, "FD")

      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(8, 127, 122)
      doc.text(titleText, margin + 4, y + 4)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      doc.setTextColor(71, 85, 105)
      doc.text(excerptLines, margin + 4, y + 8)

      y += refHeight + 2
    }
  }

  // --- 8. FOOTER / DISCLAIMER ---
  ensureSpace(20)
  y += 4
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y, pageWidth - margin, y)
  y += 4

  doc.setFont("helvetica", "italic")
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  const disclaimerText = doc.splitTextToSize(
    `${result.disclaimer} Hak Cipta © Jeli AI — Pendamping Keamanan Pencari Kerja Indonesia. Unduh resmi via platform Jeli.`,
    contentWidth
  )
  doc.text(disclaimerText, margin, y)

  // Trigger browser file download
  const filenameDate = now.toISOString().slice(0, 10)
  const filename = `Laporan-Evaluasi-Jeli-${result.fraud_assessment.risk_category.toUpperCase()}-${filenameDate}.pdf`
  doc.save(filename)
}
