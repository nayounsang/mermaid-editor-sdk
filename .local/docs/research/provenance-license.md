# 05. 출처·의존성·license 조사

## 기준 산출물과 출처

분석 기준은 [`8f9bbc90f9f33a13cb5e2eda44100856795c4c01`](https://github.com/NextGenPowerToys/mermaid-visual-editor/tree/8f9bbc90f9f33a13cb5e2eda44100856795c4c01)이다. `vscode-extension/media/mermaid-editor.html` 상단 attribution 및 첫 script marker가 Mermaid **11.15.0**을 명시한다. HTML에는 Mermaid MIT notice와 NGPowerToys 2026 copyright가 함께 있고, Extension `THIRD-PARTY-LICENSES`에는 Mermaid MIT 전문이 있다.

| 고지 위치 | 식별 정보 | 조치 |
|---|---|---|
| Extension `LICENSE` | NGPowerToys MIT, 2026 | SDK 코드 재사용 시 저작권 및 MIT notice 유지. |
| Extension `THIRD-PARTY-LICENSES` | Mermaid MIT, Knut Sveidqvist copyright | Mermaid를 번들하면 package 배포물에 고지 유지. |
| editor HTML 내부의 `Bundled license information` | DOMPurify 3.4.0 (Apache-2.0/MPL-2.0), js-yaml 4.1.1 (MIT), lodash-es (MIT), Cytoscape embedded notices (MIT), 기타 작은 코드의 MIT attribution | 실제 SDK bundle이 어떤 항목을 포함하는지 빌드 산출물에서 다시 확인하고, 포함된 항목의 notice와 적용 가능한 전문을 배포물에 둔다. HTML의 보조 notice를 버리고 Mermaid 고지만 복사해서는 부족할 수 있다. |
| top-level `THIRD-PARTY-LICENSES` | Mermaid third-party 고지와 일치하는지 확인 대상 | 실제 package 산출물의 dependency inventory와 대조한다. |

현재 upstream의 `vscode-extension/package.json`은 VS Code Extension manifest이며 editor npm dependency 또는 build script를 제공하지 않는다. `package-lock.json`도 기준 tree에 없고, bundle의 정확한 생성 명령 및 전체 dependency lock graph를 이 산출물만으로 재구성할 수 없다. 그러므로 HTML bundle을 그대로 package에 복사하는 행위는 재현 가능한 SDK build로 간주하지 않는다.

## 재사용 및 배포 결정

1. Extension editor의 동작과 자체 작성 UI 코드는 MIT 조건에 따라 재사용 가능하되 attribution을 유지한다.
2. 조사 당시에는 Mermaid `11.15.0`을 dependency로 고정해 package에 번들할 것을 권고했다. 구현 중 해당 버전에 대한 보안 권고를 확인해 SDK target은 같은 major의 `11.17.2`로 조정했다. 기준 구현의 provenance는 `11.15.0`으로 기록하고, SDK package는 exact version 및 lockfile로 재현한다. 세부 결정은 [build architecture](../decisions/build-architecture.md)를 따른다.
3. 번들에 실제 들어간 Mermaid 하위 의존성의 licenses를 package notice에 반영한다. 필요 시 Mermaid npm package의 공식 `LICENSE`/`LICENSES` 자료를 바탕으로 한다.
4. package license audit은 소스 manifest가 아니라 실제 `dist` 및 package tarball을 대상으로 한다(task 34). 이 조사 결과만으로 최종 배포 적합 판정을 선언하지 않는다.

## 확인된 한계

현재 HTML에는 최소한 Mermaid, DOMPurify, js-yaml, lodash-es, Cytoscape의 bundled license marker가 있다. 각각의 정확한 포함 조건과 모든 transitive third-party notice를 이 단일 HTML에서 완전히 추적할 수는 없다. task 34에서 생성물 기반으로 확정한다.
