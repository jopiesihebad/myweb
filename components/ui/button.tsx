import * as React from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'default' | 'ghost' | 'outline' | 'gold' | 'destructive'
export type ButtonSize    = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

/* Use inline style for anything Tailwind can't express (clip-path, CSS vars in bg) */
const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  default:     { background: '#00c3ff', color: '#04070f', border: '1px solid #00c3ff' },
  ghost:       { background: 'transparent', color: '#5a7090', border: '1px solid transparent' },
  outline:     { background: 'transparent', color: '#eef4fc', border: '1px solid #1e2e4a' },
  gold:        { background: 'transparent', color: '#ffd700', border: '1px solid rgba(255,215,0,0.5)' },
  destructive: { background: 'rgba(255,0,98,0.1)', color: '#ff0062', border: '1px solid rgba(255,0,98,0.3)' },
}

const variantHover: Record<ButtonVariant, React.CSSProperties> = {
  default:     { background: '#00e5ff' },
  ghost:       { background: 'rgba(0,195,255,0.05)', color: '#eef4fc' },
  outline:     { borderColor: '#00c3ff', color: '#00c3ff' },
  gold:        { background: 'rgba(255,215,0,0.07)', borderColor: '#ffd700' },
  destructive: { background: 'rgba(255,0,98,0.15)' },
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm:   { padding: '5px 14px',  fontSize: '9px',  letterSpacing: '1.5px' },
  md:   { padding: '9px 20px',  fontSize: '10px', letterSpacing: '2px'   },
  lg:   { padding: '13px 28px', fontSize: '11px', letterSpacing: '2px'   },
  icon: { padding: '8px',       fontSize: '14px', width: '36px', height: '36px' },
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', style, className, children, ...props }, ref) => {
    const [hovered, setHovered] = React.useState(false)

    return (
      <button
        ref={ref}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'inline-flex items-center gap-2 font-mono font-bold uppercase cursor-pointer transition-all duration-200 outline-none',
          className,
        )}
        style={{
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...(hovered ? variantHover[variant] : {}),
          ...style,
        }}
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
