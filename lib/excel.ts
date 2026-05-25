import ExcelJS from 'exceljs'

const DB_HEADERS = ['신청일자', '신청자', '반입', '반출', '파일명', '용도(DB 출발지)', '반입반출 대상(DB 도착지)', '보안담당자 확인']
const MAIL_HEADERS = ['신청일자', '신청자', '부서', '반출', '파일명', '용도', '보안담당자 확인', '비고']

export function createEmptyDbWorkbook(): ExcelJS.Workbook {
  return createWorkbookWithHeaders(DB_HEADERS)
}

export function createEmptyMailWorkbook(): ExcelJS.Workbook {
  return createWorkbookWithHeaders(MAIL_HEADERS)
}

function createWorkbookWithHeaders(headers: string[]): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Sheet1')
  headers.forEach((h, i) => {
    ws.getCell(1, i + 1).value = h
  })
  return wb
}

export function findLastDataRow(ws: ExcelJS.Worksheet, colCount: number): number {
  let lastRow = 0
  ws.eachRow((row, rowNumber) => {
    const values = Array.from({ length: colCount }, (_, i) => row.getCell(i + 1).value)
    if (values.some((v) => v !== null && v !== '')) {
      lastRow = rowNumber
    }
  })
  return lastRow
}

export function appendRowToSheet(
  ws: ExcelJS.Worksheet,
  data: (string | null)[],
  colCount: number
): number {
  const lastRow = findLastDataRow(ws, colCount)
  const targetRow = lastRow + 1
  data.forEach((value, i) => {
    ws.getCell(targetRow, i + 1).value = value ?? ''
  })
  return targetRow
}

export async function serializeWorkbook(wb: ExcelJS.Workbook): Promise<Buffer> {
  const arrayBuffer = await wb.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}

export async function loadWorkbookFromBuffer(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  return wb
}

export function verifyLastRow(
  ws: ExcelJS.Worksheet,
  expectedRow: number,
  colCount: number
): boolean {
  const actual = findLastDataRow(ws, colCount)
  return actual >= expectedRow
}
