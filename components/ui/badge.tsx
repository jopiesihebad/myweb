import * as React from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant = 'cyan' | 'gold' | 'lime' | 'red' | 'orange' | 'purple' | 'gray' | 'outline'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  cyan:    { background: '#00c3ff',               color: '#04070f',  border: 'none'                              },
  gold:    { background: '#ffd700',               color: '#04070f',  border: 'none'                              },
  lime:    { background: 'rgba(57,255,20,0.12)',  color: '#39ff14',  border: '1px solid rgba(57,255,20,0.3)'    },
  red:     { background: 'rgba(255,0,98,0.12)',   color: '#ff0062',  border: '1px solid rgba(255,0,98,0.3)'     },
  orange:  { background: 'rgba(255,140,0,0.12)',  color: '#ff8c00',  border: '1px solid rgba(255,140,0,0.3)'    },
  purple:  { background: 'rgba(189,147,249,0.12)',color: '#bd93f9',  border: '1px solid rgba(189,147,249,0.3)'  },
  gray:    { background: 'rgba(90,112,144,0.12)', color: '#5a7090',  border: '1px solid #1e2e4a'                },
  outline: { background: 'transparent',           color: '#eef4fc',  border: '1px solid #1e2e4a'                },
}

export function Badge({ variant = 'cyan', style, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        fontSize: '8px',
        fontFamily: '"JetBrains Mono", monospace',
        fontWeight: 700,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        ...badgeStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  )
}
