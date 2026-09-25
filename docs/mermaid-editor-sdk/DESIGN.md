# Mermaid Visual Editor SDK 추출 설계

## 프로젝트 목적

웹 애플리케이션 개발자가 Mermaid 편집기를 직접 만들지 않고도 자신의 제품 안에 시각 편집을 embed할 수 있게 한다. 다이어그램을 보는 사람은 source를 처음부터 작성하지 않아도 GUI로 구조를 이해하고 수정할 수 있고, host는 결과를 Mermaid 문자열로 받아 기존 텍스트 기반 workflow에 연결한다.

SDK는 Mermaid를 이미지로 바꾸는 renderer에 그치지 않는다. GUI 편집과 Mermaid source 사이를 오가게 하되, host의 문서 모델·저장 방식·프레임워크에는 종속되지 않는 재사용 가능한 editor runtime을 제공한다.

## 1. 목표와 기준

목표는 기존 VSCode Extension을 일반화하는 것이 아니라, Mermaid 문자열 하나를 브라우저에서 보고 편집하는 기능을 SDK로 추출하는 것이다. SDK는 Mermaid source를 입력받아 GUI 편집을 제공하고, 편집된 source를 host에 돌려준다.

기준 프로젝트:

- Repository: <https://github.com/NextGenPowerToys/mermaid-visual-editor>
- 기준 브랜치: `main`
- 분석 기준 커밋: `8f9bbc90f9f33a13cb5e2eda44100856795c4c01` (`Release v2.5.0`)
- 라이선스: MIT. 배포 전 Mermaid 등 번들된 third-party 고지를 포함물 기준으로 확인한다.

기준 커밋의 주요 파일은 [`extension.js`](https://github.com/NextGenPowerToys/mermaid-visual-editor/blob/8f9bbc90f9f33a13cb5e2eda44100856795c4c01/vscode-extension/extension.js), [`mermaid-editor.html`](https://github.com/NextGenPowerToys/mermaid-visual-editor/blob/8f9bbc90f9f33a13cb5e2eda44100856795c4c01/vscode-extension/media/mermaid-editor.html), [`package.json`](https://github.com/NextGenPowerToys/mermaid-visual-editor/blob/8f9bbc90f9f33a13cb5e2eda44100856795c4c01/vscode-extension/package.json), `LICENSE`, `THIRD-PARTY-LICENSES`다.

## 2. 범위 결정

MVP 계약은 다음과 같다.

- SDK 인스턴스 하나는 Mermaid 문자열 하나를 편집한다. 한 문자열 안의 subgraph는 같은 다이어그램의 일부다.
- Markdown 안의 여러 Mermaid block을 찾아 탭으로 보여주는 multi-sheet 동작은 포함하지 않는다. block 탐색과 선택은 host 책임이다.
- 원본 README에 기재된 다이어그램 유형을 GUI 편집 지원 대상으로 유지한다: flowchart, sequence, class, state, ER, gantt, pie, journey, mindmap, gitgraph, timeline, quadrant.
- Mermaid renderer가 출력할 수 있는 유형과 GUI에서 구조를 편집할 수 있는 유형은 구분한다. GUI 편집 미지원 유형은 렌더 미리보기와 원문 코드로 제공하며, 노드·간선 단위의 GUI 편집을 가장하지 않는다.
- Mermaid frontmatter, 설정, 주석 및 GUI 모델이 직접 다루지 않는 원문은 GUI 편집 후에도 보존한다.
- SDK는 Markdown parsing, VSCode API, file I/O 및 저장을 수행하지 않는다.

예를 들어 기준 번들에는 Mermaid 11.15.0이 포함되어 있고 Mermaid의 `architecture-beta` 문법은 11.1.0부터 제공되지만, 기준 에디터 README의 GUI 지원 목록에는 architecture diagram이 없다. 이런 경우에는 Mermaid 렌더 미리보기와 source를 제공하고 GUI 구조 편집은 비활성화한다. Mermaid의 [Architecture 문법 문서](https://mermaid.js.org/syntax/architecture) 및 기준 버전의 [에디터 README](https://github.com/NextGenPowerToys/mermaid-visual-editor/blob/8f9bbc90f9f33a13cb5e2eda44100856795c4c01/vscode-extension/README.md)를 참고한다.

## 3. 기준 구현 구조와 확인 사항

기준 구현은 모듈화된 TypeScript/JavaScript 앱이 아니라 `vscode-extension/media/mermaid-editor.html`에 UI, 편집 코드, Mermaid 11.15.0 번들을 넣은 self-contained HTML이다. Extension이 이 파일을 읽고 `buildEditorHtml()`에서 CSP, 초기값, 옵션 및 host bridge 코드를 주입해 Webview에 전달한다.

기준 구현은 source 탐색을 `getDiagramInfo()`가 아니라 `extractMermaidBlocks()`에서 수행한다. `.mmd`와 `.mermaid` 파일은 전체 내용을 다이어그램 source로 취급하고, Markdown에서는 backtick/tilde fenced block과 `::: mermaid` 형식을 찾는다. 이 탐색은 Extension 책임이므로 SDK로 옮기지 않는다.

주입되는 bridge에는 VSCode 메시지 전달 외에 편집기 동작도 섞여 있다. 예를 들어 sheet UI와 sheet별 undo state, export 버튼 가로채기, 초기 source 적용 등이 포함된다. MVP에서는 multi-sheet를 제외하므로 sheet 기능은 추출하지 않는다. 반면 코드 변경 통지, 초기값 반영, 렌더 설정, 선택 상태 등 독립적인 editor 동작은 SDK 내부의 명시적 API로 옮긴다. SVG 생성은 editor 기능으로 둘 수 있지만, 파일 저장 대화상자와 파일 쓰기는 host 책임으로 둔다.

기준 Extension은 Mermaid bundle의 `Function("return this")` fallback 때문에 `script-src 'unsafe-eval'`을 설정한다. 따라서 기준 Webview가 eval을 허용하도록 구성된 사실은 확인했다. 이 설정이 실제 browser 실행에 필수인지와 SDK bundle에서 제거 가능한지는 아직 만들어지지 않은 SDK 산출물에서만 검증할 수 있다. 이는 지금 추가 조사할 미결 항목이 아니라, browser bundle 구현 후 CSP 아래에서 확인할 통합 조건이다.

## 4. 목표 경계

```text
Host
  ├─ 소스 수집 및 Markdown block 선택
  ├─ 저장, 파일 I/O, VSCode 통합
  └─ Mermaid 문자열 하나 전달 / 변경값 수신
             │
             ▼
Mermaid Editor SDK
  ├─ 렌더링과 편집 가능 여부 판정
  ├─ GUI 및 source 편집
  ├─ 지원하는 구조의 Mermaid 변환
  ├─ selection 및 editor option
  └─ host callback
```

VSCode Extension은 Markdown block 선택 및 WorkspaceEdit 등 host 기능을 유지하면서 SDK consumer가 된다. 기존 Extension 통합은 기능 확인에 활용하되, 그 자체를 자동 regression test로 간주하지 않는다. 지원 유형별 source fixture와 round-trip 사례를 별도로 유지한다.

## 5. SDK API 초안

```ts
interface MermaidVisualEditorOptions {
  value: string
  onChange?: (value: string) => void
  onSelectionChange?: (selection: EditorSelection | null) => void
  onError?: (error: EditorError) => void
}

interface MermaidVisualEditor {
  getValue(): string
  setValue(value: string): void
  destroy(): void
}

function createMermaidVisualEditor(
  container: HTMLElement,
  options: MermaidVisualEditorOptions,
): MermaidVisualEditor
```

초기 공개 option과 타입 정의는 [SDK 계약 결정](../decisions/sdk-contract.md)을 기준으로 한다. host 전용 `sheets`, `activeIdx`, `hasSource`, `title`은 포함하지 않는다.

이벤트 규약:

- 최초 `value`는 editor를 초기화한다.
- 사용자 source 편집이나 GUI 편집으로 값이 바뀌면 `onChange`에 전체 Mermaid source를 전달한다.
- host가 `setValue()`를 호출해 변경한 값은 외부 업데이트다. 이 호출만으로 `onChange`를 발생시키지 않는다.
- `getValue()`는 editor의 현재 Mermaid source를 반환한다.
- `destroy()` 이후에는 listener와 callback을 정리한다.
- 파싱 실패 및 GUI 편집 불가 유형은 editor UI에서 서로 다른 상태로 표시한다. GUI 편집 미지원은 파싱 오류로 취급하지 않는다.

`save()` API는 제공하지 않는다. 저장은 host 책임이다. Markdown 문자열 전체, 파일 경로 또는 파일 저장 대화상자는 SDK API에 넣지 않는다.

## 6. Mermaid source 보존 정책

GUI 편집 모델은 Mermaid 전체 문법보다 좁을 수 있다. 렌더 성공 여부만으로 GUI 편집 가능 여부를 판단하지 않는다.

- 편집 지원 유형의 GUI mutation은 변경된 부분을 Mermaid source로 반영한다.
- frontmatter의 `config`, `title`, 주석, directive 및 editor가 구조화하지 않는 문장은 변경되지 않는 한 원문을 유지한다.
- GUI mutation이 미지원 문법이나 metadata를 손실할 위험이 있으면 해당 source를 조용히 재작성하지 않는다. 구현은 원문 조각 보존을 보장하거나, 보장을 못 하는 경우 GUI mutation을 제한하는 방향으로 설계한다.
- 지원되는 mutation은 원문 statement span만 변경하고 비대상 범위를 byte-for-byte 보존한다. span을 확정하지 못하거나 참조가 모호한 rename/delete는 적용하지 않는다. 상세 fixture 기준은 [source fidelity 결정](../decisions/source-fidelity.md)을 따른다.
- 편집 미지원 diagram type은 Mermaid 미리보기와 source 편집을 제공한다. GUI 조작 UI는 제공하지 않는다.
- Mermaid 자체 파싱 오류와 “렌더 가능하지만 GUI 미지원”은 editor UI에서 서로 다른 상태로 사용자에게 알린다.

정적 코드 조사 결과, 기준 구현은 원문 보존을 보장하지 않는다. 대표 편집 함수는 Mermaid AST 전체를 serialize하기보다 문자열과 줄 단위 정규식을 사용한다. 예를 들어 `renameTokenEverywhere()`는 ID token을 source 전체에서 치환하고 `deleteNode()`는 해당 ID를 포함하는 줄을 제거한다. 따라서 주석이나 설정에 우연히 같은 token이 있으면 변경되거나 삭제될 수 있다. 신규 SDK는 지원 유형별 round-trip 사례로 동작을 확인하고, 손실 가능성이 있는 mutation을 제한하거나 변경 범위를 좁혀야 한다.

## 7. 설정과 export 경계

현재 `buildEditorHtml()`이 문자열 교체로 주입하는 설정을 먼저 목록화하고, 각 항목을 public option으로 옮긴다. 설정 이름과 기본값은 기준 구현에서 실제 사용하는 값으로 결정한다. 임의의 신규 옵션은 추가하지 않는다.

SVG 생성과 현재 선택의 export 데이터 생성은 SDK가 제공할 수 있다. 브라우저 다운로드 동작은 SDK 기본 구현으로 둘 수 있지만, VSCode native Save dialog, Save As, WorkspaceEdit 및 파일 쓰기는 VSCode Extension/host에 남긴다. PNG export 역시 canvas 변환과 결과 저장을 분리한다.

## 8. 구현 순서

1. 기준 커밋의 지원 유형별 기능과 `buildEditorHtml()` 설정 patch 목록, bridge 동작을 inventory로 기록한다.
2. source provenance 조사 결과를 반영해 추출 경로를 정한다. 기준 커밋에는 self-contained HTML과 Extension host 코드가 있으며, 별도의 editor source나 HTML 생성 build script가 없다. package task는 VSIX packaging을 수행한다. 원본 modular source가 upstream에 없으면 HTML의 host-independent 앱 코드를 분리해 모듈화하고, Mermaid bundle은 버전을 고정해 별도로 관리한다. 3.4MB HTML을 opaque artifact로 SDK에 계속 내장하는 것은 최종 구조로 삼지 않는다.
3. source fidelity와 GUI 편집 가능 판정 기준을 지원 유형별 fixture로 정한다. frontmatter/config, 주석 및 지원하지 않는 diagram type을 포함한다.
4. Webview 없이 브라우저 container에서 editor 하나를 실행하고 `value`, `getValue`, `setValue`, callbacks, `destroy` 동작을 구현한다.
5. bridge의 editor 기능을 SDK runtime으로 옮기고 `acquireVsCodeApi()`, `vscode.postMessage()` 및 DOM selector 기반 host 계약을 제거한다.
6. 문자열 patch를 제거하고 검증한 설정만 typed option으로 전달한다.
7. 기존 VSCode Extension을 SDK consumer로 바꾼다. Markdown 파싱, QuickPick, 파일 저장 및 WorkspaceEdit은 Extension에 남긴다.
8. 브라우저 SDK bundle을 consumer CSP 아래에서 실행해 `unsafe-eval` 요구 여부와 제한 조건을 기록한다.
9. 동작과 source 보존이 확인된 후 npm package 구조와 React wrapper 필요성을 결정한다.

## 9. 완료 조건

1. 브라우저에서 `createMermaidVisualEditor(container, { value })`로 한 Mermaid 문자열을 불러온다.
2. 위에 명시된 기존 GUI 지원 유형은 기존 편집 흐름을 제공한다.
3. 사용자 편집은 Mermaid source를 갱신하고 `onChange`로 새 source를 전달한다.
4. `setValue()`는 source와 화면을 동기화하지만 `onChange`를 호출하지 않는다.
5. `getValue()`가 현재 source를 반환하고, source 재입력 및 GUI round-trip이 가능하다.
6. `architecture-beta` 등 GUI 편집 미지원 유형은 렌더 미리보기와 원문 코드를 제공한다.
7. frontmatter/config, 주석 및 미지원 원문이 GUI 변경으로 조용히 삭제되지 않는다.
8. SDK 런타임은 VSCode API, Markdown block 검색 및 file I/O에 의존하지 않는다.
9. HTML/JavaScript 문자열 또는 regex patch 없이 옵션을 전달한다.
10. 기존 Extension은 host 기능을 유지하면서 SDK consumer로 동작한다.
11. SDK bundle의 CSP 요구사항을 실제 브라우저에서 확인하고 consumer 문서에 명시한다.

## 10. License 및 배포

기준 Extension은 MIT이고 기준 HTML에는 Mermaid 11.15.0 및 MIT 고지가 포함되어 있다. 기준 `THIRD-PARTY-LICENSES`에도 Mermaid 고지가 있다. npm 배포 전 실제 package 산출물에 포함되는 코드와 자산을 확인하고, 해당 저작권 및 라이선스 고지를 유지한다. Extension 전체가 MIT라는 사실만으로 모든 산출물의 third-party 의무가 끝난다고 가정하지 않는다.

## 11. 조사 및 상세 설계 결과

기준 구현 조사와 SDK 계약·source fidelity·build 구조 결정은 아래 문서를 따른다.

- [고정 기준 소스와 저장소 구조](../research/baseline-source.md)
- [12개 유형 지원표](../research/support-matrix.md)
- [주입 설정 목록](../research/injected-options.md)
- [host bridge 경계](../research/host-bridge.md)
- [provenance 및 license 조사](../research/provenance-license.md)
- [SDK API와 lifecycle 계약](../decisions/sdk-contract.md)
- [source 보존 규칙과 fixture 명세](../decisions/source-fidelity.md)
- [package build 및 모듈 구조](../decisions/build-architecture.md)

SDK 구현은 기존 HTML을 불투명 산출물로 내장하지 않는다. Framework 독립 TypeScript source와 version-pinned Mermaid dependency에서 ESM/CJS/IIFE 및 타입 선언을 생성한다. Actual browser CSP 요구와 package license는 각각 task 32와 34에서 생성물 기준으로 검증한다.

## 12. 사용자 화면 와이어프레임

화면 배치, palette 항목, 사용자 조작과 상태 피드백의 기준은 [Mermaid 편집기 UI/UX 와이어프레임](docs/ux-ui/UI-UX-WIREFRAME.md) 및 [다이어그램 팔레트 카탈로그](docs/ux-ui/UI-UX-WIREFRAME.md)를 따른다. 이 문서는 사용자가 보게 될 화면과 동작을 설명하며 SDK props/API, 내부 UI 구현, 파일 저장 방식을 정하지 않는다. SDK 한 인스턴스의 범위는 Mermaid 문자열 하나이며 multi-sheet와 여러 block 선택 UI는 포함하지 않는다.
