# 07. source 보존 기준과 fixture 명세

상태: **보존 규칙 및 fixture 기대값 확정**. 실행 가능한 fixture는 package/test 구조 생성 시 추가한다(task 12 및 diagram adapter 작업). 이 문서의 예시는 fixture 입력과 assertion의 원천이다.

## 핵심 규칙

1. 최초 source를 원문으로 보관한다. GUI를 열고 닫거나 선택만 해서는 byte를 변경하지 않는다.
2. source parsing/render는 GUI 지원 판정과 별개다. 구조 adapter가 없거나 parser가 모호한 source에는 구조 mutation을 제공하지 않는다.
3. GUI mutation은 mutation 대상의 유일한 statement span만 바꾼다. 대상 span을 안전하게 특정할 수 없으면 적용하지 않고 사용자가 source 편집으로 전환하게 한다.
4. 변경하지 않은 문장은 공백, 주석, 인용 방식, 들여쓰기, newline style(CRLF 포함) 및 순서를 보존한다. 전체 Mermaid AST를 canonical serializer로 다시 쓰지 않는다.
5. rename/delete가 source 전체에서 ID 토큰을 치환/삭제하지 않는다. 선언과 참조를 구문 위치에서 모두 식별하고 변경할 수 있을 때만 commit한다. 주석, label, title, config에서 같은 문자가 나와도 유지한다.
6. preview render 또는 invalid syntax 오류 자체는 source 변경을 일으키지 않는다. 실패한 mutation은 source와 undo history 모두 그대로 둔다.
7. 지원되지 않는 construct가 mutation과 얽혀 안전한 보존을 입증할 수 없으면 해당 diagram의 GUI mutation을 제한한다. 보존할 수 없는 construct를 조용히 지우는 흐름을 허용하지 않는다.

## Fixture matrix

모든 fixture는 `before.mmd`, 정해진 GUI action, 기대 `after.mmd`, 기대 capability/selection outcome을 짝으로 둔다. 기대 `after`는 아래 보존 assertion과 함께 비교한다.

| ID | 유형 및 source 특징 | 동작 | 필수 결과 |
|---|---|---|---|
| F01 | flowchart, 앞뒤 blank line, subgraph, edge, 사용자 정의 방향 | subgraph 내부 노드 label 수정 | target declaration만 바뀌고 header/direction, 다른 edge, `subgraph` 경계 및 trailing newline 유지. |
| F02 | flowchart, 주석/label/config에 node ID와 같은 문자열, ID가 다른 ID의 substring | node rename | 정확한 node identity의 declaration 및 구문상 참조만 변경. 주석/label/config 및 유사 ID는 그대로. 안전한 참조 식별이 불가능하면 mutation 거부. |
| F03 | flowchart, 중복 edge와 `linkStyle`, `classDef`, `style`, `click` | edge 하나 삭제 | 선택 edge statement 한 개만 삭제하고 같은 endpoint의 다른 edge 및 styling/directive 유지. |
| F04 | 앞부분 YAML frontmatter (`config`, `title`), `%%{init}%%`, 이후 flowchart | node shape/label 수정 | frontmatter/init block은 byte 동일하게 유지하고 diagram body의 target statement만 교체. |
| F05 | sequence의 `autonumber`, `activate`, `Note`, `alt/else/end`, escaped multiline label | palette item 추가 후 source 수정 | 기존 block nesting/order와 note/comment 유지. adapter가 해당 syntax를 표현하지 못하면 body rewrite 대신 source-only capability. |
| F06 | class의 namespace, annotation, visibility/member, generic 및 관계 cardinality | class member 수정 | member 한 줄만 교체. 관계 label이 아닌 문법, annotation, namespace 및 다른 멤버 보존. |
| F07 | state composite state, note, choice/fork/join, transition label | state transition 수정 | 대상 transition만 변경하고 nested `state {}`, `note`, 다른 transition 순서를 보존. |
| F08 | ER `PK`/`FK`/`UK`, attribute comment, identifying/non-identifying cardinality | attribute 수정 | 한 attribute span만 변경하고 key marker, comment, 관계 cardinality와 entity 순서를 보존. |
| F09 | Mermaid frontmatter 및 `%`/`%%` 주석에 중복 ID 문자열, 잘못된 syntax 포함 | render 오류 후 source edit | 오류 표시만 하고 source를 수정하지 않는다. raw source editing은 계속 가능. |
| F10 | Mermaid 11.15.0에서 render되나 adapter 미지원인 `architecture-beta` | load/select | preview + 원문 편집 상태를 제공. structural palette/drag/mutation 없음. parse error 상태와 구분. |
| F11 | CRLF 파일, UTF-8 BOM 및 마지막 newline 있음/없음 | 각 adapter의 국소 mutation | 바뀐 span 밖 BOM, line ending, 마지막 newline 유무를 유지. |
| F12 | 같은 텍스트 선언이 반복되거나 edge endpoint가 모호한 source | GUI rename/delete | 첫 정규식 일치 항목만 임의 변경하지 말고 ambiguous mutation을 차단. |

## 검증 assertion

- `before`와 `after`를 mutation span 기준으로 비교한다. 비대상 prefix/suffix가 byte-for-byte 동일해야 한다.
- 주석, frontmatter/config, directives, metadata 및 미지원 statement는 fixture의 위치와 원문이 그대로 남아야 한다.
- failure/ambiguous outcome은 source, selection 및 undo snapshot이 불변이어야 한다.
- 각 지원 diagram type에 최소 1개 round-trip와 1개 GUI mutation fixture를 둔다. source-only 유형은 palette insertion 후 전체 source가 parse/render되는지 확인하되, 이를 구조 round-trip 성공으로 세지 않는다.
- 고급 문법 fixture는 지원 범위를 입증하기 전까지 capability `guiEditable: false`가 기대값이다.

## 구현 영향

기준 구현의 `renameTokenEverywhere()`/줄 필터 기반 `deleteNode()`는 이 규칙의 안전성을 만족한다고 가정할 수 없다. SDK source model은 원문 span과 opaque 영역을 보존하는 설계가 필요하다. AST/CST 또는 scanner가 exact span을 증명하지 못하면 해당 action을 disable하는 것이 요구사항이다.
