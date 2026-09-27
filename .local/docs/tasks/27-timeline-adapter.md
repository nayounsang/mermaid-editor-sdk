# 27. Timeline adapter

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기준 구현의 timeline 편집을 옮긴다.

## 산출물과 완료 조건

period/event 순서 및 multiline 범위의 fixture를 만족한다.

## 구현 범위

- 기준 팔레트의 Title, Section, Event 3개 source snippet을 공통 click/drop adapter로 연결한다.
- 중복 title은 source에서 직접 고치도록 거부하고, 반복 section은 고유한 `Era name`을 만든다. Event는 기존 period 행의 들여쓰기를 사용하고, 이벤트가 아직 없으면 마지막 section 아래에 추가한다.
- multiline event continuation과 기존 section/period 순서를 보존하는 fixture를 추가한다. Mermaid DB의 event order 및 section도 확인한다.
- Timeline canvas 구조 직접 편집은 기준 구현에 없다.

## 결과 저장 위치

코드 및 type별 round-trip 테스트/fixture

## 검증

- Node 22.21.0: 전체 27개 테스트 파일, 310개 테스트 통과. lint, typecheck, build 통과.
- Timeline multiline fixture의 바이트 보존과 Mermaid DB의 section, period, event 순서를 확인했다. CRLF/LF/CR, 마지막 개행 유무도 검증했다.

## Strict review

- 최종 P/R/T: No findings / No structural findings / No test-quality findings.
- Dependency / Ecosystem candidates: 없음. 새 의존성 없이 공통 palette adapter factory를 사용한다.
- Candidate risks / residual coverage: Mermaid DB는 multiline description continuation을 별도 event로 노출하지 않으므로 fixture의 바이트 비교와 event ordering 검증을 함께 사용한다. 공통 drop/lifecycle은 기존 adapter 테스트에서 확인한다.
- 검토 범위: behavior, security, performance, architecture/naming, test quality, dependency reuse, ecosystem/catalog/registry.

## 선행 작업

16
