import { useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Download,
  FileText,
  HelpCircle,
  Lightbulb,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  StopCircle,
  Wand2,
  X,
  XCircle,
} from "lucide-react"
import {
  generateCustomScenario,
  getScenarios,
  type QuestionOption,
  type Scenario,
  type SimulatorQuestion,
} from "../services/roleplay"
import { generateSimulatorPdf, type UserAnswerRecord } from "../utils/generateSimulatorPdf"

interface Props {
  onBackToHome: () => void
  lang: "ID" | "EN"
}

const customTemplates = [
  "Tawaran barista kopi disuruh bayar uang materai & jaminan seragam Rp75.000",
  "Admin media sosial freelance diminta kirim foto selfie memegang KTP",
  "Pekerjaan ketik dokumen manual tapi harus bayar biaya aktivasi akun Rp100.000",
  "Undangan seleksi kapal pesiar internasional diminta transfer tiket via travel rekanan",
  "Tawaran kerja remote gaji dolar tapi disuruh deposit kripto untuk buka dompet kerja",
]

const button =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#087F7A] disabled:cursor-not-allowed disabled:opacity-50"

export function ScamSimulatorPage({ onBackToHome, lang }: Props) {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Simulation Active State (Starts directly on question 1)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, UserAnswerRecord>>({})
  const [isFinished, setIsFinished] = useState(false)

  // Custom Scenario Generation State
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [generatingCustom, setGeneratingCustom] = useState(false)
  const [customError, setCustomError] = useState("")

  // PDF Download feedback
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Custom Modal Pop-up State (Replaces native browser alert & confirm)
  const [modalDialog, setModalDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: "info" | "warning" | "danger"
    onConfirm?: () => void
  }>({
    isOpen: false,
    title: "",
    message: "",
  })

  function showAlertDialog(title: string, message: string, variant: "info" | "warning" | "danger" = "info") {
    setModalDialog({
      isOpen: true,
      title,
      message,
      confirmText: "Mengerti",
      variant,
    })
  }

  function showConfirmDialog({
    title,
    message,
    confirmText = "Lanjutkan",
    cancelText = "Batal",
    variant = "warning",
    onConfirm,
  }: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: "info" | "warning" | "danger"
    onConfirm: () => void
  }) {
    setModalDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      variant,
      onConfirm,
    })
  }

  function closeModalDialog() {
    setModalDialog((prev) => ({ ...prev, isOpen: false }))
  }

  const activeScenario = scenarios.find((s) => s.id === selectedId) || scenarios[0]
  const questions: SimulatorQuestion[] = activeScenario?.questions || []
  const activeQuestion: SimulatorQuestion | undefined = questions[currentQuestionIdx]
  const currentAnswer = answers[currentQuestionIdx]

  useEffect(() => {
    const controller = new AbortController()
    getScenarios(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return
        setScenarios(items)
        if (items.length > 0) {
          setSelectedId(items[0].id)
        }
        setError("")
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Gagal memuat latihan.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  function handleSelectScenario(id: string) {
    if (Object.keys(answers).length > 0 && !isFinished) {
      showConfirmDialog({
        title: "Ganti Skenario Latihan?",
        message: "Berpindah ke skenario lain akan mereset progres latihan yang sedang berjalan. Apakah kamu yakin ingin berganti latihan?",
        confirmText: "Ya, Ganti Skenario",
        cancelText: "Lanjutkan Latihan Ini",
        variant: "warning",
        onConfirm: () => {
          setSelectedId(id)
          setCurrentQuestionIdx(0)
          setAnswers({})
          setIsFinished(false)
          setError("")
          closeModalDialog()
          window.scrollTo({ top: 120, behavior: "smooth" })
        },
      })
      return
    }
    setSelectedId(id)
    setCurrentQuestionIdx(0)
    setAnswers({})
    setIsFinished(false)
    setError("")
    window.scrollTo({ top: 120, behavior: "smooth" })
  }

  function handleSelectOption(option: QuestionOption) {
    if (!activeQuestion) return

    const record: UserAnswerRecord = {
      questionNumber: activeQuestion.question_number,
      title: activeQuestion.title,
      recruiterMessage: activeQuestion.recruiter_message,
      challengeText: activeQuestion.challenge_text,
      selectedOptionId: option.id,
      selectedOptionText: option.text,
      isCorrect: option.is_correct,
      feedbackLabel: option.feedback_label,
      explanation: option.explanation,
      goodAnswerSummary: activeQuestion.good_answer_summary,
      educationalTakeaway: activeQuestion.educational_takeaway,
      correctOptionText: activeQuestion.options.find((o) => o.is_correct)?.text,
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: record,
    }))
  }

  function handleNextQuestion() {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1)
      window.scrollTo({ top: 180, behavior: "smooth" })
    } else {
      setIsFinished(true)
      window.scrollTo({ top: 120, behavior: "smooth" })
    }
  }

  function handlePrevQuestion() {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1)
      window.scrollTo({ top: 180, behavior: "smooth" })
    }
  }

  function handleEndSimulation() {
    if (Object.keys(answers).length === 0) {
      showAlertDialog(
        "Latihan Belum Dimulai",
        "Kamu belum memilih respons pada pertanyaan ini. Silakan pilih salah satu opsi terlebih dahulu sebelum mengakhiri latihan.",
        "info"
      )
      return
    }
    showConfirmDialog({
      title: "Akhiri Latihan Sekarang?",
      message: `Kamu telah menyelesaikan ${totalAnswered} dari ${questions.length} pertanyaan. Apakah kamu ingin menyudahi sesi sekarang dan melihat evaluasi hasil latihanmu?`,
      confirmText: "Ya, Akhiri & Lihat Rapor",
      cancelText: "Lanjutkan Latihan",
      variant: "danger",
      onConfirm: () => {
        closeModalDialog()
        setIsFinished(true)
        window.scrollTo({ top: 120, behavior: "smooth" })
      },
    })
  }

  function handleRestartSimulation() {
    setCurrentQuestionIdx(0)
    setAnswers({})
    setIsFinished(false)
    window.scrollTo({ top: 120, behavior: "smooth" })
  }

  function handleDownloadPdf() {
    if (!activeScenario) return
    setDownloadingPdf(true)
    try {
      const records = Object.keys(answers)
        .map(Number)
        .sort((a, b) => a - b)
        .map((idx) => answers[idx])
      generateSimulatorPdf({
        scenario: activeScenario,
        answers: records,
        lang,
      })
    } catch (e) {
      console.error("PDF generation failed:", e)
      showAlertDialog(
        "Gagal Mengunduh Dokumen",
        "Terjadi kendala saat menghasilkan berkas PDF di browsermu. Silakan coba kembali beberapa saat lagi.",
        "warning"
      )
    } finally {
      setTimeout(() => setDownloadingPdf(false), 800)
    }
  }

  async function handleCreateCustomScenario(e?: React.FormEvent) {
    e?.preventDefault()
    if (!customPrompt.trim() || generatingCustom) return

    setGeneratingCustom(true)
    setCustomError("")
    const controller = new AbortController()

    try {
      const created = await generateCustomScenario(customPrompt.trim(), controller.signal)
      setScenarios((prev) => [created, ...prev])
      setSelectedId(created.id)
      setCurrentQuestionIdx(0)
      setAnswers({})
      setIsFinished(false)
      setShowCustomModal(false)
      setCustomPrompt("")
      window.scrollTo({ top: 120, behavior: "smooth" })
    } catch (err: unknown) {
      setCustomError(err instanceof Error ? err.message : "Gagal membuat skenario AI. Pastikan backend aktif.")
    } finally {
      setGeneratingCustom(false)
    }
  }

  const answeredList = Object.values(answers)
  const totalAnswered = answeredList.length
  const correctCount = answeredList.filter((a) => a.isCorrect).length
  const scorePercent = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0

  return (
    <main className="min-h-screen bg-warm-grid px-4 pb-24 pt-28 text-[#202C2B]">
      <div className="mx-auto max-w-5xl">
        {/* Navigation back */}
        <button onClick={onBackToHome} className={`${button} mb-6 px-0 text-[#064B50] hover:text-[#087F7A]`}>
          <ArrowLeft size={17} /> {lang === "ID" ? "Kembali ke Beranda" : "Back to Homepage"}
        </button>

        {/* Header */}
        <header className="mb-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EFF7D5] px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-[#064B50]">
            <Sparkles size={14} className="text-[#087F7A]" />
            Jeli Lakon · Simulator Scam Interaktif
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#064B50] sm:text-4xl">
            Latih refleksmu menghadapi modus penipuan kerja.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#202C2B]/75">
            Setiap modul menyajikan <strong>studi kasus nyata</strong> beserta kemungkinan skenario dari penipu.
            Pilih responsmu di setiap pertanyaan, pelajari analisis benar/salah dan deskripsi jawaban yang baik, lalu unduh rapor lengkapmu dalam format PDF.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#087F7A]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} /> 5 Modul Studi Kasus Siap Pakai
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} /> Generator Kasus Mandiri (AI)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} /> Evaluasi Benar & Salah Seketika
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={15} /> Unduh Laporan PDF
            </span>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-[#064B50]">
            <LoaderCircle className="animate-spin text-[#087F7A]" size={24} />
            <span>Memuat data simulasi latihan…</span>
          </div>
        ) : (
          /* Notice items-start to prevent empty stretching! */
          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
            {/* Left Sidebar: Scenario Selector & AI Custom Creator */}
            <aside aria-label="Pilih skenario" className="space-y-3">
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#087F7A]/40 bg-[#EFF7D5]/70 p-4 text-xs font-extrabold text-[#064B50] shadow-2xs transition-all hover:border-[#087F7A] hover:bg-[#EFF7D5]"
              >
                <Wand2 size={16} className="text-[#087F7A]" />
                <span>+ Buat Skenario Sendiri (AI)</span>
              </button>

              <div className="space-y-2.5">
                {scenarios.map((item, index) => {
                  const isCustom = item.id.startsWith("custom-")
                  const isSelected = selectedId === item.id
                  const qCount = item.questions?.length || item.total_questions || 5

                  return (
                    <button
                      key={item.id}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectScenario(item.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-[#087F7A] ${
                        isSelected
                          ? "border-[#064B50] bg-[#064B50] text-white shadow-md ring-2 ring-[#087F7A]/30"
                          : "border-[#064B50]/15 bg-white text-[#202C2B] hover:border-[#087F7A]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                          {isCustom ? "✨ KASUS KUSTOM AI" : `MODUL 0${index + 1}`}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isSelected ? "bg-[#B8F000] text-[#064B50]" : "bg-[#F7F7F0] text-[#064B50]"
                          }`}
                        >
                          {qCount} Pertanyaan
                        </span>
                      </div>
                      <h2 className="mt-1.5 text-sm font-bold leading-snug">{item.title}</h2>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed opacity-80">{item.description}</p>
                    </button>
                  )
                })}
              </div>
            </aside>

            {/* Right: Main Simulator Arena (No justify-between, natural flow!) */}
            <section className="min-w-0 overflow-hidden rounded-3xl border border-[#064B50]/15 bg-white shadow-sm flex flex-col">
              {/* Top Banner Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#064B50]/10 bg-[#FAFBF6] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#064B50] text-white">
                    <MessageCircle size={16} />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-[#064B50]">
                      {activeScenario?.title || "Simulasi Penipuan Kerja"}
                    </p>
                    <p className="text-[11px] text-[#202C2B]/60">
                      {!isFinished && questions.length > 0
                        ? `Pertanyaan ${currentQuestionIdx + 1} dari ${questions.length}`
                        : "Laporan Evaluasi Keputusan"}
                    </p>
                  </div>
                </div>

                {!isFinished && totalAnswered > 0 && (
                  <button
                    onClick={handleEndSimulation}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <StopCircle size={14} /> Akhiri Latihan
                  </button>
                )}
              </div>

              {/* View 1: Active Multi-Stage Question (1 Question Active at a time) */}
              {!isFinished && activeQuestion && (
                <div className="p-5 sm:p-7 space-y-5">
                  {/* Studi Kasus & Konteks Modul yang Jelas */}
                  <div className="rounded-2xl border border-[#087F7A]/20 bg-[#F7F7F0] p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-[#087F7A]" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#064B50]">
                          Studi Kasus: {activeScenario?.title}
                        </span>
                      </div>
                      <span className="rounded-full bg-[#EFF7D5] px-2.5 py-0.5 text-[10px] font-bold text-[#064B50]">
                        {activeScenario?.id.startsWith("custom-") ? "Kasus Pengguna" : "Studi Kasus Resmi"}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#202C2B]/85 leading-relaxed font-medium">
                      {activeScenario?.description}
                    </p>

                    <div className="mt-2.5 flex items-start gap-1.5 text-xs font-semibold text-[#087F7A] bg-white/70 p-2.5 rounded-xl border border-[#064B50]/10">
                      <span className="font-bold shrink-0">Target Latihan:</span>
                      <span>{activeScenario?.objective}</span>
                    </div>
                  </div>

                  {/* Stepper Progress Indicator */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#064B50] mb-2">
                      <span>Pertanyaan {currentQuestionIdx + 1} dari {questions.length}</span>
                      <span>{Math.round(((currentQuestionIdx + 1) / questions.length) * 100)}% Selesai</span>
                    </div>

                    {/* Progress Pills */}
                    <div className="flex gap-1.5">
                      {questions.map((q, idx) => {
                        const isAnswered = answers[idx] !== undefined
                        const isCurrent = idx === currentQuestionIdx
                        const isCorrect = answers[idx]?.isCorrect

                        let pillStyle = "bg-slate-200 text-slate-500"
                        if (isCurrent) pillStyle = "bg-[#064B50] text-white ring-2 ring-[#087F7A]/40"
                        else if (isAnswered) {
                          pillStyle = isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-red-500 text-white"
                        }

                        return (
                          <button
                            key={q.question_number}
                            onClick={() => {
                              setCurrentQuestionIdx(idx)
                            }}
                            title={`Pertanyaan ${idx + 1}: ${q.title}`}
                            className={`flex-1 h-2 rounded-full transition-all ${pillStyle}`}
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* Stage Title */}
                  <div className="pt-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#087F7A]">
                      TAHAP {activeQuestion.question_number} DARI {questions.length}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#064B50]">{activeQuestion.title}</h3>
                  </div>

                  {/* Recruiter Message Bubble */}
                  <div className="rounded-2xl border border-[#064B50]/15 bg-[#FAFBF6] p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#064B50]">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>Pesan Perekrut Fiktif AI:</span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-[#202C2B] font-medium bg-white p-3.5 rounded-xl border border-slate-200">
                      “{activeQuestion.recruiter_message}”
                    </p>
                  </div>

                  {/* Challenge Prompt */}
                  <div className="flex items-start gap-2.5 rounded-xl bg-[#EFF7D5]/80 p-3.5 border border-[#087F7A]/20">
                    <HelpCircle size={18} className="text-[#087F7A] shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm font-bold text-[#064B50]">
                      {activeQuestion.challenge_text}
                    </p>
                  </div>

                  {/* Options List */}
                  <div className="space-y-3">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[#202C2B]/60">
                      PILIH RESPONSMU (KLIK UNTUK EVALUASI):
                    </p>
                    {activeQuestion.options.map((option) => {
                      const isSelected = currentAnswer?.selectedOptionId === option.id

                      let optionBorder = "border-slate-200 hover:border-[#087F7A] bg-white hover:bg-[#F7F7F0]"
                      if (isSelected) {
                        optionBorder = option.is_correct
                          ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30"
                          : "border-red-500 bg-red-50/70 ring-2 ring-red-500/30"
                      }

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelectOption(option)}
                          className={`w-full text-left rounded-2xl border-2 p-4 transition-all shadow-2xs ${optionBorder}`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-extrabold text-xs transition-colors ${
                                isSelected
                                  ? option.is_correct
                                    ? "bg-emerald-600 text-white"
                                    : "bg-red-500 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {option.id}
                            </span>
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-semibold text-[#202C2B] leading-snug">
                                {option.text}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Realtime Feedback Section (Once an option is picked) */}
                  {currentAnswer && (
                    <div className="space-y-4 rounded-2xl border p-5 sm:p-6 bg-[#FAFBF6] animate-in fade-in-50 duration-200">
                      {/* Status Banner */}
                      <div
                        className={`flex items-start gap-3 rounded-xl p-3.5 border ${
                          currentAnswer.isCorrect
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : "bg-red-50 border-red-200 text-red-900"
                        }`}
                      >
                        {currentAnswer.isCorrect ? (
                          <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-xs sm:text-sm font-extrabold">
                            {currentAnswer.feedbackLabel}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed opacity-90">
                            {currentAnswer.explanation}
                          </p>
                        </div>
                      </div>

                      {/* Deskripsi Mengenai Jawaban yang Baik */}
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-4">
                        <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-amber-900">
                          <Lightbulb size={16} className="text-amber-600" />
                          <span>Deskripsi Mengenai Jawaban yang Baik:</span>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-amber-950 font-medium">
                          {activeQuestion.good_answer_summary}
                        </p>
                      </div>

                      {/* Educational Takeaway & Regulation */}
                      {activeQuestion.educational_takeaway && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-[#EFF7D5]/80 p-3.5 border border-[#087F7A]/20">
                          <ShieldAlert size={16} className="text-[#087F7A] shrink-0 mt-0.5" />
                          <p className="text-xs leading-relaxed text-[#064B50]">
                            <strong className="font-bold">Kunci Regulasi & Refleks: </strong>
                            {activeQuestion.educational_takeaway}
                          </p>
                        </div>
                      )}

                      {/* Stepper Navigation Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                        {currentQuestionIdx > 0 ? (
                          <button
                            type="button"
                            onClick={handlePrevQuestion}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#064B50]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#064B50] hover:bg-[#F7F7F0] transition-colors"
                          >
                            <ChevronLeft size={16} /> Pertanyaan Sebelumnya
                          </button>
                        ) : (
                          <div />
                        )}

                        {currentQuestionIdx < questions.length - 1 ? (
                          <button
                            type="button"
                            onClick={handleNextQuestion}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#064B50] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#087F7A] transition-colors"
                          >
                            <span>Lanjut ke Pertanyaan Selanjutnya</span>
                            <ArrowRight size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleNextQuestion}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-800 transition-colors"
                          >
                            <span>🏁 Selesai & Lihat Rapor Hasil</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Always-present Bottom End Training Option */}
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                    <p className="text-xs text-[#202C2B]/60">
                      Ingin menyudahi latihan? Kamu tetap dapat meninjau rapor evaluasi dari pertanyaan yang sudah dijawab.
                    </p>
                    <button
                      type="button"
                      onClick={handleEndSimulation}
                      className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
                    >
                      Akhiri Latihan
                    </button>
                  </div>
                </div>
              )}

              {/* View 2: Final Report & PDF Download Screen */}
              {isFinished && (
                <div className="p-6 sm:p-8 animate-in fade-in-50 duration-300 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#064B50] text-[#B8F000]">
                      <Award size={26} />
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#087F7A]">
                        EVALUASI SIMULATOR JELI LAKON
                      </span>
                      <h2 className="text-2xl font-extrabold text-[#064B50]">
                        Rapor Hasil Latihanmu
                      </h2>
                    </div>
                  </div>

                  {/* Score Summary Card */}
                  <div className="rounded-3xl border border-[#064B50]/20 bg-[#F7F7F0] p-6 sm:p-7">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#087F7A]">
                          SKENARIO: {activeScenario?.title}
                        </p>
                        <h3 className="mt-1 text-xl font-extrabold text-[#064B50]">
                          {scorePercent >= 80
                            ? "Kesiapan Tinggi: Kamu Sangat Jeli!"
                            : scorePercent >= 50
                            ? "Cukup Siap: Perlu Penajaman di Beberapa Trik!"
                            : "Perlu Latihan: Modus Menjebak Berhasil Memperdayamu!"}
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm text-[#202C2B]/75 max-w-xl">
                          Kamu berhasil menyelesaikan {totalAnswered} dari {questions.length} pertanyaan, dengan{" "}
                          <strong>{correctCount} jawaban aman</strong>.
                        </p>
                      </div>

                      <div className="flex flex-col items-center justify-center rounded-2xl bg-[#064B50] px-6 py-4 text-white shadow-sm shrink-0">
                        <span className="text-3xl font-extrabold text-[#B8F000]">{scorePercent}%</span>
                        <span className="text-[11px] font-bold text-white/80">
                          {correctCount} / {totalAnswered} Tepat
                        </span>
                      </div>
                    </div>

                    {/* PDF Download Trigger Banner */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-[#064B50]/15">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-[#087F7A]" />
                        <div>
                          <p className="text-xs font-bold text-[#064B50]">Unduh Dokumen Latihan Lengkap</p>
                          <p className="text-[11px] text-[#202C2B]/65">
                            Menyimpan seluruh pertanyaan, pilihanmu, kunci jawaban, dan tips regulasi dalam satu file PDF.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={downloadingPdf || totalAnswered === 0}
                        className={`${button} bg-[#064B50] text-white hover:bg-[#087F7A] text-xs py-2.5 px-4 shadow-sm`}
                      >
                        {downloadingPdf ? (
                          <>
                            <LoaderCircle size={15} className="animate-spin" />
                            Membuat PDF…
                          </>
                        ) : (
                          <>
                            <Download size={15} className="text-[#B8F000]" />
                            Unduh Laporan Latihan (PDF)
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Questions Review Accordion/List */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#064B50]">
                      Tinjauan Lengkap Pertanyaan & Jawaban:
                    </h4>

                    {answeredList.map((item) => (
                      <div
                        key={item.questionNumber}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-[#087F7A]">
                            Tahap {item.questionNumber}: {item.title}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                              item.isCorrect
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.isCorrect ? "✅ Tepat & Aman" : "❌ Salah / Terjebak"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 italic mb-2">
                          “{item.recruiterMessage}”
                        </p>

                        <div className="text-xs space-y-1.5 my-3 bg-slate-50 p-3 rounded-xl">
                          <p>
                            <strong>Pilihanmu: </strong> {item.selectedOptionText}
                          </p>
                          {!item.isCorrect && item.correctOptionText && (
                            <p className="text-emerald-700">
                              <strong>Pilihan yang Lebih Aman: </strong> {item.correctOptionText}
                            </p>
                          )}
                          <p className="text-slate-600">
                            <strong>Analisis: </strong> {item.explanation}
                          </p>
                        </div>

                        {item.goodAnswerSummary && (
                          <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-200/60">
                            <strong>Deskripsi Jawaban yang Baik: </strong> {item.goodAnswerSummary}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleRestartSimulation}
                      className={`${button} bg-[#064B50] text-white hover:bg-[#087F7A]`}
                    >
                      <RotateCcw size={16} /> Ulangi Skenario Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = scenarios.findIndex((s) => s.id === selectedId)
                        const nextScenario = scenarios[(currentIndex + 1) % scenarios.length]
                        if (nextScenario) {
                          handleSelectScenario(nextScenario.id)
                        }
                      }}
                      className={`${button} border border-[#064B50]/20 bg-white text-[#064B50] hover:bg-[#F7F7F0]`}
                    >
                      Pilih Latihan Lainnya <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div
                  role="alert"
                  className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                  <p className="flex-1">{error}</p>
                  <button aria-label="Tutup pesan kesalahan" onClick={() => setError("")}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Modal: Create Custom Scenario with AI */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs animate-in fade-in-50">
            <div className="relative w-full max-w-xl rounded-3xl border border-[#064B50]/15 bg-white p-6 shadow-2xl sm:p-7">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="absolute right-5 top-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>

              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF7D5] text-[#064B50]">
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#064B50]">Buat Skenario Latihan Kustom dengan AI</h3>
                  <p className="text-xs text-[#202C2B]/60">Ajukan kasus atau pertanyaanmu untuk dijadikan simulator interaktif.</p>
                </div>
              </div>

              <p className="mb-3 text-xs leading-relaxed text-[#202C2B]/75">
                Pernah menerima pesan lowongan mencurigakan atau penasaran dengan modus tertentu? Ketikkan ceritanya, AI Jeli
                akan merancangnya menjadi rangkaian pertanyaan simulasi interaktif (hingga 5-7 tahap):
              </p>

              {/* Quick Template Pills */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {customTemplates.map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setCustomPrompt(template)}
                    className="rounded-lg border border-[#064B50]/15 bg-[#F7F7F0] px-2.5 py-1 text-[11px] font-medium text-[#064B50] hover:bg-[#EFF7D5] transition-colors"
                  >
                    + {template.split(" ").slice(0, 4).join(" ")}…
                  </button>
                ))}
              </div>

              <form onSubmit={(e) => void handleCreateCustomScenario(e)}>
                <label htmlFor="custom-prompt" className="mb-1.5 block text-xs font-bold text-[#064B50]">
                  Ceritakan situasi tawaran kerja / pertanyaan yang ingin kamu uji:
                </label>
                <textarea
                  id="custom-prompt"
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={generatingCustom}
                  placeholder="Contoh: Saya dapat tawaran jadi admin data WFH tapi diminta transfer deposit uang seragam Rp200.000..."
                  className="w-full rounded-xl border border-[#064B50]/25 p-3 text-sm focus:outline-2 focus:outline-[#087F7A]"
                />

                {customError && (
                  <p className="mt-2 text-xs font-bold text-red-600">{customError}</p>
                )}

                <div className="mt-4 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    disabled={generatingCustom}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={generatingCustom || !customPrompt.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#064B50] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#087F7A] disabled:opacity-50"
                  >
                    {generatingCustom ? (
                      <>
                        <LoaderCircle size={15} className="animate-spin" />
                        Merancang Skenario AI…
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} className="text-[#B8F000]" />
                        Rancang Skenario AI
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Confirmation / Alert Modal Pop-up (No native browser alerts!) */}
        {modalDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-2xs animate-in fade-in-50">
            <div className="relative w-full max-w-md rounded-3xl border border-[#064B50]/15 bg-white p-6 shadow-2xl sm:p-7 animate-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={closeModalDialog}
                className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Tutup dialog"
              >
                <X size={18} />
              </button>

              <div className="flex items-start gap-3.5 mb-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    modalDialog.variant === "danger"
                      ? "bg-red-100 text-red-600"
                      : modalDialog.variant === "warning"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-[#EFF7D5] text-[#064B50]"
                  }`}
                >
                  {modalDialog.variant === "danger" ? (
                    <StopCircle size={22} />
                  ) : modalDialog.variant === "warning" ? (
                    <AlertTriangle size={22} />
                  ) : (
                    <HelpCircle size={22} />
                  )}
                </div>
                <div className="pr-4">
                  <h3 className="text-base font-extrabold text-[#064B50] leading-snug">
                    {modalDialog.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#202C2B]/75 leading-relaxed">
                    {modalDialog.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                {modalDialog.cancelText && (
                  <button
                    type="button"
                    onClick={closeModalDialog}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {modalDialog.cancelText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (modalDialog.onConfirm) {
                      modalDialog.onConfirm()
                    } else {
                      closeModalDialog()
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all ${
                    modalDialog.variant === "danger"
                      ? "bg-red-600 hover:bg-red-700"
                      : modalDialog.variant === "warning"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-[#064B50] hover:bg-[#087F7A]"
                  }`}
                >
                  {modalDialog.confirmText || "OK"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default ScamSimulatorPage
