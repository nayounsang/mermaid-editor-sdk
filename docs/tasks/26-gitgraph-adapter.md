# 26. Gitgraph adapter

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

기준 구현의 gitgraph 편집을 옮긴다.

## 산출물과 완료 조건

명령 순서·branch/commit 참조 보존 fixture를 만족한다.

## 구현 범위

- 기준 구현과 같은 6개 source snippet을 click/drop으로 삽입한다. 기존 명령 순서, branch/commit 참조, metadata와 source 바이트는 그대로 유지한다.
- 반복 삽입 시 commit ID(`msg`, `msg2`...)와 branch 이름(`feature`, `feature2`...)을 고유하게 만든다. Checkout은 설정된 main branch가 source에서 다르면 그 branch를 참조한다. Merge는 현재 branch와 head가 다른 committed branch를 골라 추가하고, main branch 설정을 판독할 수 없거나 merge가 불가능한 graph에서는 상태 의존 삽입을 거부한다. 그래프 직접 선택/구조 편집은 원본에도 없다.
- shared palette factory와 source scanner를 사용하며 새로운 의존성은 없다.

## 검증

- Node 22.21.0: 전체 25개 테스트 파일, 297개 테스트 통과. lint, typecheck, build 통과.
- fixture의 기존 command 순서, branch 순서, commit ID/tag, merge 양쪽 부모와 추가 commit의 부모를 Mermaid DB로 확인했다. 반복 ID/branch, 사용자 정의 main, 공백/escaped quote 이름과 무효 merge 거부도 검증했다.

## Strict review

- 최종 P/R/T: No findings / No structural findings / No test-quality findings. 초기 리뷰에서 발견한 중복 commit ID, 잘못된 merge 참조, main branch metadata 오인식은 보완 후 재검토했다.
- Dependency / Ecosystem candidates: 없음. 새 의존성 없이 공통 adapter factory와 source scanner를 사용한다.
- Candidate risks / residual coverage: flow-style YAML의 mainBranchName이나 cherry-pick 등 topology를 안전하게 모델링하지 못하는 source는 상태 의존 삽입을 거부한다. Gitgraph 전용 click/cleanup 테스트가 있고, 공통 drop/lifecycle은 Journey adapter 테스트에서 검증한다.
- 검토 범위: behavior, security, performance, architecture/naming, test quality, dependency reuse, ecosystem/catalog/registry.

## 결과 저장 위치

코드 및 type별 round-trip 테스트/fixture

## 선행 작업

16
