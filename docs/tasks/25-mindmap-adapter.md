# 25. Mindmap adapter

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기준 구현의 mindmap 편집을 옮긴다.

## 산출물과 완료 조건

중첩 구조와 노드 모양의 범위, nesting fixture를 만족한다.

## 구현 및 검증

- 기준 palette의 Root (circle), Branch, Square node, Rounded, Cloud를 공통 click/drop adapter로 연결했다.
- 빈 source에서는 첫 노드를 root로 만든다. 기존 tree에서는 source의 root/최소 자식 들여쓰기를 확인하여 새 노드를 root의 자식으로 추가한다. `mindmap-nesting` fixture는 3개 기존 branch와 그 자손을 byte-for-byte 및 Mermaid tree 데이터로 보존한다.
- Root (circle) 항목을 기존 tree에 추가하면 새 root 대신 고유 ID의 원형 자식이 된다. 원본의 palette 삽입 의미를 유지하면서 임의의 root 들여쓰기에도 단일 root 규칙을 지키도록 한 차이다.
- 노드 모양, 한 칸 들여쓰기, multiline label, header와 같은 줄의 root, CRLF/마지막 newline, 문자 `%` 및 `accTitle`이 들어간 일반 노드를 검증한다. Mindmap과 Journey의 주석/접근성 문법 차이를 공통 scanner 옵션으로 구분했다.
- 기존 source는 재직렬화하지 않는다. 불완전하거나 모호한 metadata 블록은 삽입을 거부한다. 원본처럼 별도의 tree 선택/재부모화 GUI는 제공하지 않는다.

- 검증: Node 22.21.0에서 23 files / 271 tests, lint, typecheck, build 통과. ID 검색 최적화 후 Mindmap 15개 테스트도 통과했다.

## Strict review

- P/R/T: No findings / No structural findings / No test-quality findings.
- Dependency / Ecosystem candidates: 없음. Candidate risks: 확인된 구체적 위험 없음.
- 행동·보안·성능·구조·명명 및 테스트/의존성/통합 검토를 완료했다. 공통 factory의 drop/lifecycle은 Journey 테스트로 검증하며 Mindmap 전용 drop 및 혼합 tab/space 조합은 잔여 커버리지다.

## 결과 저장 위치

코드 및 type별 round-trip 테스트/fixture

## 선행 작업

16
