# 23. Pie adapter

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기준 구현의 pie 편집을 옮긴다.

## 산출물과 완료 조건

label quoting, 값 수정과 round-trip fixture를 만족한다.

## 구현 및 검증

- Pie adapter는 기준 palette의 title/slice 도구를 click 및 drag-drop으로 source에 추가한다. 중복 title 추가는 거부한다.
- Source mutation은 frontmatter, 지시문, 주석, 기존 slice와 줄바꿈을 보존한다. 접근성 설명과 multiline directive는 opaque 영역으로 건너뛰고, quoted/multiline label과 숫자 span만 수정한다. Slice label이 유일하고 숫자가 유효할 때만 변경한다.
- `pie-preservation` fixture는 label 변경, 값 수정 및 slice 추가 후 pinned Mermaid parser round-trip을 확인한다.
- 검증: Node 22.21.0 기준 `npm test -- --pool=forks --maxWorkers=1` (19 files, 233 tests), `npm run lint`, `npm run typecheck`, `npm run build`, `git diff --check` 통과.
- `$strict-review`: 최초 검토에서 접근성 설명을 slice로 오인하는 문제, 반복 삽입 label 충돌 및 palette CSS 누락을 확인하고 반영했다. 회귀 사례는 실제 Mermaid DB의 section/값과 원문 보존을 함께 검사한다. 수정 후 재검토: No findings / No structural findings / No test-quality findings. Security/performance/architecture/naming 검토에서 추가 결함 없음.
- Dependency 후보: 설치된 `@mermaid-js/parser`의 Pie AST를 검토했다. 현재 동기 mutation 계약과 원문 span 보존 때문에 직접 의존성으로 추가하지 않았다. 신규 ecosystem 의존성은 필요하지 않다. Browser/CSP 검증은 task 32에 남는다.
- 기준 구현 대조: title/slice click·drop 및 source 편집 범위를 이식했다. chart slice 직접 조작은 원본에도 없다. 반복 추가가 렌더에 반영되도록 고유 label을 생성하고, 중복 title 추가를 제한하는 것은 source 안전성을 위한 의도적 차이다.

## 결과 저장 위치

코드 및 type별 round-trip 테스트/fixture

## 선행 작업

16
