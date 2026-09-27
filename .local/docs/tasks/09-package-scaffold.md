# 09. package scaffold

## 상태

- [ ] 대기
- [ ] 진행 중
- [x] 완료

## 목적

합의한 package exports, browser build, 타입 선언 생성을 구성한다.

## 산출물과 완료 조건

빈 container에서 import 가능한 최소 package 골격을 만든다.

## 결과 저장 위치

코드

## 선행 작업

08

## 구현 및 검증

- Vite에서 ESM/CJS package entry, browser IIFE와 `style.css`를 생성하고 TypeScript declaration emit을 분리했다.
- ESLint flat config와 `npm run lint`를 추가해 review prerequisite를 구성했다.
- ESM/CJS import, IIFE global export, 선언·CSS 산출물 존재, lint, typecheck, build를 확인했다.
- `npm test`: 16 passed. `npm pack --dry-run`: 132 files / 11,789,531 unpacked bytes; package exports, declaration, CSS와 notice가 포함되고 sourcemap은 제외된다.

### `$strict-review`

- 범위: `package.json`, `package-lock.json`, Vite/TypeScript/ESLint 설정, `src/index.ts`, style entry와 packed entry path. Caller는 `exports`/`main`/`module`/`browser`/`types` 필드이며 consumer boundary는 ESM/CJS/IIFE import다.
- 검증 근거: lint/typecheck/test/build 통과, npm pack dry-run manifest 확인, ESM/CJS import 및 IIFE global smoke check.
- correctness, security, performance, architecture/refactoring, semantic naming, test-quality, dependency 및 ecosystem pass 결과: **No P/R findings / No structural findings / No test-quality findings.**
- 빠진 문맥: actual consumer CSP browser run은 task 32 범위다. 보안 dependency 조정은 task 10에서 검토했다.
