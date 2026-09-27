# 12. source 보존 document model

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

구조화된 영역과 opaque 원문을 연결해 안전한 변경 범위를 계산한다.

## 산출물과 완료 조건

보존 가능한 mutation 기반을 구현하고 불확실한 construct는 편집 제한한다.

## 결과 저장 위치

코드, 테스트, source fixture

## 선행 작업

07, 11

## 구현 및 검증

- 원문을 byte span 기반 region으로 나누고 frontmatter, comment, blank 및 일반 statement를 분류한다. BOM, CRLF와 종료 개행은 대상 밖에서 그대로 유지한다.
- 현재 편집 가능 범위는 flowchart의 단순한 한 줄 node label/shape 교체뿐이다. 반복 문장, opaque 영역, 비 flowchart, identity 변경 및 multiline replacement는 거부한다.
- `$strict-review`: 범위는 `SourceDocument` span scanner/mutation API와 byte-preservation fixtures다. Correctness/security/performance/architecture/naming/test-quality 검토 **No findings / No structural findings / No test-quality findings**. ID 변경, ambiguity 및 비-flowchart mutation을 차단한다. 현재 lifecycle에는 구조 mutation caller가 아직 없으며 adapter 연결은 후속 task에서 다룬다. Dependency 및 ecosystem candidates 없음.
- `npm run lint`, `npm run typecheck`, `npm test` (16 passed), `npm run build`, `npm audit` (0 vulnerabilities) 통과.
