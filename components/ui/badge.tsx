import * as React from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant = 'cyan' | 'gold' | 'lime' | 'red' | 'orange' | 'purple' | 'gray' | 'outline'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  cyan:    'bg-cyan text-bg border-transparent',
  gold:    'bg-gold text-bg border-transparent',
  lime:    'bg-[rgba(57,255,20,0.12)] text-lime border border-[rgba(57,255,20,0.3)]',
  red:     'bg-[rgba(255,0,98,0.12)] text-red border border-[rgba(255,0,98,0.3)]',
  orange:  'bg-[rgba(255,140,0,0.12)] text-orange border border-[rgba(255,140,0,0.3)]',
  purple:  'bg-[rgba(189,147,249,0.12)] text-purple border border-[rgba(189,147,249,0.3)]',
  gray:    'bg-[rgba(90,112,144,0.12)] text-gray border border-border2',
  outline: 'bg-transparent text-white border border-border2',
}

export function Badge({ variant = 'cyan', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-[10px] py-[3px]',
        'font-mono font-bold text-[8px] tracking-[2px] uppercase',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
