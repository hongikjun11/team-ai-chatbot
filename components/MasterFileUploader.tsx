'use client'
import { useState } from 'react'

interface Props {
  type: 'db' | 'mail'
}

export default function MasterFileUploader({ type }: Props) {
  const [uploading, setUploading] = useState(false)
  const [lastUploaded, setLastUploaded] = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('type', type)

    try {
      const res = await fetch('/api/excel/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.ok) {
        setLastUploaded(data.name)
        alert(`✅ "${data.name}" 파일이 master로 등록되었습니다.`)
      } else {
        alert(data.error || '업로드 실패')
      }
    } catch {
      alert('업로드 중 오류가 발생했습니다')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
        📤 {uploading ? '업로드 중...' : '기존 파일 등록'}
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="hidden"
          disabled={uploading}
        />
      </label>
      {lastUploaded && (
        <span className="text-xs text-green-600">{lastUploaded} 등록됨</span>
      )}
    </div>
  )
}
