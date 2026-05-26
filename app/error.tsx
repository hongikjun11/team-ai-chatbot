'use client'
import { useEffect } from 'react'

export default function Error({
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md w-full mx-4 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">페이지 오류가 발생했습니다</h2>
        <p className="text-sm text-gray-500 mb-6">{error.message || '알 수 없는 오류입니다.'}</p>
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
