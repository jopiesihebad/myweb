import * as React from 'react'
import { cn } from '@/lib/utils'

export type CardAccent = 'cyan' | 'gold' | 'lime' | 'red' | 'none'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: CardAccent
  hoverable?: boolean
}

const accentTopBar: Record<CardAccent, string> = {
  cyan: 'from-cyan to-transparent',
  gold: 'from-gold to-transparent',
  lime: 'from-lime to-transparent',
  red:  'from-red to-transparent',
  none: '',
}

export function Card({ accent = 'none', hoverable = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-panel border border-border p-7',
        'transition-all duration-250',
        hoverable && 'hover:bg-panel2 hover:-translate-y-1 hover:border-border2',
        className,
      )}
      {...props}
    >
      {accent !== 'none' && (
        <div className={cn('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r', accentTopBar[accent])} />
      )}
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-syne text-[18px] font-bold tracking-[-0.3px] text-white', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('text-[11px] text-gray leading-[1.7]', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-3 mt-5 pt-4 border-t border-border', className)}
      {...props}
    >
      {children}
    </div>
  )
}
