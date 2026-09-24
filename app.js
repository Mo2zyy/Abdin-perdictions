const SUPABASE_URL = 'https://ffdltukfzqxqrcpvrxxe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZGx0dWtmenF4cXJjcHZyeHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDc5NDQsImV4cCI6MjEwNTgyMzk0NH0.utVnf2aOG9yxRZoYlAoziDH_LY3Bvd3KkkmcwdY-IoY';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null;

async function login() {
  const username = document.getElementById('username-input').value.trim();
  if (!username) return alert('أدخل الاسم أولاً');

  try {
    let { data: user } = await db.from('users_profiles').select('*').eq('username', username).single();

    if (!user) {
      const { data: newUser, error } = await db.from('users_profiles').insert([{ username }]).select().single();
      if (error) throw error;
      user = newUser;
    }

    currentUser = user;
    document.getElementById('user-display-name').innerText = user.username;
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('predictions-section').classList.remove('hidden');

    loadMatches();
  } catch (err) {
    alert('خطأ في تسجيل الدخول: ' + err.message);
  }
}

async function loadMatches() {
  const container = document.getElementById('matches-list');
  try {
    const { data: matches } = await db.from('matches').select('*').order('id', { ascending: true });
    const { data: preds } = await db.from('predictions').select('*').eq('user_id', currentUser.id);

    const map = {};
    if (preds) preds.forEach(p => map[p.match_id] = p);

    let html = '';
    let currentRound = 0;

    matches.forEach(m => {
      if (m.round_no !== currentRound) {
        currentRound = m.round_no;
        html += `<h3 style="color:#38bdf8; margin-top:20px; border-bottom:1px solid #334155;">الجولة ${currentRound}</h3>`;
      }

      const p = map[m.id] || {};
      html += `
        <div class="match-card" data-match-id="${m.id}">
          <span class="team">${m.home_team}</span>
          <input type="number" min="0" class="score-input home-score" value="${p.predicted_home_score ?? ''}">
          <span>-</span>
          <input type="number" min="0" class="score-input away-score" value="${p.predicted_away_score ?? ''}">
          <span class="team">${m.away_team}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<p>حدث خطأ أثناء تحميل المباريات</p>';
  }
}

async function savePredictions() {
  const cards = document.querySelectorAll('.match-card');
  const predictions = [];

  cards.forEach(card => {
    const matchId = card.getAttribute('data-match-id');
    const h = card.querySelector('.home-score').value;
    const a = card.querySelector('.away-score').value;

    if (h !== '' && a !== '') {
      predictions.push({
        user_id: currentUser.id,
        match_id: parseInt(matchId),
        predicted_home_score: parseInt(h),
        predicted_away_score: parseInt(a)
      });
    }
  });

  if (!predictions.length) return alert('أدخل توقعاً واحداً على الأقل');

  try {
    const { error } = await db.from('predictions').upsert(predictions, { onConflict: 'user_id, match_id' });
    if (error) throw error;
    alert('تم حفظ توقعاتك بنجاح! 🏆');
  } catch (err) {
    alert('خطأ أثناء الحفظ: ' + err.message);
  }
}
