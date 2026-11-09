import React, { useEffect, useState } from "react"
import { Sparkles, Volume2, Mic, ShieldCheck } from "lucide-react"

export type AvatarEmotion = "idle" | "talking" | "listening" | "thinking" | "warning" | "happy" | "celebrate"

interface JeliAvatarProps {
  emotion?: AvatarEmotion
  isSpeaking?: boolean
  isListening?: boolean
  character?: "jeli" | "recruiter"
  size?: "md" | "lg" | "xl"
  className?: string
  speechVolume?: number
  lang?: "ID" | "EN"
}

export const JeliAvatar: React.FC<JeliAvatarProps> = ({
  emotion = "idle",
  isSpeaking = false,
  isListening = false,
  character = "jeli",
  size = "lg",
  className = "",
  lang = "ID",
}) => {
  // Eye blinking state (Kedap-kedip alami berkala)
  const [isBlinking, setIsBlinking] = useState(false)
  // Mouth frame state for dynamic lip-sync (Mulut berbicara animasi)
  const [mouthFrame, setMouthFrame] = useState(0)
  // Hand gesture frame (Tangan bergerak seolah-olah hidup)
  const [gestureTick, setGestureTick] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(preference.matches)
    preference.addEventListener("change", update)
    return () => preference.removeEventListener("change", update)
  }, [])

  // 1. Natural blinking loop (Kedip mata setiap 3.2 - 5 detik)
  useEffect(() => {
    if (reducedMotion) return
    let blinkTimeout: ReturnType<typeof setTimeout>
    const blinkInterval = setInterval(() => {
      setIsBlinking(true)
      blinkTimeout = setTimeout(() => {
        setIsBlinking(false)
      }, 160) // blink duration 160ms
    }, 3600)

    return () => {
      clearInterval(blinkInterval)
      clearTimeout(blinkTimeout)
    }
  }, [reducedMotion])

  // 2. Animated lip-sync loop when speaking (Mulut bergerak saat berbicara)
  useEffect(() => {
    if (!isSpeaking || reducedMotion) return
    const mouthInterval = setInterval(() => {
      setMouthFrame((prev) => (prev + 1) % 4)
    }, 130) // cycles mouth shapes smoothly

    return () => clearInterval(mouthInterval)
  }, [isSpeaking, reducedMotion])

  // 3. Hand & body gesture cycle (Tangan bergerak aktif saat berbicara / mendengarkan)
  useEffect(() => {
    if (reducedMotion) return
    const gestureInterval = setInterval(() => {
      setGestureTick((prev) => (prev + 1) % 100)
    }, 60)
    return () => clearInterval(gestureInterval)
  }, [reducedMotion])

  // Dynamic hand rotation and translation based on state
  const isTalkingOrActive = isSpeaking || emotion === "talking"
  const leftHandY = isTalkingOrActive ? Math.sin(gestureTick * 0.18) * 10 - 6 : Math.sin(gestureTick * 0.08) * 3
  const leftHandRot = isTalkingOrActive ? Math.sin(gestureTick * 0.18) * 14 - 15 : Math.sin(gestureTick * 0.08) * 4
  const rightHandY = isTalkingOrActive ? Math.cos(gestureTick * 0.18) * 10 - 8 : Math.cos(gestureTick * 0.08) * 3
  const rightHandRot = isTalkingOrActive ? -Math.cos(gestureTick * 0.18) * 14 + 18 : -Math.cos(gestureTick * 0.08) * 4

  const sizeClasses = {
    md: "w-52 aspect-square sm:w-56",
    lg: "w-52 aspect-square sm:w-72 lg:w-80",
    xl: "w-52 aspect-square sm:w-80 lg:w-96",
  }[size]

  const statusLabel = isListening
    ? (lang === "ID" ? "Mendengarkan Suaramu..." : "Listening to your voice...")
    : isSpeaking
    ? (lang === "ID" ? "Jeli Sedang Berbicara..." : "Jeli is speaking...")
    : emotion === "thinking"
    ? (lang === "ID" ? "Jeli Sedang Berpikir..." : "Jeli is thinking...")
    : emotion === "warning"
    ? (lang === "ID" ? "Tetap waspada" : "Stay alert")
    : (lang === "ID" ? "Siap membantu" : "Ready to help")

  const isRecruiter = character === "recruiter"
  const mainHue = isRecruiter ? "#1E293B" : "#064B50"
  const accentHue = isRecruiter ? "#EF4444" : "#B8F000"

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Sound wave ripple rings when speaking or listening */}
      {(isSpeaking || isListening) && (
        <div className="absolute inset-0 -top-4 flex items-center justify-center pointer-events-none">
          <span
            className={`absolute h-52 w-52 rounded-full border-2 animate-ping opacity-25 sm:h-64 sm:w-64 ${
              isListening ? "border-amber-400" : "border-[#087F7A]"
            }`}
          />
          <span
            className={`absolute h-56 w-56 rounded-full border opacity-20 animate-pulse sm:h-72 sm:w-72 ${
              isListening ? "border-amber-500" : "border-[#B8F000]"
            }`}
          />
        </div>
      )}

      {/* Main Animated SVG Avatar Character */}
      <div className={`relative ${sizeClasses} transition-all duration-300 drop-shadow-2xl`}>
        <svg
          viewBox="0 0 320 320"
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Body gradient */}
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={mainHue} />
              <stop offset="60%" stopColor={isRecruiter ? "#334155" : "#087F7A"} />
              <stop offset="100%" stopColor={isRecruiter ? "#0F172A" : "#043337"} />
            </linearGradient>

            {/* Face screen gradient */}
            <radialGradient id="faceGlow" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#F7FBF8" />
              <stop offset="100%" stopColor="#E2ECE6" />
            </radialGradient>

            {/* Star sparkle glow */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* GENTLE BODY BREATHING WRAPPER */}
          <g
            style={{
              transform: `translateY(${Math.sin(gestureTick * 0.08) * 3}px)`,
              transformOrigin: "center center",
              transition: "transform 0.1s ease-out",
            }}
          >
            {/* LEFT HAND (TANGAN KIRI) - Bergerak dinamis seolah-olah hidup */}
            <g
              style={{
                transform: `translate(${38}px, ${168 + leftHandY}px) rotate(${leftHandRot}deg)`,
                transformOrigin: "top right",
                transition: "transform 0.08s ease-out",
              }}
            >
              {/* Arm & Palm */}
              <path
                d="M 30,10 C 15,25 0,45 -8,60 C -12,68 -5,75 5,72 C 18,68 35,45 42,28 Z"
                fill={mainHue}
              />
              {/* Hand Palm / Glove */}
              <ellipse cx="-4" cy="65" rx="13" ry="11" fill={accentHue} />
              <circle cx="-13" cy="60" r="5" fill={accentHue} /> {/* thumb */}
              <circle cx="-6" cy="74" r="4.5" fill={accentHue} /> {/* fingers */}
              <circle cx="2" cy="73" r="4.5" fill={accentHue} />
            </g>

            {/* RIGHT HAND (TANGAN KANAN) - Bergerak aktif saat berbicara / menjelaskan */}
            <g
              style={{
                transform: `translate(${275}px, ${168 + rightHandY}px) rotate(${rightHandRot}deg)`,
                transformOrigin: "top left",
                transition: "transform 0.08s ease-out",
              }}
            >
              {/* Arm & Palm */}
              <path
                d="M -30,10 C -15,25 0,45 8,60 C 12,68 5,75 -5,72 C -18,68 -35,45 -42,28 Z"
                fill={mainHue}
              />
              {/* Hand Palm / Glove */}
              <ellipse cx="4" cy="65" rx="13" ry="11" fill={accentHue} />
              <circle cx="13" cy="60" r="5" fill={accentHue} /> {/* thumb */}
              <circle cx="6" cy="74" r="4.5" fill={accentHue} /> {/* fingers */}
              <circle cx="-2" cy="73" r="4.5" fill={accentHue} />
            </g>

            {/* MAIN JELI TORSO / HEAD BODY (Organic Tear/Shield Shape of Jeli Mascot) */}
            <path
              d="M 160,25 C 225,25 275,75 275,145 C 275,215 220,265 160,278 C 100,265 45,215 45,145 C 45,75 95,25 160,25 Z"
              fill="url(#bodyGrad)"
              filter="drop-shadow(0 12px 24px rgba(6,75,80,0.35))"
            />

            {/* CHEST EMBLEM: Digital Security Star / Beacon */}
            <path
              d="M 160,15 L 165,28 L 178,33 L 165,38 L 160,51 L 155,38 L 142,33 L 155,28 Z"
              fill={accentHue}
              filter="url(#glow)"
            />

            {/* VISOR / FACE SCREEN (Wajah Tempat Mata & Mulut Beranimasi) */}
            <path
              d="M 160,60 C 215,60 252,98 252,150 C 252,202 212,238 160,248 C 108,238 68,202 68,150 C 68,98 105,60 160,60 Z"
              fill="url(#faceGlow)"
              stroke="#D6E4DC"
              strokeWidth="2.5"
            />

            {/* CUTE CHEEKS (BLUSH) */}
            <ellipse cx="106" cy="172" rx="10" ry="6" fill="#F87171" opacity="0.35" />
            <ellipse cx="214" cy="172" rx="10" ry="6" fill="#F87171" opacity="0.35" />

            {/* ========================================================= */}
            {/* EYES SECTION (MATA KEDAP-KEDIP DAN BEREKSPRESI)           */}
            {/* ========================================================= */}
            <g
              style={{
                transform: isBlinking ? "scaleY(0.08)" : "scaleY(1)",
                transformOrigin: "160px 140px",
                transition: "transform 0.08s ease-in-out",
              }}
            >
              {emotion === "happy" || emotion === "celebrate" ? (
                /* Happy squint eyes (^ ^) */
                <>
                  <path d="M 104,142 Q 118,128 132,142" stroke={mainHue} strokeWidth="5" strokeLinecap="round" fill="none" />
                  <path d="M 188,142 Q 202,128 216,142" stroke={mainHue} strokeWidth="5" strokeLinecap="round" fill="none" />
                </>
              ) : emotion === "thinking" ? (
                /* Thinking eyes looking up-right */
                <>
                  <circle cx="118" cy="138" r="14" fill={mainHue} />
                  <circle cx="122" cy="134" r="5" fill="#FFFFFF" />
                  <circle cx="202" cy="138" r="14" fill={mainHue} />
                  <circle cx="206" cy="134" r="5" fill="#FFFFFF" />
                  {/* Pondering eyebrow */}
                  <path d="M 104,122 Q 118,116 132,120" stroke={mainHue} strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M 188,120 Q 202,114 216,118" stroke={mainHue} strokeWidth="3" strokeLinecap="round" fill="none" />
                </>
              ) : emotion === "warning" ? (
                /* Sharp vigilant / alert eyes */
                <>
                  <circle cx="118" cy="140" r="15" fill="#DC2626" />
                  <circle cx="118" cy="140" r="9" fill={mainHue} />
                  <circle cx="115" cy="136" r="3.5" fill="#FFFFFF" />

                  <circle cx="202" cy="140" r="15" fill="#DC2626" />
                  <circle cx="202" cy="140" r="9" fill={mainHue} />
                  <circle cx="199" cy="136" r="3.5" fill="#FFFFFF" />
                  {/* Alert V eyebrows */}
                  <path d="M 104,120 L 132,126" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M 216,120 L 188,126" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
                </>
              ) : (
                /* Standard friendly eyes with pupil highlights */
                <>
                  {/* Left Eye */}
                  <ellipse cx="118" cy="140" rx="14" ry="16" fill={mainHue} />
                  <circle cx="114" cy="135" r="5" fill="#FFFFFF" />
                  <circle cx="122" cy="144" r="2.5" fill={accentHue} />

                  {/* Right Eye */}
                  <ellipse cx="202" cy="140" rx="14" ry="16" fill={mainHue} />
                  <circle cx="198" cy="135" r="5" fill="#FFFFFF" />
                  <circle cx="206" cy="144" r="2.5" fill={accentHue} />

                  {/* Eyebrows */}
                  <path d="M 106,120 Q 118,114 130,119" stroke={mainHue} strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M 190,119 Q 202,114 214,120" stroke={mainHue} strokeWidth="3" strokeLinecap="round" fill="none" />
                </>
              )}
            </g>

            {/* ========================================================= */}
            {/* MOUTH SECTION (MULUT BERBICARA SINKRON DENGAN AUDIO TTS)  */}
            {/* ========================================================= */}
            <g transform="translate(160, 192)">
              {isSpeaking ? (
                /* Animated speaking mouth shapes (Lipsync) */
                mouthFrame === 1 ? (
                  /* Open 'O' */
                  <ellipse cx="0" cy="0" rx="10" ry="14" fill="#991B1B" stroke={mainHue} strokeWidth="3">
                    <ellipse cx="0" cy="5" rx="6" ry="5" fill="#F87171" />
                  </ellipse>
                ) : mouthFrame === 2 ? (
                  /* Wide open 'A' smile */
                  <path
                    d="M -18,-2 Q 0,18 18,-2 Z"
                    fill="#991B1B"
                    stroke={mainHue}
                    strokeWidth="3"
                    strokeLinejoin="round"
                  >
                    <path d="M -10,3 Q 0,14 10,3 Z" fill="#F87171" />
                  </path>
                ) : mouthFrame === 3 ? (
                  /* Medium mouth shape 'U' */
                  <ellipse cx="0" cy="0" rx="13" ry="9" fill="#991B1B" stroke={mainHue} strokeWidth="3" />
                ) : (
                  /* Speaking slight smile */
                  <path d="M -14,-1 Q 0,8 14,-1" stroke={mainHue} strokeWidth="4" strokeLinecap="round" fill="none" />
                )
              ) : isListening ? (
                /* Attentive small round 'o' mouth */
                <circle cx="0" cy="0" r="6" fill="#991B1B" stroke={mainHue} strokeWidth="2.5" />
              ) : emotion === "warning" ? (
                /* Determined / protective flat mouth */
                <line x1="-12" y1="2" x2="12" y2="2" stroke={mainHue} strokeWidth="3.5" strokeLinecap="round" />
              ) : (
                /* Gentle friendly resting smile */
                <path d="M -15,-2 Q 0,11 15,-2" stroke={mainHue} strokeWidth="3.5" strokeLinecap="round" fill="none" />
              )}
            </g>
          </g>
        </svg>

        {/* Small floating badge on chest/avatar corner */}
        <div className="absolute top-2 right-2 flex items-center justify-center h-8 w-8 rounded-full bg-white/90 border border-[#064B50]/15 shadow-md">
          {isListening ? (
            <Mic size={16} className="text-amber-500 animate-pulse" />
          ) : isSpeaking ? (
            <Volume2 size={16} className="text-[#087F7A] animate-bounce" />
          ) : emotion === "warning" ? (
            <ShieldCheck size={16} className="text-red-500" />
          ) : (
            <Sparkles size={16} className="text-[#087F7A]" />
          )}
        </div>
      </div>

      {/* Realtime Live Status Pill */}
      <div className="mt-3 flex items-center gap-2 rounded-full border border-[#064B50]/15 bg-white/95 px-4 py-1.5 shadow-sm text-xs font-bold text-[#064B50]">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isListening
              ? "bg-amber-500 animate-ping"
              : isSpeaking
              ? "bg-[#087F7A] animate-pulse"
              : emotion === "warning"
              ? "bg-red-500 animate-pulse"
              : "bg-[#B8F000]"
          }`}
        />
        <span>{statusLabel}</span>
      </div>
    </div>
  )
}

export default JeliAvatar
