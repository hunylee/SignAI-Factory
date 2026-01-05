/**
 * SignAI-Factory Express 서버
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

// 라우터 임포트
const competitionsRouter = require('./routes/competitions');
const submissionsRouter = require('./routes/submissions');
const { router: authRouter } = require('./routes/auth');
const socialAuthRouter = require('./routes/social-auth');

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// API 라우트
app.use('/api/auth', authRouter);
app.use('/api/auth', socialAuthRouter);  // 소셜 로그인
app.use('/api/competitions', competitionsRouter);
app.use('/api/submissions', submissionsRouter);

// 헬스 체크
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SignAI-Factory API 정상 작동 중' });
});

// 서버 시작
const PORT = config.server.port;
app.listen(PORT, () => {
    console.log('');
    console.log('🤟 ================================');
    console.log('   SignAI-Factory 서버 시작!');
    console.log('   http://localhost:' + PORT);
    console.log('🤟 ================================');
    console.log('');
    console.log('📌 API 엔드포인트:');
    console.log('   GET  /api/competitions     - 공모전 목록');
    console.log('   GET  /api/competitions/:id - 공모전 상세');
    console.log('   POST /api/competitions     - 공모전 생성 (관리자)');
    console.log('   POST /api/submissions      - 제출물 등록');
    console.log('');
});

module.exports = app;
