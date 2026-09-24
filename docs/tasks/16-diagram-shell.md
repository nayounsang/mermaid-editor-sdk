# 16. 공통 GUI shell

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

type adapter가 공유하는 canvas, 도구 영역, 선택 및 source 반영 경계를 만든다.

## 산출물과 완료 조건

공통 adapter 계약과 편집 shell을 제공한다.

## 결과 저장 위치

코드 및 테스트

## 선행 작업

12, 13, 15

## 구현 및 검증

- 공통 workspace에 Mermaid canvas, source panel, adapter 도구 영역을 배치했다. adapter가 없으면 source 편집과 preview를 유지하고 도구 영역은 감춘다.
- 내부 `DiagramAdapter` 계약은 rendered SVG와 `SourceDocument` snapshot을 받고, 변경은 `SourceDocument` mutation 함수로 runtime에 돌려준다. runtime은 전체 source를 동기 반영해 `onChange`로 알리고 selection snapshot은 freeze해 전달한다.
- input, external update, 재렌더와 destroy에서 adapter cleanup을 호출한다. 오래된 adapter context의 mutation/selection, mount 중 destroy 및 host callback 재진입은 render revision과 active guard로 차단한다.
- Mermaid `RenderResult.diagramType`을 capability와 adapter lookup에 사용한다. 별도 `detectType()` 호출을 없애고 실제 렌더 결과의 type으로 분류한다.
- `$strict-review`: 최종 correctness/security/performance에서 P findings 없음. 구조·의미 및 test-quality findings 없음. 최초 review의 정상 destroy cleanup 및 `onChange` 중 stale selection findings를 수정하고 cleanup/reentrancy 회귀 테스트를 추가했다. Dependency candidates 없음. Ecosystem candidate: 향후 third-party Mermaid diagram plugin을 지원하려면 Mermaid 공유 instance/registration bridge와 해당 adapter가 필요할 수 있다. 현재 12개 built-in adapter 범위 밖이며 blocker가 아니다. 참고: [Mermaid API](https://mermaid.js.org/config/setup/mermaid/interfaces/Mermaid.html), [Vite library mode](https://v6.vite.dev/guide/build).
- test-quality 확인 범위: source sync/reentrant update, status/parse/render 실패, burst input, adapter mount/source mutation/selection, unsafe mutation 거부, stale callback 및 destroy cleanup. Arrange/Act/Assert가 각 scenario에 맞고 caller-facing contract를 관찰한다.
- `npm run lint`, `npm run typecheck`, `npm test` (27 passed), `npm run build` 통과.
