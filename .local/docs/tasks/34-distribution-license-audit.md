# 34. 배포 license audit

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

실제 package 산출물의 코드/자산과 제3자 고지를 대조한다.

## 산출물과 완료 조건

누락 없는 고지 및 재현 가능한 감사 기록을 만든다.

## 완료 기록

- `npm run audit:distribution`으로 source map의 package/version inventory와 실제 npm tarball을 대조한다.
- 48개 package/version 모두 고지 파일에 license/notice 원문이 포함되어 있고, 최종 tarball에 두 고지 파일이 포함되는 것을 확인했다.
- 감사 결과와 재현 절차: [distribution license audit](../validation/distribution-license-audit.md).

## 결과 저장 위치

문서: .local/docs/validation/distribution-license-audit.md 및 package license notice 파일

## 선행 작업

05, 10
