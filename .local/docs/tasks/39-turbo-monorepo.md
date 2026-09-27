# 39. Turbo monorepo migration

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

React Mermaid editor SDK를 Turbo workspace로 구성하고, full UI SDK와 조합 가능한 UI exports를 `package/ui`, React·DOM에 의존하지 않는 editor logic을 `package/headless`, HMR 개발 consumer를 `app/example`에 둔다. 상세 설계, 참조 사례, 거시적 진행 순서와 완료 기준은 [Turbo 모노레포 전환 설계](../monorepo-design.md)가 기준이다.

## 선행 작업

- [x] Tiptap, Lexical, BlockNote, Plate, tldraw, React Flow의 공식 문서를 비교해 UI/headless/editor API 구조를 설계에 반영했다.
- [x] 현재 React SDK의 session/source/UI/build 경계를 설계 문서에 매핑했다.
- [x] Workspace package graph, task graph, package manager와 HMR 경로를 정했다.

## 완료 조건

- `app/example`, `package/ui`, `package/headless`가 workspace package/app으로 분리되어 있다.
- root Turbo task graph가 build/typecheck/lint/test 순서와 build outputs cache를 관리하고 dev server를 persistent uncached task로 제공한다.
- `@mermaid-editor/headless`는 logic/session public exports와 declarations를 제공하고 React/DOM/UI/CSS runtime dependency가 없다.
- `mermaid-visual-editor-sdk`는 full SDK와 Provider/hooks, toolbar, source editor, diagram renderer 및 component subpaths를 public API로 제공한다.
- example은 UI package의 public specifier를 사용하고 browser HMR로 package TS/TSX 변경을 반영한다.
- 기존 imperative/browser exports, Mermaid diagram 지원, source fidelity, history와 third-party license notice를 migration 후에도 유지한다.
- CI/development/consumer 문서는 pnpm/Turbo 및 새 package exports를 안내한다.
- 설치, build, typecheck, existing tests, app HMR, package exports, headless dependency isolation, license/distribution 검증이 완료된다.

## 현재 진행

- `.local/docs/monorepo-design.md`에 broad React SDK research, package responsibilities, dependency direction, API entrypoints, package manager choice, high-level procedure와 완료 증거를 기록했다.
- `app/example`, `package/ui`, `package/headless`로 workspace를 분리하고 Turbo task graph와 pnpm lockfile을 구성했다.
- public UI/headless CJS exports smoke check, frozen install, build, typecheck, lint, 전체 335개 test, 브라우저 HMR 및 배포 license audit를 확인했다.
- HMR은 `EditorShell` source의 임시 문구 변경이 브라우저에 새로고침 없이 반영되는 것을 확인한 뒤 원복했다.
