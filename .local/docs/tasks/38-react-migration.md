# 38. React migration

## 상태

- [ ] 대기
- [x] 진행 중
- [ ] 완료

## 목적

`.local/docs/react-design.md`의 source/model session, React UI, package 구조를 현재 SDK 전체에 구현한다. 별도 하위 프로젝트를 추가하지 않고 package root를 React editor entry로 만든다. 기존 imperative API와 browser IIFE는 호환 경계로 유지한다.

## 완료 조건

- `DiagramSession`이 Mermaid source, renderer model, revision, origin, history와 stale async 결과를 관리한다.
- 현재 12개 diagram의 source mutation 및 SVG interaction이 React UI에서 유지된다.
- React component tree가 shell, tool sidebar, palette, canvas, source editor, selection editor와 status를 소유한다.
- React 18/19 peer 지원, SSR 초기 snapshot, Strict Mode cleanup, 여러 instance 격리를 구현한다.
- 각 `MermaidEditor`의 controller/session은 해당 editor의 React Context가 소유하고, Zustand는 그 session snapshot 구독에 사용한다.
- React package root, `./react` alias, `./legacy` imperative entry, CSS export, browser IIFE와 declaration build가 함께 동작한다.
- README와 local playground가 최종 React API를 사용한다.
- UI와 session behavior를 요구 범위에 맞게 검증하고 설계 체크리스트를 실제 증거에 맞춰 갱신한다.

## 구현 기준

- React state/store: Zustand
- action validation: Zod
- selection forms: React Hook Form with the Zod resolver
- accessible controls: Base UI
- data grouping/utilities: es-toolkit
- palette drag and drop: `@dnd-kit/react`
- source span differencing and protected region serialization: `diff`
- source editor: CodeMirror 6 through `@uiw/react-codemirror`
- generated element IDs: nanoid
- Mermaid rendering: 현재 고정 버전과 diagram adapters/source mutations 재사용
- 각 `MermaidEditor` instance 전용 Context가 controller/session을 제공한다. 한 instance는 Mermaid 코드 블록 하나를 관리한다.
- Mermaid JS renderer는 모듈 단위 공유 인스턴스다. `p-queue`는 공유 renderer의 parse→render 호출만 직렬화하며 effect cleanup에서 stale 대기 요청을 취소한다.

## 현재 진행

- `DiagramSession` source/model snapshot, source/model revision, origin, source history와 action validation을 추가했다.
- 각 `MermaidEditor` 인스턴스가 전용 `EditorSessionProvider`를 만들고, 내부 session hook은 Context controller만 구독한다. editor 사이의 source/model 데이터는 분리된다.
- 12개 source adapter의 parsing/capability/mutation registry와 React 독립 editor controller를 추가했다.
- React editor component tree와 React playground를 추가했다.
- SourceEditor를 CodeMirror로 교체하고 selection forms에 React Hook Form과 Zod resolver를 적용했다.
- React selection editor에서 flowchart/class/state/ER node styling, 관계 operator/cardinality, flowchart subgraph 스타일과 삭제를 편집한다.
- `SourceEditor`는 SSR/hydration 첫 렌더에 동일한 value를 가진 textarea를 표시한 다음 browser effect 뒤 CodeMirror로 전환한다. 서버 출력에 Mermaid source가 포함되며 React hydration 경고가 없는 것을 확인했다.
- 헤더에서 12종 다이어그램 종류를 선택하고, 캔버스 툴바에서 확대·축소·Fit·Center·Save·Reset을 실행한다. 요소 클릭은 선택, 더블 클릭은 Base UI 편집 대화상자를 연다.
- 편집 대화상자는 대상별 제목과 accessible delete label을 제공하고 적용·취소·삭제를 구분한다. 다중 행 문구 입력은 textarea를 사용하고, Escape로 닫거나 Cmd/Ctrl+Enter로 적용한다.
- Cmd/Ctrl+S 저장, Cmd/Ctrl+Z와 Cmd/Ctrl+Shift+Z 또는 Ctrl+Y history, Delete/Backspace 삭제, Space+drag 패닝과 휠 확대·축소를 React editor에 연결했다. 편집 입력의 텍스트 삭제/undo는 브라우저 및 CodeMirror에 남긴다.
- Flowchart/Class/State/ER 관계 도구를 선택한 뒤 캔버스에서 시작 노드와 대상 노드를 차례로 선택해 관계를 만든다. 가능한 대상 노드와 선택한 시작 노드를 캔버스에서 강조한다. Flowchart/Class 관계 유형, State/Flowchart/ER label, ER cardinality와 identifying line 옵션을 제공한다.
- 다이어그램 종류 전환이 현재 source를 교체할 때 확인을 요청한다.
- 좁은 화면에서는 팔레트·캔버스·코드 영역을 세로로 배치한다.
- 지원표의 graph palette variants와 모든 Sequence palette 항목, State composite/note/start/end transition을 React action으로 제공한다.
- Flowchart, Class, State, ER palette 정의를 `ui/diagrams/<type>/`로 나누고 공통 registry로 선택한다.
- dnd-kit 기반 팔레트 drag-and-drop으로 graph item과 source snippet을 캔버스에 추가하고 클릭 동작도 유지한다.
- DiagramSession actions와 React canvas adapter mutation이 `SourceDocument`의 common region map과 `diff` serializer를 거쳐 기존 주석·metadata·빈 줄·opaque span 변경을 차단한다. 사용자의 직접 source 편집은 자유 입력으로 반영한다.
- Diagram별 append mutation을 `appendSourceLines`로 모아 추가 구문이 footer comment·metadata·blank region보다 앞에 삽입되도록 하고, 기존 protected text와 공백을 그대로 둔다.
- diagram type 및 semantic model parse는 공통 source scanner를 사용해 YAML frontmatter, comments, Mermaid directives, accessibility metadata를 요소로 오인하지 않는다.
- 기존 diagram adapter의 SVG interactions를 React canvas lifecycle 안에서 mount/cleanup한다.
- React ESM/CJS에서는 선언된 런타임 의존성을 외부화하고, legacy IIFE와 declaration, stylesheet, dependency license inventory를 빌드한다.
- 타입 검사, lint, React/legacy package build, distribution license audit를 통과했다. 와이어프레임에 맞춰 헤더 선택기, 캔버스 툴바, 더블 클릭 편집 대화상자, keyboard/pointer 조작과 narrow-screen 레이아웃을 반영했다.
- 로컬 playground를 브라우저에서 조작해 Flowchart source 입력→SVG 갱신, 관계 연결, node/edge 생성·수정·삭제, undo, Sequence message 삽입, parse 오류 source 보존, Mermaid 지원 외 diagram의 source-only 상태를 확인했다. YAML frontmatter, 앞/뒤 comment, 빈 줄이 있는 Flowchart에 노드를 추가해도 보호 원문이 유지되는지 확인하고 footer comment를 넘어 추가되던 결함을 수정했다. Strict Mode 아래 두 editor에 별도 source를 전달하고 한쪽 host prop 갱신이 그쪽 model/SVG에만 반영되며 onChange 되울림이 없는 것을 확인했다. 12개 diagram template을 모두 선택해 렌더하고 대표 palette action을 실행해 source 및 SVG 갱신까지 확인했다. 모든 palette 항목별 검증은 남아 있다.
