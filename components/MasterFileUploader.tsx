'use client'
import { useState } from 'react'

interface Props {
  type: 'db' | 'mail'
  onDeleted?: () => void
}

export default function MasterFileUploader({ type, onDeleted }: Props) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
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

  const handleDelete = async () => {
    const label = type === 'db' ? 'DB 마스터' : '메일 마스터'
    const confirmed = window.confirm(
      `⚠️ "${label}" 파일을 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await fetch('/api/excel/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (data.ok) {
        setLastUploaded(null)
        alert(`🗑️ "${label}" 파일이 삭제되었습니다.`)
        onDeleted?.()
      } else {
        alert(data.error || '삭제 실패')
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다')
    } finally {
      setDeleting(false)
    }
  }

  const busy = uploading || deleting

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
        📤 {uploading ? '업로드 중...' : '기존 파일 등록'}
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="hidden"
          disabled={busy}
        />
      </label>
      <button
        onClick={handleDelete}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50 disabled:pointer-events-none"
      >
        🗑️ {deleting ? '삭제 중...' : '마스터 파일 삭제'}
      </button>
      {lastUploaded && (
        <span className="text-xs text-green-600">{lastUploaded} 등록됨</span>
      )}
    </div>
  )
}
