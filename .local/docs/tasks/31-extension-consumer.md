# 31. Extension consumer 전환

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기존 Extension의 editor 실행부를 SDK로 바꾸고 block 탐색/저장을 host에 둔다.

## 산출물과 완료 조건

SDK runtime에서 VSCode API, postMessage, selector host 계약을 제거한다.

## 결과 저장 위치

코드 및 통합 테스트

## 선행 작업

13–16, 29

## 구현 및 검증

- SDK public entry로 editor를 생성하는 consumer 통합 테스트를 추가했다. Host가 Markdown의 Mermaid block을 찾아 문자열 하나를 전달하고, SDK의 Save callback에서 현재 source를 받아 block만 교체한다. 주변 Markdown은 보존된다.
- host가 선택한 다른 block 값을 `setValue()`로 전달할 때 화면은 동기화되고 `onChange` echo는 발생하지 않는다.
- `src/runtime`, diagram adapter 및 source mutation 코드에 VS Code API, `postMessage`, Markdown block 탐색, Webview host selector 계약이 없는 것을 확인했다. 저장 callback은 host가 저장 동작을 소유하도록 유지한다.
- `npx vitest run src/runtime/extension-consumer.integration.test.ts` 통과 (2 tests).
- 기존 Extension의 block 탐색과 파일 저장은 SDK로 옮기지 않는다. 결정 근거는 [host bridge 조사](../research/host-bridge.md)와 [SDK 설계](../mermaid-editor-sdk/DESIGN.md)의 host 경계다.
