# SignAI-Factory 🤟

수어(手話) 데이터 수집 공모전 플랫폼

## 📌 프로젝트 소개

SignAI-Factory는 수어 학습용 AI 모델을 위한 데이터를 수집하는 공모전 플랫폼입니다.
참여자들이 수어 영상을 제출하고, 보상을 받을 수 있습니다.

## 🚀 시작하기

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2A%2Agithub.com%2Fhunylee%2FSignAI-Factory)

### 필수 요구사항
- Node.js 18+
- PostgreSQL 18+

### 설치

```bash
# 패키지 설치
npm install

# 데이터베이스 설정
node db/setup.js

# 관리자 계정 생성
node db/setup-admin.js

# 서버 실행
npm start
```

### 접속
- 홈페이지: http://localhost:3000
- 관리자: http://localhost:3000/admin

## 📂 프로젝트 구조

```
SignAI-Factory/
├── index.html          # 메인 페이지
├── detail.html         # 공모전 상세
├── login.html          # 로그인
├── signup.html         # 회원가입
├── admin/              # 관리자 페이지
├── js/                 # 프론트엔드 JS
├── server.js           # Express 서버
├── config.js           # 설정
├── config/oauth.js     # 소셜 로그인 설정
├── db/                 # DB 설정
└── routes/             # API 라우트
```

## 🔑 관리자 로그인

```
이메일: admin@signai.kr
비밀번호: admin1234
```

## 📡 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/competitions | 공모전 목록 |
| GET | /api/competitions/:id | 공모전 상세 |
| POST | /api/competitions | 공모전 생성 |
| POST | /api/submissions | 제출물 등록 |
| POST | /api/auth/login | 로그인 |
| POST | /api/auth/signup | 회원가입 |

## 🌐 소셜 로그인 설정 (선택)

`config/oauth.js` 파일에서 각 서비스의 API 키를 설정하세요:
- Google: [console.cloud.google.com](https://console.cloud.google.com)
- Naver: [developers.naver.com](https://developers.naver.com)
- Kakao: [developers.kakao.com](https://developers.kakao.com)

## 📝 라이선스

MIT License
