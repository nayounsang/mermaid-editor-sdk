# 01. 기준 구현과 저장소 확인

## 기준

| 항목 | 값 |
|---|---|
| upstream | [NextGenPowerToys/mermaid-visual-editor](https://github.com/NextGenPowerToys/mermaid-visual-editor) |
| 기준 브랜치 | `main` |
| 기준 커밋 | [`8f9bbc90f9f33a13cb5e2eda44100856795c4c01`](https://github.com/NextGenPowerToys/mermaid-visual-editor/tree/8f9bbc90f9f33a13cb5e2eda44100856795c4c01) (`Release 2.5.0`) |
| upstream 라이선스 | MIT (`Copyright (c) 2026 NGPowerToys`) |
| Mermaid | 11.15.0, HTML 안에 inline bundle |

## 재현 가능한 소스 확보

```sh
git clone https://github.com/NextGenPowerToys/mermaid-visual-editor.git
git -C mermaid-visual-editor checkout --detach 8f9bbc90f9f33a13cb5e2eda44100856795c4c01
git -C mermaid-visual-editor rev-parse HEAD
```

마지막 명령은 위의 전체 commit hash를 출력해야 한다. `main`은 기준 위치를 설명할 뿐, 조사 결과를 재현할 때는 반드시 hash로 checkout한다. 이번 조사는 해당 hash를 detached HEAD로 확인했다.

## 확인한 주요 파일

| 파일 | 용도와 관찰 |
|---|---|
| `vscode-extension/media/mermaid-editor.html` | 편집기 UI, 편집 로직, Mermaid 11.15.0 bundle 및 일부 bundle license 주석을 포함한 약 3.48 MB 단일 HTML. |
| `vscode-extension/extension.js` | VS Code Webview 생성, HTML/CSP/bridge 주입, 메시지 처리, Markdown block 추출, 저장·export 및 Extension 명령. |
| `vscode-extension/README.md` | 사용 흐름, 지원 유형, 단축키 및 기능 설명. |
| `vscode-extension/package.json` | VS Code Extension metadata, contribution point 및 package entry. 별도 editor module/build script는 정의하지 않는다. |
| `vscode-extension/LICENSE`, `vscode-extension/THIRD-PARTY-LICENSES` | 앱 및 Mermaid 고지. HTML 안에도 Mermaid 고지가 있다. |
| `vscode-extension/.vscodeignore` | VSIX에서 `.git`, `node_modules`, map, VS Code 설정을 제외한다. |
| `README.md`, `LICENSE`, `THIRD-PARTY-LICENSES`, `samples/` | upstream 저장소 문서, 라이선스, 예제. |

기준 tree는 40개 파일이며, 별도 `src/`, package lockfile, HTML 생성기 또는 재사용 가능한 editor 모듈은 없다. VSIX는 기존 HTML을 직접 포함하는 구조다. `extension.js`가 HTML을 읽어 Webview에 전달하며 Mermaid bundle은 thumbnail picker에서도 재사용한다.

## 현재 대상 저장소

현재 작업 디렉터리는 `mermaid-editor-sdk`이며, 조사 시점에는 `docs/`의 설계·task 문서만 있고 앱 소스, `package.json`, 테스트 또는 build 설정이 없다. 따라서 task 08은 기존 target 코드를 추출하는 작업이 아니라, 새 SDK package의 구조를 정하는 설계 결정이다.

## 경계 결론

기준 Extension에는 editor 기능과 host 기능이 한 HTML/JS 경로에 섞여 있다. SDK 추출은 HTML을 최종 산출물로 복사하는 방식이 아니라 editor 동작을 모듈 source로 옮기는 작업이다. Markdown 탐색, VS Code API, workspace/file I/O는 target에 옮기지 않는다.
