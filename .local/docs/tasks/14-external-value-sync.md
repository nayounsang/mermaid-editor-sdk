# 14. setValue 및 callback

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

host 업데이트와 내부 편집 변경의 되울림 없는 동기화를 구현한다.

## 산출물과 완료 조건

setValue는 onChange 없이 동기화되고 사용자 변경은 전체 source를 알린다.

## 결과 저장 위치

코드 및 테스트

## 선행 작업

13

## 구현 및 검증

- 사용자 source 변경은 전체 문자열을 `onChange`에 동기 전달하고, `getValue()`에서 callback 실행 중에도 새 값을 읽을 수 있음을 확인했다.
- callback에서 host가 `setValue()`로 정규화 값을 되돌려 보내도 callback echo가 없고 source와 내부 값이 동기화된다. 같은 값을 설정하면 no-op이다.
- `$strict-review`: 변경된 동기화 테스트를 검토했다. correctness/security/performance에서 P findings 없음. 테스트 품질, 구조 및 의미 검토에서도 별도 finding 없음. 재진입 시 timer가 잠깐 재예약되지만 최종 예약은 하나이며 추가 Mermaid parse/render는 없다.
- `npm run lint`, `npm run typecheck`, `npm test` (18 passed), `npm run build` 통과.
