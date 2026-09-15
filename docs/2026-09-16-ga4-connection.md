# 골드만 GA4 읽기 연결 파일럿

## 범위와 현재 상태

- 사용자 제공 GA4 속성 ID는 `421090862`. 화면의 데이터 스트림 ID `6495995154`와 다르다.
- 골드만의 기존 UI/메뉴/색상/카드 배치를 보존하고 연동 카드와 AI 추천 유입 카드에 기능을 연결했다. 위드유 자료·일정·화면은 변경하지 않는다.
- 연결 기능 코드는 구현됐지만 Google OAuth 클라이언트 설정·동의가 아직 없어 **실제 계정 연결 및 실측 보고서 검증은 미완료**다. 숫자를 샘플로 대체하지 않는다.
- 방문·활성 사용자·주요 이벤트·유입 출처·이벤트 수·AI referral 유입과 일별 추이를 조회한다. AI 답변 원문/언급률/인용률, 예약 환자 수, 발행 효과의 인과관계는 측정하지 않는다.

## 운영자가 준비할 설정

1. Google Cloud 프로젝트에서 Google Analytics Data API를 활성화한다.
2. Google Auth Platform의 브랜드/동의 화면을 설정한다. 테스트 모드라면 속성 읽기 권한이 있는 운영자를 테스트 사용자로 등록한다.
3. OAuth 클라이언트 유형은 Web application. 승인된 리디렉션 URI:
   `https://mediaanswer-aeo.fullmoon9289.chatgpt.site/api/ga4/callback`
4. 아래 값은 Sites production environment에 넣고 적용 배포한다. `.openai/hosting.json`, 프런트엔드, Git, 채팅에 비밀값을 넣지 않는다.

| 키 | 값 | 비밀 설정 |
| --- | --- | --- |
| `GOOGLE_GA4_CLIENT_ID` | 생성한 웹 OAuth 클라이언트 ID | 권장 |
| `GOOGLE_GA4_CLIENT_SECRET` | 해당 클라이언트의 비밀값 | 필수 |
| `GA4_TOKEN_ENCRYPTION_KEY` | 암호학적 난수 32바이트를 64자리 hex로 인코딩 | 필수 |

암호화 키는 연결 후 임의 교체하면 저장된 refresh token을 복호화할 수 없다. 키 교체 절차/재연결을 함께 준비한다. 아직 구성된 연결이 없으므로 이번 구현에서 임의로 Google 자격 증명을 생성하거나 계정 설정을 변경하지 않았다.

5. 메디앤서 → 골드만 → 연동 및 설정 → Google 계정으로 GA4 연결. 승인 계정은 이 GA4 속성에서 최소 Viewer 권한이 필요하다.
6. 연결 후 최근 7/28/90일과 직접 기간을 각각 조회하고, GA4 화면의 **동일 속성·시간대·기간·필터**와 대조한다. 대조 완료 전 실제 연결 검증 완료로 기록하지 않는다.

Google External + Testing의 비기본 scope refresh token은 7일 만료 대상이다. 실제 고객 서비스 전에는 Google 앱 검증 요건, 개인정보처리방침, 운영자 소유 도메인 및 배포 출처를 확인한다. 임시 호스팅 도메인의 소유권을 운영자가 증명할 수 있다고 가정하지 않는다.

## 인증·보관

- 현재 Sites 접근 정책은 소유자 1명만 접근 가능한 비공개로 확인했다. 정책을 확대하지 않는다. 다병원 고객 공개 전 별도의 조직/병원 멤버십 검증이 필요하다.
- Sites dispatcher의 `oai-authenticated-user-id`가 없는 GA4 API 요청은 거절한다. 서버에서 골드만/속성 ID를 고정하고 연결은 사용자별로 격리한다. 사용자 이메일을 인증 키로 삼지 않는다.
- Google OAuth는 Site 로그인 대체가 아니라 외부 분석 자료 읽기 권한이다. scope는 `analytics.readonly` 하나다.
- 시작/해제는 같은 origin POST. PKCE S256, 10분 state, HttpOnly/Secure/SameSite=Lax 바인딩 쿠키를 사용한다. state의 원자적 claim과 최종 조건부 저장으로 재사용, 타 사용자, 만료, 연결 해제/새 시도와의 경쟁을 거절한다.
- refresh token과 PKCE verifier는 AES-GCM으로 암호화하며 사용자/병원/속성/연결 ID 문맥을 결합한다. access token은 요청 메모리에만 둔다. 토큰 및 Google 원문 오류를 클라이언트나 로그로 반환하지 않는다.
- 신규 `ga4_connections`, `ga4_oauth_states`만 추가한다. 기존 자료 마이그레이션은 수정하지 않는다.
- 해제는 메디앤서의 해당 사용자 골드만 토큰과 진행 시도만 삭제한다. Google 프로젝트 전체 revoke는 다른 연동에도 영향이 있어 자동 수행하지 않는다. Google 계정의 서드파티 앱 접근 권한은 사용자가 별도로 취소할 수 있다.

## 측정 정의와 한계

- 기본 기간은 GA4 속성 시간대의 어제까지 28일. 오늘/미래/잘못된 날짜/366일 초과는 거절한다.
- `activeUsers`는 기간 총계를 직접 가져오며 일별 사용자 수를 더하지 않는다. `keyEvents`와 이벤트 발생 수를 예약 완료 또는 환자 수로 치환하지 않는다.
- AI 추천 유입은 명시된 AI 서비스 도메인 + `sessionMedium=referral` 조합만 집계한다. 광고/일반 Google 검색/비슷한 도메인/UTM 이름을 근거로 AI 추천을 추정하지 않는다. 누락된 referrer는 복원하지 못한다.
- 일별·출처·랜딩페이지·이벤트 보고서를 별도로 요청한다. 5개 보고서 중 하나라도 실패하면 이전 값을 현재 성과처럼 표시하지 않는다. Google 표본·threshold·(other) 경고를 노출한다.
- 각 보고서 최대 10,000행. 초과 시 일부 합계를 전체처럼 표시하지 않고 기간 축소를 요청한다. 추가 pagination은 후속 개선 범위다.
- 쿼리 문자열/fragment 및 식별자 형태 페이지 경로, 이메일·전화번호 형태 출처/이벤트명은 표시하지 않는다. 이것은 GA4 원본의 개인정보 유입을 해결하는 기능이 아니다. 환자 식별 정보·상담 내역은 원래부터 Google Analytics에 보내지 않아야 한다.
- 연결과 마지막 조회 시각은 D1에 저장한다. 집계 보고서는 조회 시 반환하고 장기 보관하지 않는다. 화면 진입/조회 때만 읽으며 백그라운드 정기 수집은 없다.
- PDF의 기존 진단 범위는 변경하지 않았다. 새 GA4 표를 PDF에 포함하는 기능은 후속 범위다.

## 검증 기록

- 합성 Google 응답 + 실제 인메모리 SQLite로 인증, scope/PKCE, 사용자 격리, 암호화, state 만료/재사용, 연결 해제 경쟁, refresh 실패, 기간 검증, 부분 응답 거절을 테스트한다.
- 기존 CSV/질문/일정/골드만 화면 회귀 테스트를 함께 실행한다.
- 로컬 light preview는 화면 HTTP 렌더링용이며 Cloudflare D1/Google 인증 실행 검증을 대체하지 않는다.
- OAuth 동의 성공, 실제 GA4 보고서 대조, 브라우저 인증 왕복은 외부 Google 설정 후 필수 수동 검증 항목이다.

## 공식 참고 자료

- [Google Web Server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server)
- [OAuth token expiration](https://developers.google.com/identity/protocols/oauth2#expiration)
- [GA4 Data API batchRunReports](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/batchRunReports)
- [GA4 checkCompatibility](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/checkCompatibility)
- [GA4 dimension/metric definitions](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
