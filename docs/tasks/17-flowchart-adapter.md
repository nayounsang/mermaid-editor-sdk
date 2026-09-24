# 17. Flowchart adapter

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기준 구현의 flowchart GUI 흐름을 옮긴다.

## 산출물과 완료 조건

지원표 동작, ID 참조 보존, round-trip/mutation fixture를 만족한다.

## 구현 범위

- Flowchart 노드 8개 shape와 subgraph 추가, 노드/edge/subgraph 선택 및 편집·삭제를 지원한다.
- 노드 `+`와 노드 간 Shift-click/drag 연결, edge 재연결·label·line·stroke 편집을 지원한다.
- source mutation은 원문 span만 바꾸며 ID 참조, parallel edge의 선택 occurrence, 줄바꿈, BOM, 주석 및 마지막 줄바꿈을 보존한다.
- 중복 정의, opaque `click` 참조, 다중 endpoint 또는 edge 번호를 나눠 쓰는 `linkStyle` 등 안전한 위치를 증명할 수 없는 변경은 거부하거나 해당 edge GUI를 제한한다.

## 검증

- 노드 `+` root overlay에서 Process box, Rounded, Circle, Decision shape를 선택하며 Enter/Space 입력을 지원한다.
- 8개 node palette, 4개 connector 도구의 drag/drop, connector 지정 연결, 중첩 subgraph 삽입을 지원한다.
- subgraph 내부 mutation은 가장 안쪽 `end` 앞에 삽입하고, BOM, CRLF, 주석 및 마지막 개행 정책을 보존한다. 빈 값과 잘못된 fill/stroke 색상은 mutation error로 거부한다.
- `npm test -- --pool=forks --maxWorkers=1`: 5개 파일, 72개 테스트 통과
- `npm run lint`, `npm run typecheck`, `npm run build`: 통과
- `$strict-review`: 동작, 보안, 성능, 구조, 용어, 테스트 품질, dependency 및 Mermaid 생태계 관점 검토 완료

## 잔여 검증

Mermaid 11.17.2가 반환하는 실제 SVG의 내부 node/edge/cluster selector와 browser hit-testing, `getBBox` 위치는 공개 API 계약이 아니다. 현재 환경에서 실브라우저 검증을 할 수 없어 task 32의 CSP/browser 검증에서 확인한다. jsdom adapter 테스트와 pinned Mermaid parser round-trip은 통과했다.

## 결과 저장 위치

코드 및 type별 round-trip 테스트/fixture

## 선행 작업

16
