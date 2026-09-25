# 다이어그램 팔레트 카탈로그

항목과 순서는 Mermaid Visual Editor v2.5.0 고정 커밋 `8f9bbc90f9f33a13cb5e2eda44100856795c4c01`의 `DIAGRAM_TYPES` 정의와 대조했다. **아이콘**은 기준 구현에서 항목 오른쪽에 보이는 텍스트 표기다.

일반 항목은 캔버스로 끌거나 눌러 추가한다. `연결 선택` 항목은 눌러 연결 모드로 만든 뒤, 캔버스에서 연결할 노드 사이를 끈다. 추가되는 정확한 위치와 입력 흐름은 다이어그램 종류에 따라 달라진다.

## Flowchart

| 그룹 및 순서 | 항목 (아이콘) | 사용 |
| --- | --- | --- |
| Nodes 1 | Process box (`[ ]`) | 사각 노드 추가 |
| Nodes 2 | Decision (`{ }`) | 마름모 결정 노드 추가 |
| Nodes 3 | Rounded (`( )`) | 둥근 노드 추가 |
| Nodes 4 | Circle (`(( ))`) | 원형 노드 추가 |
| Nodes 5 | Stadium (`([ ])`) | stadium 노드 추가 |
| Nodes 6 | Subroutine (`[[ ]]`) | 이중선 노드 추가 |
| Nodes 7 | Database (`[( )]`) | 원통형 노드 추가 |
| Nodes 8 | Hexagon (`{{ }}`) | 육각형 노드 추가 |
| Edges 1 | Arrow (`-->`) | 연결 선택 후 화살표 관계 연결 |
| Edges 2 | Labeled arrow (`-->|`) | 연결 선택 후 라벨이 있는 관계 연결 |
| Edges 3 | Dashed (`-.->`) | 연결 선택 후 점선 관계 연결 |
| Edges 4 | Thick (`==>`) | 연결 선택 후 굵은 관계 연결 |
| Containers 1 | Subgraph (`{}`) | 하위 그룹 영역 추가 |

## Sequence

| 그룹 및 순서 | 항목 (아이콘) | 사용 |
| --- | --- | --- |
| Actors 1 | Participant (`p`) | 참여자 추가 |
| Actors 2 | Actor (`a`) | actor 추가 |
| Messages 1 | Message (sync) (`->>`) | 연결 선택 후 동기 메시지 추가 |
| Messages 2 | Reply (dashed) (`-->>`) | 연결 선택 후 점선 응답 추가 |
| Messages 3 | Activate (`->>+`) | 연결 선택 후 활성화 표시가 있는 메시지 추가 |
| Messages 4 | Deactivate (`-->>-`) | 연결 선택 후 비활성화 표시가 있는 메시지 추가 |
| Messages 5 | Async (`-)`) | 연결 선택 후 비동기 메시지 추가 |
| Blocks 1 | Note (`note`) | note 문장 추가 |
| Blocks 2 | Loop (`loop`) | 반복 블록 추가 |
| Blocks 3 | Alt / else (`alt`) | 조건/대안 블록 추가 |
| Blocks 4 | Opt (`opt`) | 선택 블록 추가 |
| Blocks 5 | Parallel (`par`) | 병렬 블록 추가 |

## Class

| 그룹 및 순서 | 항목 (아이콘) | 사용 |
| --- | --- | --- |
| Class 1 | Class block (`class`) | 멤버가 포함된 클래스 블록 추가 |
| Class 2 | Empty class (`cls`) | 빈 클래스 추가 |
| Relations 1 | Inheritance (`<\|--`) | 연결 선택 후 상속 관계 연결 |
| Relations 2 | Composition (`*--`) | 연결 선택 후 합성 관계 연결 |
| Relations 3 | Aggregation (`o--`) | 연결 선택 후 집합 관계 연결 |
| Relations 4 | Association (`-->`) | 연결 선택 후 연관 관계 연결 |
| Relations 5 | Dependency (`..>`) | 연결 선택 후 의존 관계 연결 |
| Relations 6 | Realization (`<\|..`) | 연결 선택 후 실체화 관계 연결 |
| Cardinality 1 | One-to-many (`1..*`) | 연결 선택 후 일대다 관계 연결 |
| Cardinality 2 | One-to-one (`1..1`) | 연결 선택 후 일대일 관계 연결 |

## State

| 그룹 및 순서 | 항목 (아이콘) | 사용 |
| --- | --- | --- |
| States 1 | Simple state (`s`) | 단순 상태 추가 |
| States 2 | Composite (`{}`) | 중첩 상태 블록 추가 |
| States 3 | Choice (`cx`) | choice 상태 추가 |
| Transitions 1 | Start → state (`[*]→`) | 시작점에서 상태로 전이 추가 |
| Transitions 2 | State → end (`→[*]`) | 상태에서 종료점으로 전이 추가 |
| Transitions 3 | Transition (`-->`) | 연결 선택 후 상태 사이 전이 추가 |
| Transitions 4 | Labeled (`-->:`) | 연결 선택 후 이벤트 라벨이 있는 전이 추가 |
| Notes 1 | Note (`n`) | 상태 note 추가 |

## Entity-Relationship

| 그룹 및 순서 | 항목 (아이콘) | 사용 |
| --- | --- | --- |
| Entity 1 | Entity with fields (`{}`) | 필드가 있는 entity 추가 |
| Entity 2 | Empty entity (`E`) | 빈 entity 추가 |
| Relations 1 | One-to-many (`\|\|..o{`) | 연결 선택 후 일대다 관계 연결 |
| Relations 2 | One-to-one (`\|\|..\|\|`) | 연결 선택 후 일대일 관계 연결 |
| Relations 3 | Many-to-many (`}o..o{`) | 연결 선택 후 다대다 관계 연결 |
| Relations 4 | Zero-or-one (`\|o..\|\|`) | 연결 선택 후 0 또는 1 관계 연결 |
| Relations 5 | One-or-many (`\|\|..\|{`) | 연결 선택 후 1개 이상 관계 연결 |

## Gantt

| 그룹 및 순서 | 항목 (아이콘) | 사용 |
| --- | --- | --- |
| Structure 1 | Title (`t`) | 제목 추가 |
| Structure 2 | Date format (`fmt`) | 날짜 형식 문장 추가 |
| Structure 3 | Section (`§`) | 작업 구간 추가 |
| Tasks 1 | Task (`task`) | 이름·ID·시작일·기간이 있는 작업 추가 |
| Tasks 2 | After previous (`→task`) | 이전 작업 뒤에 이어지는 작업 추가 |
| Tasks 3 | Milestone (`◆`) | milestone 추가 |
| Tasks 4 | Critical (`!`) | 중요 작업 추가 |
| Tasks 5 | Done (`✓`) | 완료된 작업 추가 |
| Tasks 6 | Active (`▶`) | 진행 중인 작업 추가 |

## Pie chart

| 그룹 및 순서 | 항목 (아이콘) | 사용 |
| --- | --- | --- |
| Structure 1 | Title (`t`) | 제목 추가 |
| Slices 1 | Slice (`◔`) | 라벨과 수치가 있는 조각 추가 |

## User journey

| 그룹 및 순서 | 항목 (아이콘) | 사용 |
| --- | --- | --- |
| Structure 1 | Title (`t`) | 제목 추가 |
| Structure 2 | Section (`§`) | 단계 구간 추가 |
| Tasks 1 | Task (`★`) | 점수와 담당자가 있는 작업 추가 |
| Tasks 2 | Multi-actor (`★★`) | 복수 담당자가 있는 작업 추가 |

## Mindmap

| 그룹 및 순서 | 항목 (아이콘) | 사용 |
| --- | --- | --- |
| Nodes 1 | Root (circle) (`(( ))`) | 원형 루트 노드 추가 |
| Nodes 2 | Branch (`·`) | 가지 노드 추가 |
| Nodes 3 | Square node (`[ ]`) | 사각형 노드 추가 |
| Nodes 4 | Rounded (`( )`) | 둥근 노드 추가 |
| Nodes 5 | Cloud (`)(`) | 구름형 노드 추가 |

## Git graph

| 그룹 및 순서 | 항목 (아이콘) | 사용 |
| --- | --- | --- |
| Commits 1 | Commit (`●`) | commit 추가 |
| Commits 2 | Commit with id (`●id`) | 메시지/ID가 있는 commit 추가 |
| Commits 3 | Tagged commit (`tag`) | tag가 있는 commit 추가 |
| Branches 1 | Branch (`├`) | branch 추가 |
| Branches 2 | Checkout (`⇄`) | branch checkout 문장 추가 |
| Branches 3 | Merge (`⇆`) | merge 문장 추가 |

## Timeline

| 그룹 및 순서 | 항목 (아이콘) | 사용 |
| --- | --- | --- |
| Structure 1 | Title (`t`) | 제목 추가 |
| Structure 2 | Section (`§`) | 시대/구간 추가 |
| Events 1 | Event (`\|`) | 날짜와 설명이 있는 사건 추가 |

## Quadrant

| 그룹 및 순서 | 항목 (아이콘) | 사용 |
| --- | --- | --- |
| Structure 1 | Title (`t`) | 제목 추가 |
| Structure 2 | X-axis (`x`) | X축 양 끝 문구 추가 |
| Structure 3 | Y-axis (`y`) | Y축 양 끝 문구 추가 |
| Quadrants 1 | Quadrant label (`Q`) | 사분면 이름 추가 |
| Points 1 | Data point (`•`) | 이름과 0~1 좌표가 있는 점 추가 |

---

[UI/UX 와이어프레임](./UI-UX-WIREFRAME.md)에서 이 카탈로그를 참조한다.
