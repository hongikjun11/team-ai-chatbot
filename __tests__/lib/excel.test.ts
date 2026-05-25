import { createEmptyDbWorkbook, findLastDataRow, appendRowToSheet, serializeWorkbook } from '@/lib/excel'

describe('excel lib', () => {
  it('creates empty db workbook with correct headers', async () => {
    const wb = createEmptyDbWorkbook()
    const ws = wb.getWorksheet(1)!
    expect(ws.getCell('A1').value).toBe('신청일자')
    expect(ws.getCell('B1').value).toBe('신청자')
  })

  it('findLastDataRow returns 1 for header-only sheet', async () => {
    const wb = createEmptyDbWorkbook()
    const ws = wb.getWorksheet(1)!
    const last = findLastDataRow(ws, 8)
    expect(last).toBe(1)
  })

  it('appendRowToSheet adds row after last data row', async () => {
    const wb = createEmptyDbWorkbook()
    const ws = wb.getWorksheet(1)!
    const data = ['2026.05.22', '홍익준', 'O', '', 'test.db', '설계팀', '개발팀', '홍익준']
    appendRowToSheet(ws, data, 8)
    const last = findLastDataRow(ws, 8)
    expect(last).toBe(2)
    expect(ws.getCell('A2').value).toBe('2026.05.22')
  })

  it('serializeWorkbook returns Buffer', async () => {
    const wb = createEmptyDbWorkbook()
    const buf = await serializeWorkbook(wb)
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(0)
  })
})
