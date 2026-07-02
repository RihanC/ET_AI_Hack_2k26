import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  onClick?: () => void
  disabled?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg border transition-colors select-none focus:outline-none focus:ring-1 focus:ring-primary/40'

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white border-primary hover:bg-primary/90',
  secondary: 'bg-card border-border text-text hover:border-primary/40 hover:text-text',
  ghost: 'bg-transparent border-border/40 text-muted hover:text-text hover:border-primary/40',
  danger: 'bg-critical/15 text-critical border-critical/30 hover:bg-critical/20 hover:border-critical/40',
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  onClick,
  disabled,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

