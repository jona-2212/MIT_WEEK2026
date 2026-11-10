import { useEffect, useEffectEvent, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  LoaderCircle,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  User,
  Volume2,
  VolumeX,
  Wand2,
} from "lucide-react"
import JeliAvatar, { type AvatarEmotion } from "./JeliAvatar"
import { chatLiveRoleplay, getTtsAudio, type ChatMessageItem } from "../services/roleplay"
import { locales, t, type Language } from "../i18n"

interface Props {
  onBackToHome: () => void
  onOpenSimulator: () => void
  lang: Language
  active: boolean
  voiceEnabled: boolean
  onVoiceChange: (enabled: boolean) => void
}

type SpeechRecognizer = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

function speechRecognition() {
  const browser = window as Window & {
    SpeechRecognition?: new () => SpeechRecognizer
    webkitSpeechRecognition?: new () => SpeechRecognizer
  }
  return browser.SpeechRecognition || browser.webkitSpeechRecognition
}

// Initial greetings
const initialGreetingId: ChatMessageItem = {
  id: "msg-welcome",
  role: "assistant",
  text: "Halo, aku Jeli. Ada tawaran kerja yang ingin kamu cek?",
  timestamp: "Baru saja",
  emotion: "happy",
}

const initialGreetingEn: ChatMessageItem = {
  id: "msg-welcome",
  role: "assistant",
  text: "Hi, I’m Jeli. Is there a job offer you’d like to check?",
  timestamp: "Just now",
  emotion: "happy",
}

const suggestedPromptsId = [
  ["Biaya seragam", "Lowongan admin jarak jauh meminta uang seragam Rp250.000. Apa yang perlu dicek?"],
  ["Berkas APK", "Perekrut mengirim undangan tes berupa berkas APK lewat WhatsApp. Apa risikonya?"],
  ["Komisi tugas", "Tawaran paruh waktu menjanjikan komisi besar untuk menyukai video. Apa tanda bahayanya?"],
  ["Surat panggilan", "Bagaimana cara memeriksa keaslian surat panggilan kerja?"],
]

const suggestedPromptsEn = [
  ["Uniform fees", "A remote admin job asks for a Rp250,000 uniform deposit. What should I check?"],
  ["APK file", "A recruiter sent an interview invitation as an APK file on WhatsApp. What are the risks?"],
  ["Paid tasks", "A part-time job promises big commissions for liking videos. What are the warning signs?"],
  ["Interview letters", "How can I check whether an interview letter is genuine?"],
]

export function LiveAvatarRoleplayPage({
  onBackToHome, onOpenSimulator, lang, active, voiceEnabled, onVoiceChange,
}: Props) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    lang === "EN" ? initialGreetingEn : initialGreetingId,
  ])
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [avatarEmotion, setAvatarEmotion] = useState<AvatarEmotion>("happy")
  const [speechError, setSpeechError] = useState("")
  const [chatError, setChatError] = useState("")

  const chatLog = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognizer | null>(null)
  const micPermittedRef = useRef<boolean>(false)

  const chatRequest = useRef<AbortController | null>(null)
  const playbackRequest = useRef<AbortController | null>(null)
  const voiceRef = useRef(voiceEnabled)
  const isActive = useRef(false)
  const permissionPending = useRef(false)

  // Auto scroll chat internally to bottom WITHOUT moving or jerking the browser window
  useEffect(() => {
    const log = chatLog.current
    if (log) {
      log.scrollTo({
        top: log.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [active, messages, isLoading])

  useEffect(() => {
    voiceRef.current = voiceEnabled
    if (!voiceEnabled) {
      stopPlayback()
    }
  }, [voiceEnabled])

  const sendTranscript = useEffectEvent((transcript: string) => {
    void handleSendMessage(transcript)
  })

  useEffect(() => {
    if (!active) return
    isActive.current = true
    const Recognition = speechRecognition()
    const recognition = Recognition ? new Recognition() : null
    if (recognition) {
      recognition.lang = locales[lang]
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onstart = () => {
        setIsListening(true)
        setSpeechError("")
      }
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript
        if (transcript?.trim()) sendTranscript(transcript.trim())
      }
      recognition.onerror = ({ error }) => {
        setIsListening(false)
        if (error === "aborted") return
        if (error === "not-allowed" || error === "service-not-allowed") micPermittedRef.current = false
        setSpeechError(lang === "EN"
          ? "Microphone unavailable. Check browser permissions or type your message."
          : "Mikrofon tidak tersedia. Periksa izin browser atau ketik pesan.")
      }
      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition
    }
    return () => {
      isActive.current = false
      chatRequest.current?.abort()
      playbackRequest.current?.abort()
      playbackRequest.current = null
      setIsSpeaking(false)
      setIsListening(false)
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (recognition) {
        recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null
        recognition.abort()
      }
      recognitionRef.current = null
    }
  }, [active, lang])

  function stopPlayback() {
    playbackRequest.current?.abort()
    playbackRequest.current = null
    setIsSpeaking(false)
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  async function speakText(text: string) {
    if (!isActive.current || !voiceRef.current) return
    stopPlayback()
    const controller = new AbortController()
    playbackRequest.current = controller
    const { signal } = controller
    setIsSpeaking(true)

    const finish = () => {
      if (signal.aborted) return
      playbackRequest.current = null
      setIsSpeaking(false)
    }
    const browserSpeech = () => {
      if (signal.aborted) return
      if (!window.speechSynthesis) {
        setSpeechError(lang === "ID" ? "Suara tidak tersedia. Balasan tetap bisa dibaca." : "Audio is unavailable. You can still read the reply.")
        finish()
        return
      }
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = locales[lang]
      utterance.onend = finish
      utterance.onerror = finish
      signal.addEventListener("abort", () => window.speechSynthesis.cancel(), { once: true })
      try {
        window.speechSynthesis.speak(utterance)
      } catch {
        finish()
      }
    }
    try {
      const audioData = await getTtsAudio(text, lang === "EN" ? "en" : "id", signal)
      if (signal.aborted) return
      const url = URL.createObjectURL(audioData)
      const audio = new Audio(url)
      const release = () => {
        audio.onended = audio.onerror = null
        audio.pause()
        audio.removeAttribute("src")
        URL.revokeObjectURL(url)
      }
      signal.addEventListener("abort", release, { once: true })
      audio.onended = () => {
        release()
        finish()
      }
      try {
        await audio.play()
        if (!signal.aborted) audio.onerror = () => {
          release()
          browserSpeech()
        }
      } catch {
        release()
        browserSpeech()
      }
    } catch {
      browserSpeech()
    }
  }

  async function requestMicrophonePermission() {
    if (permissionPending.current) return false
    permissionPending.current = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      if (!isActive.current) return false
      micPermittedRef.current = true
      setSpeechError("")
      return true
    } catch {
      if (isActive.current) setSpeechError(lang === "EN"
        ? "Microphone permission was denied or unavailable. You can type instead."
        : "Izin mikrofon ditolak atau tidak tersedia. Kamu bisa mengetik pesan.")
      return false
    } finally {
      permissionPending.current = false
    }
  }

  async function toggleListening() {
    const recognition = recognitionRef.current
    if (!recognition) {
      setSpeechError(lang === "EN"
        ? "Speech recognition is unavailable in this browser. You can type instead."
        : "Pengenalan suara tidak tersedia di browser ini. Kamu bisa mengetik pesan.")
      return
    }
    if (isListening) {
      recognition.stop()
      return
    }
    stopPlayback()
    if (!micPermittedRef.current && !await requestMicrophonePermission()) return
    if (!isActive.current || recognition !== recognitionRef.current) return
    try {
      recognition.start()
    } catch {
      setSpeechError(lang === "EN" ? "Could not start the microphone." : "Mikrofon gagal dimulai.")
    }
  }

  async function handleSendMessage(textToSend?: string) {
    const message = (textToSend || inputText).trim()
    if (!message || chatRequest.current || !isActive.current) return
    if (message.length > 1000) {
      setChatError(lang === "EN" ? "Use up to 1,000 characters." : "Gunakan maksimal 1.000 karakter.")
      return
    }
    const controller = new AbortController()
    chatRequest.current = controller
    const timestamp = new Date().toLocaleTimeString(locales[lang], {
      hour: "2-digit", minute: "2-digit",
    })
    const id = crypto.randomUUID()
    setInputText("")
    setChatError("")
    stopPlayback()
    setMessages((prev) => [...prev, { id, role: "user", text: message, timestamp }])
    setIsLoading(true)
    setAvatarEmotion("thinking")

    try {
      const history = messages
        .filter((m) => m.id !== "msg-welcome" && m.mode !== "fallback")
        .map(({ role, text }) => ({ role, text }))
      const reply = await chatLiveRoleplay(message, "jeli", history, lang, controller.signal)
      if (controller.signal.aborted) return
      setMessages((prev) => [...prev, {
        id: `${id}-reply`, role: "assistant", text: reply.reply, mode: reply.mode,
        timestamp, emotion: reply.emotion,
      }])
      setAvatarEmotion(reply.emotion)
      void speakText(reply.reply)
    } catch (err) {
      if (controller.signal.aborted) return
      setMessages((prev) => prev.filter((item) => item.id !== id))
      setInputText(message)
      setAvatarEmotion("warning")
      setChatError(err instanceof Error ? err.message : (lang === "EN"
        ? "Chat is unavailable. Try again." : "Chat belum tersedia. Coba lagi."))
    } finally {
      if (chatRequest.current === controller) {
        chatRequest.current = null
        setIsLoading(false)
        if (controller.signal.aborted) {
          setMessages((prev) => prev.filter((item) => item.id !== id))
          setInputText((prev) => prev || message)
          setAvatarEmotion("happy")
        }
      }
    }
  }

  const suggestedPrompts = lang === "EN" ? suggestedPromptsEn : suggestedPromptsId
  if (!active) return null

  return (
    <main className="min-h-screen bg-warm-grid px-4 pb-20 pt-24 text-[#202C2B]">
      <div className="mx-auto max-w-6xl">
        {/* Top Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 rounded-xl text-sm font-bold text-[#064B50] hover:text-[#087F7A] transition-colors"
          >
            <ArrowLeft size={17} /> {lang === "ID" ? "Kembali ke Beranda" : "Back to Homepage"}
          </button>

          <button
            onClick={onOpenSimulator}
            className="inline-flex items-center gap-2 rounded-xl border border-[#064B50]/20 bg-white px-3.5 py-1.5 text-xs font-bold text-[#064B50] shadow-2xs hover:bg-[#F7F7F0] transition-colors"
          >
            <Wand2 size={14} className="text-[#087F7A]" />
            <span>
              {lang === "ID" ? "Buka Simulator" : "Open Simulator"}
            </span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Feature Title Banner */}
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#064B50] sm:text-4xl">
            {t(lang, "askJeli")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#202C2B]/80">
            {lang === "ID"
              ? "Tanya soal tawaran kerja lewat teks atau suara."
              : "Ask about job offers by text or voice."}
          </p>
        </div>

        {/* Main Grid: Avatar on Left, Interactive Chat on Right */}
        <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)] items-start">
          {/* LEFT: Animated Avatar Card & Voice Controls */}
          <div className="flex min-w-0 flex-col items-center rounded-3xl border border-[#064B50]/15 bg-white p-4 shadow-sm sm:p-6">

            {/* THE ANIMATED AVATAR (Mata Kedap-Kedip, Mulut Berbicara, Tangan Bergerak Simetris & Responsif) */}
            <div className="py-2">
              <JeliAvatar
                character="jeli"
                emotion={isSpeaking ? "talking" : isListening ? "listening" : avatarEmotion}
                isSpeaking={isSpeaking}
                isListening={isListening}
                size="lg"
                lang={lang}
              />
            </div>

            {/* Sound & Speech Audio Toggles */}
            <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                aria-pressed={voiceEnabled}
                onClick={() => {
                  voiceRef.current = !voiceEnabled
                  if (voiceEnabled) stopPlayback()
                  onVoiceChange(!voiceEnabled)
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                  voiceEnabled
                    ? "bg-[#EFF7D5] text-[#064B50]"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                <span>
                  {lang === "ID"
                    ? `Suara ${voiceEnabled ? "aktif" : "nonaktif"}`
                    : `Voice ${voiceEnabled ? "on" : "off"}`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
                  if (lastAssistant) speakText(lastAssistant.text)
                }}
                disabled={isSpeaking || !voiceEnabled}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#064B50]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#064B50] hover:bg-[#F7F7F0] transition-colors disabled:opacity-40"
              >
                <RefreshCw size={13} className={isSpeaking ? "animate-spin" : ""} />
                <span>{lang === "ID" ? "Putar balasan" : "Play reply"}</span>
              </button>
            </div>

            {/* Interactive Microphone Button for Voice Talk */}
            <div className="mt-5 w-full flex flex-col items-center">
              <button
                type="button"
                onClick={() => void toggleListening()}
                aria-label={lang === "ID"
                  ? (isListening ? "Selesai bicara" : "Mulai bicara")
                  : (isListening ? "Finish speaking" : "Start speaking")}
                className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                  isListening
                    ? "bg-red-500 ring-8 ring-red-200 animate-pulse"
                    : "bg-[#064B50] hover:bg-[#087F7A] ring-4 ring-[#EFF7D5]"
                }`}
                title={
                  isListening
                    ? lang === "ID"
                      ? "Klik untuk selesai bicara"
                      : "Click to finish speaking"
                    : lang === "ID"
                    ? "Klik lalu bicara lewat mikrofon"
                    : "Click then speak through microphone"
                }
              >
                {isListening ? <MicOff size={26} /> : <Mic size={26} />}
              </button>
              <p className="mt-2 text-xs font-extrabold text-[#064B50]">
                {isListening
                  ? lang === "ID"
                    ? "Mendengarkan…"
                    : "Listening…"
                  : lang === "ID"
                  ? "Tekan untuk bicara"
                  : "Press to speak"}
              </p>
            </div>

            {/* Speech / Permission Helper & Troubleshooting */}
            {speechError && (
              <div className="mt-3 flex w-full flex-wrap items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900">
                <p role="alert" className="flex-1 leading-relaxed">{speechError}</p>
                <button type="button" onClick={() => setSpeechError("")} className="rounded-lg px-2.5 py-1.5 font-bold hover:bg-red-100">
                  {lang === "ID" ? "Tutup" : "Dismiss"}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Live Chat Box & Text Input */}
          <div className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[#064B50]/15 bg-white shadow-sm sm:h-[38rem]">
            {/* Header Chat */}
            <div className="flex items-center justify-between border-b border-[#064B50]/10 bg-[#FAFBF6] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#064B50] text-[#B8F000]">
                  <Bot size={15} />
                </span>
                <h2 className="text-sm font-extrabold text-[#064B50]">
                  {lang === "ID" ? "Percakapan dengan Jeli" : "Chat with Jeli"}
                </h2>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div ref={chatLog} role="log" aria-label={lang === "ID" ? "Riwayat percakapan" : "Chat history"} className="min-h-44 max-h-[60dvh] flex-1 space-y-4 overflow-y-auto p-4 sm:min-h-0 sm:max-h-none sm:p-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex max-w-[95%] gap-2 sm:max-w-[85%] ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      msg.role === "user"
                        ? "bg-[#064B50] text-white"
                        : "bg-[#EFF7D5] text-[#064B50]"
                    }`}
                  >
                    {msg.role === "user" ? <User size={15} /> : <Bot size={15} />}
                  </div>

                  <div
                    className={`min-w-0 rounded-2xl p-3 text-sm leading-relaxed shadow-2xs sm:p-4 ${
                      msg.role === "user"
                        ? "bg-[#064B50] text-white"
                        : "bg-[#F7F7F0] border border-[#064B50]/10 text-[#202C2B]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75 font-bold">
                      <span>{msg.role === "user" ? (lang === "ID" ? "Kamu" : "You") : "Jeli"}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {msg.mode === "fallback" && (
                      <p className="mb-1 font-semibold">{lang === "ID" ? "Panduan lokal" : "Local guidance"}</p>
                    )}
                    <p className="whitespace-pre-wrap wrap-anywhere">{msg.text}</p>

                    {/* Speaker play / replay button on AI bubble */}
                    {msg.role === "assistant" && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        disabled={!voiceEnabled}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#064B50] shadow-2xs border border-[#064B50]/15 hover:bg-[#EFF7D5] transition-all"
                      >
                        <Volume2 size={13} className="text-[#087F7A]" />
                        <span>{lang === "ID" ? "Dengarkan" : "Listen"}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div role="status" className="flex max-w-fit items-center gap-2 rounded-xl bg-[#EFF7D5]/50 p-2 text-xs font-bold text-[#064B50]">
                  <LoaderCircle size={15} className="animate-spin" />
                  <span>{lang === "ID" ? "Jeli sedang menyiapkan balasan…" : "Jeli is preparing a reply…"}</span>
                </div>
              )}
            </div>

            {/* Quick Suggested Chips */}
            <div className="border-t border-slate-100 bg-[#FAFBF6] px-4 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#064B50] mb-1.5">
                {lang === "ID" ? "Contoh pertanyaan" : "Suggested questions"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedPrompts.map(([label, prompt]) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSendMessage(prompt)}
                    disabled={isLoading}
                    className="min-h-9 rounded-lg border border-[#064B50]/15 bg-white px-2.5 py-1 text-left text-xs font-medium text-[#064B50] hover:bg-[#EFF7D5] disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar (Tulisan dibalas tulisan & suara) */}
            {chatError && <p role="alert" className="px-3 py-2 text-xs text-red-700">{chatError}</p>}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void handleSendMessage()
              }}
              className="border-t border-slate-200 p-3 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                aria-label={lang === "ID" ? "Pertanyaan untuk Jeli" : "Question for Jeli"}
                value={inputText}
                maxLength={1000}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                placeholder={
                  lang === "ID"
                    ? "Tulis pertanyaanmu…"
                    : "Write your question…"
                }
                className="min-w-0 flex-1 rounded-xl border border-[#064B50]/25 px-3.5 py-2.5 text-sm focus:outline-2 focus:outline-[#087F7A]"
              />

              <button
                type="submit"
                aria-label={lang === "ID" ? "Kirim pesan" : "Send message"}
                disabled={isLoading || !inputText.trim()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#064B50] text-white hover:bg-[#087F7A] transition-colors disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

export default LiveAvatarRoleplayPage
