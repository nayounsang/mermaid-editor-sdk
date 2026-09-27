# 37. SDK editor UI reference and playground styling

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

SDK 편집 UI의 레이아웃과 시각 언어를 [Mermaid NG Screenshots](https://nextgenpowertoys.github.io/mermaid-visual-editor/#screenshots)와 나란히 검토한다. 정적 Storybook은 레퍼런스로 유지하고, 이미 SDK가 지원하는 편집 기능이 실제로 사용하기 쉽도록 playground의 레이아웃과 시각 위계를 적용한다.

## 산출물과 완료 조건

- `npm run dev` playground의 `UI reference`를 열어 별도 화면으로 본다.
- 레퍼런스 editor surface의 구조와 비례를 나타낸다: 상단 diagram/header bar, 왼쪽 palette, 오른쪽 격자 canvas와 canvas toolbar, 아래 Mermaid source pane, 선택 요소 편집 modal.
- 레퍼런스의 색 체계, 표면 대비, border/radius, 타이포그래피 위계, 여백, 강조/삭제 버튼의 시각적 비중을 참고 화면에 맞춘다.
- Flowchart canvas와 family-aware edit modal을 정적 화면으로 보여준다. Modal 열기/닫기 이외의 control은 SDK나 source를 변경하지 않는다.
- Playground에서 현재 지원되는 도구를 캔버스 위에 그룹화하고, Mermaid source를 캔버스 아래 전체 폭으로 배치한다.
- 선택 상태를 JSON 덤프 대신 다이어그램 요소와 식별 가능한 이름으로 표시한다.
- SDK runtime 및 diagram adapter와 연결하지 않고, host 전용 VS Code chrome·file explorer·sheet tabs는 그리지 않는다.
- desktop과 좁은 viewport에서 palette/canvas/source/modal의 배치가 확인 가능하다.

## 범위

- 화면 설계 참고용 HTML/CSS Storybook route를 제공한다.
- 기존 SDK playground shell과 스타일을 레퍼런스에 맞추되 adapter 기능, source mutation, 새 editor control은 추가하지 않는다.

## 검증

- `npm run dev` 후 `/storybook.html`을 열어 reference screenshot과 나란히 보며 레이아웃 및 color/spacing hierarchy를 확인한다.
- Storybook 화면과 기존 SDK playground가 별도 route로 열리고, Storybook 조작이 SDK value/callback을 바꾸지 않는지 확인한다.

## 결과 저장 위치

`storybook.html`, `src/storybook.ts`, `src/styles/storybook.css`, `src/styles/dev.css`, `src/dev.ts`, `.local/docs/development.md`

## UX/UI 기준 문서

- [편집기 UI/UX 와이어프레임](../ux-ui/UI-UX-WIREFRAME.md): 사용자가 보는 단일 다이어그램 화면과 조작 흐름
- [팔레트 카탈로그](../ux-ui/PALETTE-CATALOG.md): Mermaid Visual Editor v2.5.0 기준 12개 종류의 그룹·항목·아이콘·순서

위 문서들은 구현 접근이나 SDK API를 정하지 않는 사용자 화면 명세다. Storybook reference 화면을 검토할 때 함께 참조한다.

## 선행 작업

없음
