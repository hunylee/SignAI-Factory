const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { Pool } = require('pg');

const DATA_DIR = path.join(__dirname, '../data');

// 데이터 디렉터리 생성
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function generateExternalCompetitions() {
    console.log('Fetching external competitions from Wevity...');
    try {
        const url = 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=20';
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const competitions = [];

        $('#container .list li').not('.top').each((i, el) => {
            if (competitions.length >= 12) return false;

            const title = $(el).find('.tit a').text().trim();
            const link = 'https://www.wevity.com/' + $(el).find('.tit a').attr('href');
            const img = $(el).find('.img img').attr('src');
            const dday = $(el).find('.day').text().trim();
            const host = $(el).find('.organ').text().trim();

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

        const outputPath = path.join(DATA_DIR, 'external-competitions.json');
        fs.writeFileSync(outputPath, JSON.stringify({ success: true, data: competitions }, null, 2));
        console.log(`✅ Saved external competitions to ${outputPath}`);

    } catch (error) {
        console.error('Error fetching external competitions:', error.message);
        // 오류 발생 시 빈 배열 저장
        const outputPath = path.join(DATA_DIR, 'external-competitions.json');
        fs.writeFileSync(outputPath, JSON.stringify({ success: false, error: error.message, data: [] }, null, 2));
    }
}

async function generateInternalCompetitions() {
    console.log('Fetching internal competitions...');
    try {
        // config.js 로드 가능성을 고려한 임포트
        let config;
        try {
            config = require('../config');
        } catch (e) {
            console.log('config.js not found, skipping db connection');
        }

        let competitions = [];

        if (config && config.db && process.env.GITHUB_ACTIONS !== 'true') {
            const pool = new Pool(config.db);
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

                competitions = result.rows.map(comp => ({
                    ...comp,
                    progress: comp.target_count > 0 ? Math.round((comp.current_count / comp.target_count) * 100) : 0,
                    days_left: comp.deadline ? Math.ceil((new Date(comp.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null
                }));
                console.log('✅ Fetched from database successfully.');
            } catch (err) {
                console.log('⚠️ Could not fetch from database. Using dummy data.', err.message);
            } finally {
                await pool.end();
            }
        }

        // DB에서 가져오지 못한 경우 (GitHub Actions 등) 더미 데이터 생성
        if (competitions.length === 0) {
            competitions = [
                {
                    id: 1,
                    title: "[예시] 수어 일상생활 데이터 수집",
                    description: "일상생활에서 자주 쓰이는 수어 동작 데이터를 수집합니다.",
                    prize_amount: "50,000원",
                    target_count: 100,
                    current_count: 45,
                    progress: 45,
                    days_left: 7,
                    status: "open"
                }
            ];
            console.log('✅ Generated dummy internal competitions.');
        }

        const outputPath = path.join(DATA_DIR, 'competitions.json');
        fs.writeFileSync(outputPath, JSON.stringify({ success: true, count: competitions.length, data: competitions }, null, 2));

        // id를 기반으로 개별 공모전 파일도 생성 (상세 페이지용)
        competitions.forEach(comp => {
            const compPath = path.join(DATA_DIR, `competition-${comp.id}.json`);
            fs.writeFileSync(compPath, JSON.stringify({ success: true, data: comp }, null, 2));
        });
        
        console.log(`✅ Saved internal competitions to ${ outputPath }`);

    } catch (error) {
        console.error('Error generating internal competitions:', error);
    }
}

async function main() {
    await generateExternalCompetitions();
    await generateInternalCompetitions();
    console.log('🎉 Static data generation completed!');
}

main();
