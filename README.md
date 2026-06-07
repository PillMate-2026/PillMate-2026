# PillMate

PillMate는 집에 보관 중인 의약품을 등록하고 유통기한을 관리할 수 있는 웹 서비스입니다.

약 이름 검색, OCR 등록, 가족 약장 공유, 유통기한 알림, 폐의약품 수거함 안내, 증상 기반 보유약 추천 기능을 제공합니다. 개인 약장과 가족 약장을 모두 지원해 여러 사용자가 함께 의약품 정보를 관리할 수 있습니다.

## 배포 주소

http://34.50.48.84:3000

## 기술 스택

| 분류 | 기술 |
| --- | --- |
| Backend | Node.js, Express.js |
| Templating | EJS |
| Database | MySQL |
| Infrastructure | GCP Compute Engine (e2-medium) |
| External API | 식약처 공공 API, 카카오맵 API |
| Version Control | Git, GitHub |
| Design | Figma |

## 사용 라이브러리

| 라이브러리 | 사용 이유 |
| --- | --- |
| `express` | Node.js 환경에서 웹 서버와 라우팅을 구성하기 위해 사용 |
| `ejs` | 서버 데이터를 HTML 화면에 렌더링하기 위해 사용 |
| `dotenv` | DB 정보와 API 키를 환경 변수로 분리해 관리하기 위해 사용 |
| `mysql2` | MySQL 데이터베이스 연결과 쿼리 실행을 위해 사용 |
| `express-session` | 로그인 상태를 세션으로 유지하기 위해 사용 |
| `passport` | 인증 흐름을 구조화하기 위해 사용 |
| `passport-local` | 아이디와 비밀번호 기반 로그인을 처리하기 위해 사용 |
| `passport-google-oauth20` | Google OAuth 로그인을 지원하기 위해 사용 |
| `bcrypt` | 사용자 비밀번호를 해시 처리해 저장하기 위해 사용 |
| `multer` | OCR 등록에 필요한 이미지 파일 업로드를 처리하기 위해 사용 |
| `@google-cloud/vision` | 업로드된 약 이미지에서 텍스트를 추출하기 위해 사용 |
| `axios` | 식약처 공공 API 호출과 외부 HTTP 요청 처리를 위해 사용 |
| `xml2js` | XML 형태의 API 응답을 JavaScript 객체로 변환하기 위해 사용 |
| `node-cron` | 정해진 시간에 유통기한 알림 작업을 실행하기 위해 사용 |
| `nodemon` | 개발 중 파일 변경 시 서버를 자동 재시작하기 위해 사용 |

## 프로젝트 구조

```text
pillmate/
├── app.js                    # Express 앱 진입점
├── config/                   # DB, Passport 설정
├── controllers/              # 화면 및 API 요청 처리
├── db/                       # DB 연결, 스키마, 시드 데이터
├── middleware/               # 공통 미들웨어
├── models/                   # DB 접근 로직
├── public/                   # CSS, JS, 이미지 정적 파일
├── routes/                   # URL 라우팅
├── services/                 # 외부 API, OCR, 알림 스케줄러
├── tools/                    # 데이터 변환 도구
├── uploads/                  # OCR 이미지 업로드 임시 저장소
└── views/                    # EJS 화면 템플릿
```
