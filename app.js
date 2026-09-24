// تعريف بيانات الاتصال بقاعدة بيانات Supabase
const SUPABASE_URL = 'https://ffdltukfzqxqrcpvrxxe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZGx0dWtmenF4cXJjcHZyeHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDc5NDQsImV4cCI6MjEwNTgyMzk0NH0.utVnf2aOG9yxRZoYlAoziDH_LY3Bvd3KkkmcwdY-IoY';

let db;
let currentUser = '';
let matchesMap = {};
let idToMatch = {};

// هيكل الماتشات والجولات المعتمد
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

// عند تحميل الصفحة بالكامل
window.addEventListener('DOMContentLoaded', async () => {
  if (window.supabase) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    await fetchMatchesMapping();
  } else {
    console.error('Supabase library is not loaded!');
  }
  
  // التحقق من وجود اسم مسجل مسبقاً في الـ LocalStorage
  const savedUser = localStorage.getItem('league_username');
  if (savedUser) {
    currentUser = savedUser;
    const inputEl = document.getElementById('usernameInput');
    if (inputEl) inputEl.value = savedUser;
    loginUser();
  }
});

// جلب خريطة الماتشات ومعرفاتها من قاعدة البيانات
async function fetchMatchesMapping() {
  try {
    const { data, error } = await db.from('matches').select('*');
    if (error) throw error;
    if (data) {
      data.forEach(m => {
        const key = `${m.home_team}_${m.away_team}`;
        matchesMap[key] = m.id;
        idToMatch[m.id] = key;
      });
    }
  } catch (err) {
    console.error('Error fetching matches mapping:', err);
  }
}

// تسجيل الدخول بالاسم
function loginUser() {
  const inputEl = document.getElementById('usernameInput');
  const name = inputEl ? inputEl.value.trim() : '';
  
  if (!name) {
    alert('من فضلك ادخل اسمك أولاً!');
    return;
  }
  
  currentUser = name;
  localStorage.setItem('league_username', currentUser);
  
  const displayEl = document.getElementById('displayName');
  if (displayEl) displayEl.innerText = currentUser;
  
  const loginSec = document.getElementById('loginSection');
  const predContent = document.getElementById('predictionsContent');
  
  if (loginSec) loginSec.style.display = 'none';
  if (predContent) predContent.style.display = 'block';

  // تحميل التوقعات وعرض النتائج والنقاط فوراً
  loadUserPredictions();
}

// تسجيل الخروج
function logoutUser() {
  localStorage.removeItem('league_username');
  currentUser = '';
  
  const loginSec = document.getElementById('loginSection');
  const predContent = document.getElementById('predictionsContent');
  
  if (predContent) predContent.style.display = 'none';
  if (loginSec) loginSec.style.display = 'block';
}

// حفظ أو تحديث التوقعات في Supabase
async function savePredictions() {
  if (!currentUser) {
    alert('يجب تسجيل الدخول أولاً!');
    return;
  }

  let upsertData = [];

  for (let item of matchesStructure) {
    const matchKey = `${item.home}_${item.away}`;
    const matchId = matchesMap[matchKey];

    if (!matchId) continue;

    const hInput = document.getElementById(`p_r${item.r}_m${item.m}_h`);
    const aInput = document.getElementById(`p_r${item.r}_m${item.m}_a`);

    if (hInput && aInput && hInput.value !== '' && aInput.value !== '') {
      upsertData.push({
        username: currentUser,      // حفظ الاسم صريحاً في العمود الجديد
        user_id: 1,                 // قيمة افتراضية لتفادي قيود الـ integer
        match_id: matchId,
        predicted_home_score: parseInt(hInput.value),
        predicted_away_score: parseInt(aInput.value)
      });
    }
  }

  if (upsertData.length === 0) {
    alert('من فضلك املأ توقع لماتش واحد على الأقل قبل الحفظ!');
    return;
  }

  try {
    const { error } = await db.from('predictions').upsert(upsertData, { onConflict: 'username,match_id' });
    if (error) throw error;
    
    alert('تم حفظ التوقعات بنجاح! 🚀');
    loadUserPredictions(); // إعادة تحميل لعرض التحديثات والنقاط فور الحفظ
  } catch (err) {
    console.error('Error saving predictions:', err);
    alert('فشل حفظ التوقعات، راجع الـ Console لمعرفة السبب.');
  }
}

// تحميل توقعات المستخدم السابقة ومقارنتها بالنتائج الحقيقية وعرض النقاط
async function loadUserPredictions() {
  if (!currentUser) return;

  try {
    // 1. جلب توقعات المستخدم الحالي
    const { data: userPreds, error } = await db.from('predictions').select('*').eq('username', currentUser);
    if (error) throw error;

    // 2. جلب النتائج الحقيقية للماتشات من جدول matches
    const { data: matches, error: matchError } = await db.from('matches').select('*');
    if (matchError) throw matchError;

    const matchesDict = {};
    if (matches) {
      matches.forEach(m => { matchesDict[m.id] = m; });
    }

    if (userPreds) {
      userPreds.forEach(p => {
        const matchKey = idToMatch[p.match_id];
        if (matchKey) {
          const struct = matchesStructure.find(s => `${s.home}_${s.away}` === matchKey);
          if (struct) {
            const hInput = document.getElementById(`p_r${struct.r}_m${struct.m}_h`);
            const aInput = document.getElementById(`p_r${struct.r}_m${struct.m}_a`);
            
            if (hInput) hInput.value = p.predicted_home_score;
            if (aInput) aInput.value = p.predicted_away_score;

            // جلب النتيجة الحقيقية للماتش وحساب النقاط تلقائياً
            const realMatch = matchesDict[p.match_id];
            if (realMatch && realMatch.home_score !== null && realMatch.home_score !== undefined && 
                realMatch.away_score !== null && realMatch.away_score !== undefined) {
              
              let points = 0;
              
              // قواعد حساب النقاط:
              // 3 نقاط للنتيجة الصحيحة تماماً
              if (p.predicted_home_score === realMatch.home_score && p.predicted_away_score === realMatch.away_score) {
                points = 3;
              } 
              // نقطة واحدة لو توقع الفائز صح أو التعادل صح
              else if (
                (p.predicted_home_score > p.predicted_away_score && realMatch.home_score > realMatch.away_score) ||
                (p.predicted_home_score < p.predicted_away_score && realMatch.home_score < realMatch.away_score) ||
                (p.predicted_home_score === p.predicted_away_score && realMatch.home_score === realMatch.away_score)
              ) {
                points = 1;
              }

              // إنشاء صندوق صغير تحت خانة الإدخال لعرض النتيجة الحقيقية والنقاط
              let scoreInputsContainer = hInput.closest('.score-inputs');
              if (!scoreInputsContainer) scoreInputsContainer = hInput.parentElement;
              
              let infoBox = scoreInputsContainer.querySelector('.match-result-info');
              
              if (!infoBox) {
                infoBox = document.createElement('div');
                infoBox.className = 'match-result-info';
                infoBox.style.cssText = 'font-size: 11px; color: #00ff87; text-align: center; margin-top: 4px; font-weight: bold;';
                scoreInputsContainer.appendChild(infoBox);
              }
              
              infoBox.innerHTML = `النتيجة الفعلية: (${realMatch.home_score} - ${realMatch.away_score}) | النقاط: <span style="color: #ffcc00;">+${points}</span>`;
            }
          }
        }
      });
    }
  } catch (err) {
    console.error('Error loading predictions and results:', err);
  }
}

// دالة المشاركة الاختيارية
function sharePredictions() {
  alert('ميزة المشاركة قادمة قريبًا! يمكنك أخذ لقطة شاشة (Screenshot) لتوقعاتك ومشاركتها مع أصحابك.');
}
