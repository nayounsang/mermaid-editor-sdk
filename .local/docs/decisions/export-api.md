# Export API 결정

## 결정

SDK는 MVP에서 SVG/PNG export data를 반환하는 public API를 제공하지 않는다. 기존 Extension의 export 동작은 Extension이 소유하고 파일 선택과 쓰기를 처리한다.

## 이유

- SDK의 핵심 경계는 Mermaid 편집, 렌더링, source 값과 편집 이벤트다.
- 파일 저장과 경로 선택은 consumer 환경마다 다르며 host 책임으로 둔다.
- 현재 consumer 요구사항에는 host 저장과 분리된 export data API가 필요하지 않다.

향후 consumer 요구가 생기면 파일 저장 UI와 분리된 순수 데이터 반환 API로 별도 검토한다.
