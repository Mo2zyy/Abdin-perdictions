const SUPABASE_URL = 'https://ffdltukfzqxqrcpvrxxe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZGx0dWtmenF4cXJjcHZyeHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDc5NDQsImV4cCI6I...';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TEAM_LOGOS = {
  'Ahd': './ahd.jpeg',
  'Angle': './angle.jpeg',
  'Desoky': './desoky.jpeg',
  'Eslam': './eslam.jpeg',
  'Kamal': './kamal.jpeg',
  'Loay': './loay.jpeg',
  'Seif': './seif.jpeg'
};

const MATCH_VS_IMAGES = {
  'Desoky-Ahd': './desoky_vs_ahd.jpeg',
  'Ahd-Desoky': './desoky_vs_ahd.jpeg'
};

async function loadMatches() {
  try {
    const { data: matches, error } = await db.from('matches').select('*').order('id', { ascending: true });

    if (error) {
      console.error(error);
      document.getElementById('matches-container').innerHTML = `<p style="color:red; text-align:center;">Error: ${error.message}</p>`;
      return;
    }

    let matchesHtml = '';
    let currentRound = 0;

    if (matches && matches.length > 0) {
      matches.forEach(m => {
        if (m.round_no !== currentRound) {
          currentRound = m.round_no;
          matchesHtml += `<h3 style="color:var(--accent-green); margin-top:25px; border-bottom:1px solid var(--border-color); padding-bottom:5px; text-align:center;">Round ${currentRound}</h3>`;
        }

        const hLogo = TEAM_LOGOS[m.home_team] ? `<img src="${TEAM_LOGOS[m.home_team]}" class="team-logo">` : '';
        const aLogo = TEAM_LOGOS[m.away_team] ? `<img src="${TEAM_LOGOS[m.away_team]}" class="team-logo">` : '';
        const scoreDisplay = (m.home_score !== null && m.away_score !== null && m.home_score !== undefined) 
          ? `${m.home_score} - ${m.away_score}` 
          : 'VS';

        matchesHtml += `
          <div class="match-card" onclick="openMatchModal('${m.home_team}', '${m.away_team}')">
            <div class="player-cell" style="flex:1; justify-content:flex-start;">
              ${hLogo} <span>${m.home_team}</span>
            </div>
            <div class="score-box">${scoreDisplay}</div>
            <div class="player-cell" style="flex:1; justify-content:flex-end;">
              <span>${m.away_team}</span> ${aLogo}
            </div>
          </div>
        `;
      });
    }

    document.getElementById('matches-container').innerHTML = matchesHtml;

  } catch (err) {
    console.error(err);
  }
}

function openMatchModal(home, away) {
  const title = `${home} VS ${away}`;
  const pairKey = `${home}-${away}`;
  const imageSrc = MATCH_VS_IMAGES[pairKey] || './vs-default.jpeg';

  document.getElementById('modal-match-title').innerText = title;
  document.getElementById('modal-vs-image').src = imageSrc;
  document.getElementById('match-modal').style.display = 'flex';
}

function closeMatchModal() {
  document.getElementById('match-modal').style.display = 'none';
}

function closeOnOverlay(event) {
  if (event.target.id === 'match-modal') {
    closeMatchModal();
  }
}

window.onload = loadMatches;
