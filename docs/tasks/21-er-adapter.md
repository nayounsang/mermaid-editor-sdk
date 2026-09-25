# 21. ER adapter

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기준 구현의 ER 편집을 옮긴다.

## 산출물과 완료 조건

entity, attribute, cardinality 범위와 보존 fixture를 만족한다.

## 구현 및 검증

- ER adapter는 entity 추가·선택·ID 변경·삭제, attribute 추가·수정·삭제, identifying/non-identifying 관계 연결, endpoint/cardinality/label 편집·삭제와 fill/stroke 설정을 제공한다.
- `er-preservation` fixture에서 frontmatter, 주석, 방향, PK/FK/UK marker, attribute comment, 식별/비식별 관계와 entity 순서를 유지하면서 attribute 한 줄과 관계 한 건만 변경한다. Unicode/인용 entity ID, 중복 관계 occurrence, CRLF source를 mutation 범위에서 처리한다.
- Mermaid 문법 alias cardinality는 entity 목록에는 반영하되 relationship mutation 경로에서는 제외해 source reference를 변경하지 않는다. 그런 alias 관계가 섞인 SVG에서는 source 행과 path 간 안전한 일대일 매핑을 보장할 수 없으므로 관계 선택도 비활성화한다. GUI 관계 편집은 기준 UI가 제공한 다섯 cardinality marker 형태를 대상으로 한다.
- 검증: `npm test -- --pool=forks --maxWorkers=1` (14 files, 180 tests), `npm run lint`, `npm run typecheck`, `npm run build`, `git diff --check` 통과. Source fixture 및 mutation 전후를 pinned Mermaid 11.17.2 parser로 확인하고, adapter 테스트는 pinned SVG에서 entity/relationship 선택 및 편집, alias cardinality 혼합 시 안전한 관계 선택 차단, adapter runtime registration을 확인한다. 다섯 canonical cardinality form, 새 관계 controls, CRLF additions/updates/deletions도 확인한다. Review 결과 현재 결함은 없으며, SVG selector와 관계 path 순서는 Mermaid 공개 RenderResult contract가 보장하지 않으므로 Mermaid 업그레이드 시 pinned-render 확인이 필요하다.

## 결과 저장 위치

코드 및 type별 round-trip 테스트/fixture

## 선행 작업

16
