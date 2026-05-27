'use client'
import { useState, useEffect, useCallback } from 'react'

interface Props {
  type: 'db' | 'mail'
  refreshTrigger?: number  // 숫자가 바뀔 때마다 자동 새로고침
}

export default function ExcelViewer({ type, refreshTrigger }: Props) {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/excel/data?type=${type}`)
      const data = await res.json()
      if (data.headers) {
        setHeaders(data.headers)
        setRows(data.rows ?? [])
        setLastUpdated(new Date().toLocaleTimeString('ko-KR'))
      }
    } catch {
      // 무시
    } finally {
      setLoading(false)
    }
  }, [type])

  // 마운트 시 + refreshTrigger 변경 시 새로고침
  useEffect(() => {
    fetchData()
  }, [fetchData, refreshTrigger])

  const title = type === 'db' ? '설계 DB 반출입 현황' : '대용량 메일 반출 현황'

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: '260px' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">📊 {title}</span>
          {lastUpdated && (
            <span className="text-xs text-gray-400">업데이트: {lastUpdated}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              총 {rows.length}건
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-xs text-gray-500 hover:text-gray-800 border border-gray-300 px-2 py-1 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            {loading ? '⟳' : '↺ 새로고침'}
          </button>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className="flex-1 overflow-auto">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            불러오는 중...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            저장된 데이터가 없습니다
          </div>
        ) : (
          <table className="w-full text-xs border-collapse min-w-max">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="bg-gray-100 border border-gray-200 px-3 py-1.5 text-gray-600 font-semibold text-center whitespace-nowrap w-8">
                  No
                </th>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="bg-gray-100 border border-gray-200 px-3 py-1.5 text-gray-600 font-semibold text-center whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={ri % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'}
                >
                  <td className="border border-gray-200 px-3 py-1.5 text-center text-gray-400">
                    {ri + 1}
                  </td>
                  {headers.map((_, ci) => (
                    <td
                      key={ci}
                      className="border border-gray-200 px-3 py-1.5 text-gray-700 whitespace-nowrap max-w-48 overflow-hidden text-ellipsis"
                      title={row[ci] ?? ''}
                    >
                      {row[ci] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
