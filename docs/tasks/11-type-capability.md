# 11. diagram capability 분류

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

렌더 가능성, parse 오류, GUI 편집 지원을 분리 판정한다.

## 산출물과 완료 조건

미지원 diagram을 오류로 취급하지 않는 내부 capability 모델을 구현한다.

## 결과 저장 위치

코드 및 테스트

## 선행 작업

07, 09, 10

## 구현 및 검증

- Mermaid `detectType()` 결과를 12개 조사 유형에 연결하고, 새/미지원 유형과 빈 입력은 각각 `unsupported`와 `unknown`으로 분류한다.
- parse, preview, editor capability 상태를 별도 값으로 관리한다. GUI adapter가 아직 없는 SDK에서는 source editing을 유지한다.
- `$strict-review`: 범위는 capability model, pinned Mermaid `detectType()` boundary 및 `create-editor.ts` caller다. detector mapping assertion을 실제 pinned API 결과로 보강한 뒤 correctness/security/performance/architecture/naming/test-quality 검토에서 **No findings / No structural findings / No test-quality findings**. Dependency 및 ecosystem candidates 없음. Mermaid renderer/browser CSP 자체는 task 32에서 검증한다.
- `npm run lint`, `npm run typecheck`, `npm test` (16 passed), `npm run build`, `npm audit` (0 vulnerabilities) 통과.
