# 32. CSP 브라우저 검증

## 상태

- [ ] 대기
- [x] 진행 중
- [ ] 완료

## 목적

browser bundle을 consumer CSP에서 실행해 unsafe-eval 요구를 확인한다.

## 산출물과 완료 조건

핵심 동작의 재현 가능한 결과와 CSP 제약을 기록한다.

## 결과 저장 위치

문서: .local/docs/validation/csp-browser.md. 재현 스크립트가 필요하면 코드 저장소에 둔다.

## 선행 작업

10, 13, 16

## 작업 기록

- Browser IIFE 및 stylesheet build가 생성됐다.
- Google Chrome에서 `script-src 'self'` 정책과 `script-src 'self' 'unsafe-eval'` 대조 조건으로 bundle을 실행했다. 초기 Mermaid SVG 렌더, source 수정과 `onChange`, host `setValue()` 동기화가 두 조건에서 통과했고 CSP violation event는 없었다.
- 재현 방법과 policy 범위는 `.local/docs/validation/csp-browser.md`에 기록했다.
- upstream baseline Extension은 inline bridge와 Mermaid 11.15.0 때문에 `unsafe-inline 'unsafe-eval'` 정책을 사용한다. SDK IIFE가 tested flow에서 eval 없이 동작하는 차이는 의도된 것으로 분류해 사용자 검토를 기다린다. 검토 전까지 이 task는 진행 중이다.
