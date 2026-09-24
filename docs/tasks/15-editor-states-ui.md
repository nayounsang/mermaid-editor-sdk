# 15. source 편집과 상태 UI

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

source 편집, preview, parse 오류와 GUI 미지원 상태를 연결한다.

## 산출물과 완료 조건

모든 diagram에서 source를 보고 수정할 수 있고 상태 차이를 표시한다.

## 결과 저장 위치

코드 및 테스트

## 선행 작업

11, 12, 13

## 구현 및 검증

- 모든 diagram에서 source textarea를 유지하고, parse 오류 및 render 오류에서도 source 수정이 가능하다. preview에는 `aria-busy`를 반영한다.
- 상태 UI는 parse/render 오류를 구분하고, 정상 렌더된 known type의 source-only 상태, 지원하지 않는 diagram, detector가 식별하지 못한 diagram을 별도 `data-state`와 안내문으로 표시한다.
- `$strict-review`: 최초 performance pass에서 입력마다 동일한 live status/`aria-busy` DOM 값을 다시 쓰는 저영향 candidate를 확인했다. 상태 setter를 idempotent하게 만들고 burst-input MutationObserver 회귀 검증을 추가했다. 최종 correctness/security/performance 및 구조·의미·test-quality 검토에서 findings 없음.
- `npm run lint`, `npm run typecheck`, `npm test` (21 passed), `npm run build` 통과.
