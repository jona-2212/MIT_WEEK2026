import { jsPDF } from "jspdf"
import { locales, type Language } from "../i18n"
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
  lang?: Language
}

export function generateSimulatorPdf({ scenario, answers, lang = "ID" }: GenerateSimulatorPdfOptions): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })
  const en = lang === "EN"

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
      ? "Rapor latihan penipuan kerja"
      : "Job scam practice report",
    margin,
    y + 5
  )

  const now = new Date()
  const dateStr = now.toLocaleString(locales[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`${lang === "ID" ? "Waktu Latihan" : "Date"}: ${dateStr}`, pageWidth - margin, y, { align: "right" })
  doc.text(`${en ? "Scenario ID" : "ID skenario"}: ${scenario.id}`, pageWidth - margin, y + 4.5, { align: "right" })

  y += 11
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  // --- SCENARIO SUMMARY ---
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  const titleLines: string[] = doc.splitTextToSize(scenario.title, contentWidth - 10)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  const descLines: string[] = doc.splitTextToSize(scenario.description, contentWidth - 10)
  const cardHeight = 17 + titleLines.length * 5 + descLines.length * 4

  ensureSpace(cardHeight + 6)
  doc.setFillColor(247, 247, 240)
  doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, "F")
  doc.setDrawColor(8, 127, 122)
  doc.setLineWidth(0.8)
  doc.line(margin, y, margin, y + cardHeight)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(6, 75, 80)
  doc.text(titleLines, margin + 5, y + 8)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(71, 85, 105)
  const descY = y + 8 + titleLines.length * 5
  doc.text(descLines, margin + 5, descY)
  const answered = en
    ? `${answers.length} of ${scenario.questions?.length ?? answers.length} questions answered.`
    : `${answers.length} dari ${scenario.questions?.length ?? answers.length} pertanyaan dijawab.`
  doc.text(answered, margin + 5, descY + descLines.length * 4 + 2)

  y += cardHeight + 6

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
    doc.text(`${en ? "Question" : "Pertanyaan"} ${ans.questionNumber}: ${ans.title}`, margin + 3, y + 5)
    y += 10

    // Recruiter Message quote
    doc.setFont("helvetica", "italic")
    doc.setFontSize(8)
    doc.setTextColor(75, 85, 99)
    const recruiterLines = doc.splitTextToSize(`${en ? "Recruiter message" : "Pesan perekrut"}: "${ans.recruiterMessage}"`, contentWidth - 8)
    ensureSpace(recruiterLines.length * 4 + 4)
    doc.text(recruiterLines, margin + 4, y)
    y += recruiterLines.length * 3.8 + 3

    // Challenge text
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(6, 75, 80)
    const challengeLines = doc.splitTextToSize(`${en ? "Challenge" : "Tantangan"}: ${ans.challengeText}`, contentWidth - 8)
    ensureSpace(challengeLines.length * 4 + 4)
    doc.text(challengeLines, margin + 4, y)
    y += challengeLines.length * 3.8 + 4

    // User Response & Correctness
    const isAnsCorrect = ans.isCorrect
    const statusBg = isAnsCorrect ? [240, 253, 244] : [254, 242, 242]
    const statusTextCol = isAnsCorrect ? [22, 101, 52] : [153, 27, 27]
    const statusLabel = isAnsCorrect ? (en ? "Safe choice" : "Pilihan aman") : (en ? "Risky choice" : "Pilihan berisiko")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    const statusLines = doc.splitTextToSize(
      ans.feedbackLabel ? `${statusLabel} · ${ans.feedbackLabel}` : statusLabel,
      contentWidth - 14
    )
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.8)
    const optionLines = doc.splitTextToSize(
      `${en ? "Your choice" : "Pilihanmu"}: ${ans.selectedOptionText}`,
      contentWidth - 14
    )
    const saferLines = !isAnsCorrect && ans.correctOptionText
      ? doc.splitTextToSize(`${en ? "Safer choice" : "Pilihan lebih aman"}: ${ans.correctOptionText}`, contentWidth - 14)
      : []
    const responseHeight = 7 + (statusLines.length + optionLines.length + saferLines.length) * 3.6
    ensureSpace(responseHeight + 3)

    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2])
    doc.roundedRect(margin + 2, y, contentWidth - 4, responseHeight, 2, 2, "F")
    doc.setDrawColor(statusTextCol[0], statusTextCol[1], statusTextCol[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(margin + 2, y, contentWidth - 4, responseHeight, 2, 2, "S")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(statusTextCol[0], statusTextCol[1], statusTextCol[2])
    doc.text(statusLines, margin + 5, y + 5)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.8)
    doc.setTextColor(30, 41, 59)
    doc.text(optionLines, margin + 5, y + 6 + statusLines.length * 3.6)
    if (saferLines.length) doc.text(saferLines, margin + 5, y + 6 + (statusLines.length + optionLines.length) * 3.6)
    y += responseHeight + 3

    // Explanation
    if (ans.explanation) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      doc.setTextColor(71, 85, 105)
      const explLines = doc.splitTextToSize(`${en ? "Analysis" : "Analisis"}: ${ans.explanation}`, contentWidth - 8)
      ensureSpace(explLines.length * 3.5 + 4)
      doc.text(explLines, margin + 4, y)
      y += explLines.length * 3.5 + 3
    }

    // Good Answer Description (Deskripsi Jawaban yang Baik)
    if (ans.goodAnswerSummary) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.setFillColor(254, 252, 232) // light yellow #fefce8
      const goodLines = doc.splitTextToSize(
        `${en ? "What makes a good reply" : "Ciri balasan yang baik"}: ${ans.goodAnswerSummary}`,
        contentWidth - 12
      )
      const goodBoxHeight = Math.max(12, goodLines.length * 3.4 + 5)
      ensureSpace(goodBoxHeight + 3)
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
      doc.setFont("helvetica", "italic")
      doc.setFontSize(7.2)
      doc.setTextColor(8, 127, 122)
      const takeawayLines = doc.splitTextToSize(
        `${en ? "Key takeaway" : "Pelajaran utama"}: ${ans.educationalTakeaway}`,
        contentWidth - 8
      )
      ensureSpace(takeawayLines.length * 3.4 + 4)
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
  doc.text(en ? "Official reporting channels in Indonesia" : "Kanal aduan resmi di Indonesia", margin + 4, y + 5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(71, 85, 105)
  doc.text(en ? "1. Check bank accounts: https://cekrekening.id" : "1. Cek rekening: https://cekrekening.id", margin + 4, y + 9)
  doc.text(en ? "2. Report cyber fraud to the police: https://patrolisiber.id" : "2. Lapor penipuan siber ke Polri: https://patrolisiber.id", margin + 4, y + 13)
  doc.text(en ? "3. Labour and trafficking reports: Kemnaker RI and BP2MI (133)" : "3. Aduan tenaga kerja dan TPPO: Kemnaker RI dan BP2MI (133)", margin + 4, y + 17)

  // Page numbers on all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(
      en ? `Page ${i} of ${totalPages} · Jeli Lakon` : `Halaman ${i} dari ${totalPages} · Jeli Lakon`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    )
  }

  // Save PDF file
  const safeTitle = scenario.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 30)
  doc.save(`${en ? "Jeli-Practice-Report" : "Laporan-Latihan-Jeli"}-${safeTitle}-${now.toISOString().slice(0, 10)}.pdf`)
}
