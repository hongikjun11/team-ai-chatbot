'use client'
import { useState, useEffect, useRef } from 'react'

interface DocMeta {
  name: string
  downloadUrl: string
}

interface Props {
  isAdmin?: boolean
}

export default function DocumentUploader({ isAdmin = false }: Props) {
  const [uploading, setUploading] = useState(false)
  const [docs, setDocs] = useState<DocMeta[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchDocs = async () => {
    setLoadingList(true)
    try {
      const res = await fetch('/api/documents/list')
      const data = await res.json()
      if (data.docs) setDocs(data.docs)
    } catch {
      // 무시
    } finally {
      setLoadingList(false)
    }
  }

  // 마운트 시 문서 목록 로드
  useEffect(() => {
    fetchDocs()
  }, [])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        await fetchDocs() // 업로드 후 목록 갱신
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
    <div className="flex items-center gap-2">
      {/* 문서 업로드 — 관리자만 표시 */}
      {isAdmin && (
        <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          📄 {uploading ? '업로드 중...' : '문서 업로드'}
          <input type="file" accept=".pdf,.docx,.doc,.xlsx,.xls" onChange={handleFile} className="hidden" />
        </label>
      )}

      {/* 문서 다운로드 드롭다운 */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          📥 문서 다운로드
          {docs.length > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {docs.length}
            </span>
          )}
        </button>

        {showDropdown && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {loadingList ? (
              <p className="text-xs text-gray-500 p-3 text-center">불러오는 중...</p>
            ) : docs.length === 0 ? (
              <p className="text-xs text-gray-500 p-3 text-center">업로드된 문서가 없습니다</p>
            ) : (
              <ul className="py-1 max-h-60 overflow-y-auto">
                {docs.map((doc) => (
                  <li key={doc.name}>
                    <a
                      href={doc.downloadUrl}
                      download={doc.name}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => setShowDropdown(false)}
                    >
                      <span className="text-base">📄</span>
                      <span className="truncate flex-1">{doc.name}</span>
                      <span className="text-xs text-blue-500 shrink-0">↓</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
