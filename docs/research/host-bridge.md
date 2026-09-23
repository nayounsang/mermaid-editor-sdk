# 04. host bridge 조사

## Webview 메시지

| 방향 | type / payload | 발생 시점 | SDK 이전 여부 |
|---|---|---|---|
| Editor → Extension | `ready` | bridge 설치 후 준비 알림 | SDK lifecycle 내부로 흡수. host handshake 불필요. |
| Extension → Editor | `setCode { code }` | 외부에서 editor source를 교체 | `setValue(value)`로 이전. 변경 callback을 되울리지 않는다. |
| Extension → Editor | `getCode { requestId }` | host가 현재 source를 요청 | `getValue()`로 이전. request/response와 timeout map 제거. |
| Editor → Extension | `codeResponse { code, requestId }` | `getCode` 응답 | 제거. `getValue()` 반환으로 대체. |
| Extension → Editor | `getSheets { requestId }` | 저장 전에 모든 sheet 요청 | MVP 제외. multi-sheet host 흐름에 종속. |
| Editor → Extension | `sheetsResponse { sheets, activeIdx, requestId }` | `getSheets` 응답 | MVP 제외. |
| Editor → Extension | `saveFile { mimeType, title, sheetName, data, isBase64 }` | SVG/PNG export button | 파일 선택과 쓰기는 host 책임. 필요 시 SDK는 순수 export data 반환 API를 제공하는지 task 30에서 결정. |
| Editor → Extension | `saveError { message }` | canvas 변환 또는 export 오류 | SDK 오류 상태 및 `onError`로 이전; host UI 알림은 consumer 선택. |
| Editor → Extension | `saveBack` | Save button 또는 Cmd/Ctrl+S | 기존 source overwrite/Save As 행위이므로 Extension 전용. SDK에서 제거. |
| Extension → Editor | `saveResult { ok }` | host 저장 결과 | host가 소유하는 save UI가 있으면 host 측 상태로 처리. core editor 계약으로 이전하지 않음. |
| Extension → Editor | `linkedToSource` | Save As 후 panel과 file 연결 | Extension 전용 상태이므로 제거. |
| Picker → Extension | `select { index }` | Markdown block thumbnail 선택 | picker/block 탐색 자체를 SDK 범위에서 제외한다. |

## DOM 및 전역 bridge

Bridge는 `#code`에 값 대입 후 `input` event를 발생시켜 렌더를 갱신한다. 또한 `#output` SVG로부터 이미지 export를 만들고, `#download-svg-btn`, `#download-png-btn`, `#reset-btn`, `.app`을 교체하거나 조회한다. sheet별 undo 상태를 위해 `window.__vsxGetUndoState`, `__vsxSetUndoState`, `__vsxSuppressNextInput`, `__vsxSyncTypeFromCode`를 부른다.

SDK 내부는 각 editor instance가 자신의 DOM과 lifecycle을 소유한다. source 변경은 명시적 내부 함수로 연결하고 CSS selector, synthetic input event, 전역 `window.__vsx*` 계약에 의존하지 않는다.

## SDK/host 경계

- **SDK:** Mermaid value 입력/반환, 렌더, source editor, 지원된 구조 편집, parse/render 오류 상태, selection 이벤트, destruction.
- **Host:** Markdown·파일 parsing, block 선택, sheet 목록, VS Code 명령과 panel, 파일 저장·Save As, 파일 경로, workspace API, native notification.
- SVG/PNG 변환 계산은 editor 쪽 기능일 수 있지만 결과 파일 경로 선택과 기록은 host 기능이다. export data public API는 task 30에서 별도로 결정한다.
