/**
 * 간단한 마크다운 → HTML 변환기
 * react-markdown 없이 동작 (ESM 호환 이슈 방지)
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderTable(block: string): string {
  const lines = block.trim().split('\n').filter((l) => l.trim())
  if (lines.length < 2) return escapeHtml(block)

  const header = lines[0]
  const body = lines.slice(2) // skip separator line

  const th = header
    .split('|')
    .filter((_, i, arr) => i > 0 && i < arr.length - 1)
    .map((c) => `<th class="border border-gray-300 px-3 py-1 bg-gray-50 font-semibold text-xs">${escapeHtml(c.trim())}</th>`)
    .join('')

  const rows = body
    .map((row) => {
      const tds = row
        .split('|')
        .filter((_, i, arr) => i > 0 && i < arr.length - 1)
        .map((c) => `<td class="border border-gray-300 px-3 py-1 text-xs">${escapeHtml(c.trim())}</td>`)
        .join('')
      return `<tr>${tds}</tr>`
    })
    .join('')

  return `<div class="overflow-x-auto my-2"><table class="border-collapse border border-gray-300 text-sm"><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>`
}

export function renderMarkdown(raw: string): string {
  // 1. AI 내부 action JSON 블록 숨기기 (사용자에게 불필요)
  let text = raw.replace(/```json\s*\{[\s\S]*?\}\s*```/g, '')

  // 2. 코드 블록
  text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
    return `<pre class="bg-gray-100 rounded-lg p-3 overflow-x-auto my-2 text-xs font-mono"><code>${escapeHtml(code.trim())}</code></pre>`
  })

  // 3. 표 (| col | col | 형식)
  const tableRegex = /(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)+)/g
  text = text.replace(tableRegex, (match) => renderTable(match))

  // 4. 헤더
  text = text.replace(/^### (.+)$/gm, '<h3 class="font-semibold text-sm mt-3 mb-1 text-gray-700">$1</h3>')
  text = text.replace(/^## (.+)$/gm, '<h2 class="font-semibold text-base mt-3 mb-1 text-gray-800">$1</h2>')
  text = text.replace(/^# (.+)$/gm, '<h1 class="font-bold text-lg mt-4 mb-1 text-gray-900">$1</h1>')

  // 5. 굵게 / 기울임
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // 6. 인라인 코드
  text = text.replace(/`([^`\n]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')

  // 7. 순서 없는 리스트
  text = text.replace(/^[-*] (.+)$/gm, '<li class="ml-5 list-disc leading-relaxed">$1</li>')
  // 8. 순서 있는 리스트
  text = text.replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal leading-relaxed">$1</li>')

  // 9. 연속 li를 ul/ol로 묶기
  text = text.replace(/(<li class="ml-5 list-disc[^"]*">[^<]*<\/li>\n?)+/g,
    (m) => `<ul class="my-1">${m}</ul>`)
  text = text.replace(/(<li class="ml-5 list-decimal[^"]*">[^<]*<\/li>\n?)+/g,
    (m) => `<ol class="my-1">${m}</ol>`)

  // 10. 링크 [텍스트](url)
  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800">$1 ↗</a>'
  )

  // 11. 수평선
  text = text.replace(/^---+$/gm, '<hr class="my-3 border-gray-200">')

  // 11. 단락 및 줄바꿈
  const blocks = text.split(/\n{2,}/)
  text = blocks
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      // 이미 HTML 태그로 시작하면 감싸지 않음
      if (/^<(h[1-6]|pre|ul|ol|table|div|hr)/.test(trimmed)) return trimmed
      return `<p class="leading-relaxed">${trimmed.replace(/\n/g, '<br>')}</p>`
    })
    .filter(Boolean)
    .join('\n')

  return text
}
