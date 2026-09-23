# 03. 주입 설정 조사

## `buildEditorHtml()` 입력과 사용처

`vscode-extension/extension.js`의 `buildEditorHtml(context, initialCode, options)`는 HTML에 CSP meta와 bridge script를 문자열 patch로 추가한다. `createPanel()`이 전달하는 옵션과 실제 소비 위치는 다음과 같다.

| 값 | 전달 형태 / 기본값 | 실제 소비 | SDK 이동 및 public option 후보 |
|---|---|---|---|
| `initialCode` | 두 번째 positional 인수, `JSON.stringify(initialCode || null)` | bridge의 `applyInitial()`이 `#code`에 값을 쓰고 input 이벤트를 발생시킨다. | `value: string`으로 이동. 빈 문자열도 그대로 보존해야 한다. 현재 `|| null`은 빈 문자열을 “초기값 없음”으로 취급해 HTML starter를 남길 수 있다. |
| `hasSource` | `options.hasSource` → boolean, 기본 `false` | Save 버튼을 “Save…” 또는 “Save”로 표시하고 안내 문구를 바꾼다. | SDK 옵션이 아니다. native 파일 저장 UI의 host 상태이므로 Extension에 남긴다. |
| `sheets` | 비어 있지 않은 배열이면 `{name, code}` 배열, 아니면 `null` | sheet 탭, 코드 교체, sheet별 undo 기록 및 저장 payload를 만든다. | MVP에서는 제외. 다중 Mermaid block 선택/저장에 속하며 host의 문서 단위 기능이다. |
| `activeIdx` | `Number(...) || 0`을 sheet 범위에 clamp | 최초 활성 sheet를 지정한다. | MVP에서는 제외. `sheets`에 종속된 host 선택 상태다. |
| `title` | `createPanel()`에서 기본값 `Mermaid Visual Editor` | VS Code Webview panel 제목. | VS Code host 전용이므로 SDK 옵션으로 옮기지 않는다. |

## 고정 또는 소비되지 않는 값

- Mermaid 설정은 `mermaid-editor.html`에서 `prefers-color-scheme`을 읽어 theme을 정하고 `securityLevel: 'loose'`, `flowchart: { curve: 'basis', useMaxWidth: false }`, `startOnLoad: false`를 직접 지정한다. `buildEditorHtml()` 옵션으로 주입하지 않는다. 이 값을 public option으로 노출할 근거는 아직 없다.
- CSP는 bridge가 주입하는 실행 환경 정책이지 편집 동작 옵션이 아니다. `script-src 'unsafe-inline' 'unsafe-eval'`은 현재 번들의 런타임 요구를 반영하며 SDK option으로 옮기지 않는다.
- `buildEditorHtml()`은 초기값의 JSON 문자열을 직접 삽입하며, bridge는 `#code`, `#output`, `#type`, `.app`, `#download-svg-btn`, `#download-png-btn`, `#reset-btn` 같은 내부 DOM id/class를 찾아 동작한다. 이를 typed API와 내부 component ownership으로 대체한다.

## public option 후보 결론

현재 근거로 옮길 후보는 `value`뿐이다. `onChange` 및 `onSelectionChange`는 기존 HTML UI가 host와 연결할 독립 동작을 SDK API로 표현하기 위한 계약 초안이다. Mermaid theme/config 옵션은 실제 consumer 요구 조사나 task 03의 injected option 증거가 없으므로 임의로 추가하지 않는다. `hasSource`, `sheets`, `activeIdx`, `title`, save path는 host에 남긴다.
