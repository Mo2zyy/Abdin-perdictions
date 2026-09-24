// ==========================================
// ملف app.js - النسخة الكاملة والنهائية
// ==========================================

let db = null;
let currentUser = '';

// دالة تسجيل الدخول
function loginUser() {
  const input = document.getElementById('usernameInput');
  if (!input || !input.value.trim()) {
    alert('من فضلك اكتب اسمك الأول!');
    return;
  }
  currentUser = input.value.trim();
  try {
    localStorage.setItem('current_user', currentUser);
  } catch (e) {
    console.error("LocalStorage error:", e);
  }
  
  const loginSec = document.getElementById('loginSection');
  const contentSec = document.getElementById('predictionsContent');
  const dispName = document.getElementById('displayName');

  if (loginSec) loginSec.style.display = 'none';
  if (contentSec) contentSec.style.display = 'block';
  if (dispName) dispName.innerText = currentUser;
  
  loadUserPredictions();
}

// دالة تسجيل الخروج
function logoutUser() {
  try {
    localStorage.removeItem('current_user');
  } catch (e) {
    console.error("LocalStorage error:", e);
  }
  currentUser = '';
  location.reload();
}

// دالة جلب وعرض توقعات المستخدم والنتائج الحقيقية والنقاط
async function loadUserPredictions() {
  if (!currentUser) {
    try {
      currentUser = localStorage.getItem('current_user');
    } catch (e) {
      console.error("LocalStorage error:", e);
    }
  }
  if (!currentUser || !db) return;

  try {
    console.log("Loading predictions for:", currentUser);

    // 1. جلب توقعات المستخدم من جدول predictions
    const { data: userPreds, error } = await db.from('predictions').select('*').eq('username', currentUser);
    if (error) {
      console.error('خطأ في جلب التوقعات:', error);
      return;
    }

    // 2. جلب النتائج الحقيقية من جدول matches
    const { data: matches, error: matchError } = await db.from('matches').select('*');
    if (matchError) {
      console.error('خطأ في جلب المباريات:', matchError);
      return;
    }

    const matchesDict = {};
    if (matches) {
      matches.forEach(m => {
        matchesDict[m.id] = m;
      });
    }

    // 3. خريطة الهيكل المتوافقة مع IDs صفحة الـ HTML
    const matchesStructure = [
      { r: 1, m: 1, home: 'Desoky', away: 'Seif' },
      { r: 1, m: 2, home: 'Angle', away: 'Eslam' },
      { r: 1, m: 3, home: 'Loay', away: 'Ahd' },
      { r: 2, m: 1, home: 'Kamal', away: 'Desoky' },
      { r: 2, m: 2, home: 'Seif', away: 'Loay' },
      { r: 2, m: 3, home: 'Ahd', away: 'Eslam' },
      { r: 3, m: 1, home: 'Kamal', away: 'Angle' },
      { r: 3, m: 2, home: 'Desoky', away: 'Loay' },
      { r: 3, m: 3, home: 'Eslam', away: 'Seif' },
      { r: 4, m: 1, home: 'Loay', away: 'Kamal' },
      { r: 4, m: 2, home: 'Angle', away: 'Ahd' },
      { r: 4, m: 3, home: 'Eslam', away: 'Desoky' },
      { r: 5, m: 1, home: 'Ahd', away: 'Kamal' },
      { r: 5, m: 2, home: 'Loay', away: 'Eslam' },
      { r: 5, m: 3, home: 'Seif', away: 'Angle' },
      { r: 6, m: 1, home: 'Eslam', away: 'Kamal' },
      { r: 6, m: 2, home: 'Ahd', away: 'Seif' },
      { r: 6, m: 3, home: 'Desoky', away: 'Angle' },
      { r: 7, m: 1, home: 'Kamal', away: 'Seif' },
      { r: 7, m: 2, home: 'Desoky', away: 'Ahd' },
      { r: 7, m: 3, home: 'Loay', away: 'Angle' },
      { r: 8, m: 1, home: 'Seif', away: 'Desoky' },
      { r: 8, m: 2, home: 'Eslam', away: 'Angle' },
      { r: 8, m: 3, home: 'Ahd', away: 'Loay' },
      { r: 9, m: 1, home: 'Desoky', away: 'Kamal' },
      { r: 9, m: 2, home: 'Loay', away: 'Seif' },
      { r: 9, m: 3, home: 'Eslam', away: 'Ahd' },
      { r: 10, m: 1, home: 'Angle', away: 'Kamal' },
      { r: 10, m: 2, home: 'Loay', away: 'Desoky' },
      { r: 10, m: 3, home: 'Seif', away: 'Eslam' },
      { r: 11, m: 1, home: 'Kamal', away: 'Loay' },
      { r: 11, m: 2, home: 'Ahd', away: 'Angle' },
      { r: 11, m: 3, home: 'Desoky', away: 'Eslam' },
      { r: 12, m: 1, home: 'Kamal', away: 'Ahd' },
      { r: 12, m: 2, home: 'Eslam', away: 'Loay' },
      { r: 12, m: 3, home: 'Angle', away: 'Seif' },
      { r: 13, m: 1, home: 'Kamal', away: 'Eslam' },
      { r: 13, m: 2, home: 'Seif', away: 'Ahd' },
      { r: 13, m: 3, home: 'Angle', away: 'Desoky' },
      { r: 14, m: 1, home: 'Seif', away: 'Kamal' },
      { r: 14, m: 2, home: 'Ahd', away: 'Desoky' },
      { r: 14, m: 3, home: 'Angle', away: 'Loay' }
    ];

    if (userPreds) {
      userPreds.forEach(p => {
        let struct = matchesStructure.find((s, index) => (index + 1) === p.match_id) || 
                     matchesStructure.find(s => s.home === p.home_team && s.away === p.away_team);

        if (struct) {
          const hInput = document.getElementById(`p_r${struct.r}_m${struct.m}_h`);
          const aInput = document.getElementById(`p_r${struct.r}_m${struct.m}_a`);

          if (hInput) hInput.value = p.predicted_home_score;
          if (aInput) aInput.value = p.predicted_away_score;

          const realMatch = matchesDict[p.match_id] || matchesDict[struct.r];

          if (realMatch && realMatch.home_score !== null && realMatch.home_score !== undefined && 
              realMatch.away_score !== null && realMatch.away_score !== undefined) {
            
            let points = 0;
            if (p.predicted_home_score === realMatch.home_score && p.predicted_away_score === realMatch.away_score) {
              points = 3;
            } else if (
              (p.predicted_home_score > p.predicted_away_score && realMatch.home_score > realMatch.away_score) ||
              (p.predicted_home_score < p.predicted_away_score && realMatch.home_score < realMatch.away_score) ||
              (p.predicted_home_score === p.predicted_away_score && realMatch.home_score === realMatch.away_score)
            ) {
              points = 1;
            }

            let row = hInput.closest('.match-row');
            if (row) {
              let badge = row.querySelector('.result-badge');
              if (!badge) {
                badge = document.createElement('div');
                badge.className = 'result-badge';
                badge.style.cssText = 'background: #06090e; color: #00ff87; border: 1px solid #00ff87; padding: 4px 8px; margin-top: 5px; border-radius: 4px; font-size: 11px; text-align: center; width: 100%; grid-column: span 3;';
                row.appendChild(badge);
              }
              badge.innerHTML = `✅ النتيجة الحقيقية: <b>${realMatch.home_score} - ${realMatch.away_score}</b> | النقاط: <span style="color: #ffcc00;">+${points}</span>`;
            }
          }
        }
      });
    }
  } catch (err) {
    console.error('Error in loadUserPredictions:', err);
  }
}

// تهيئة الاتصال والتحقق من حالة المستخدم عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  if (typeof supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined') {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  
  try {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      currentUser = savedUser;
      
      const loginSec = document.getElementById('loginSection');
      const contentSec = document.getElementById('predictionsContent');
      const dispName = document.getElementById('displayName');
      
      if (loginSec) loginSec.style.display = 'none';
      if (contentSec) contentSec.style.display = 'block';
      if (dispName) dispName.innerText = currentUser;
      
      setTimeout(() => {
        loadUserPredictions();
      }, 300);
    }
  } catch (e) {
    console.error("LocalStorage error:", e);
  }
});
