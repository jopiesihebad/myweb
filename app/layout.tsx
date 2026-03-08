import type { Metadata } from 'next'
import '../styles/globals.css'
import { WebSocketProvider } from '@/components/WebSocketProvider'

export const metadata: Metadata = {
  title: 'StockIndexer — Conway Automaton Intelligence Platform',
  description:
    'AI Signal Trading with SS BlackBox v6.3.1 + pieBot Sovereign. Real-time signals, Ownership Intelligence IDX, Conway Automaton state engine. 14-day free trial.',
  keywords: [
    'trading signals', 'Conway Automaton', 'SS BlackBox', 'pieBot',
    'stock signals IDX', 'forex signals', 'crypto signals', 'backtest trading',
  ],
  authors: [{ name: 'StockIndexer' }],
  robots: 'index, follow',
  openGraph: {
    title: 'StockIndexer — Conway Automaton Intelligence',
    description:
      "The world's first Conway Automaton signal intelligence platform. Win rate 81.8%, profit factor 1.92, 287 backtest trades. Start free 14-day trial.",
    url: 'https://stockindexer.com',
    siteName: 'StockIndexer',
    images: [{ url: 'https://stockindexer.com/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StockIndexer — Conway Automaton Intelligence',
    description: 'AI Signal Trading SS BlackBox v6.3.1 + pieBot. Real-time signals, live Ownership Intelligence IDX.',
    images: ['https://stockindexer.com/og-image.png'],
  },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Global ambient layers */}
        <div className="grid-bg" aria-hidden />
        <div className="orb orb-1" aria-hidden />
        <div className="orb orb-2" aria-hidden />
        <div className="orb orb-3" aria-hidden />
        {/*
          WebSocketProvider wraps the entire app so every client component
          can call useWsSignal() without creating its own WS connection.
        */}
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
      </body>
    </html>
  )
}
