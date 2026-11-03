import React from "react"
import symbol from "../assets/jeli_simbol.png"

interface JeliCompanionProps {
  state?: "vigilant" | "alert" | "protect" | "celebrate" | "scanning"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  interactive?: boolean
  onInteract?: () => void
}

export const JeliCompanion: React.FC<JeliCompanionProps> = ({
  state = "vigilant",
  size = "lg",
  className = "",
  interactive = true,
  onInteract,
}) => {
  const sizes = { sm: "w-24 h-24", md: "w-36 h-36", lg: "w-56 h-56 md:w-64 md:h-64", xl: "w-72 h-72 md:w-80 md:h-80" }
  const label = {
    alert: "PERINGATAN MENCURIGAKAN",
    scanning: "MEMERIKSA POLA...",
    protect: "PENGAMATAN CERMAT",
    celebrate: "KEPUTUSAN TEPAT",
    vigilant: "JELI • OBSERVANT",
  }[state]
  return (
    <div
      onClick={onInteract}
      className={`relative inline-block ${sizes[size]} ${interactive ? "cursor-pointer hover:scale-105" : ""} transition-transform ${className}`}
      title="Jeli — Digital Safety Companion"
    >
      <img src={symbol} alt="Jeli companion" className="h-full w-full object-contain drop-shadow-xl" />
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#064B50]/15 bg-white/95 px-3 py-1 text-[11px] font-bold tracking-wide text-[#064B50] shadow-md">
        <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${state === "alert" ? "bg-red-600" : "bg-[#B8F000]"}`} />
        {label}
      </div>
    </div>
  )
}

export default JeliCompanion
