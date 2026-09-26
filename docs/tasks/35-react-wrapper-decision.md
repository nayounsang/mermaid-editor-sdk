# 35. React 전환 사전 설계

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

현재 SDK의 구조와 공개 계약을 조사해 Mermaid source와 editable diagram model을 연결하는 session, diagram별 CRUD adapter 및 React UI 구조를 설계한다. 이번 task는 문서 설계만 수행하며 React 구현은 포함하지 않는다.

## 산출물과 완료 조건

현재 코드 및 기준 구현을 가리키는 참조 링크를 포함한 React 구조 설계 문서를 작성한다. 문서에는 현재 모듈 구조, 제안하는 React integration 구조와 각 모듈의 책임, package/build 특성, 전환 단계, 기술적 위험 및 설계 결정을 기록한다.

## 결과 저장 위치

문서: [docs/react-design.md](../react-design.md)

## 선행 작업

13

## 결정 요약

- `MermaidCodeBlock`과 Node/Edge 기반 `RendererModel`을 양방향으로 연결하는 `DiagramSession`, CRUD adapter, React UI 구조를 설계했다.
- React runtime은 optional `./react` entry로 분리하고 기존 imperative entry를 호환 경로로 유지한다.
- upstream 단일 HTML 및 Extension host 기능과 현재 SDK package 경계의 차이를 `docs/react-design.md`에 기록했다.
- 이 task는 문서 설계만 완료했다. React component, package export 및 build 변경은 구현하지 않았다.
