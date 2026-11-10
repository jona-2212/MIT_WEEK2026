import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'lime' | 'secondary'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
}

function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const variants = {
    primary:
      'border border-blue-400/40 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:-translate-y-0.5 hover:from-blue-500 hover:to-blue-600 hover:shadow-[0_12px_30px_rgba(37,99,235,0.45)]',
    lime:
      'border-transparent bg-[#ccff00] text-[#070d1e] hover:bg-[#b8e600] hover:shadow-[0_10px_28px_rgba(204,255,0,0.25)]',
    secondary:
      'border-slate-600 bg-slate-900/80 text-slate-200 hover:border-slate-500 hover:bg-slate-800 hover:text-white',
  }

  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold transition duration-200 active:scale-[.98] focus-visible:outline-3 focus-visible:outline-[#ccff00]/45 focus-visible:outline-offset-3 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
