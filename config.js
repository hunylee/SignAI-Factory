/**
 * SignAI-Factory 환경 설정
 */

module.exports = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'rk09salk%^',
        database: process.env.DB_NAME || 'signai_factory'
    },
    server: {
        port: process.env.PORT || 3000
    }
};
