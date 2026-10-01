# 오늘의 서울 기온 — ALEPH 과제 4

비밀키 없이 MET Norway의 서울 중심 좌표 현재 시간대 기온 예측값을 조회합니다. 현장 실측값이 아닙니다. 실제 데이터와 공식 합성 fixture는 분리됩니다.

## 화면
- 현재 시간대 예측 기온, °C, 공개 출처 URL, 출처 시각, 서버 조회 시각, Asia/Seoul 표시.
- 성공 조회를 `seoul-temperature:YYYY-MM-DD` 키로 D1에 원자적 upsert. 같은 KST 날짜는 한 행, 다음 날짜는 새 행.
- 외부 실패 때 새 값을 저장하지 않고 마지막 정상값·일별 기록을 보존. timeout / auth / rate_limit / offline / schema_error를 구분.
- 기록이 1시간 이상 지나면 오래된 값으로 표시. 조회 실패는 stale/error로 표시하고 다시 시도 제공.
- 날짜별 원자료·정규화 저장값·화면값을 펼쳐 대조 가능. 차이는 최신 기록 값 - 이전 기록 값. 날짜가 연속하면 어제 대비, 연속하지 않으면 이전 기록 대비로 표시.

## 실제 이틀 확인
1. 첫 KST 날짜에 ‘실제 조회’를 누르고 성공 값·단위·출처 시각·조회 시각을 확인.
2. 다른 실제 KST 날짜에 다시 조회. 최종 제출 시 정확히 2건인지 확인.
3. 각 날짜의 원자료·저장값·화면값과 두 값의 차이를 대조.
4. 공식 계약의 봉인 영수증 `t04_day` 정확히 2건은 ALEPH 플랫폼에서 남겨야 함. 이 앱은 플랫폼 영수증을 생성하거나 가장하지 않음. 합성 날짜는 실제 이틀을 대신하지 않음.

## 합성 확인
‘합성 실패 검사’에서 실패 5종을 각각 선택. 버튼마다 공식 D1-A→D1-B로 초기화 후 실패를 재생하여 105 pt / 1행 / stale을 확인. ‘다시 시도 · D2 복구’는 공식 T04-RECOVER-D2를 재생하여 120 pt / 2행 / fresh / none. 반복 복구도 2행 유지.
‘전체 자동 검사’는 같은 날짜 세 번, 다음 날짜, 다섯 실패와 반복 회복을 실제 reducer로 검증.

## 출처와 고정 자산
실제 API: https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=37.5665&lon=126.9780
공식 설명: https://api.met.no/weatherapi/locationforecast/2.0/documentation
서울 공통 좌표를 사용하며 개인 위치나 개인 기록을 수집하지 않음. 기온은 현재 시각 이하의 가장 최근 모델 예측값(최대 1시간 차이)이며 현장 관측소 측정값으로 표현하지 않음. 제공처: MET Norway, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). 응답의 Expires까지 저장된 원자료를 재사용하며 새로운 조회로 가장하지 않음. 429 이후 10분은 추가 요청을 하지 않음. 초기 Open-Meteo 서버 경로의 지속적인 429로 제공처를 전환함. 오늘 성공 조회가 같은 날짜의 행을 갱신하고, 내일도 MET Norway를 사용해야 같은 원천의 두 실제 기록을 비교할 수 있음.
자산 package ID: aleph-t04-real-information-board-public-contract-v2
공식 ZIP: https://aleph-omega.vercel.app/assets/studio-task-assets/t04-real-information-board/t04-real-information-board-public-v1.zip
`public/t04/asset-manifest.json`의 17개 SHA-256을 검증. 원본 자산은 수정하지 않음. 검증 결과는 `public/t04/hash-verification.json`.

## 실행
Node 22 이상. `pnpm install`, `pnpm dev`. Sites 배포용 설정은 `.openai/hosting.json`, D1 논리 binding은 DB. `pnpm db:generate`로 migration 생성, 배포 시 적용.
검증: `node scripts/verify.mjs`, `node node_modules/typescript/bin/tsc --noEmit`.
공개 소스 출력: `node scripts/source-snapshot.mjs`. 전체 프로젝트 파일을 JSON/ZIP으로 만들며 출력 자체는 Git에서 제외. 소스 URL은 실제 전체 commit을 포함한 `/source?commit=<full SHA>`로 제출. 이후 수정·배포 시 소스 snapshot 및 제출 commit도 함께 갱신해야 함.

## 개인정보와 비밀값
API 키 없음. 클라이언트 입력값을 서버에 받아 저장하지 않음. 공개 GET는 기상 기록만 반환하며 공개 POST는 고정 API만 조회. 소스·배포 출력에 인증정보를 넣지 않음. 합성 상태 초기화는 실제 D1 기록에 영향을 주지 않음.

## 제출문 초안
위치: 공개 정보판의 ‘실제 데이터’ 및 ‘합성 실패 검사’ 탭.
행동: ① 실제 데이터와 일별 2건 대조 ② 합성 실패 선택 ③ 다시 시도 또는 전체 자동 검사.
통과: 실제 2건·원자료/저장값/화면값·차이가 일치하며, 실패 시 105 유지, 복구 시 120/2행/fresh/none.
안 될 때: 실패 원인·오래된 값·다시 시도가 표시되고 정상 기록은 유지.

AI에게 맡긴 일: 화면·조회·저장·합성 재생 구현과 공식 자산 검사.
직접 판단한 일: [학생이 직접 확인하고 판단한 내용을 제출 전에 입력]
AI 제안을 따르지 않은 일: [실제로 따르지 않은 제안 또는 없었던 이유를 입력]
