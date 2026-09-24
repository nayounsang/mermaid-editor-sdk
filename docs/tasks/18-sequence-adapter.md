# 18. Sequence adapter

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기준 구현의 sequence 편집을 옮긴다.

## 산출물과 완료 조건

지원 동작과 참가자/메시지 참조 보존 fixture를 만족한다.

## 결과 저장 위치

코드 및 type별 round-trip 테스트/fixture

## 선행 작업

16

## 진행 메모

- 참가자, actor, message, note 및 block palette를 adapter로 옮긴다. 기존 참가자 선언이 있으면 새 message/note template이 선언 ID를 참조하고, 기존 source는 끝에 추가하는 방식으로 보존한다.
- 원본 Sequence message connector palette가 graph handler에 연결되지 않아 실제 삽입을 수행하지 못하는 차이를 확인했다. SDK는 메시지 도구를 click/drag source insertion으로 제공한다. `docs/task.md`의 예정 작업에는 Sequence 메시지 편집을 이어받는 후속 작업이 없으므로 자연히 해소될 차이는 아니다. 현재 18번의 의도적 개선으로 유지하며 완료 보고에 검토 항목으로 명시한다.
- 메시지 삽입은 명시적 선언뿐 아니라 기존 메시지에서 참조된 암시적 participant ID도 재사용한다. 따라서 `sequenceDiagram\nAlice->>Bob: ...`에 `A`/`B`를 새로 도입하지 않는다.
- parser 후보 추가 조사: [`@crafter/mermaid-parser@0.0.4`](https://www.npmjs.com/package/%40crafter/mermaid-parser)는 Sequence AST를 내지만 line-by-line 구현이며 공개된 화살표 인식은 `->>`, `-->>`, `-)`, `-x` 중심이다. package metadata에 license 필드가 없고, 전체 Mermaid 호환성 및 원문 보존을 확인할 근거가 부족하다. [`@polagram/core@0.4.2`](https://www.npmjs.com/package/%40polagram/core)는 Sequence AST 변환과 Mermaid 생성이 목적이며 node source span/raw text 보존 API가 없다. 두 후보 모두 이번 source-preserving insertion 경로에는 채택하지 않는다.
- 참가자 탐색은 기준 의존성 Mermaid 11.17.2의 표준/bidirectional/half-arrow, central-connection 메시지를 인식하고 주석 줄은 건너뛴다. 20 KB 비메시지 줄에 대한 회귀 케이스도 포함한다. 문법 기준: [Mermaid sequence diagram arrows](https://mermaid.js.org/syntax/sequenceDiagram#messages), [central connections](https://mermaid.js.org/syntax/sequenceDiagram#central-connections-v11123).
- round-trip fixture와 palette click/drag insertion 및 cleanup 검증을 추가했다. 전체 테스트, lint, typecheck, build, strict-review를 통과했다.
