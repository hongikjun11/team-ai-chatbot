'use client'
import { useState } from 'react'

export default function DocumentUploader() {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<string[]>([])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.ok) {
        setUploaded((prev) => [...prev, data.name])
      } else {
        alert(data.error || '업로드 실패')
      }
    } catch {
      alert('업로드 실패')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
        📄 {uploading ? '업로드 중...' : '문서 업로드'}
        <input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls" onChange={handleFile} className="hidden" />
      </label>
      {uploaded.length > 0 && (
        <span className="text-xs text-gray-500">{uploaded[uploaded.length - 1]} 업로드됨</span>
      )}
    </div>
  )
}
