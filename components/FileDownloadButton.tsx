'use client'
import { useState } from 'react'

interface Props {
  type: 'db' | 'mail'
  label: string
}

export default function FileDownloadButton({ type, label }: Props) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/excel/download?type=${type}`)
      if (!res.ok) throw new Error('다운로드 실패')
      const { url } = await res.json()
      window.open(url, '_blank')
    } catch {
      alert('파일 다운로드에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
    >
      📥 {loading ? '준비 중...' : label}
    </button>
  )
}
