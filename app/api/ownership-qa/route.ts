import { NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────────────────────
//  POST /api/ownership-qa
//  AI-powered Q&A about IDX stock ownership using Anthropic API
//  Context: IDX disclosure data for BBCA, BBRI, ANTM, ASII
// ─────────────────────────────────────────────────────────────

const OWNERSHIP_CONTEXT = `
Kamu adalah analis saham Indonesia yang ahli dalam data kepemilikan saham IDX.
Jawab pertanyaan berdasarkan data kepemilikan berikut (per Q3 2025):

=== BBRI (Bank Rakyat Indonesia) ===
- Pemerintah RI / Kementerian BUMN: 53.19% (217.2M lembar)
- BlackRock Inc: 5.84% (FOREIGN)
- Vanguard Group: 3.12% (FOREIGN, Mutual Fund)
- Danareksa Investment: 2.87% (LOCAL, Mutual Fund)
- PT Taspen: 2.41% (LOCAL, Institution)
- GIC Singapore: 1.94% — ⚠️ FLAG: Suspected hidden accumulation +0.44% Q3 2025
- Eastspring Investments: 1.62% (FOREIGN)
- PT Asuransi Jiwa Manulife: 1.31% (LOCAL)
- Norges Bank: 1.18% — ⚠️ FLAG: Suspected hidden accumulation +0.31%
- Public Float: 25.58%
- Total foreign ownership: ~13.7%

=== BBCA (Bank Central Asia) ===
- PT Dwimuria Investama Andalan (Robert Hartono): 54.94% — keluarga terkaya Indonesia
- BlackRock Inc: 6.12% (FOREIGN)
- Vanguard Group: 3.44% (FOREIGN)
- PT Prudential Life: 2.18% (LOCAL)
- GIC Singapore: 1.87% — ⚠️ FLAG: Hidden accumulation +0.38% Q3 2025
- Norges Bank: 1.24% — ⚠️ FLAG: Hidden accumulation +0.22%
- Eastspring: 1.11%
- Public Float: 28.21%
- Total foreign ownership: ~17.2%

=== ANTM (Aneka Tambang) ===
- Pemerintah RI via MIND ID (Mining Industry Indonesia): 65%
- BlackRock: 3.21%
- Vanguard: 1.84%
- PT Taspen: 1.52%
- Norges Bank: 0.98% — ⚠️ FLAG: Agresif +0.67% Q3 2025 (ekspektasi nikel)
- Public Float: 26.64%
- Produk utama: nikel, emas, bauksit, perak

=== ASII (Astra International) ===
- Jardine Matheson Holdings (Hong Kong): 50.11% — strategic/permanent holding
- BlackRock: 4.88%
- Vanguard: 2.34%
- PT Taspen: 1.98%
- GIC Singapore: 1.74% — ⚠️ FLAG: Hidden accumulation +0.29%
- PT Manulife: 1.12%
- Norges Bank: 0.87%
- Public Float: 36.96%
- Anak usaha: Astra Motor, Toyota, Astra Credit, Astra Insurance

=== DEFINISI ===
- CP: Corporate/Pengendali
- ID: Individual
- IB: Institution/Asuransi
- MF: Mutual Fund/Reksa Dana
- FRG: Foreign/Asing
- Hidden accumulation: investor yang diduga membeli melebihi 1% threshold tanpa pelaporan resmi, terdeteksi dari pola transaksi bertahap melalui beberapa custodian

Jawab dalam Bahasa Indonesia yang profesional. Sertakan data angka spesifik.
Jika pertanyaan di luar data yang tersedia, katakan terus terang.
Format jawaban: ringkas, padat, data-driven. Maksimal 3 paragraf.
`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured', answer: null },
      { status: 503 }
    )
  }

  let body: { question: string; ticker?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { question, ticker } = body
  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question required' }, { status: 400 })
  }

  const userPrompt = ticker
    ? `[Pertanyaan tentang ${ticker}]: ${question}`
    : question

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'x-api-key':     apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',  // fast + cheap for Q&A
        max_tokens: 600,
        system:     OWNERSHIP_CONTEXT,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[ownership-qa] Anthropic error:', err)
      return NextResponse.json({ error: 'AI API error', answer: null }, { status: 502 })
    }

    const data = await res.json()
    const answer = data.content?.[0]?.text ?? 'Tidak dapat menghasilkan jawaban.'

    return NextResponse.json({
      answer,
      model:  'claude-haiku-4-5',
      ticker: ticker ?? null,
    })

  } catch (err) {
    console.error('[ownership-qa] Error:', err)
    return NextResponse.json({ error: 'Internal error', answer: null }, { status: 500 })
  }
}
