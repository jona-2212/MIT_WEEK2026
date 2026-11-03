import React from "react"
import symbol from "../assets/jeli_simbol.png"
import fullLogo from "../assets/jeli_logo_lengkap.png"

interface JeliLogoProps {
  variant?: "full" | "icon"
  theme?: "light" | "dark"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export const JeliLogo: React.FC<JeliLogoProps> = ({
  variant = "full",
  theme = "light",
  size = "md",
  className = "",
}) => {
  const heights = { sm: "h-7", md: "h-9", lg: "h-11", xl: "h-14" }
  if (variant === "full" && theme === "dark") {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <img
          src={symbol}
          alt="Jeli"
          className={`${heights[size]} aspect-square object-contain select-none`}
          loading="eager"
        />
        <span className="flex items-baseline font-sans text-2xl font-extrabold tracking-tight text-white">
          jeli<span className="text-3xl leading-none text-[#B8F000]">.</span>
        </span>
      </div>
    )
  }

  return (
    <img
      src={variant === "icon" ? symbol : fullLogo}
      alt="Jeli"
      className={`${heights[size]} ${variant === "icon" ? "aspect-square" : "w-auto"} object-contain select-none ${className}`}
      loading="eager"
    />
  )
}

export default JeliLogo
