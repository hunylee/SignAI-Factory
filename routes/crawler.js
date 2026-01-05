const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

// 외부 공모전 크롤링 API
router.get('/', async (req, res) => {
    try {
        // 위비티(Wevity) 웹/모바일/IT 분야
        const url = 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=20';

        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const competitions = [];

        // 리스트 파싱 (위비티 구조에 맞추어 조정)
        $('#container .list li').not('.top').each((i, el) => {
            // 상단 공지(top) 제외하고 수집
            if (competitions.length >= 12) return false; // 최대 12개만

            const title = $(el).find('.tit a').text().trim();
            const link = 'https://www.wevity.com/' + $(el).find('.tit a').attr('href');
            const img = $(el).find('.img img').attr('src'); // 썸네일 불완전할 수 있음
            const dday = $(el).find('.day').text().trim();
            const host = $(el).find('.organ').text().trim();

            // 이미지가 상대 경로일 경우 처리
            const fullImg = img && !img.startsWith('http') ? `https://www.wevity.com${img}` : img;

            if (title) {
                competitions.push({
                    id: i,
                    title,
                    host,
                    dday,
                    image: fullImg,
                    link,
                    source: 'wevity'
                });
            }
        });

        res.json({
            success: true,
            data: competitions
        });

    } catch (error) {
        console.error('크롤링 에러:', error);
        res.status(500).json({
            success: false,
            error: '외부 공모전 정보를 가져오는데 실패했습니다.',
            details: error.message
        });
    }
});

module.exports = router;
