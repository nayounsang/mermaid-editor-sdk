# 13. runtime lifecycle API

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

container 생성, getValue, destroy 등 editor runtime 핵심을 구현한다.

## 산출물과 완료 조건

createMermaidVisualEditor의 기본 생명주기 동작을 제공한다.

## 결과 저장 위치

코드 및 테스트

## 선행 작업

06, 09, 11, 12

## 구현 및 검증

- `createMermaidVisualEditor`가 container/options를 DOM 변경 전에 검증하고 SDK-owned root만 mount한다. 초기값, sync `getValue`, 무반향 `setValue`, idempotent `destroy`, `DestroyedEditorError` 규칙을 구현했다.
- source input은 `onChange`를 동기 호출하며 Mermaid preview는 120 ms debounce, stale revision guard로 비동기 렌더를 조정한다. parse 오류, 렌더 오류, 지원되지 않는 diagram 상태를 구분한다.
- textarea 입력에서 source의 CRLF/LF style을 보존한다. destroy 후 pending render timer/listener/root를 정리하며 host DOM 자식은 유지한다.
- `$strict-review`: 범위는 public `createMermaidVisualEditor`, DOM/source/renderer lifecycle, Mermaid async boundary와 lifecycle tests다. 최초 검토의 textarea newline normalization 문제 및 mock detector coverage를 수정한 뒤 correctness/security/performance/architecture/naming/test-quality 검토 **No P/R findings / No structural findings / No test-quality findings**. Dependency 및 ecosystem candidates 없음. consumer CSP/browser matrix는 task 32에 남긴다.
- `npm run lint`, `npm run typecheck`, `npm test` (16 passed), `npm run build`, `npm audit` (0 vulnerabilities), ESM/CJS import 및 IIFE global export 확인.
