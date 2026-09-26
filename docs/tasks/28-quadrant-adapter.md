# 28. Quadrant adapter

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기준 구현의 quadrant 편집을 옮긴다.

## 산출물과 완료 조건

축, label, point 변경과 metadata 보존 fixture를 만족한다.

## 구현 범위

- 기준 팔레트의 Title, X-axis, Y-axis, Quadrant label, Data point source snippet을 공통 click/drop adapter로 연결한다.
- Title/축/quadrant-1은 중복 삽입을 거부하고, 반복 Data point는 기존 plain/styled label과 겹치지 않게 이름을 만든다.
- 기존 순서와 좌표·classDef·frontmatter·init directive를 유지하면서 append하고, line ending과 마지막 개행 여부도 보존한다.
- Canvas에서 점을 이동하거나 직접 편집하는 동작은 기준 palette 구현에 없다.

## 결과 저장 위치

코드 및 type별 round-trip 테스트/fixture

## 검증

- Node 22.21.0: 전체 29개 테스트 파일, 330개 테스트 통과. lint, typecheck, build 통과.
- Metadata fixture의 frontmatter/init directive, 기존 축/사분면/점/classDef 바이트 보존을 확인하고, 모든 palette 항목과 반복 삽입을 Mermaid parser로 검증했다. CRLF/LF/CR 및 마지막 개행 유무도 확인했다.

## Strict review

- 최종 P/R/T: No findings / No structural findings / No test-quality findings.
- 초기 검토에서 발견한 legacy runtime catalog의 Data point snippet 불일치는 기준 팔레트와 맞추고 parity 회귀 테스트를 추가한 뒤 재검토했다.
- Dependency / Ecosystem candidates: 없음. 새 의존성 없이 공통 palette adapter와 Mermaid parser를 사용한다.
- Candidate risks / residual coverage: palette 방식대로 source snippet만 추가하며 Canvas 점 이동/직접 편집은 제공하지 않는다. 점 label scanner는 표준 inline point와 `:::class:` inline point 문법을 기준으로 중복 이름을 피한다.
- 검토 범위: behavior, security, performance, architecture/naming, test quality, dependency reuse, ecosystem/catalog/registry.

## 선행 작업

16
