/**
 * SignAI-Factory 데이터베이스 설정 스크립트
 * PostgreSQL 테이블 생성 및 초기 데이터 입력
 */

const { Pool } = require('pg');

// 데이터베이스 연결 설정
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'rk09salk%^',
    database: 'postgres'
});

async function setupDatabase() {
    const client = await pool.connect();

    try {
        console.log('🔌 PostgreSQL 연결 성공!');

        // 1. signai_factory 데이터베이스 생성
        console.log('\n📦 데이터베이스 생성 중...');
        try {
            await client.query('CREATE DATABASE signai_factory');
            console.log('✅ signai_factory 데이터베이스 생성 완료');
        } catch (err) {
            if (err.code === '42P04') {
                console.log('ℹ️  signai_factory 데이터베이스가 이미 존재합니다');
            } else {
                throw err;
            }
        }

    } catch (err) {
        console.error('❌ 오류 발생:', err.message);
        throw err;
    } finally {
        client.release();
    }

    // signai_factory DB에 재연결
    const appPool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'rk09salk%^',
        database: 'signai_factory'
    });

    const appClient = await appPool.connect();

    try {
        // 2. 테이블 생성
        console.log('\n📋 테이블 생성 중...');

        // users 테이블
        await appClient.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ users 테이블 생성 완료');

        // competitions 테이블 (공모전)
        await appClient.query(`
            CREATE TABLE IF NOT EXISTS competitions (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                prize_amount VARCHAR(50),
                youtube_url VARCHAR(500),
                target_count INTEGER DEFAULT 0,
                current_count INTEGER DEFAULT 0,
                deadline DATE,
                status VARCHAR(20) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ competitions 테이블 생성 완료');

        // submissions 테이블 (제출물)
        await appClient.query(`
            CREATE TABLE IF NOT EXISTS submissions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                competition_id INTEGER REFERENCES competitions(id),
                file_path VARCHAR(500),
                file_name VARCHAR(255),
                status VARCHAR(20) DEFAULT 'pending',
                feedback TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP
            )
        `);
        console.log('✅ submissions 테이블 생성 완료');

        // 3. 샘플 데이터 입력
        console.log('\n📝 샘플 데이터 입력 중...');

        // 샘플 공모전 데이터
        const existingCompetitions = await appClient.query('SELECT COUNT(*) FROM competitions');

        if (parseInt(existingCompetitions.rows[0].count) === 0) {
            await appClient.query(`
                INSERT INTO competitions (title, description, prize_amount, youtube_url, target_count, current_count, deadline, status)
                VALUES 
                    ('일상생활 인사말 수어 데이터 수집', '안녕하세요, 감사합니다 등 일상 인사말 수어를 수집합니다.', '500만원', 'https://www.youtube.com/embed/fHI8X4OXluQ', 5000, 2250, '2026-01-20', 'open'),
                    ('병원 응급상황 수어 데이터', '응급 상황에서 사용하는 의료 관련 수어를 수집합니다.', '300만원', 'https://www.youtube.com/embed/fHI8X4OXluQ', 1000, 1000, '2025-12-31', 'closed')
            `);
            console.log('✅ 샘플 공모전 데이터 입력 완료');
        } else {
            console.log('ℹ️  샘플 데이터가 이미 존재합니다');
        }

        // 4. 결과 확인
        console.log('\n📊 테이블 현황:');
        const tables = await appClient.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        tables.rows.forEach(row => console.log(`   - ${row.table_name}`));

        const compCount = await appClient.query('SELECT COUNT(*) FROM competitions');
        console.log(`\n🏆 등록된 공모전: ${compCount.rows[0].count}개`);

        console.log('\n✨ 데이터베이스 설정 완료!');

    } catch (err) {
        console.error('❌ 오류 발생:', err.message);
        throw err;
    } finally {
        appClient.release();
        await appPool.end();
    }

    await pool.end();
}

// 실행
setupDatabase().catch(console.error);
