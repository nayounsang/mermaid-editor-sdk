# 20. State adapter

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기준 구현의 state 편집을 옮긴다.

## 산출물과 완료 조건

상태/전이 범위가 명시되고 전이 참조 보존 fixture를 만족한다.

## 구현 및 검증

- State adapter는 상태 추가·선택·ID 변경·삭제, 상태 연결, 전이 endpoint/label 편집·삭제를 제공한다. 복합 상태 자체의 삭제와 주석/노트 등 opaque 구문 안에 ID가 등장하는 변경은 차단한다.
- `state-preservation` fixture에서 frontmatter, comment, 복합 상태, nested transition 및 note를 보존하면서 단일 상태 ID와 중복 전이 occurrence 하나를 수정한다. CRLF 유지와 모호한 변경 거부를 테스트한다.
- `$strict-review`: note-block occurrence, legacy Mermaid state SVG selector, 반복 source line scan, RGB style parsing, 구두점으로 끝나는 ID 참조, 반복 ID 정렬/범위 검색, note connector 경로 오인, Unicode 상태 ID, Mermaid parser가 거부하는 하이픈 endpoint, 반복 상태 선언 rename finding을 수정했다. Mermaid note connector는 transition selection index에서 제외하고 legacy 및 stateDiagram-v2 렌더 SVG로 확인한다. Mermaid가 허용하는 ID 토큰 범위를 source scanner에 반영하고 상태 ID 노드 매핑은 Set 조회로 수행한다. 반복 선언은 F12에 따라 rename에서도 모호한 변경으로 차단한다. 마지막 검토에서 confirmed code/test finding은 없었다. Mermaid SVG selector와 transition path 순서는 공개 RenderResult 계약이 보장하지 않아 버전 업그레이드 시 pinned-render 테스트를 유지할 호환성 후보로 기록한다.
- 검증: `npm test -- --pool=forks --maxWorkers=1` (11 files, 155 tests), `npm run lint`, `npm run typecheck`, `npm run build`, `git diff --check` 통과. Preservation fixture와 note 안의 전이 형태 문장을 포함한 source를 pinned Mermaid parser로 확인한다. Adapter 테스트는 pinned Mermaid 렌더 SVG의 legacy/v2 상태 노드, 중복 전이 경로, 앞선 note connector 이후 전이 편집, Unicode 상태와 전이 선택, parser가 거부하는 endpoint 차단을 확인한다. Mutation 테스트는 parser가 허용하는 중복 선언 rename 차단을 확인한다.

## 결과 저장 위치

코드 및 type별 round-trip 테스트/fixture

## 선행 작업

16
