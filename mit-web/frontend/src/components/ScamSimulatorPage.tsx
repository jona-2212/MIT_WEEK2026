import { useEffect, useRef, useState, type ReactNode } from "react"
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
  Mic,
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
import { locales, t, type Language } from "../i18n"
import type { UserAnswerRecord } from "../utils/generateSimulatorPdf"

interface Props {
  onBackToHome: () => void
  onOpenAvatar?: () => void
  lang: Language
}

const customTemplatesId = [
  "Tawaran barista kopi disuruh bayar uang materai & jaminan seragam Rp75.000",
  "Admin media sosial freelance diminta kirim foto selfie memegang KTP",
  "Pekerjaan ketik dokumen manual tapi harus bayar biaya aktivasi akun Rp100.000",
  "Undangan seleksi kapal pesiar internasional diminta transfer tiket via travel rekanan",
  "Tawaran kerja remote gaji dolar tapi disuruh deposit kripto untuk buka dompet kerja",
]

const customTemplatesEn = [
  "Barista offer demanding $50 uniform deposit & document stamp fee",
  "Freelance social media admin requested to submit selfie holding government ID",
  "Document typing job requiring $80 upfront account activation fee",
  "Cruise ship interview requiring flight tickets booked via designated travel partner",
  "Remote dollar-salary job demanding crypto deposit to unlock working wallet",
]

const button =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#087F7A] disabled:cursor-not-allowed disabled:opacity-50"

function SimulatorDialog({ titleId, onDismiss, children }: { titleId: string; onDismiss: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onDismiss()
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-auto rounded-3xl border border-[#064B50]/15 bg-white p-0 shadow-2xl backdrop:bg-black/55"
    >
      {children}
    </dialog>
  )
}

export function ScamSimulatorPage({ onBackToHome, onOpenAvatar, lang }: Props) {
  const [catalogs, setCatalogs] = useState<Partial<Record<Language, { items: Scenario[]; error?: string }>>>({})
  const [customScenarios, setCustomScenarios] = useState<{ scenario: Scenario; prompt: string }[]>([])
  const [selectedId, setSelectedId] = useState("")

  // Simulation Active State (Starts directly on question 1)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [choices, setChoices] = useState<Record<number, string>>({})
  const [isFinished, setIsFinished] = useState(false)
  const questionHeading = useRef<HTMLHeadingElement>(null)
  const reportHeading = useRef<HTMLHeadingElement>(null)

  // Custom Scenario Generation State
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [customPending, setCustomPending] = useState<Language | null>(null)
  const [customError, setCustomError] = useState<{ lang: Language; message: string } | null>(null)
  const customRequest = useRef<AbortController | null>(null)

  useEffect(() => () => customRequest.current?.abort(), [lang])
  const generatingCustom = customPending === lang

  function closeCustom() {
    customRequest.current?.abort()
    customRequest.current = null
    setCustomPending(null)
    setShowCustomModal(false)
  }

  // PDF Download feedback
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Custom Modal Pop-up State
  const [modalDialog, setModalDialog] = useState<{
    isOpen: boolean
    lang?: Language
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
      lang,
      title,
      message,
      confirmText: lang === "ID" ? "Mengerti" : "Understood",
      variant,
    })
  }

  function showConfirmDialog({
    title,
    message,
    confirmText = lang === "ID" ? "Lanjutkan" : "Continue",
    cancelText = lang === "ID" ? "Batal" : "Cancel",
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
      lang,
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

  const catalog = catalogs[lang]
  const loading = !catalog
  const scenarios = [
    ...customScenarios.filter(({ scenario }) => scenario.language === lang).map(({ scenario }) => scenario),
    ...(catalog?.items ?? []),
  ]

  useEffect(() => {
    if (catalog) return
    const controller = new AbortController()
    getScenarios(controller.signal, lang)
      .then((items) => {
        if (!controller.signal.aborted) setCatalogs((previous) => ({ ...previous, [lang]: { items } }))
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return
        const error = e instanceof Error ? e.message : (lang === "ID" ? "Gagal memuat latihan." : "Could not load the scenarios.")
        setCatalogs((previous) => ({ ...previous, [lang]: { items: [], error } }))
      })
    return () => controller.abort()
  }, [catalog, lang])

  const activeScenario = selectedId ? scenarios.find((s) => s.id === selectedId) : scenarios[0]
  const untranslatedCustom = !activeScenario ? customScenarios.find(({ scenario }) => scenario.id === selectedId) : undefined
  const questions: SimulatorQuestion[] = activeScenario?.questions || []
  const activeQuestion: SimulatorQuestion | undefined = questions[currentQuestionIdx]
  const answers: Record<number, UserAnswerRecord> = {}
  questions.forEach((question, index) => {
    const option = question.options.find(({ id }) => id === choices[question.question_number])
    if (!option) return
    answers[index] = {
      questionNumber: question.question_number,
      title: question.title,
      recruiterMessage: question.recruiter_message,
      challengeText: question.challenge_text,
      selectedOptionId: option.id,
      selectedOptionText: option.text,
      isCorrect: option.is_correct,
      feedbackLabel: option.feedback_label,
      explanation: option.explanation,
      goodAnswerSummary: question.good_answer_summary,
      educationalTakeaway: question.educational_takeaway,
      correctOptionText: question.options.find((item) => item.is_correct)?.text,
    }
  })
  const currentAnswer = answers[currentQuestionIdx]

  function focusPanel(panel: "question" | "report" = "question") {
    requestAnimationFrame(() => {
      const heading = panel === "report" ? reportHeading.current : questionHeading.current
      heading?.focus({ preventScroll: true })
      heading?.scrollIntoView({ block: "start" })
    })
  }

  function handleSelectScenario(id: string) {
    if (id === activeScenario?.id) {
      focusPanel(isFinished ? "report" : "question")
      return
    }
    if (Object.keys(choices).length > 0 && !isFinished) {
      showConfirmDialog({
        title: lang === "ID" ? "Ganti Skenario Latihan?" : "Switch Practice Scenario?",
        message:
          lang === "ID"
            ? "Berpindah ke skenario lain akan mereset progres latihan yang sedang berjalan. Apakah kamu yakin ingin berganti latihan?"
            : "Switching to another scenario will reset your current practice progress. Are you sure you want to switch?",
        confirmText: lang === "ID" ? "Ya, Ganti Skenario" : "Yes, Switch Scenario",
        cancelText: lang === "ID" ? "Lanjutkan Latihan Ini" : "Continue Current Practice",
        variant: "warning",
        onConfirm: () => {
          setSelectedId(id)
          setCurrentQuestionIdx(0)
          setChoices({})
          setIsFinished(false)
          closeModalDialog()
          focusPanel()
        },
      })
      return
    }
    setSelectedId(id)
    setCurrentQuestionIdx(0)
    setChoices({})
    setIsFinished(false)
    focusPanel()
  }

  function handleSelectOption(option: QuestionOption) {
    if (!activeQuestion || !activeScenario) return
    setSelectedId(activeScenario.id)
    setChoices((prev) => ({
      ...prev,
      [activeQuestion.question_number]: option.id,
    }))
  }

  function handleNextQuestion() {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1)
      focusPanel()
    } else {
      setIsFinished(true)
      focusPanel("report")
    }
  }

  function handlePrevQuestion() {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1)
      focusPanel()
    }
  }

  function handleEndSimulation() {
    if (Object.keys(answers).length === 0) {
      showAlertDialog(
        lang === "ID" ? "Latihan Belum Dimulai" : "Practice Not Started",
        lang === "ID"
          ? "Kamu belum memilih respons pada pertanyaan ini. Silakan pilih salah satu opsi terlebih dahulu sebelum mengakhiri latihan."
          : "You haven't selected a response yet. Please pick an option first before ending the session.",
        "info"
      )
      return
    }
    showConfirmDialog({
      title: lang === "ID" ? "Akhiri Latihan Sekarang?" : "End Practice Now?",
      message:
        lang === "ID"
          ? `Kamu telah menyelesaikan ${totalAnswered} dari ${questions.length} pertanyaan. Apakah kamu ingin menyudahi sesi sekarang dan melihat evaluasi hasil latihanmu?`
          : `You have completed ${totalAnswered} of ${questions.length} questions. Do you want to finish now and view your evaluation report?`,
      confirmText: lang === "ID" ? "Ya, Akhiri & Lihat Rapor" : "Yes, Finish & View Report",
      cancelText: lang === "ID" ? "Lanjutkan Latihan" : "Continue Practice",
      variant: "danger",
      onConfirm: () => {
        closeModalDialog()
        setIsFinished(true)
        focusPanel("report")
      },
    })
  }

  function handleRestartSimulation() {
    setCurrentQuestionIdx(0)
    setChoices({})
    setIsFinished(false)
    focusPanel()
  }

  async function handleDownloadPdf() {
    if (!activeScenario || downloadingPdf) return
    setDownloadingPdf(true)
    try {
      const { generateSimulatorPdf } = await import("../utils/generateSimulatorPdf")
      if (document.documentElement.lang === lang.toLowerCase()) {
        generateSimulatorPdf({ scenario: activeScenario, answers: answeredList, lang })
      }
    } catch {
      showAlertDialog(
        lang === "ID" ? "Gagal Mengunduh Dokumen" : "Failed to Download Document",
        lang === "ID"
          ? "Terjadi kendala saat menghasilkan berkas PDF di browsermu. Silakan coba kembali beberapa saat lagi."
          : "An error occurred while generating the PDF in your browser. Please try again shortly.",
        "warning"
      )
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function handleCreateCustomScenario(e?: React.FormEvent) {
    e?.preventDefault()
    const prompt = customPrompt.trim()
    if (prompt.length < 20 || (customRequest.current && !customRequest.current.signal.aborted)) return

    setCustomPending(lang)
    setCustomError(null)
    const controller = new AbortController()

    customRequest.current = controller

    try {
      const created = await generateCustomScenario(prompt, controller.signal, lang)
      if (controller.signal.aborted) return
      setCustomScenarios((prev) => [{ scenario: created, prompt }, ...prev])
      setSelectedId(created.id)
      setCurrentQuestionIdx(0)
      setChoices({})
      setIsFinished(false)
      setShowCustomModal(false)
      setCustomPrompt("")
      focusPanel()
    } catch (err: unknown) {
      if (controller.signal.aborted) return
      setCustomError({
        lang,
        message: err instanceof Error
          ? err.message
          : lang === "ID"
          ? "Gagal membuat skenario AI. Pastikan backend aktif."
          : "Could not create the scenario. Try again.",
      })
    } finally {
      if (customRequest.current === controller) {
        customRequest.current = null
        setCustomPending(null)
      }
    }
  }

  const answeredList = Object.values(answers)
  const totalAnswered = answeredList.length
  const customTemplates = lang === "EN" ? customTemplatesEn : customTemplatesId

  return (
    <main className="min-h-screen bg-warm-grid px-4 pb-24 pt-6 text-[#202C2B]">
      <div className="mx-auto max-w-5xl">
        {/* Navigation back & Switch to Live Avatar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button onClick={onBackToHome} className={`${button} px-0 text-[#064B50] hover:text-[#087F7A]`}>
            <ArrowLeft size={17} /> {lang === "ID" ? "Kembali ke Beranda" : "Back to Homepage"}
          </button>

          {onOpenAvatar && (
            <button
              onClick={onOpenAvatar}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#064B50] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#087F7A] transition-all"
            >
              <Mic size={15} className="text-[#B8F000]" />
              <span>
                {lang === "ID"
                  ? "Tanya Jeli"
                  : "Ask Jeli"}
              </span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Header */}
        <header className="mb-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EFF7D5] px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-[#064B50]">
            <Sparkles size={14} className="text-[#087F7A]" />
            Jeli Lakon · {t(lang, "simulator")}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#064B50] sm:text-4xl">
            {lang === "ID"
              ? "Latih respons terhadap penipuan kerja"
              : "Practise responding to job scams"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#202C2B]/75">
            {lang === "ID"
              ? "Pilih skenario, coba responsmu, lalu lihat pembahasan dan unduh rapor."
              : "Choose a scenario, try a response, then review your choices and download your report."}
          </p>
        </header>

        {loading ? (
          <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-[#064B50]">
            <LoaderCircle className="animate-spin text-[#087F7A]" size={24} />
            <span>{lang === "ID" ? "Memuat data simulasi latihan…" : "Loading simulation exercises…"}</span>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
            {/* Left Sidebar: Scenario Selector & AI Custom Creator */}
            <aside aria-label={lang === "ID" ? "Pilih skenario" : "Choose a scenario"} className="space-y-3">
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#087F7A]/40 bg-[#EFF7D5]/70 p-4 text-xs font-extrabold text-[#064B50] shadow-2xs transition-all hover:border-[#087F7A] hover:bg-[#EFF7D5]"
              >
                <Wand2 size={16} className="text-[#087F7A]" />
                <span>{lang === "ID" ? "+ Buat Skenario Sendiri (AI)" : "+ Create Custom Scenario (AI)"}</span>
              </button>

              <div className="space-y-2.5">
                {scenarios.map((item, index) => {
                  const isCustom = item.id.startsWith("custom-")
                  const isSelected = activeScenario?.id === item.id
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
                          {isCustom
                            ? lang === "ID"
                              ? "✨ KASUS KUSTOM AI"
                              : "✨ AI CUSTOM CASE"
                            : lang === "ID"
                            ? `MODUL 0${index + 1}`
                            : `MODULE 0${index + 1}`}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isSelected ? "bg-[#B8F000] text-[#064B50]" : "bg-[#F7F7F0] text-[#064B50]"
                          }`}
                        >
                          {qCount} {lang === "ID" ? "Pertanyaan" : "Questions"}
                        </span>
                      </div>
                      <h2 className="mt-1.5 text-sm font-bold leading-snug">{item.title}</h2>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed opacity-80">{item.description}</p>
                    </button>
                  )
                })}
              </div>
            </aside>

            {/* Right: Main Simulator Arena */}
            <section className="min-w-0 overflow-hidden rounded-3xl border border-[#064B50]/15 bg-white shadow-sm flex flex-col">
              {/* Top Banner Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#064B50]/10 bg-[#FAFBF6] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#064B50] text-white">
                    <MessageCircle size={16} />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-[#064B50]">
                      {activeScenario?.title || (lang === "ID" ? "Simulasi Penipuan Kerja" : "Job Scam Simulation")}
                    </p>
                    <p className="text-[11px] text-[#202C2B]/60">
                      {!isFinished && questions.length > 0
                        ? lang === "ID"
                          ? `Pertanyaan ${currentQuestionIdx + 1} dari ${questions.length}`
                          : `Question ${currentQuestionIdx + 1} of ${questions.length}`
                        : isFinished && activeScenario ? lang === "ID"
                        ? "Laporan Evaluasi Keputusan"
                        : "Practice Report"
                        : null}
                    </p>
                  </div>
                </div>

                {!isFinished && totalAnswered > 0 && (
                  <button
                    onClick={handleEndSimulation}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <StopCircle size={14} /> {lang === "ID" ? "Akhiri Latihan" : "End Practice"}
                  </button>
                )}
              </div>

              {untranslatedCustom && (
                <div className="space-y-3 p-5">
                  <p role="status" className="text-sm text-[#202C2B]/80">
                    {lang === "ID" ? "Skenario kustom ini dibuat dalam bahasa Inggris." : "This custom scenario was created in Indonesian."}
                  </p>
                  <button className={`${button} bg-[#064B50] text-white`} onClick={() => {
                    setCustomPrompt((draft) => draft || untranslatedCustom.prompt)
                    setShowCustomModal(true)
                  }}>
                    {lang === "ID" ? "Buat ulang dalam bahasa Indonesia" : "Recreate in English"}
                  </button>
                </div>
              )}
              {!activeScenario && !untranslatedCustom && !catalog?.error && (
                <p role="status" className="p-5 text-sm">
                  {lang === "ID" ? "Pilih atau buat skenario untuk mulai." : "Choose or create a scenario to begin."}
                </p>
              )}

              {/* View 1: Active Multi-Stage Question (1 Question Active at a time) */}
              {!isFinished && activeQuestion && (
                <div className="p-5 sm:p-7 space-y-5">
                  {/* Studi Kasus & Konteks Modul yang Jelas */}
                  <div className="rounded-2xl border border-[#087F7A]/20 bg-[#F7F7F0] p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-[#087F7A]" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#064B50]">
                          {lang === "ID" ? "Studi Kasus:" : "Case Study:"} {activeScenario?.title}
                        </span>
                      </div>
                      <span className="rounded-full bg-[#EFF7D5] px-2.5 py-0.5 text-[10px] font-bold text-[#064B50]">
                        {activeScenario?.id.startsWith("custom-")
                          ? lang === "ID"
                            ? "Kasus Pengguna"
                            : "User Custom Case"
                          : lang === "ID"
                          ? "Studi Kasus Resmi"
                          : "Official Case Study"}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#202C2B]/85 leading-relaxed font-medium">
                      {activeScenario?.description}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-start gap-1.5 rounded-xl border border-[#064B50]/10 bg-white/70 p-2.5 text-xs text-[#064B50]">
                      <strong>{lang === "ID" ? "Tujuan latihan" : "Learning objective"}</strong>
                      <span>{activeScenario?.objective}</span>
                    </div>
                  </div>

                  {/* Stepper Progress Indicator */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#064B50] mb-2">
                      <span>
                        {lang === "ID"
                          ? `Pertanyaan ${currentQuestionIdx + 1} dari ${questions.length}`
                          : `Question ${currentQuestionIdx + 1} of ${questions.length}`}
                      </span>
                      <span>
                        {Math.round((totalAnswered / questions.length) * 100)}% {lang === "ID" ? "Selesai" : "Completed"}
                      </span>
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
                          pillStyle = isCorrect ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
                        }

                        return (
                          <button
                            key={q.question_number}
                            onClick={() => {
                              setCurrentQuestionIdx(idx)
                              focusPanel()
                            }}
                            aria-current={currentQuestionIdx === idx ? "step" : undefined}
                            title={
                              lang === "ID"
                                ? `Pertanyaan ${idx + 1}: ${q.title}`
                                : `Question ${idx + 1}: ${q.title}`
                            }
                            className={`flex-1 h-2 rounded-full transition-all ${pillStyle}`}
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* Stage Title */}
                  <div className="pt-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#087F7A]">
                      {lang === "ID"
                        ? `TAHAP ${activeQuestion.question_number} DARI ${questions.length}`
                        : `STAGE ${activeQuestion.question_number} OF ${questions.length}`}
                    </span>
                    <h3 ref={questionHeading} tabIndex={-1} className="text-base font-extrabold text-[#064B50] sm:text-lg">{activeQuestion.title}</h3>
                  </div>

                  {/* Recruiter Message Bubble */}
                  <div className="rounded-2xl border border-[#064B50]/15 bg-[#FAFBF6] p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#064B50]">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>{lang === "ID" ? "Pesan Perekrut Fiktif AI:" : "Fictitious AI Recruiter Message:"}</span>
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
                      {lang === "ID" ? "PILIH RESPONSMU (KLIK UNTUK EVALUASI):" : "CHOOSE YOUR RESPONSE (CLICK TO EVALUATE):"}
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
                          aria-pressed={isSelected}
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
                          <p role="status" className="text-xs sm:text-sm font-extrabold">
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
                          <span>
                            {lang === "ID"
                              ? "Deskripsi Mengenai Jawaban yang Baik:"
                              : "Description of a Good Response:"}
                          </span>
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
                            <strong className="font-bold">
                              {lang === "ID" ? "Kunci Regulasi & Refleks: " : "Key Regulations & Reflexes: "}
                            </strong>
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
                            <ChevronLeft size={16} /> {lang === "ID" ? "Pertanyaan Sebelumnya" : "Previous Question"}
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
                            <span>
                              {lang === "ID"
                                ? "Lanjut ke Pertanyaan Selanjutnya"
                                : "Next Question"}
                            </span>
                            <ArrowRight size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleNextQuestion}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-800 transition-colors"
                          >
                            <span>{lang === "ID" ? "🏁 Selesai & Lihat Rapor Hasil" : "🏁 Finish & View Report Card"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Always-present Bottom End Training Option */}
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                    <p className="text-xs text-[#202C2B]/60">
                      {lang === "ID"
                        ? "Ingin menyudahi latihan? Kamu tetap dapat meninjau rapor evaluasi dari pertanyaan yang sudah dijawab."
                        : "Want to finish now? You can still review your evaluation report for questions answered so far."}
                    </p>
                    <button
                      type="button"
                      onClick={handleEndSimulation}
                      className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
                    >
                      {lang === "ID" ? "Akhiri Latihan" : "End Practice"}
                    </button>
                  </div>
                </div>
              )}

              {/* View 2: Final Report & PDF Download Screen */}
              {isFinished && activeScenario && (
                <div className="p-6 sm:p-8 animate-in fade-in-50 duration-300 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#064B50] text-[#B8F000]">
                      <Award size={26} />
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#087F7A]">
                        {lang === "ID" ? "EVALUASI SIMULATOR JELI LAKON" : "JELI LAKON SIMULATOR EVALUATION"}
                      </span>
                      <h2 ref={reportHeading} tabIndex={-1} className="text-2xl font-extrabold text-[#064B50]">
                        {lang === "ID" ? "Rapor Hasil Latihanmu" : "Your Practice Report Card"}
                      </h2>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#064B50]/20 bg-[#F7F7F0] p-6 sm:p-7">
                    <h3 className="text-xl font-extrabold text-[#064B50]">{activeScenario.title}</h3>
                    <p className="mt-2 text-sm text-[#202C2B]/75">
                      {lang === "ID"
                        ? `${totalAnswered} dari ${questions.length} pertanyaan dijawab.`
                        : `${totalAnswered} of ${questions.length} questions answered.`}
                    </p>

                    {/* PDF Download Trigger Banner */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-[#064B50]/15">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-[#087F7A]" />
                        <div>
                          <p className="text-xs font-bold text-[#064B50]">
                            {lang === "ID" ? "Unduh Dokumen Latihan Lengkap" : "Download Complete Practice Document"}
                          </p>
                          <p className="text-[11px] text-[#202C2B]/65">
                            {lang === "ID"
                              ? "Menyimpan seluruh pertanyaan, pilihanmu, kunci jawaban, dan tips regulasi dalam satu file PDF."
                              : "Saves all questions, your responses, correct answers, and regulation tips in a single PDF file."}
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
                            {lang === "ID" ? "Membuat PDF…" : "Generating PDF…"}
                          </>
                        ) : (
                          <>
                            <Download size={15} className="text-[#B8F000]" />
                            {lang === "ID" ? "Unduh Laporan Latihan (PDF)" : "Download Practice Report (PDF)"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Questions Review List */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#064B50]">
                      {lang === "ID" ? "Tinjauan Lengkap Pertanyaan & Jawaban:" : "Complete Review of Questions & Answers:"}
                    </h4>

                    {answeredList.map((item) => (
                      <div
                        key={item.questionNumber}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-[#087F7A]">
                            {item.title}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                              item.isCorrect
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.isCorrect
                              ? lang === "ID"
                                ? "✅ Tepat & Aman"
                                : "✅ Safe & Accurate"
                              : lang === "ID"
                              ? "❌ Salah / Terjebak"
                              : "❌ Wrong / Trapped"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 italic mb-2">
                          “{item.recruiterMessage}”
                        </p>

                        <div className="text-xs space-y-1.5 my-3 bg-slate-50 p-3 rounded-xl">
                          <p>
                            <strong>{lang === "ID" ? "Pilihanmu: " : "Your Choice: "}</strong>
                            {item.selectedOptionText}
                          </p>
                          {!item.isCorrect && item.correctOptionText && (
                            <p className="text-emerald-700">
                              <strong>{lang === "ID" ? "Pilihan yang Lebih Aman: " : "Safer Choice: "}</strong>
                              {item.correctOptionText}
                            </p>
                          )}
                          <p className="text-slate-600">
                            <strong>{lang === "ID" ? "Analisis: " : "Analysis: "}</strong>
                            {item.explanation}
                          </p>
                        </div>

                        {item.goodAnswerSummary && (
                          <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-200/60">
                            <strong>{lang === "ID" ? "Deskripsi Jawaban yang Baik: " : "Description of a Good Response: "}</strong>
                            {item.goodAnswerSummary}
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
                      <RotateCcw size={16} /> {lang === "ID" ? "Ulangi Skenario Ini" : "Retake This Scenario"}
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
                      {lang === "ID" ? "Pilih Latihan Lainnya" : "Choose Another Scenario"}{" "}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {catalog?.error && (
                <div
                  role="alert"
                  className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                  <p className="flex-1">{catalog.error}</p>
                  <button
                    type="button"
                    className="shrink-0 font-bold underline"
                    onClick={() => setCatalogs((previous) => ({ ...previous, [lang]: undefined }))}
                  >
                    {lang === "ID" ? "Coba lagi" : "Retry"}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Modal: Create Custom Scenario with AI */}
        {showCustomModal && (
          <SimulatorDialog titleId="custom-scenario-title" onDismiss={closeCustom}>
            <div className="relative p-4 sm:p-7">
              <button
                type="button"
                onClick={closeCustom}
                aria-label={lang === "ID" ? "Tutup dialog" : "Close dialog"}
                className="absolute right-5 top-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>

              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF7D5] text-[#064B50]">
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 id="custom-scenario-title" className="pr-7 text-base font-extrabold text-[#064B50]">
                    {lang === "ID" ? "Buat skenario sendiri" : "Create a custom scenario"}
                  </h3>
                </div>
              </div>

              <p className="mb-3 text-xs leading-relaxed text-[#202C2B]/75">
                {lang === "ID"
                  ? "Ceritakan kasus fiktif. Jeli akan menyiapkan latihan dalam bahasa Indonesia."
                  : "Describe a fictional case. Jeli will prepare an exercise in English."}
              </p>

              {/* Quick Template Pills */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                {customTemplates.map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setCustomPrompt(template)}
                    disabled={generatingCustom}
                    className="rounded-lg border border-[#064B50]/15 bg-[#F7F7F0] px-2.5 py-1 text-[11px] font-medium text-[#064B50] hover:bg-[#EFF7D5] transition-colors"
                  >
                    + {template.split(" ").slice(0, 4).join(" ")}…
                  </button>
                ))}
              </div>

              <form onSubmit={(e) => void handleCreateCustomScenario(e)}>
                <label htmlFor="custom-prompt" className="mb-1.5 block text-xs font-bold text-[#064B50]">
                  {lang === "ID"
                    ? "Situasi yang ingin dilatih"
                    : "Situation to practise"}
                </label>
                <textarea
                  id="custom-prompt"
                  rows={3}
                  maxLength={1500}
                  aria-describedby="custom-prompt-limit"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={generatingCustom}
                  placeholder={
                    lang === "ID"
                      ? "Contoh: Saya dapat tawaran jadi admin data WFH tapi diminta transfer deposit uang seragam Rp200.000..."
                      : "Example: A remote admin job asks for a Rp200,000 uniform deposit."
                  }
                  className="w-full rounded-xl border border-[#064B50]/25 p-3 text-sm focus:outline-2 focus:outline-[#087F7A]"
                />

                <p id="custom-prompt-limit" className="mt-1 text-xs text-[#202C2B]/75">
                  {lang === "ID" ? "Minimal 20 karakter" : "At least 20 characters"} · {customPrompt.length.toLocaleString(locales[lang])}/{(1500).toLocaleString(locales[lang])}
                </p>
                {customError?.lang === lang && (
                  <p role="alert" className="mt-2 text-xs font-bold text-red-800">{customError.message}</p>
                )}

                <div className="mt-4 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={closeCustom}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    {lang === "ID" ? "Batal" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={generatingCustom || customPrompt.trim().length < 20}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#064B50] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#087F7A] disabled:opacity-50"
                  >
                    {generatingCustom ? (
                      <>
                        <LoaderCircle size={15} className="animate-spin" />
                        {lang === "ID" ? "Merancang Skenario AI…" : "Crafting AI Scenario…"}
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} className="text-[#B8F000]" />
                        {lang === "ID" ? "Rancang Skenario AI" : "Craft AI Scenario"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </SimulatorDialog>
        )}

        {/* Custom Confirmation / Alert Modal Pop-up */}
        {modalDialog.isOpen && modalDialog.lang === lang && (
          <SimulatorDialog titleId="scenario-dialog-title" onDismiss={closeModalDialog}>
            <div className="relative p-4 sm:p-7">
              <button
                type="button"
                onClick={closeModalDialog}
                className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label={lang === "ID" ? "Tutup dialog" : "Close dialog"}
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
                  <h3 id="scenario-dialog-title" className="text-base font-extrabold text-[#064B50] leading-snug">
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
          </SimulatorDialog>
        )}
      </div>
    </main>
  )
}

export default ScamSimulatorPage
