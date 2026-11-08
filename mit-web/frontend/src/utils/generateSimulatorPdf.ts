import { jsPDF } from "jspdf"
import type { Scenario } from "../services/roleplay"

export interface UserAnswerRecord {
  questionNumber: number
  selectedOptionId: string
  selectedOptionText: string
  isCorrect: boolean
  feedbackLabel: string
  explanation: string
  goodAnswerSummary: string
  educationalTakeaway: string
  recruiterMessage: string
  challengeText: string
  title: string
  correctOptionText?: string
}

interface GenerateSimulatorPdfOptions {
  scenario: Scenario
  answers: UserAnswerRecord[]
  lang?: "ID" | "EN"
}

export function generateSimulatorPdf({ scenario, answers, lang = "ID" }: GenerateSimulatorPdfOptions): void {
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
    if (y + requiredHeight > pageHeight - margin - 12) {
      doc.addPage()
      y = margin + 6
    }
  }

  // --- HEADER / BANNER ---
  doc.setFillColor(6, 75, 80) // #064B50
  doc.rect(0, 0, pageWidth, 6, "F")

  y = 16
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(6, 75, 80)
  doc.text("JELI LAKON", margin, y)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text(
    lang === "ID"
      ? "Laporan Hasil Latihan Simulator Scam & Uji Keputusan Refleks AI"
      : "Job Scam Simulator Training Report & AI Decision Evaluation",
    margin,
    y + 5
  )

  const now = new Date()
  const dateStr = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`${lang === "ID" ? "Waktu Latihan" : "Date"}: ${dateStr}`, pageWidth - margin, y, { align: "right" })
  doc.text(`ID Skenario: ${scenario.id}`, pageWidth - margin, y + 4.5, { align: "right" })

  y += 11
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  // --- SUMMARY SCORE CARD ---
  const totalCompleted = answers.length
  const correctCount = answers.filter((a) => a.isCorrect).length
  const scorePercent = totalCompleted > 0 ? Math.round((correctCount / totalCompleted) * 100) : 0

  ensureSpace(36)
  // Background card
  doc.setFillColor(247, 247, 240)
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, "F")
  doc.setDrawColor(8, 127, 122)
  doc.setLineWidth(0.8)
  doc.line(margin, y, margin, y + 32)

  // Title of scenario
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(6, 75, 80)
  doc.text(scenario.title, margin + 5, y + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  const descLines = doc.splitTextToSize(scenario.description, contentWidth - 55)
  doc.text(descLines.slice(0, 2), margin + 5, y + 14)

  // Score badge
  const scoreBoxX = pageWidth - margin - 45
  const scoreBoxY = y + 4
  const badgeColor = scorePercent >= 80 ? [8, 127, 122] : scorePercent >= 50 ? [217, 119, 6] : [220, 38, 38]
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2])
  doc.roundedRect(scoreBoxX, scoreBoxY, 40, 24, 2, 2, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(`${scorePercent}%`, scoreBoxX + 20, scoreBoxY + 10, { align: "center" })

  doc.setFontSize(7.5)
  doc.setFont("helvetica", "normal")
  doc.text(`${correctCount}/${totalCompleted} ${lang === "ID" ? "Aman" : "Safe"}`, scoreBoxX + 20, scoreBoxY + 16, {
    align: "center",
  })
  doc.text(
    scorePercent >= 80 ? "SANGAT SIAP" : scorePercent >= 50 ? "PERLU WASPADA" : "BERISIKO TINGGI",
    scoreBoxX + 20,
    scoreBoxY + 21,
    { align: "center" }
  )

  y += 38

  // --- QUESTIONS BREAKDOWN HEADER ---
  ensureSpace(12)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(6, 75, 80)
  doc.text(lang === "ID" ? "RINCIAN PERTANYAAN & JAWABAN LATIHAN" : "QUESTIONS & RESPONSES BREAKDOWN", margin, y)
  y += 5

  // --- RENDER EACH QUESTION AND USER RESPONSE ---
  answers.forEach((ans) => {
    // Estimated required height
    ensureSpace(65)

    // Subheader: Question Number & Stage Title
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(30, 58, 138)
    doc.text(`Pertanyaan ${ans.questionNumber}: ${ans.title}`, margin + 3, y + 5)
    y += 10

    // Recruiter Message quote
    doc.setFont("helvetica", "italic")
    doc.setFontSize(8)
    doc.setTextColor(75, 85, 99)
    const recruiterLines = doc.splitTextToSize(`Pesan Perekrut: "${ans.recruiterMessage}"`, contentWidth - 8)
    ensureSpace(recruiterLines.length * 4 + 4)
    doc.text(recruiterLines, margin + 4, y)
    y += recruiterLines.length * 3.8 + 3

    // Challenge text
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(6, 75, 80)
    const challengeLines = doc.splitTextToSize(`Tantangan: ${ans.challengeText}`, contentWidth - 8)
    ensureSpace(challengeLines.length * 4 + 4)
    doc.text(challengeLines, margin + 4, y)
    y += challengeLines.length * 3.8 + 4

    // User Response & Correctness
    ensureSpace(20)
    const isAnsCorrect = ans.isCorrect
    const statusBg = isAnsCorrect ? [240, 253, 244] : [254, 242, 242]
    const statusTextCol = isAnsCorrect ? [22, 101, 52] : [153, 27, 27]

    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2])
    doc.roundedRect(margin + 2, y, contentWidth - 4, 14, 2, 2, "F")
    doc.setDrawColor(statusTextCol[0], statusTextCol[1], statusTextCol[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(margin + 2, y, contentWidth - 4, 14, 2, 2, "S")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(statusTextCol[0], statusTextCol[1], statusTextCol[2])
    doc.text(
      isAnsCorrect ? `[OK] ${ans.feedbackLabel || "Jawaban Tepat & Aman"}` : `[PERINGATAN] ${ans.feedbackLabel || "Jawaban Salah / Terjebak"}`,
      margin + 5,
      y + 5
    )

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.8)
    doc.setTextColor(30, 41, 59)
    const userOptionLines = doc.splitTextToSize(`Pilihanmu: ${ans.selectedOptionText}`, contentWidth - 14)
    doc.text(userOptionLines.slice(0, 2), margin + 5, y + 10)
    y += 17

    // Explanation
    if (ans.explanation) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      doc.setTextColor(71, 85, 105)
      const explLines = doc.splitTextToSize(`Analisis: ${ans.explanation}`, contentWidth - 8)
      ensureSpace(explLines.length * 3.5 + 4)
      doc.text(explLines, margin + 4, y)
      y += explLines.length * 3.5 + 3
    }

    // Good Answer Description (Deskripsi Jawaban yang Baik)
    if (ans.goodAnswerSummary) {
      ensureSpace(18)
      doc.setFillColor(254, 252, 232) // light yellow #fefce8
      const goodLines = doc.splitTextToSize(
        `Deskripsi Jawaban yang Baik: ${ans.goodAnswerSummary}`,
        contentWidth - 12
      )
      const goodBoxHeight = Math.max(12, goodLines.length * 3.4 + 5)
      doc.roundedRect(margin + 2, y, contentWidth - 4, goodBoxHeight, 1.5, 1.5, "F")
      doc.setDrawColor(202, 138, 4)
      doc.setLineWidth(0.3)
      doc.roundedRect(margin + 2, y, contentWidth - 4, goodBoxHeight, 1.5, 1.5, "S")

      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.setTextColor(133, 77, 14)
      doc.text(goodLines, margin + 5, y + 4.5)
      y += goodBoxHeight + 3
    }

    // Educational Takeaway
    if (ans.educationalTakeaway) {
      ensureSpace(12)
      doc.setFont("helvetica", "italic")
      doc.setFontSize(7.2)
      doc.setTextColor(8, 127, 122)
      const takeawayLines = doc.splitTextToSize(
        `Dasar Regulasi & Tips Kunci: ${ans.educationalTakeaway}`,
        contentWidth - 8
      )
      doc.text(takeawayLines, margin + 4, y)
      y += takeawayLines.length * 3.4 + 4
    }

    // Divider between questions
    y += 2
    doc.setDrawColor(241, 245, 249)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5
  })

  // --- FOOTER SECTION ---
  ensureSpace(24)
  y += 2
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7.5)
  doc.setTextColor(15, 23, 42)
  doc.text("Kanal Aduan Resmi Penipuan Kerja RI:", margin + 4, y + 5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(71, 85, 105)
  doc.text("1. Cek Rekening & Rekam Jejak Pelaku: https://cekrekening.id", margin + 4, y + 9)
  doc.text("2. Laporan Penipuan Siber Polri: https://patrolisiber.id", margin + 4, y + 13)
  doc.text("3. Aduan Tenaga Kerja / TPPO: Kemnaker RI & BP2MI (Call Center: 133)", margin + 4, y + 17)

  // Page numbers on all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Halaman ${i} dari ${totalPages} · Jeli Lakon Simulator · Dokumen Hasil Latihan Mandiri`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    )
  }

  // Save PDF file
  const safeTitle = scenario.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 30)
  doc.save(`Laporan-Latihan-Jeli-${safeTitle}-${Date.now().toString().slice(-6)}.pdf`)
}
