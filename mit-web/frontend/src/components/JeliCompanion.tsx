import React from "react"
import symbol from "../assets/jeli_simbol.png"
import { t, type Language } from "../i18n"

interface JeliCompanionProps {
  state?: "vigilant" | "alert" | "protect" | "celebrate" | "scanning"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  interactive?: boolean
  onInteract?: () => void
  lang?: Language
}

export const JeliCompanion: React.FC<JeliCompanionProps> = ({
  state = "vigilant",
  size = "lg",
  className = "",
  interactive = true,
  onInteract,
  lang = "ID",
}) => {
  const sizes = { sm: "w-24 h-24", md: "w-36 h-36", lg: "w-56 h-56 md:w-64 md:h-64", xl: "w-72 h-72 md:w-80 md:h-80" }
  const label = {
    ID: { alert: "TANDA BAHAYA", scanning: "MEMERIKSA POLA", protect: "AMATI DENGAN CERMAT", celebrate: "KEPUTUSAN TEPAT", vigilant: "JELI SIAGA" },
    EN: { alert: "WARNING SIGN", scanning: "CHECKING PATTERNS", protect: "LOOK CLOSELY", celebrate: "SAFE DECISION", vigilant: "JELI IS READY" },
  }[lang][state]
  const canInteract = interactive && onInteract !== undefined
  const Element = canInteract ? "button" : "div"
  return (
    <Element
      type={canInteract ? "button" : undefined}
      onClick={canInteract ? onInteract : undefined}
      aria-label={canInteract ? t(lang, "askJeli") : undefined}
      className={`relative inline-block rounded-full ${sizes[size]} ${canInteract ? "cursor-pointer hover:scale-105" : ""} transition-transform ${className}`}
    >
      <img src={symbol} alt={canInteract ? "" : "Jeli"} className="h-full w-full object-contain drop-shadow-xl" />
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#064B50]/15 bg-white/95 px-3 py-1 text-[11px] font-bold tracking-wide text-[#064B50] shadow-md">
        <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${state === "alert" ? "bg-red-600" : "bg-[#B8F000]"}`} />
        {label}
      </div>
    </Element>
  )
}

export default JeliCompanion
