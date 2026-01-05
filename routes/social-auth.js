/**
 * 소셜 로그인 API 라우트
 * Google, Naver, Kakao OAuth 처리
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const oauthConfig = require('../config/oauth');

const JWT_SECRET = 'signai-factory-secret-key-2026';

// 소셜 로그인 설정 상태 확인
router.get('/status', (req, res) => {
    res.json({
        success: true,
        providers: {
            google: oauthConfig.isConfigured('google'),
            naver: oauthConfig.isConfigured('naver'),
            kakao: oauthConfig.isConfigured('kakao')
        }
    });
});

// Google 로그인 시작
router.get('/google', (req, res) => {
    if (!oauthConfig.isConfigured('google')) {
        return res.status(503).json({
            success: false,
            error: 'Google 로그인이 설정되지 않았습니다. config/oauth.js 파일을 확인하세요.'
        });
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${oauthConfig.google.clientId}&` +
        `redirect_uri=${encodeURIComponent('http://localhost:3000' + oauthConfig.google.callbackURL)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(oauthConfig.google.scope.join(' '))}&` +
        `access_type=offline`;

    res.redirect(authUrl);
});

// Naver 로그인 시작
router.get('/naver', (req, res) => {
    if (!oauthConfig.isConfigured('naver')) {
        return res.status(503).json({
            success: false,
            error: '네이버 로그인이 설정되지 않았습니다. config/oauth.js 파일을 확인하세요.'
        });
    }

    const state = Math.random().toString(36).substring(7);
    const authUrl = `https://nid.naver.com/oauth2.0/authorize?` +
        `client_id=${oauthConfig.naver.clientId}&` +
        `redirect_uri=${encodeURIComponent('http://localhost:3000' + oauthConfig.naver.callbackURL)}&` +
        `response_type=code&` +
        `state=${state}`;

    res.redirect(authUrl);
});

// Kakao 로그인 시작
router.get('/kakao', (req, res) => {
    if (!oauthConfig.isConfigured('kakao')) {
        return res.status(503).json({
            success: false,
            error: '카카오 로그인이 설정되지 않았습니다. config/oauth.js 파일을 확인하세요.'
        });
    }

    const authUrl = `https://kauth.kakao.com/oauth/authorize?` +
        `client_id=${oauthConfig.kakao.clientId}&` +
        `redirect_uri=${encodeURIComponent('http://localhost:3000' + oauthConfig.kakao.callbackURL)}&` +
        `response_type=code`;

    res.redirect(authUrl);
});

// 소셜 로그인 공통 콜백 처리 함수
async function handleSocialCallback(provider, profile, res) {
    try {
        const { email, name, socialId } = profile;

        // 기존 사용자 확인
        let user = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (user.rows.length === 0) {
            // 새 사용자 생성
            user = await pool.query(`
                INSERT INTO users (email, name, password_hash, role)
                VALUES ($1, $2, $3, 'user')
                RETURNING *
            `, [email, name, `social_${provider}_${socialId}`]);
        }

        const userData = user.rows[0];

        // JWT 토큰 생성
        const token = jwt.sign(
            {
                userId: userData.id,
                email: userData.email,
                role: userData.role,
                name: userData.name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 클라이언트로 리다이렉트 (토큰 전달)
        res.redirect(`/login-success.html?token=${token}&user=${encodeURIComponent(JSON.stringify({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role
        }))}`);

    } catch (err) {
        console.error('소셜 로그인 콜백 오류:', err);
        res.redirect('/login.html?error=social_login_failed');
    }
}

// Google 콜백 (TODO: 실제 토큰 교환 구현 필요)
router.get('/google/callback', async (req, res) => {
    const { code } = req.query;

    // TODO: code를 사용하여 access_token 획득 후 사용자 정보 조회
    // 현재는 플레이스홀더
    res.redirect('/login.html?error=google_not_configured');
});

// Naver 콜백 (TODO: 실제 토큰 교환 구현 필요)
router.get('/naver/callback', async (req, res) => {
    const { code, state } = req.query;

    // TODO: code를 사용하여 access_token 획득 후 사용자 정보 조회
    res.redirect('/login.html?error=naver_not_configured');
});

// Kakao 콜백 (TODO: 실제 토큰 교환 구현 필요)
router.get('/kakao/callback', async (req, res) => {
    const { code } = req.query;

    // TODO: code를 사용하여 access_token 획득 후 사용자 정보 조회
    res.redirect('/login.html?error=kakao_not_configured');
});

module.exports = router;
