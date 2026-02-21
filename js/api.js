/**
 * SignAI-Factory API 클라이언트
 * 프론트엔드에서 백엔드 API를 호출하는 함수들
 */

const API_BASE = window.location.pathname.includes('/admin') ? '../data' : 'data';

// 공모전 목록 가져오기
async function fetchCompetitions() {
    try {
        const response = await fetch(`${API_BASE}/competitions.json`);
        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            console.error('공모전 목록 조회 실패:', data.error);
            return [];
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        return [];
    }
}

// 특정 공모전 상세 가져오기
async function fetchCompetition(id) {
    try {
        const response = await fetch(`${API_BASE}/competition-${id}.json`);
        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            console.error('공모전 조회 실패:', data.error);
            return null;
        }
    } catch (error) {
        console.error('API 호출 오류:', error);
        return null;
    }
}

async function createCompetition(competitionData) {
    console.log('[Mocked] createCompetition:', competitionData);
    return { success: true, data: { ...competitionData, id: Date.now() } };
}

async function submitData(submissionData) {
    console.log('[Mocked] submitData:', submissionData);
    return { success: true, message: '성공적으로 제출되었습니다. (GitHub Pages 데모 모드)' };
}

// 공모전 카드 HTML 생성
function createCompetitionCard(competition) {
    const isOpen = competition.status === 'open';
    const statusText = isOpen ? `접수중 D-${Math.max(0, competition.days_left)}` : '마감';
    const statusClass = isOpen ? '' : 'end';

    return `
        <div class="card" onclick="location.href='detail.html?id=${competition.id}'">
            <div class="status ${statusClass}">${statusText}</div>
            <h3>${competition.title}</h3>
            <p>목표: ${competition.target_count.toLocaleString()}건 | 달성률 ${competition.progress}%</p>
            <div class="price">상금 ${competition.prize_amount}</div>
        </div>
    `;
}

// 메인 페이지에 공모전 목록 렌더링
async function renderCompetitions() {
    const container = document.querySelector('.card-container');
    if (!container) return;

    container.innerHTML = '<p>불러오는 중...</p>';

    const competitions = await fetchCompetitions();

    if (competitions.length === 0) {
        container.innerHTML = '<p>등록된 공모전이 없습니다.</p>';
        return;
    }

    container.innerHTML = competitions.map(createCompetitionCard).join('');
}

// URL에서 파라미터 가져오기
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
