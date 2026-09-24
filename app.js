const SUPABASE_URL = 'https://ffdltukfzqxqrcpvrxxe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZGx0dWtmenF4cXJjcHZyeHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDc5NDQsImV4cCI6MjEwNTgyMzk0NH0.utVnf2aOG9yxRZoYlAoziDH_LY3Bvd3KkkmcwdY-IoY';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const TEAM_LOGOS = {
  'Ahd': 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Flag_of_Portugal.svg',
  'Angle': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/National_Bank_of_Egypt_SC_logo.png',
  'Desoky': 'https://upload.wikimedia.org/wikipedia/en/7/70/Villarreal_CF_logo.svg',
  'Eslam': 'https://upload.wikimedia.org/wikipedia/en/c/c5/Al_Nassr_FC_logo.svg',
  'Kamal': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  'Loay': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  'Seif': 'https://upload.wikimedia.org/wikipedia/en/8/8c/Al_Ahly_SC_logo.svg'
};

let currentUser = null;

async function login() {
  const username = document.getElementById('username-input').value.trim();
  if (!username) return alert('أدخل الاسم أولاً');

  try {
    let { data: user, error: userErr } = await db.from('users_profiles').select('*').eq('username', username).maybeSingle();

    if (userErr) throw userErr;

    if (!user) {
      const { data: newUser, error: createError } = await db.from('users_profiles').insert([{ username }]).select().single();
      if (createError) throw createError;
      user = newUser;
    }

    currentUser = user;
    document.getElementById('user-display-name').innerText = user.username;
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('predictions-section').classList.remove('hidden');

    await loadMatches();
  } catch (err) {
    alert('حدث خطأ أثناء تسجيل الدخول: ' + (err.message || JSON.stringify(err)));
  }
}

async function loadMatches() {
  const container = document.getElementById('matches-list');
  container.innerHTML = '<p>جاري تحميل المباريات...</p>';

  try {
    const { data: matches, error: matchErr } = await db.from('matches').select('*').order('id', { ascending: true });
    
    if (matchErr) throw matchErr;

    if (!matches || matches.length === 0) {
      container.innerHTML = '<p style="color:red;">لا توجد مباريات في قاعدة البيانات!</p>';
      return;
    }

    const { data: preds } = await db.from('predictions').select('*').eq('user_id', currentUser.id);

    const map = {};
    if (preds) preds.forEach(p => map[p.match_id] = p);

    let html = '';
    let currentRound = 0;

    matches.forEach(m => {
      if (m.round_no !== currentRound) {
        currentRound = m.round_no;
        html += `<h3 style="color:#38bdf8; margin-top:20px; border-bottom:1px solid #334155; padding-bottom:5px;">الجولة ${currentRound}</h3>`;
      }

      const p = map[m.id] || {};
      html += `
        <div class="match-card" data-match-id="${m.id}" style="display:flex; justify-between; align-items:center; margin-bottom:10px;">
          <span class="team" style="flex:1; text-align:center;">${m.home_team}</span>
          <input type="number" min="0" class="score-input home-score" value="${p.predicted_home_score ?? ''}" style="width:40px; text-align:center;">
          <span style="margin: 0 5px;">-</span>
          <input type="number" min="0" class="score-input away-score" value="${p.predicted_away_score ?? ''}" style="width:40px; text-align:center;">
          <span class="team" style="flex:1; text-align:center;">${m.away_team}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p style="color:red;">خطأ أثناء تحميل المباريات: ' + (err.message || JSON.stringify(err)) + '</p>';
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
