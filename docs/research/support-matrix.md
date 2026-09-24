# 02. 기존 GUI 지원표

## 판정 기준

README의 “supported”는 해당 타입을 편집기에서 표시하고 source/palette를 제공한다는 의미까지 포함한다. 아래 표는 Mermaid 렌더, palette 삽입 및 SVG 구조에 붙은 GUI 조작을 나눠 기록한다. “구조 GUI”는 기존 코드의 node/edge/subgraph hit test와 modal 편집이 실제로 연결된 범위다.

## 유형별 근거

| Diagram | Mermaid 렌더 | Palette / source 작업 | 구조 GUI 조작 | 판정 및 근거 |
|---|---|---|---|---|
| Flowchart / graph | 예 | 노드 shape, 연결선, subgraph를 palette에서 추가하고 source textarea를 직접 편집 | 노드·edge·subgraph를 더블클릭해 label/style/속성 편집, Delete, edge endpoint 재연결, node 간 drag 연결, flowchart node `+` 삽입 | 가장 넓은 구조 편집. `DIAGRAM_TYPES.flowchart`, `isGraphDiagram`, `attachDoubleClick`, edge/plus handlers. |
| Sequence | 예 | participant/actor와 note/loop/alt/opt/par 항목은 click/drag로 source에 삽입. message 도구는 connector로 arm되지만 Sequence에는 연결 대상 graph handler가 없어 source에 삽입되지 않음. source 편집은 가능. | 의미 구조 선택·수정 및 message 연결 없음 | 렌더와 일부 palette/source 편집. 구조 adapter 없음. 기준 구현에서는 message 항목은 노출되지만 실제로 동작하지 않음. |
| Class | 예 | class block와 관계 snippet 및 source 편집 | class node/member, relation type/direction, style 편집·삭제 및 연결 조작 | 그래프 shell에서 처리되는 구조 편집. class relation에는 자유 label이 없음을 UI가 반영. |
| State | 예 | state, composite, transition, note snippet 및 source 편집 | state name/style, transition label 편집·삭제 및 연결 조작 | 그래프 shell에서 처리되는 구조 편집. |
| ER | 예 | entity, 관계 snippet 및 source 편집 | entity/attribute, 관계 cardinality/label, style 편집·삭제 및 연결 조작 | 그래프 shell에서 처리되는 구조 편집. |
| Gantt | 예 | title/date format/section/task snippet 및 source 편집 | Gantt bar를 task 구조로 선택·이동·편집하는 전용 GUI 없음 | 렌더와 source/palette 편집. |
| Pie | 예 | title/slice snippet 및 source 편집 | slice의 차트 직접 조작 없음 | 렌더와 source/palette 편집. |
| Journey | 예 | title/section/task snippet 및 source 편집 | task/actor를 직접 조작하는 전용 GUI 없음 | 렌더와 source/palette 편집. |
| Mindmap | 예 | root/branch/shape snippet 및 source 편집 | branch tree의 직접 구조 편집 없음 | 렌더와 source/palette 편집. |
| Gitgraph | 예 | commit/branch/checkout/merge snippet 및 source 편집 | commit graph의 직접 구조 편집 없음 | 렌더와 source/palette 편집. |
| Timeline | 예 | title/section/event snippet 및 source 편집 | event timeline 직접 편집 없음 | 렌더와 source/palette 편집. |
| Quadrant | 예 | title/axis/quadrant/point snippet 및 source 편집 | 점을 좌표로 드래그하는 직접 조작 없음 | 렌더와 source/palette 편집. |

README는 12개 유형을 지원 목록으로 열거하고 palette 이용을 설명한다. 코드에서는 12개 모두 `DIAGRAM_TYPES` starter와 palette 그룹이 있다. 반면 `isGraphDiagram()`은 실제 SVG의 graph node/edge 표시를 기준으로 flowchart, state, class, ER에만 graph affordance를 연결한다. 이 구분을 SDK의 `renderable`과 `guiEditable` capability로 분리한다.

## 추가 경계

- Mermaid가 새로 지원하는 syntax는 Mermaid 렌더러가 처리할 수 있어도 위 12개 adapter 중 하나가 없으면 구조 GUI 지원으로 판정하지 않는다.
- 기준 구현의 Sequence 메시지 palette item 다섯 개는 `connector: true`다. `renderPalette()`는 이 항목을 클릭해도 connector를 arm할 뿐이고, canvas 연결 동작은 `isGraphDiagram()`에 포함된 flowchart/state/class/ER 계열만 처리한다. Sequence는 `isGraphDiagram()` 대상이 아니므로 해당 메시지 도구는 실제로 source를 추가하지 않는다. SDK Sequence adapter는 message button을 명시적인 source insertion으로 동작시켜 이 접근 가능한 편집 흐름의 누락을 보완한다.
- 파싱이 실패하면 렌더 오류다. 파싱은 되지만 adapter가 없는 유형은 오류가 아니라 렌더 + 원문 편집 상태로 노출한다.
- 기준 구현의 graph 편집은 SVG DOM 식별자와 줄 단위 정규식 source mutation을 사용한다. 이 표는 기능 존재 여부를 기록하며, source 보존 안전성을 보증하지 않는다. 해당 보증은 task 07의 fixture로 별도 확인한다.

## 근거 파일

- [`vscode-extension/README.md` at baseline](https://github.com/NextGenPowerToys/mermaid-visual-editor/blob/8f9bbc90f9f33a13cb5e2eda44100856795c4c01/vscode-extension/README.md) — supported families와 UI 설명.
- [`mermaid-editor.html` at baseline](https://github.com/NextGenPowerToys/mermaid-visual-editor/blob/8f9bbc90f9f33a13cb5e2eda44100856795c4c01/vscode-extension/media/mermaid-editor.html) — `DIAGRAM_TYPES`, `isGraphDiagram()`, hit testing, edit modal 및 palette 코드.
