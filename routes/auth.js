/**
 * 인증 API 라우트
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = 'signai-factory-secret-key-2026'; // 실제 운영시 환경변수로 관리

// 로그인
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: '이메일과 비밀번호를 입력해주세요.'
            });
        }

        // 사용자 조회
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        const user = result.rows[0];

        // 비밀번호 확인
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // JWT 토큰 생성
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: '로그인 성공!',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (err) {
        console.error('로그인 오류:', err);
        res.status(500).json({
            success: false,
            error: '로그인 처리 중 오류가 발생했습니다.'
        });
    }
});

// 회원가입
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // 입력 검증
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: '이메일, 비밀번호, 이름을 모두 입력해주세요.'
            });
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: '올바른 이메일 형식이 아닙니다.'
            });
        }

        // 비밀번호 길이 검증
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: '비밀번호는 6자 이상이어야 합니다.'
            });
        }

        // 이메일 중복 확인
        const existing = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: '이미 등록된 이메일입니다.'
            });
        }

        // 비밀번호 해시
        const hashedPassword = await bcrypt.hash(password, 10);

        // 사용자 생성
        const result = await pool.query(`
            INSERT INTO users (email, name, password_hash, role)
            VALUES ($1, $2, $3, 'user')
            RETURNING id, email, name, role, created_at
        `, [email, name, hashedPassword]);

        const newUser = result.rows[0];

        // JWT 토큰 생성 (가입 후 바로 로그인)
        const token = jwt.sign(
            {
                userId: newUser.id,
                email: newUser.email,
                role: newUser.role,
                name: newUser.name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다!',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        });

    } catch (err) {
        console.error('회원가입 오류:', err);
        res.status(500).json({
            success: false,
            error: '회원가입 처리 중 오류가 발생했습니다.'
        });
    }
});

// 토큰 검증
router.get('/verify', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: '인증 토큰이 필요합니다.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({
            success: true,
            user: decoded
        });
    } catch (err) {
        res.status(401).json({
            success: false,
            error: '유효하지 않은 토큰입니다.'
        });
    }
});

// 관리자 권한 확인 미들웨어
function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: '인증이 필요합니다.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: '관리자 권한이 필요합니다.'
            });
        }

        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            error: '유효하지 않은 토큰입니다.'
        });
    }
}

module.exports = { router, requireAdmin };
