# 06. SDK 계약 결정

상태: **확정 초안**. 구현 및 공개 선언의 검증은 task 13/14/29에서 한다.

## 공개 API

```ts
export type DiagramType =
  | 'flowchart' | 'sequence' | 'class' | 'state' | 'er'
  | 'gantt' | 'pie' | 'journey' | 'mindmap'
  | 'gitgraph' | 'timeline' | 'quadrant'
  | 'unsupported' | 'unknown';

export type EditorSelection =
  | { kind: 'node'; diagramType: DiagramType; id: string }
  | { kind: 'edge'; diagramType: DiagramType; source: string; target: string }
  | { kind: 'subgraph'; diagramType: 'flowchart'; id: string; title?: string };

export type EditorError = {
  code: 'parse' | 'render' | 'mutation' | 'destroyed';
  message: string;
  cause?: unknown;
};

export interface MermaidVisualEditorOptions {
  value: string;
  onChange?: (value: string) => void;
  onSelectionChange?: (selection: EditorSelection | null) => void;
  onError?: (error: EditorError) => void;
}

export interface MermaidVisualEditor {
  getValue(): string;
  setValue(value: string): void;
  destroy(): void;
}

export function createMermaidVisualEditor(
  container: HTMLElement,
  options: MermaidVisualEditorOptions,
): MermaidVisualEditor;
```

`onError`는 기준 Webview가 렌더 오류를 화면 상태로만 표시한 점을 보완하는 API 결정이다. 파싱 오류와 GUI 미지원 상태를 consumer callback에서 같은 오류로 취급하지 않도록 UI status에는 별도의 `unsupported` capability를 사용한다. `cause`는 외부 library 오류를 보존하되 public `message`는 사용자에게 보여줄 수 있는 문자열이다.

## 수명 및 입력 규칙

| 상황 | 계약 |
|---|---|
| 생성 | container와 options를 검증하고 동기적으로 instance를 반환한다. DOM mount는 container 안에 SDK-owned root를 하나 추가한다. 기존 자식은 지우지 않는다. Mermaid 렌더는 비동기 작업이다. |
| `value` | 필수 plain string. 빈 문자열도 유효한 입력이며 기본 starter로 바꾸지 않는다. 앞뒤 공백·개행을 포함해 현재 값을 그대로 보관한다. |
| 사용자 편집 | textarea 입력이나 지원된 GUI mutation으로 값이 실제 바뀌었을 때 전체 source를 `onChange(value)`로 알린다. 렌더 debounce가 callback 전달을 지연시키지 않는다. 동일 문자열을 다시 만들면 중복 callback은 없다. |
| `setValue(value)` | string만 허용한다. 현재 값과 다르면 source 및 preview를 갱신한다. 외부 갱신만으로 `onChange`는 호출하지 않는다. 같은 값은 no-op이다. |
| `getValue()` | 가장 최근 사용자 변경 또는 `setValue`를 반영한 현재 전체 source를 동기 반환한다. preview render 완료를 기다리지 않는다. |
| callback 순서 | source 변경을 instance 내부 상태에 먼저 적용한 뒤 `onChange`를 동기 호출한다. 그 다음 preview render를 예약한다. callback 안에서 `getValue`하면 새 값을 읽는다. |
| selection | 사용자가 adapter가 인식하는 구조를 선택하면 불변 snapshot을 전달한다. 선택 해제, 현재 구조 삭제 또는 선택을 식별할 수 없는 source 갱신은 `null`을 전달한다. 초기 mount만으로 임의 selection callback을 발생시키지 않는다. |
| parse/render 오류 | source는 그대로 유지하고 UI에 오류를 표시한다. `onError`는 현재 source에 대한 오류를 알린다. 다음 입력이나 `setValue`에서 재렌더한다. GUI 미지원은 parse/render error가 아니다. |
| destroy | idempotent. listener, observer, pending timer/frame 및 instance 참조를 해제하고 SDK-owned root만 제거한다. 이후 public mutator는 `destroyed` 상태 오류를 동기 throw하고 callback은 더 발생하지 않는다. `getValue()`는 마지막 source를 반환해 host cleanup 순서와 무관하게 읽을 수 있다. |

## 인수 검증 및 callback 실패

- 생성 시 container가 `HTMLElement`가 아니거나 options가 plain object가 아니거나 `value`가 string이 아니면 `TypeError`를 동기 throw하며 DOM을 수정하지 않는다.
- `setValue`에 string 이외 값이 전달되면 `TypeError`를 동기 throw한다.
- 사용자 callback에서 발생한 예외는 source state를 되돌리거나 렌더 루프를 중단시키지 않는다. 구현은 callback 예외를 해당 이벤트 흐름 밖에서 보고하고 내부 `onError`로 재귀 전달하지 않는다.
- `destroy` 후 `getValue`는 read-only 조회로 허용한다. `setValue`는 `Error`(name `DestroyedEditorError`)를 throw한다.

## 제외하는 option

Task 03 조사에서 host 주입값 `hasSource`, `sheets`, `activeIdx`, `title`은 VS Code 저장/다중 문서 상태였다. public SDK option으로 옮기지 않는다. Mermaid config 값도 HTML에 고정되어 있었으며, 초기 core API에는 새 renderer options를 임의 추가하지 않는다. Theme/options 요구는 구현 후 별도 근거가 생길 때만 추가 task로 다룬다.

## API 결정 이유

계약은 Mermaid 문자열 하나를 편집하고 host에 반환하는 범위로 제한한다. source synchronization은 동기 API로 단순하게 유지하고 renderer의 비동기 완료 상태를 source truth와 분리한다. 초기값, external update, 사용자 변경의 callback 구분으로 host/editor 간 feedback loop를 방지한다.
