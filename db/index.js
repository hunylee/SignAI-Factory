/**
 * SignAI-Factory 데이터베이스 연결 모듈
 */
const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
});

// 연결 테스트
pool.on('connect', () => {
    console.log('📦 PostgreSQL 데이터베이스 연결됨');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL 연결 오류:', err.message);
});

module.exports = pool;
