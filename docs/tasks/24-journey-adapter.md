# 24. Journey adapter

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기준 구현의 journey 편집을 옮긴다.

## 산출물과 완료 조건

section/task/score 지원 범위와 보존 fixture를 만족한다.

## 구현 및 검증

- 기준 title, section, task, multi-actor palette를 click/drop으로 연결했다. 생성 task의 점수는 각각 5/3이며 actor 목록은 `Actor` / `User, System`이다. 기존 task·score·actor는 source 편집으로 수정한다. 원본에도 별도 task 직접 조작은 없다.
- `journey-preservation` fixture는 frontmatter/directive/주석, section 순서와 actor 목록을 보존한다. Fixture의 score 0은 pinned parser가 수용하는 기존 원문 보존 사례이며, 생성하는 점수는 문서상 범위 1–5 안의 3/5다. 삽입 결과는 pinned Mermaid의 task 데이터와 대조했다. CRLF/CR/LF 및 마지막 newline 유무를 유지한다.
- 공통 palette adapter가 DOM 생성, click/drop, payload 검사 및 cleanup을 담당하고, source helper가 metadata를 제외한 diagram line 식별과 append를 담당한다.
- 기준 구현과의 의도적 차이: 중복 title 삽입을 거부하고 새 section에는 고유 이름을 부여한다. 미완성 metadata가 있으면 삽입을 거부한다.
- 검증: Node 22.21.0에서 21 files / 253 tests, lint, typecheck 통과. build 및 `git diff --check` 통과.

- `$strict-review`: correctness/security/performance/architecture/naming/test-quality 검토 후 No findings / No structural findings / No test-quality findings. 점수 0의 의미를 기존 원문 보존 사례로 문서에서 명확히 했다. 추가 dependency/ecosystem 후보 없음. 실제 browser/CSP 검증은 task 32 범위다.

## 결과 저장 위치

코드 및 type별 round-trip 테스트/fixture

## 선행 작업

16
