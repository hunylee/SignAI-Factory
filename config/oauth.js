/**
 * OAuth 소셜 로그인 설정
 * 
 * 🔑 API 키 설정 방법:
 * 1. 각 서비스의 개발자 콘솔에서 앱 등록
 * 2. 아래 설정에 Client ID / Secret 입력
 * 3. 서버 재시작
 * 
 * 📌 개발자 콘솔 링크:
 * - Google: https://console.cloud.google.com/apis/credentials
 * - Naver: https://developers.naver.com/apps
 * - Kakao: https://developers.kakao.com/console/app
 */

module.exports = {
    // Google OAuth 2.0
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',        // 여기에 입력
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '', // 여기에 입력
        callbackURL: '/api/auth/google/callback',
        scope: ['profile', 'email']
    },

    // Naver OAuth
    naver: {
        clientId: process.env.NAVER_CLIENT_ID || '',         // 여기에 입력
        clientSecret: process.env.NAVER_CLIENT_SECRET || '', // 여기에 입력
        callbackURL: '/api/auth/naver/callback',
        scope: ['profile', 'email']
    },

    // Kakao OAuth
    kakao: {
        clientId: process.env.KAKAO_CLIENT_ID || '',         // REST API 키 입력
        clientSecret: process.env.KAKAO_CLIENT_SECRET || '', // 선택사항
        callbackURL: '/api/auth/kakao/callback',
        scope: ['profile_nickname', 'account_email']
    },

    // 설정 완료 여부 확인
    isConfigured: function (provider) {
        const config = this[provider];
        return config && config.clientId && config.clientId.length > 0;
    }
};
