# 19. Class adapter

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기준 구현의 class 편집을 옮긴다.

## 산출물과 완료 조건

Class diagram adapter가 class 추가·선택·이름 변경·삭제, member 편집, fill/stroke 설정, 관계 추가·선택·endpoint/operator 편집·삭제를 제공한다. 새 class는 생성 직후 선택하고 이름 입력에 포커스한다. class 이름을 두 번 클릭하면 이름 필드가 바로 활성화되며, 저장 후에도 선택을 유지한다. 연결 모드는 선택 시작점과 다음 동작을 캔버스에서 안내한다. `class-preservation` fixture는 namespace, annotation, generic/member 문법, 관계 multiplicity, comment를 둔 채 member와 관계만 수정한다. 안전한 statement 범위를 증명하지 못하는 구문은 mutation을 거부한다.

## 검증

- `npm test -- --pool=forks --maxWorkers=1`: 9개 파일, 128개 테스트 통과. pinned Mermaid parser로 fixture의 변경 전후 source를 확인한다.
- `npm run lint`, `npm run typecheck`, `npm run build`: 통과.
- 관계와 member의 mutation은 statement span만 바꾸고, 중복 member·불명확한 관계·지원하지 않는 참조 변경은 `AmbiguousSourceMutationError`로 거부한다.

## 보존 범위

- Member editing은 한 줄짜리 member statement를 대상으로 한다. 기존 `class ID : member` 구문은 해당 형식으로 수정·추가하며, `class ID`만 선언된 클래스는 첫 멤버를 추가할 때 안전한 block으로 바꾼다. 중복/불완전한 block은 거부한다.
- Mermaid 11.17.2의 pinned parser는 `class ID : member` 형태의 입력을 렌더링하지 못한다. 해당 형태의 텍스트 mutation은 forward-compatible 보존 기능이며, 현재 어댑터 UI는 렌더된 다이어그램에서만 접근할 수 있다.
- Class ID 변경/삭제는 선언 및 파싱 가능한 관계 문장 밖에서 ID가 참조되면 거부한다. 주석은 원문으로 남긴다.
- Namespace 내부 class member, annotation, generic 및 relation cardinality는 fixture로 보존을 확인한다. 기타 class syntax는 source 편집으로 유지한다.

## 결과 저장 위치

코드 및 type별 round-trip 테스트/fixture

## 선행 작업

16
