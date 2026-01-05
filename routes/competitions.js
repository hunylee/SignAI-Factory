/**
 * 공모전 API 라우트
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');

// 모든 공모전 목록 조회
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id, title, description, prize_amount,
                youtube_url, target_count, current_count,
                deadline, status, created_at
            FROM competitions
            ORDER BY 
                CASE WHEN status = 'open' THEN 0 ELSE 1 END,
                deadline ASC
        `);

        // 달성률 계산 추가
        const competitions = result.rows.map(comp => ({
            ...comp,
            progress: comp.target_count > 0
                ? Math.round((comp.current_count / comp.target_count) * 100)
                : 0,
            days_left: comp.deadline
                ? Math.ceil((new Date(comp.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                : null
        }));

        res.json({
            success: true,
            count: competitions.length,
            data: competitions
        });
    } catch (err) {
        console.error('공모전 목록 조회 오류:', err);
        res.status(500).json({
            success: false,
            error: '공모전 목록을 불러오는데 실패했습니다.'
        });
    }
});

// 특정 공모전 상세 조회
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM competitions WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '공모전을 찾을 수 없습니다.'
            });
        }

        const competition = result.rows[0];
        competition.progress = competition.target_count > 0
            ? Math.round((competition.current_count / competition.target_count) * 100)
            : 0;

        res.json({
            success: true,
            data: competition
        });
    } catch (err) {
        console.error('공모전 상세 조회 오류:', err);
        res.status(500).json({
            success: false,
            error: '공모전 정보를 불러오는데 실패했습니다.'
        });
    }
});

// 새 공모전 생성 (관리자)
router.post('/', async (req, res) => {
    try {
        const { title, description, prize_amount, youtube_url, target_count, deadline } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                error: '공모전 제목은 필수입니다.'
            });
        }

        const result = await pool.query(`
            INSERT INTO competitions 
            (title, description, prize_amount, youtube_url, target_count, deadline, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'open')
            RETURNING *
        `, [title, description, prize_amount, youtube_url, target_count || 0, deadline]);

        res.status(201).json({
            success: true,
            message: '공모전이 생성되었습니다!',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('공모전 생성 오류:', err);
        res.status(500).json({
            success: false,
            error: '공모전 생성에 실패했습니다.'
        });
    }
});

// 공모전 수정 (관리자)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, prize_amount, youtube_url, target_count, deadline, status } = req.body;

        const result = await pool.query(`
            UPDATE competitions 
            SET title = COALESCE($1, title),
                description = COALESCE($2, description),
                prize_amount = COALESCE($3, prize_amount),
                youtube_url = COALESCE($4, youtube_url),
                target_count = COALESCE($5, target_count),
                deadline = COALESCE($6, deadline),
                status = COALESCE($7, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *
        `, [title, description, prize_amount, youtube_url, target_count, deadline, status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '공모전을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '공모전이 수정되었습니다!',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('공모전 수정 오류:', err);
        res.status(500).json({
            success: false,
            error: '공모전 수정에 실패했습니다.'
        });
    }
});

module.exports = router;
