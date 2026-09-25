# 22. Gantt adapter

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기준 구현의 Gantt 편집을 옮긴다.

## 산출물과 완료 조건

task, 날짜, dependency 범위와 안전한 보존 fixture를 만족한다.

## 구현 및 검증

- Gantt toolbar는 기준 palette의 title, date format, section, task, after previous, milestone, critical, done, active 도구를 제공하고 click/drag-drop으로 source 끝에 추가한다.
- Source mutation은 Mermaid Gantt header를 확인하고 기존 frontmatter, directive, 주석, section 및 task source를 바이트 단위로 보존한다. CRLF를 유지하며 반복 추가 시 generated task ID를 중복하지 않는다. Existing task ID가 있으면 after-previous item은 해당 ID를 dependency로 사용하고, 없으면 Mermaid의 기본 sequential scheduling에 맡긴다.
- `gantt-preservation` fixture로 metadata, 주석, date format, section, task dependency 보존을 확인하고 추가 item source를 pinned Mermaid parser로 검증한다.
- 검증: `npm test -- --pool=forks --maxWorkers=1` (16 files, 188 tests), `npm run lint`, `npm run typecheck`, `npm run build`, `git diff --check` 통과. Source fixture 및 모든 palette 추가 결과를 pinned Mermaid 11.17.2 parser로 확인했다. Strict-review에서 현재 결함은 발견되지 않았다.

## 결과 저장 위치

코드 및 type별 round-trip 테스트/fixture

## 선행 작업

16
