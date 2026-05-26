'use client'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #fecaca', padding: 32, maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>오류가 발생했습니다</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>{error.message || '알 수 없는 오류입니다.'}</p>
            <button
              onClick={reset}
              style={{ background: '#2563eb', color: 'white', padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
