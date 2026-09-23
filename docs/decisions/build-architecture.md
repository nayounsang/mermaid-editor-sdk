# 08. build 및 모듈 구조 결정

상태: **구조 결정 완료**. 구체적인 파일 scaffold와 exports는 task 09에서 구현한다.

## 결정

framework-independent TypeScript library를 새 source tree에서 구성한다. Vite library build로 ESM/CJS 및 browser IIFE 번들을 만들고, TypeScript compiler로 public `.d.ts`를 생성한다. HTML template 전체를 runtime fetch하거나 3.48 MB HTML을 불투명 artifact로 package에 내장하지 않는다.

```text
src/
  index.ts                 public factory and declarations
  runtime/                 instance lifecycle, value sync, event dispatch
  renderer/                pinned Mermaid integration, render status
  source/                  source document model and span mutations
  ui/                      editor shell, toolbar, status and source pane
  diagrams/<type>/         capability and type-specific adapters
  styles/                  owned styles, imported by package entry
dist/
  index.js                 ESM consumer entry
  index.cjs                CommonJS consumer entry
  mermaid-visual-editor.iife.js  browser global entry
  index.d.ts                public declarations
```

초기 구현에서는 `runtime`, `source`, `ui`, `renderer`, `diagrams` 경계를 유지하되, task 09가 완성 전 과도한 파일 분할은 피한다. DOM API만 사용하고 framework runtime dependency는 추가하지 않는다.

## Bundle과 package 정책

- Mermaid를 exact dependency로 고정하고 browser bundle 안에 포함한다. 기준 Webview의 역사적 버전은 `11.15.0`이지만, 해당 버전의 보안 권고를 피하기 위해 SDK target은 같은 major의 `11.17.2`로 고정한다. consumer가 Mermaid를 별도 설치하거나 전역 등록할 필요가 없어야 한다.
- Vite config는 ESM/CJS entry와 self-contained IIFE를 각각 만들고, package `exports`와 `types`가 파일을 명시한다. browser entry에는 안정적인 `MermaidVisualEditor` global을 제공한다.
- TypeScript는 declarations 생성 전용 호출(`tsc --emitDeclarationOnly`)로 Vite JS build와 분리해 type emit의 책임을 명확히 한다.
- CSS는 `dist/style.css`로 생성하고 package subpath로 export한다. host global CSS에 selector leakage가 없도록 모든 SDK selector를 root namespace 아래 둔다. Browser IIFE consumer도 bundle 옆 stylesheet를 로드한다.
- package는 server/Node runtime, VS Code API, Markdown parser, filesystem, network fetch 및 file save API를 요구하지 않는다.
- build output 및 최종 package notice는 task 34에서 실제 tarball 기준으로 감사한다.

## 후보 비교

| 후보 | 장점 | 단점 | 결정 |
|---|---|---|---|
| monolithic HTML 복사 | 기존 Webview를 빠르게 재사용 | 3.48 MB opaque file, 문자열 bridge/CSP patch, module API 부재, host 전역 DOM coupling 유지 | 최종 구조로 제외. 초기 동작 분석 자료로만 활용. |
| 런타임 HTML fetch/iframe | CSS/DOM 격리 | 네트워크/asset 경로·CSP·iframe lifecycle와 host origin 제약 추가 | 제외. container에 직접 mount하는 API 요구와 맞지 않음. |
| framework-specific app | 익숙한 component 모델일 수 있음 | React/Vue 등 consumer 강제 및 runtime dependency | 제외. React wrapper 수요는 task 35에서 판단. |
| modular TS + Vite library build | 브라우저와 package 소비 형태를 한 source로 생성, ESM/CJS/IIFE 형식을 명시 가능, 선언 생성과 분리 가능 | build config와 package license inventory 필요 | 채택. |

## 번들 및 보안 결과

기준 HTML은 실행 가능한 Mermaid 11.15.0 bundle을 포함하고 Extension은 `Function()` fallback 때문에 CSP에 `unsafe-eval`을 허용한다. SDK build는 Mermaid를 dependency로 관리하되, `unsafe-eval` 요구 여부를 source scan만으로 단정하지 않는다. 실제 생성 bundle을 consumer CSP에서 실행하는 task 32를 release gate로 둔다.

## 대상 저장소 상태

이번 결정 시 대상에는 설계 문서 외 package source/build 파일이 없다. 따라서 재사용 가능한 target bundler 설정을 찾지 못했다. 새 package는 SDK 요구에 맞춰 자체 build boundary를 만들며, Extension을 consumer로 전환할 때 Extension build 요구와 SDK build 요구를 분리한다.
