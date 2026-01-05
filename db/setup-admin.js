/**
 * 관리자 계정 초기 설정 스크립트
 * 실행: node db/setup-admin.js
 */
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'rk09salk%^',
    database: 'signai_factory'
});

async function setupAdmin() {
    try {
        console.log('🔐 관리자 계정 설정 중...\n');

        // 관리자 비밀번호 해시
        const adminPassword = 'admin1234';  // 기본 비밀번호
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // 기존 관리자 확인
        const existing = await pool.query(
            "SELECT * FROM users WHERE email = 'admin@signai.kr'"
        );

        if (existing.rows.length > 0) {
            // 비밀번호 업데이트
            await pool.query(
                'UPDATE users SET password_hash = $1 WHERE email = $2',
                [hashedPassword, 'admin@signai.kr']
            );
            console.log('ℹ️  기존 관리자 계정 비밀번호 업데이트됨');
        } else {
            // 새 관리자 생성
            await pool.query(`
                INSERT INTO users (email, name, password_hash, role)
                VALUES ($1, $2, $3, $4)
            `, ['admin@signai.kr', '관리자', hashedPassword, 'admin']);
            console.log('✅ 관리자 계정 생성 완료');
        }

        console.log('\n📋 관리자 로그인 정보:');
        console.log('   이메일: admin@signai.kr');
        console.log('   비밀번호: admin1234');
        console.log('\n⚠️  보안을 위해 비밀번호를 변경하세요!');

        await pool.end();
    } catch (err) {
        console.error('❌ 오류:', err.message);
        await pool.end();
        process.exit(1);
    }
}

setupAdmin();
