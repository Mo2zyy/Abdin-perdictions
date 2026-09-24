// إعدادات Supabase الخاصة بمشروعك
const SUPABASE_URL = 'https://ffdltukfzqxqrcpvrxxe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZGx0dWtmenF4cXJjcHZyeHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDc5NDQsImV4cCI6MjEwNTgyMzk0NH0.utVnf2aOG9yxRZoYlAoziDH_LY3Bvd3KkkmcwdY-IoY';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

async function login() {
  const username = document.getElementById('username-input').value.trim();
  if (!username) {
    alert('من فضلك أدخل الاسم أولاً');
    return;
  }

  try {
    // البحث عن المستخدم أو إنشائه
    let { data: user, error } = await db
      .from('users_profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (!user) {
      const { data: newUser, error: createError } = await db
        .from('users_profiles')
        .insert([{ username: username }])
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    currentUser = user;
    document.getElementById('user-display-name').innerText = user.username;
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('predictions-section').classList.remove('hidden');

    loadMatches();
  } catch (err) {
    console.error(err);
    alert('حدث خطأ أثناء تسجيل الدخول: ' + err.message);
  }
}

async function loadMatches() {
  const matchesContainer = document.getElementById('matches-list');
  
  try {
    // جلب المباريات والتوقعات السابقة للمستخدم
    const { data: matches, error: matchError } = await db.from('matches').select('*');
    if (matchError) throw matchError;

    const { data: userPredictions } = await db
      .from('predictions')
      .select('*')
      .eq('user_id', currentUser.id);

    const predictionsMap = {};
    if (userPredictions) {
      userPredictions.forEach(p => {
        predictionsMap[p.match_id] = p;
      });
    }

    if (!matches || matches.length === 0) {
      matchesContainer.innerHTML = '<p>لا توجد مباريات مسجلة حالياً.</p>';
      return;
    }

    matchesContainer.innerHTML = matches.map(match => {
      const pred = predictionsMap[match.id] || {};
      const homeScore = pred.predicted_home_score ?? '';
      const awayScore = pred.predicted_away_score ?? '';

      return `
        <div class="match-card" data-match-id="${match.id}">
          <span class="team">${match.home_team}</span>
          <input type="number" min="0" class="score-input home-score" value="${homeScore}">
          <span>-</span>
          <input type="number" min="0" class="score-input away-score" value="${awayScore}">
          <span class="team">${match.away_team}</span>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
    matchesContainer.innerHTML = '<p>تعذر تحميل المباريات. تأكد من إعدادات الجداول ورخص RLS في Supabase.</p>';
  }
}

async function savePredictions() {
  const matchCards = document.querySelectorAll('.match-card');
  const predictionsToSave = [];

  matchCards.forEach(card => {
    const matchId = card.getAttribute('data-match-id');
    const homeScore = card.querySelector('.home-score').value;
    const awayScore = card.querySelector('.away-score').value;

    if (homeScore !== '' && awayScore !== '') {
      predictionsToSave.push({
        user_id: currentUser.id,
        match_id: matchId,
        predicted_home_score: parseInt(homeScore),
        predicted_away_score: parseInt(awayScore)
      });
    }
  });

  if (predictionsToSave.length === 0) {
    alert('قم بكتـابة توقع واحد على الأقل قبل الحفظ.');
    return;
  }

  try {
    const { error } = await db
      .from('predictions')
      .upsert(predictionsToSave, { onConflict: 'user_id, match_id' });

    if (error) throw error;
    alert('تم حفظ توقعاتك بنجاح! 🏆');
  } catch (err) {
    console.error(err);
    alert('حدث خطأ أثناء حفظ التوقعات: ' + err.message);
  }
}
