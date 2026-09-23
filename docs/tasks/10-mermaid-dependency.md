# 10. Mermaid 의존성 고정

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

버전 고정, bundle 포함 방식, license notice 연결을 구현한다.

## 산출물과 완료 조건

재현 가능한 dependency와 산출물 고지 경로를 만든다.

## 결과 저장 위치

코드 및 package에 포함되는 license notice

## 선행 작업

05, 08, 09

## 구현 및 검증

- SDK renderer는 `mermaid@11.17.2` exact dependency를 번들한다. upstream 조사에서 확인한 `11.15.0`은 historical baseline으로 유지하되, `npm audit` 권고에 포함된 취약 범위를 피하도록 target version을 갱신했다.
- `THIRD-PARTY-LICENSES`를 package files에 포함한다. build sourcemap에서 실제 package path와 중첩 버전을 수집해 47개 package/version의 license 및 notice 원문을 생성한다. task 34에서 최종 npm tarball과 prebundled vendor code를 다시 감사한다.
### `$strict-review`

- 범위: exact Mermaid pin/lock, Vite bundling, source-map-based notice generator, `THIRD-PARTY-LICENSES`와 npm `files` boundary. Runtime caller는 `src/runtime/create-editor.ts`의 `parse`/`detectType`/`render` 호출이다.
- 검증 근거: lint/typecheck/test/build 통과, `npm audit` 0 vulnerabilities, 47 package/version license entries, npm pack dry-run.
- correctness, security, performance, architecture/refactoring, semantic naming pass 결과: **No P/R findings / No structural findings.** 첫 검토의 security advisory, copyright text, 중첩 dependency version 및 bundle size 이슈를 수정했다.
- Dependency candidate: [`rollup-plugin-license`](https://www.npmjs.com/package/rollup-plugin-license) (미설치, medium confidence). Rollup output에서 third-party notice를 생성하는 기능이 겹친다. 현재 generator는 output sourcemap에서 실제 포함 package와 중첩 version별 license 원문을 복사한다.
- Residual risk: Mermaid 자체 배포본 안에 이미 vendored된 code가 sourcemap inventory에 완전히 드러나는지는 최종 tarball audit에서 확인한다(task 34).
- Ecosystem pass: ESM/CJS dynamic chunks, IIFE single-file global, CSS subpath는 build contract에 맞게 생성된다. CSP 실행은 task 32에서 확인한다.
