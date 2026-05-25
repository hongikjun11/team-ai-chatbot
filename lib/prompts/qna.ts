export function buildQnaPrompt(documentContents: string[]): string {
  const docsText = documentContents.length > 0
    ? documentContents.join('\n\n---\n\n')
    : '(업로드된 문서 없음)'

  return `
너는 사내 Q&A 전문 어시스턴트다. 아래 사내 문서들을 기반으로 질문에 답변한다.

# 원칙
1. 반드시 아래 제공된 문서 내용을 기반으로만 답변한다.
2. 문서에 없는 내용은 "해당 문서에서 찾을 수 없습니다"라고 답한다.
3. 출처 문서를 가능한 한 언급한다.

# 사내 문서 내용
${docsText}
`.trim()
}
