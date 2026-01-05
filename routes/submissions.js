/**
 * 제출물 API 라우트
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');

// 특정 공모전의 제출물 목록 조회
router.get('/competition/:competitionId', async (req, res) => {
    try {
        const { competitionId } = req.params;
        const result = await pool.query(`
            SELECT s.*, u.name as user_name, u.email as user_email
            FROM submissions s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.competition_id = $1
            ORDER BY s.created_at DESC
        `, [competitionId]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (err) {
        console.error('제출물 목록 조회 오류:', err);
        res.status(500).json({
            success: false,
            error: '제출물 목록을 불러오는데 실패했습니다.'
        });
    }
});

// 새 제출물 등록
router.post('/', async (req, res) => {
    try {
        const { user_id, competition_id, file_path, file_name } = req.body;

        if (!competition_id || !file_name) {
            return res.status(400).json({
                success: false,
                error: '공모전 ID와 파일명은 필수입니다.'
            });
        }

        // 제출물 저장
        const result = await pool.query(`
            INSERT INTO submissions 
            (user_id, competition_id, file_path, file_name, status)
            VALUES ($1, $2, $3, $4, 'pending')
            RETURNING *
        `, [user_id || null, competition_id, file_path, file_name]);

        // 공모전의 current_count 증가
        await pool.query(`
            UPDATE competitions 
            SET current_count = current_count + 1
            WHERE id = $1
        `, [competition_id]);

        res.status(201).json({
            success: true,
            message: '제출이 완료되었습니다! 관리자 승인을 기다려주세요.',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('제출물 등록 오류:', err);
        res.status(500).json({
            success: false,
            error: '제출에 실패했습니다.'
        });
    }
});

// 제출물 상태 업데이트 (관리자)
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, feedback } = req.body;

        if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: '유효한 상태값이 필요합니다. (pending, approved, rejected)'
            });
        }

        const result = await pool.query(`
            UPDATE submissions 
            SET status = $1, 
                feedback = $2,
                reviewed_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [status, feedback, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '제출물을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: `제출물이 ${status === 'approved' ? '승인' : status === 'rejected' ? '거절' : '대기'}되었습니다.`,
            data: result.rows[0]
        });
    } catch (err) {
        console.error('제출물 상태 업데이트 오류:', err);
        res.status(500).json({
            success: false,
            error: '상태 업데이트에 실패했습니다.'
        });
    }
});

module.exports = router;
