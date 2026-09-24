// ⚠️ افتح Supabase -> Project Settings -> API وانسخ الروابط هنا:
const SUPABASE_URL = 'ضع_هنا_رابط_موقع_سوبابيز_بتاعك';
const SUPABASE_KEY = 'ضع_هنا_الـ_anon_key_بتاعك';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUser = null;

async function login() {
  const code = document.getElementById('user-code').value.trim();
  if (!code) return alert('ادخل الاسم أو الكود الأول');

  let { data: user } = await supabase.from('users_profiles').select('*').eq('user_code', code).maybeSingle();

  if (!user) {
    const { data: newUser } = await supabase.from('users_profiles').insert([{ username: code, user_code: code }]).select().single();
    user = newUser;
  }

  currentUser = user;
  document.getElementById('login-sec').style.display = 'none';
  document.getElementById('app-sec').style.display = 'block';
  document.getElementById('welcome-msg').innerText = 'أهلاً: ' + user.username;

  loadMatches();
}

async function loadMatches() {
  const { data: matches } = await supabase.from('matches').select('*').order('id', { ascending: true });
  const { data: predictions } = await supabase.from('predictions').select('*').eq('user_id', currentUser.id);

  const listDiv = document.getElementById('matches-list');
  listDiv.innerHTML = '';

  matches.forEach(m => {
    const pred = predictions?.find(p => p.match_id === m.id) || {};
    const homeVal = pred.predicted_home ?? '';
    const awayVal = pred.predicted_away ?? '';

    listDiv.innerHTML += `
      <div class="card">
        <small style="color:#94a3b8">الجولة ${m.round_number}</small>
        <div class="match-row">
          <span class="player-name">${m.home_player}</span>
          <div>
            <input type="number" id="home-${m.id}" value="${homeVal}" min="0">
            <span style="margin: 0 5px;">-</span>
            <input type="number" id="away-${m.id}" value="${awayVal}" min="0">
          </div>
          <span class="player-name">${m.away_player}</span>
        </div>
        <button class="save-btn" onclick="savePrediction(${m.id})">حفظ التوقع</button>
      </div>
    `;
  });
}

async function savePrediction(matchId) {
  const homeScore = document.getElementById(`home-${matchId}`).value;
  const awayScore = document.getElementById(`away-${matchId}`).value;

  if (homeScore === '' || awayScore === '') return alert('برجاء إدخال النتيجة كاملة');

  const { error } = await supabase.from('predictions').upsert({
    user_id: currentUser.id,
    match_id: matchId,
    predicted_home: parseInt(homeScore),
    predicted_away: parseInt(awayScore)
  }, { onConflict: 'user_id,match_id' });

  if (error) alert('حدث خطأ أثناء الحفظ');
  else alert('تم حفظ التوقع بنجاح! ⚽');
}
