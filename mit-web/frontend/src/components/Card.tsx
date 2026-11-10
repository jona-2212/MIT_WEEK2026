import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
}

function Card({ children, className = '' }: CardProps) {
  return (
    <article
      className={`rounded-[26px] border border-slate-800 bg-slate-900/85 shadow-[0_25px_70px_rgba(0,0,0,0.28)] ${className}`}
    >
      {children}
    </article>
  )
}

export default Card
