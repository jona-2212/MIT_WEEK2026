import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  LoaderCircle,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  Wand2,
} from "lucide-react"
import JeliAvatar, { type AvatarEmotion } from "./JeliAvatar"
import { chatLiveRoleplay, getTtsAudioUrl, type ChatMessageItem } from "../services/roleplay"

interface Props {
  onBackToHome: () => void
  onOpenSimulator: () => void
  lang?: "ID" | "EN"
}

// Initial greetings
const initialGreetingId: ChatMessageItem = {
  id: "msg-welcome",
  role: "assistant",
  text: "Halo! Saya Jeli, sahabat AI penjaga keamanan karirmu. Kamu bisa mengobrol atau bertanya langsung lewat suara maupun tulisan. Ceritakan tawaran kerja yang mencurigakan, atau tanyakan ciri-ciri modus penipuan kerja!",
  timestamp: "Baru saja",
  emotion: "happy",
}

const initialGreetingEn: ChatMessageItem = {
  id: "msg-welcome",
  role: "assistant",
  text: "Hello! I'm Jeli, your AI career security guardian. You can chat or ask me directly via voice or text. Tell me about any suspicious job offers, or ask about common job scam tactics!",
  timestamp: "Just now",
  emotion: "happy",
}

const suggestedPromptsId = [
  "Ada lowongan admin WFH disuruh transfer biaya seragam Rp250.000, aman gak?",
  "Perekrut kirim file undangan tes format .APK di WhatsApp",
  "Tawaran paruh waktu like video YouTube dapat komisi besar",
  "Bagaimana cara membedakan surat panggilan kerja asli vs palsu?",
]

const suggestedPromptsEn = [
  "A WFH admin job asks for a $200 uniform deposit, is it safe?",
  "Recruiter sent an interview invitation as a .APK file on WhatsApp",
  "Part-time job offer to like YouTube videos for huge commissions",
  "How to distinguish genuine job offer letters from fraudulent ones?",
]

export function LiveAvatarRoleplayPage({ onBackToHome, onOpenSimulator, lang = "ID" }: Props) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    lang === "EN" ? initialGreetingEn : initialGreetingId,
  ])
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [avatarEmotion, setAvatarEmotion] = useState<AvatarEmotion>("happy")
  const [speechError, setSpeechError] = useState("")

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const micPermittedRef = useRef<boolean>(false)

  // Switch initial greeting when user toggles language if conversation hasn't progressed
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "msg-welcome") {
        return [lang === "EN" ? initialGreetingEn : initialGreetingId]
      }
      return prev
    })
  }, [lang])

  // Auto scroll chat internally to bottom WITHOUT moving or jerking the browser window
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages, isLoading])

  // Setup Web Speech Recognition (Speech-to-Text: Bicara)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = lang === "EN" ? "en-US" : "id-ID"
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListening(true)
        setAvatarEmotion("listening")
        setSpeechError("")
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript
        setIsListening(false)
        if (transcript && transcript.trim()) {
          void handleSendMessage(transcript.trim())
        }
      }

      recognition.onerror = (event: any) => {
        setIsListening(false)
        setAvatarEmotion("idle")
        console.warn("Speech recognition error:", event.error)

        if (event.error === "no-speech") {
          setSpeechError(
            lang === "ID"
              ? "Belum terdengar suara. Silakan klik tombol mikrofon lagi dan mulai berbicara."
              : "No speech detected. Please click the microphone button again and start speaking."
          )
        } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          micPermittedRef.current = false
          setSpeechError(
            lang === "ID"
              ? "Izin mikrofon belum aktif di browser. Klik ikon gembok 🔒 atau setelan di samping localhost:5173 pada address bar browsermu, lalu ubah 'Mikrofon' menjadi 'Izinkan' (Allow)."
              : "Microphone permission is not active. Click the lock icon 🔒 beside localhost:5173 in the address bar, then change 'Microphone' to 'Allow'."
          )
        } else if (event.error === "audio-capture") {
          setSpeechError(
            lang === "ID"
              ? "Perangkat mikrofon tidak ditemukan atau sedang dipakai aplikasi lain."
              : "Microphone device not found or already in use by another application."
          )
        } else if (event.error === "network") {
          setSpeechError(
            lang === "ID"
              ? "Layanan suara memerlukan koneksi internet aktif. Kamu juga bisa mengetik di kolom teks di sebelah kanan!"
              : "Voice service requires an active internet connection. You can also type directly in the chat box on the right!"
          )
        } else if (event.error !== "aborted") {
          setSpeechError(
            lang === "ID"
              ? "Gagal mendeteksi suara. Silakan coba lagi atau gunakan kolom teks."
              : "Voice detection failed. Please try again or use the text box."
          )
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        if (!isSpeaking) {
          setAvatarEmotion("idle")
        }
      }

      recognitionRef.current = recognition
    }

    return () => {
      try {
        recognitionRef.current?.abort()
      } catch {}
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
      }
      window.speechSynthesis?.cancel()
    }
  }, [isSpeaking, lang])

  // Browser Web Speech Synthesis Fallback
  function fallbackBrowserSpeech(cleanText: string) {
    if (!window.speechSynthesis) {
      setIsSpeaking(false)
      setAvatarEmotion("idle")
      return
    }

    try {
      window.speechSynthesis.cancel()
      window.speechSynthesis.resume()

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = lang === "EN" ? "en-US" : "id-ID"
      utterance.rate = 1.0
      utterance.pitch = 1.05

      const voices = window.speechSynthesis.getVoices()
      const matchVoice = voices.find((v) =>
        lang === "EN"
          ? v.lang.startsWith("en") || v.lang.includes("EN")
          : v.lang.startsWith("id") || v.lang.includes("ID")
      )
      if (matchVoice) utterance.voice = matchVoice

      utterance.onstart = () => {
        setIsSpeaking(true)
        setAvatarEmotion("talking")
      }
      utterance.onend = () => {
        setIsSpeaking(false)
        setAvatarEmotion("idle")
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        setAvatarEmotion("idle")
      }

      window.speechSynthesis.speak(utterance)
    } catch {
      setIsSpeaking(false)
      setAvatarEmotion("idle")
    }
  }

  // Text-to-Speech (TTS: Suara Balasan Jeli yang Jernih & Alami)
  function speakText(text: string) {
    if (!voiceEnabled) return

    // Stop previous audio or speech
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }
    window.speechSynthesis?.cancel()

    // Clean text of markdown, urls, and special symbols
    const cleanText = text
      .replace(/https?:\/\/\S+/g, lang === "EN" ? "web link" : "tautan web")
      .replace(/[*_#`~[\]]/g, "")
      .replace(/\s+/g, " ")
      .trim()

    if (!cleanText) return

    setIsSpeaking(true)
    setAvatarEmotion("talking")

    // Primary: Native MP3 audio stream from backend TTS (high quality voice in ID or EN)
    const ttsLang = lang === "EN" ? "en" : "id"
    const audioUrl = getTtsAudioUrl(cleanText, ttsLang)
    const audio = new Audio(audioUrl)
    currentAudioRef.current = audio

    audio.onplay = () => {
      setIsSpeaking(true)
      setAvatarEmotion("talking")
    }

    audio.onended = () => {
      setIsSpeaking(false)
      setAvatarEmotion("idle")
    }

    audio.onerror = (e) => {
      console.warn("Backend TTS stream error, falling back to Web Speech:", e)
      fallbackBrowserSpeech(cleanText)
    }

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Audio autoplay blocked by browser policy, trying Web Speech fallback:", err)
        fallbackBrowserSpeech(cleanText)
      })
    }
  }

  // Explicitly prompt user for mic permission via getUserMedia
  async function requestMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setSpeechError(
          lang === "ID"
            ? "Browser ini belum mendukung akses mikrofon."
            : "This browser does not support microphone access."
        )
        return false
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop tracks immediately so audio endpoint is released
      stream.getTracks().forEach((track) => track.stop())
      micPermittedRef.current = true
      setSpeechError("")
      return true
    } catch (err: any) {
      micPermittedRef.current = false
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setSpeechError(
          lang === "ID"
            ? "Izin mikrofon belum diberikan. Klik ikon gembok 🔒 atau setelan di sebelah kiri URL pada address bar browsermu, lalu pilih 'Izinkan' (Allow) untuk Mikrofon."
            : "Microphone permission was not granted. Click the lock icon 🔒 beside localhost:5173 on the address bar, then select 'Allow' for Microphone."
        )
      } else {
        setSpeechError(
          lang === "ID"
            ? "Tidak dapat mengakses mikrofon. Pastikan perangkat mikrofon laptop/PC kamu aktif."
            : "Cannot access microphone. Please ensure your microphone device is connected and unmuted."
        )
      }
      return false
    }
  }

  // Toggle voice recognition
  async function toggleListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechError(
        lang === "ID"
          ? "Browser ini belum mendukung pengenalan suara otomatis. Kamu tetap bisa mengobrol lancar menggunakan kolom teks di sebelah kanan!"
          : "This browser does not support automatic speech recognition. You can still chat smoothly using the text box on the right!"
      )
      return
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop()
      } catch {}
      setIsListening(false)
      setAvatarEmotion("idle")
      return
    }

    if (isSpeaking) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
      }
      window.speechSynthesis?.cancel()
      setIsSpeaking(false)
    }

    setSpeechError("")

    // Check / request mic permission if not yet acquired
    if (!micPermittedRef.current) {
      const granted = await requestMicrophonePermission()
      if (!granted) return
      // Small delay on Windows to let CoreAudio driver release hardware
      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    try {
      recognitionRef.current?.start()
    } catch (err: any) {
      console.warn("Speech recognition start:", err)
      try {
        recognitionRef.current?.stop()
        setTimeout(() => {
          try {
            recognitionRef.current?.start()
          } catch {}
        }, 150)
      } catch {
        setSpeechError(
          lang === "ID"
            ? "Gagal mengaktifkan mikrofon. Silakan coba klik tombol sekali lagi."
            : "Failed to activate microphone. Please try clicking the button once more."
        )
      }
    }
  }

  // Send message flow (Handles both voice and text)
  async function handleSendMessage(textToSend?: string) {
    const message = (textToSend || inputText).trim()
    if (!message || isLoading) return

    setInputText("")
    setSpeechError("")

    const userMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: message,
      timestamp: new Date().toLocaleTimeString(lang === "EN" ? "en-US" : "id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)
    setAvatarEmotion("thinking")

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }))

      // Always interact as Sahabat Jeli in selected language
      const response = await chatLiveRoleplay(message, "jeli", historyPayload, lang)

      const assistantMsg: ChatMessageItem = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        text: response.reply,
        timestamp: new Date().toLocaleTimeString(lang === "EN" ? "en-US" : "id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        emotion: response.emotion,
      }

      setMessages((prev) => [...prev, assistantMsg])
      setAvatarEmotion(response.emotion)

      // Speak response out loud in fluent Indonesian or English
      speakText(response.reply)
    } catch {
      const fallbackMsg: ChatMessageItem = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        text:
          lang === "ID"
            ? "Terima kasih sudah berbagi! Selalu ingat rumus JELI: Jangan pernah transfer uang sepeser pun untuk alasan seragam atau tes, dan jangan klik file berekstensi .APK dari nomor WhatsApp mana pun!"
            : "Thanks for sharing! Always remember: Never transfer any money for uniform or test fees, and never open .APK files from any WhatsApp sender!",
        timestamp: new Date().toLocaleTimeString(lang === "EN" ? "en-US" : "id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        emotion: "warning",
      }
      setMessages((prev) => [...prev, fallbackMsg])
      setAvatarEmotion("warning")
      speakText(fallbackMsg.text)
    } finally {
      setIsLoading(false)
    }
  }

  const suggestedPrompts = lang === "EN" ? suggestedPromptsEn : suggestedPromptsId

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
              {lang === "ID"
                ? "Buka Simulator Kuis Multi-Tahap (PDF)"
                : "Open Multi-Stage Quiz Simulator (PDF)"}
            </span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Feature Title Banner */}
        <div className="mb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EFF7D5] px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-[#064B50]">
            <Sparkles size={14} className="text-[#087F7A]" />
            {lang === "ID"
              ? "Tanya Jeli Live · Sahabat AI Penjaga Karir"
              : "Ask Jeli Live · AI Career Guardian"}
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#064B50]">
            {lang === "ID"
              ? "Tanya Jawab Suara & Teks Bersama Sahabat Jeli"
              : "Live Voice & Text Q&A with Sahabat Jeli"}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#202C2B]/75 max-w-2xl">
            {lang === "ID"
              ? "Bicara dibalas bicara, tulisan dibalas tulisan! Perhatikan mata Jeli yang berkedip alami, mulut yang bergerak saat berbicara, serta gestur tangan dinamis saat Jeli menjelaskan keamanan lowongan kerjamu."
              : "Speak and be spoken to, write and receive replies! Watch Jeli's naturally blinking eyes, synchronized talking mouth, and dynamic hand gestures as Jeli explains your job security."}
          </p>
        </div>

        {/* Main Grid: Avatar on Left, Interactive Chat on Right */}
        <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)] items-start">
          {/* LEFT: Animated Avatar Card & Voice Controls */}
          <div className="rounded-3xl border border-[#064B50]/15 bg-white p-6 shadow-sm flex flex-col items-center">
            {/* Dedicated Sahabat Jeli Identity Badge */}
            <div className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EFF7D5] py-2.5 px-3 border border-[#064B50]/10 text-[#064B50]">
              <Bot size={16} className="text-[#087F7A]" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                {lang === "ID"
                  ? "Sahabat Jeli · Konsultan Keamanan Karir"
                  : "Sahabat Jeli · Career Safety Consultant"}
              </span>
            </div>

            {/* THE ANIMATED AVATAR (Mata Kedap-Kedip, Mulut Berbicara, Tangan Bergerak Simetris & Responsif) */}
            <div className="py-2">
              <JeliAvatar
                character="jeli"
                emotion={avatarEmotion}
                isSpeaking={isSpeaking}
                isListening={isListening}
                size="lg"
                lang={lang}
              />
            </div>

            {/* Sound & Speech Audio Toggles */}
            <div className="mt-4 flex w-full items-center justify-between gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (voiceEnabled) {
                    if (currentAudioRef.current) currentAudioRef.current.pause()
                    window.speechSynthesis?.cancel()
                    setIsSpeaking(false)
                  }
                  setVoiceEnabled(!voiceEnabled)
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
                    ? `Suara AI: ${voiceEnabled ? "Aktif" : "Bisu"}`
                    : `AI Voice: ${voiceEnabled ? "Active" : "Muted"}`}
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
                <span>{lang === "ID" ? "Putar Suara Jeli" : "Play Jeli Voice"}</span>
              </button>
            </div>

            {/* Interactive Microphone Button for Voice Talk */}
            <div className="mt-5 w-full flex flex-col items-center">
              <button
                type="button"
                onClick={() => void toggleListening()}
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
                    ? "Sedang Mendengarkan... (Klik untuk kirim)"
                    : "Listening... (Click to send)"
                  : lang === "ID"
                  ? "Tekan untuk Bicara (Suara)"
                  : "Push to Talk (Voice)"}
              </p>
              <p className="text-[11px] text-[#202C2B]/60">
                {lang === "ID" ? "Bicara langsung dalam bahasa Indonesia" : "Speak directly in English"}
              </p>
            </div>

            {/* Speech / Permission Helper & Troubleshooting */}
            {speechError && (
              <div className="mt-3 w-full rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 space-y-2 animate-in fade-in-50 text-left">
                <p className="font-bold flex items-center gap-1.5 text-red-700">
                  <span>{lang === "ID" ? "⚠️ Akses Mikrofon" : "⚠️ Microphone Access"}</span>
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">{speechError}</p>
                <div className="pt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleListening()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-red-700 transition-colors"
                  >
                    <span>{lang === "ID" ? "🎙️ Izinkan & Coba Lagi" : "🎙️ Allow & Try Again"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpeechError("")}
                    className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    {lang === "ID" ? "Tutup" : "Close"}
                  </button>
                </div>
                <div className="mt-1 text-[10px] text-slate-600 bg-white/80 p-2 rounded-xl border border-red-100 leading-normal">
                  {lang === "ID" ? (
                    <>
                      💡 <strong>Cara Mengizinkan di Browser:</strong> Klik ikon 🔒 (gembok) atau setelan di samping <code>localhost:5173</code> pada address bar ➔ Ubah <strong>Mikrofon</strong> menjadi <strong>Izinkan (Allow)</strong>.
                    </>
                  ) : (
                    <>
                      💡 <strong>How to Allow in Browser:</strong> Click the 🔒 lock or settings icon beside <code>localhost:5173</code> on your address bar ➔ Change <strong>Microphone</strong> to <strong>Allow</strong>.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Live Chat Box & Text Input */}
          <div className="flex flex-col rounded-3xl border border-[#064B50]/15 bg-white shadow-sm overflow-hidden h-[620px]">
            {/* Header Chat */}
            <div className="flex items-center justify-between border-b border-[#064B50]/10 bg-[#FAFBF6] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#064B50] text-[#B8F000]">
                  <Bot size={15} />
                </span>
                <div>
                  <h3 className="text-xs font-extrabold text-[#064B50]">
                    {lang === "ID"
                      ? "Percakapan Langsung dengan Sahabat Jeli"
                      : "Live Conversation with Sahabat Jeli"}
                  </h3>
                  <p className="text-[10px] text-[#202C2B]/60">
                    {lang === "ID"
                      ? "Mode Suara (Voice) & Tulisan (Chat)"
                      : "Voice & Text Interactive Mode"}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-[#EFF7D5] px-2.5 py-0.5 text-[10px] font-bold text-[#064B50]">
                Live AI
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] ${
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
                    className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      msg.role === "user"
                        ? "bg-[#064B50] text-white"
                        : "bg-[#F7F7F0] border border-[#064B50]/10 text-[#202C2B]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75 font-bold">
                      <span>{msg.role === "user" ? (lang === "ID" ? "Kamu" : "You") : "Sahabat Jeli"}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Speaker play / replay button on AI bubble */}
                    {msg.role === "assistant" && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#064B50] shadow-2xs border border-[#064B50]/15 hover:bg-[#EFF7D5] transition-all"
                      >
                        <Volume2 size={13} className="text-[#087F7A]" />
                        <span>
                          {msg.id === "msg-welcome"
                            ? lang === "ID"
                              ? "🔊 Putar Suara Sambutan Jeli"
                              : "🔊 Play Jeli's Welcome Voice"
                            : lang === "ID"
                            ? "🔊 Dengarkan Suara Jeli"
                            : "🔊 Listen to Jeli's Voice"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs font-bold text-[#087F7A] p-2 bg-[#EFF7D5]/50 rounded-xl max-w-fit">
                  <LoaderCircle size={15} className="animate-spin" />
                  <span>
                    {lang === "ID"
                      ? "Jeli sedang berpikir dan menyiapkan suara balasan..."
                      : "Jeli is thinking and preparing a spoken response..."}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Suggested Chips */}
            <div className="border-t border-slate-100 bg-[#FAFBF6] px-4 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#064B50] mb-1.5">
                {lang === "ID" ? "Contoh Pertanyaan Cepat:" : "Quick Suggested Questions:"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSendMessage(prompt)}
                    disabled={isLoading}
                    className="rounded-lg border border-[#064B50]/15 bg-white px-2.5 py-1 text-[11px] font-medium text-[#064B50] hover:bg-[#EFF7D5] transition-colors disabled:opacity-50 text-left line-clamp-1"
                  >
                    + {prompt.slice(0, 42)}…
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar (Tulisan dibalas tulisan & suara) */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void handleSendMessage()
              }}
              className="border-t border-slate-200 p-3 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                placeholder={
                  lang === "ID"
                    ? "Ketik pertanyaan atau ceritakan tawaran kerja di sini…"
                    : "Type your question or describe the job offer here…"
                }
                className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:outline-2 focus:outline-[#087F7A]"
              />

              <button
                type="submit"
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
