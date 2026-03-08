import * as React from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'default' | 'ghost' | 'outline' | 'gold' | 'destructive'
export type ButtonSize    = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  default:     'bg-cyan text-bg border border-cyan hover:bg-cyan2',
  ghost:       'bg-transparent text-gray border border-transparent hover:bg-[rgba(0,195,255,0.05)] hover:text-white',
  outline:     'bg-transparent text-white border border-border2 hover:border-cyan hover:text-cyan',
  gold:        'bg-transparent text-gold border border-[rgba(255,215,0,0.5)] hover:bg-[rgba(255,215,0,0.07)] hover:border-gold',
  destructive: 'bg-[rgba(255,0,98,0.1)] text-red border border-[rgba(255,0,98,0.3)] hover:bg-[rgba(255,0,98,0.15)]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm:   'px-[14px] py-[5px] text-[9px] tracking-[1.5px]',
  md:   'px-5 py-[9px] text-[10px] tracking-[2px]',
  lg:   'px-7 py-[13px] text-[11px] tracking-[2px]',
  icon: 'p-2 text-sm w-9 h-9 justify-center',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center gap-2',
        'font-mono font-bold uppercase',
        'cursor-pointer transition-all duration-200 outline-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
