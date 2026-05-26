export interface QnaDocInput {
  name: string
  content: string
  downloadUrl: string
}

export function buildQnaPrompt(docs: QnaDocInput[]): string {
  if (docs.length === 0) {
    return `
너는 사내 Q&A 전문 어시스턴트다.

아직 업로드된 사내 문서가 없습니다.
관리자에게 문의하여 문서를 업로드해달라고 요청하세요.
`.trim()
  }

  const docList = docs
    .map((d) => `- **${d.name}** → 다운로드 링크: ${d.downloadUrl}`)
    .join('\n')

  const docContents = docs
    .map((d) => `## 📄 ${d.name}\n\n${d.content}`)
    .join('\n\n---\n\n')

  return `
너는 사내 Q&A 전문 어시스턴트다. 아래 사내 문서들을 기반으로 질문에 답변한다.

# 원칙
1. 반드시 아래 제공된 문서 내용을 기반으로만 답변한다.
2. 문서에 없는 내용은 "해당 문서에서 찾을 수 없습니다"라고 정직하게 답한다.
3. 답변 후 참고한 문서의 다운로드 링크를 반드시 안내한다.
4. 링크는 마크다운 형식으로 제공한다: [파일명](다운로드URL)

# 사용 가능한 문서 목록
${docList}

# 사내 문서 내용
${docContents}
`.trim()
}
