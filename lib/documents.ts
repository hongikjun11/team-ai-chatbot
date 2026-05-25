import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import ExcelJS from 'exceljs'

export async function extractTextFromBuffer(buffer: Buffer, ext: string): Promise<string> {
  const e = ext.toLowerCase().replace('.', '')

  if (e === 'pdf') {
    const data = await pdfParse(buffer)
    return data.text
  }

  if (e === 'docx' || e === 'doc') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (e === 'xlsx' || e === 'xls') {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)
    const lines: string[] = []
    wb.eachSheet((ws) => {
      ws.eachRow((row) => {
        const vals = (row.values as (string | null | undefined)[])
          .slice(1)
          .map((v) => String(v ?? ''))
          .filter(Boolean)
        if (vals.length > 0) lines.push(vals.join('\t'))
      })
    })
    return lines.join('\n')
  }

  // 기타: 텍스트로 처리
  return buffer.toString('utf-8')
}

export async function extractTextFromUrl(url: string): Promise<string> {
  const res = await fetch(url)
  const buffer = Buffer.from(await res.arrayBuffer())
  const ext = url.split('.').pop() ?? 'txt'
  return extractTextFromBuffer(buffer, ext)
}
