// ==========================================
// 1. متغيرات عامة وقواعد البيانات الأساسية
// ==========================================
let currentUser = localStorage.getItem('current_user') || 'Desoky'; // افتراضي أو حسب المسجل

// خريطة لربط معرفات الماتشات (IDs) بالأسماء الخاصة بها لتسهيل المطابقة
const idToMatch = {
  // يمكنك تعديل هذه الخريطة حسب الـ IDs الموجودة في جدول matches عندك في Supabase
  // أو يتم جلبها برمجياً، وهذا هيكل افتراضي للتوافق:
};

// هيكل المباريات لتحديد الـ Inputs الخاصة بكل مباراة (Round و Match)
const matchesStructure = [
  { r: 1, m: 1, home: 'Desoky', away: 'Seif' },
  { r: 1, m: 2, home: 'Angle', away: 'Eslam' },
  { r: 1, m: 3, home: 'Loay', away: 'Ahd' },
  { r: 2, m: 1, home: 'Kamal', away: 'Desoky' },
  { r: 2, m: 2, home: 'Seif', away: 'Loay' },
  { r: 2, m: 3, home: 'Ahd', away: 'Eslam' }
  // أضف بقية المباريات حسب جدولك هنا
];


// ==========================================
// 2. دالة تحميل وتحديث التوقعات وعرض النتائج (النسخة الشاملة والمضمونة)
// ==========================================
async function loadUserPredictions() {
  // التأكد من وجود مستخدم مسجل
  if (!currentUser) {
    currentUser = localStorage.getItem('current_user') || 'Desoky';
  }
  if (!currentUser) return;

  try {
    console.log("loadUserPredictions is running for user:", currentUser);

    // 1. جلب توقعات المستخدم الحالي من جدول predictions
    const { data: userPreds, error } = await db.from('predictions').select('*').eq('username', currentUser);
    if (error) {
      console.error('خطأ في جلب التوقعات:', error);
      return;
    }

    // 2. جلب النتائج الحقيقية للماتشات من جدول matches
    const { data: matches, error: matchError } = await db.from('matches').select('*');
    if (matchError) {
      console.error('خطأ في جلب نتائج المباريات:', matchError);
      return;
    }

    const matchesDict = {};
    if (matches) {
      matches.forEach(m => { 
        // تخزين النتائج بالـ ID وأيضاً باسم الفريقين لضمان المطابقة بأي طريقة
        matchesDict[m.id] = m; 
        if(m.home_team && m.away_team) {
          matchesDict[`${m.home_team}_${m.away_team}`] = m;
        }
      });
    }

    if (userPreds) {
      userPreds.forEach(p => {
        // محاولة إيجاد هيكل المباراة المرتبطة بالتوقع
        let struct = matchesStructure.find(s => idToMatch[p.match_id] === `${s.home}_${s.away}`);
        
        // لو الـ idToMatch مش معرف كويس، ندور بالماتش آي دي مباشرة أو نفترض مطابقة
        const realMatch = matchesDict[p.match_id] || (struct ? matchesDict[`${struct.home}_${struct.away}`] : null);

        if (struct) {
          const hInput = document.getElementById(`p_r${struct.r}_m${struct.m}_h`);
          const aInput = document.getElementById(`p_r${struct.r}_m${struct.m}_a`);
          
          if (hInput) hInput.value = p.predicted_home_score;
          if (aInput) aInput.value = p.predicted_away_score;

          // لو فيه نتيجة حقيقية مسجلة في قاعدة البيانات للماتش ده
          if (realMatch && realMatch.home_score !== null && realMatch.home_score !== undefined && 
              realMatch.away_score !== null && realMatch.away_score !== undefined) {
            
            let points = 0;
            // حساب النقاط (3 نقاط للنتيجة الصحيحة، نقطة واحدة لتوقع الفائز أو التعادل)
            if (p.predicted_home_score === realMatch.home_score && p.predicted_away_score === realMatch.away_score) {
              points = 3;
            } else if (
              (p.predicted_home_score > p.predicted_away_score && realMatch.home_score > realMatch.away_score) ||
              (p.predicted_home_score < p.predicted_away_score && realMatch.home_score < realMatch.away_score) ||
              (p.predicted_home_score === p.predicted_away_score && realMatch.home_score === realMatch.away_score)
            ) {
              points = 1;
            }

            // إيجاد العنصر الحاضن للمباراة لإظهار النتيجة تحته مباشرة بوضوح
            let container = hInput.parentElement;
            while (container && container.tagName !== 'DIV' && container.tagName !== 'LI') {
              container = container.parentElement;
            }

            if (container) {
              let infoBox = container.querySelector('.emergency-result-box');
              if (!infoBox) {
                infoBox = document.createElement('div');
                infoBox.className = 'emergency-result-box';
                infoBox.style.cssText = 'background: #111; color: #00ff87; border: 1px solid #00ff87; padding: 6px 10px; margin-top: 8px; border-radius: 6px; font-size: 13px; text-align: center; width: 100%; grid-column: span 3; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
                container.appendChild(infoBox);
              }
              infoBox.innerHTML = `✅ النتيجة الفعلية: <b>${realMatch.home_score} - ${realMatch.away_score}</b> | النقاط المكتسبة: <span style="color: #ffcc00; font-weight: bold;">+${points}</span>`;
            }
          }
        }
      });
    }
  } catch (err) {
    console.error('خطأ أثناء تنفيذ loadUserPredictions:', err);
  }
}


// ==========================================
// 3. التشغيل التلقائي عند فتح الصفحة وتحميل DOM
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("App initialized, waiting for DOM & data...");
  
  // محاولة التشغيل بعد تأكيد تحميل الصفحة واتصال Supabase
  setTimeout(() => {
    loadUserPredictions();
  }, 1200);
});

// تشغيل إضافي لو المستخدم تنقل بين التبويبات أو عمل فوكس على الصفحة
window.addEventListener("focus", () => {
  loadUserPredictions();
});
// ==========================================
// الدالة الذكية والديناميكية لتحميل وعرض التوقعات والنتائج
// ==========================================
async function loadUserPredictions() {
  let user = currentUser || localStorage.getItem('current_user') || 'Desoky';
  if (!user) return;

  try {
    console.log("Loading predictions for user:", user);

    // 1. جلب توقعات المستخدم من جدول predictions
    const { data: userPreds, error } = await db.from('predictions').select('*').eq('username', user);
    if (error) {
      console.error('خطأ في جلب التوقعات:', error);
      return;
    }

    // 2. جلب النتائج الحقيقية من جدول matches
    const { data: matches, error: matchError } = await db.from('matches').select('*');
    if (matchError) {
      console.error('خطأ في جلب النتائج الحقيقية:', matchError);
      return;
    }

    // إنشاء قاموس للنتائج الحقيقية حسب الـ match_id
    const matchesDict = {};
    if (matches) {
      matches.forEach(m => {
        matchesDict[m.id] = m;
      });
    }

    if (userPreds && userPreds.length > 0) {
      userPreds.forEach(p => {
        const realMatch = matchesDict[p.match_id];
        
        // البحث عن خانات الإدخال الخاصة بهذا الماتش في الصفحة بأكثر من طريقة لضمان إيجادها
        // غالباً الـ inputs بتاعة التوقع بتكون مرتبطة بالـ match_id أو مرتبة في الجدول
        let hInput = document.getElementById(`p_match_${p.match_id}_h`) || document.querySelector(`input[data-match-id="${p.match_id}"][data-type="home"]`);
        let aInput = document.getElementById(`p_match_${p.match_id}_a`) || document.querySelector(`input[data-match-id="${p.match_id}"][data-type="away"]`);

        // لو الـ Inputs موجودة، نحط فيها القيم القديمة
        if (hInput) hInput.value = p.predicted_home_score;
        if (aInput) aInput.value = p.predicted_away_score;

        // لو النتيجة الحقيقية موجودة في قاعدة البيانات، نحسب النقاط ونعرضها
        if (realMatch && realMatch.home_score !== null && realMatch.home_score !== undefined && 
            realMatch.away_score !== null && realMatch.away_score !== undefined) {
          
          let points = 0;
          if (p.predicted_home_score === realMatch.home_score && p.predicted_away_score === realMatch.away_score) {
            points = 3; // نتيجة صحيحة تماماً
          } else if (
            (p.predicted_home_score > p.predicted_away_score && realMatch.home_score > realMatch.away_score) ||
            (p.predicted_home_score < p.predicted_away_score && realMatch.home_score < realMatch.away_score) ||
            (p.predicted_home_score === p.predicted_away_score && realMatch.home_score === realMatch.away_score)
          ) {
            points = 1; // توقع الفائز أو التعادل صح
          }

          // محاولة إيجاد العنصر الحاضن للماتش (الصف أو الـ Container) لإظهار النتيجة تحته
          let targetElement = hInput ? hInput.closest('.match-row') || hInput.closest('tr') || hInput.parentElement.parentElement : null;
          
          if (targetElement) {
            let infoBox = targetElement.querySelector('.result-badge');
            if (!infoBox) {
              infoBox = document.createElement('div');
              infoBox.className = 'result-badge';
              infoBox.style.cssText = 'background: #111; color: #00ff87; border: 1px solid #00ff87; padding: 5px 10px; margin-top: 6px; border-radius: 6px; font-size: 12px; text-align: center; width: 100%; grid-column: span 3; font-weight: bold;';
              targetElement.appendChild(infoBox);
            }
            infoBox.innerHTML = `🎯 النتيجة الفعلية: (${realMatch.home_score} - ${realMatch.away_score}) | النقاط: <span style="color: #ffcc00;">+${points}</span>`;
          }
        }
      });
    }
  } catch (err) {
    console.error('مشكلة أثناء تنفيذ loadUserPredictions:', err);
  }
}

// التشغيل التلقائي عند تحميل الصفحة بالكامل
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    loadUserPredictions();
  }, 1500);
});
// ==========================================
// ملف app.js - النسخة النهائية المتوافقة مع صفحة التوقعات
// ==========================================

// دالة تسجيل الدخول (لو مستخدمة في صفحة أخرى أو زر الدخول)
function loginUser() {
  const input = document.getElementById('usernameInput');
  if (!input || !input.value.trim()) {
    alert('من فضلك اكتب اسمك الأول!');
    return;
  }
  currentUser = input.value.trim();
  localStorage.setItem('current_user', currentUser);
  
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('predictionsContent').style.display = 'block';
  document.getElementById('displayName').innerText = currentUser;
  
  loadUserPredictions();
}

function logoutUser() {
  localStorage.removeItem('current_user');
  currentUser = '';
  location.reload();
}

// دالة جلب وعرض توقعات المستخدم والنتائج الحقيقية والنقاط
async function loadUserPredictions() {
  if (!currentUser) {
    currentUser = localStorage.getItem('current_user');
  }
  if (!currentUser) return;

  try {
    console.log("Loading predictions for:", currentUser);

    // 1. جلب توقعات المستخدم من جدول predictions
    const { data: userPreds, error } = await db.from('predictions').select('*').eq('username', currentUser);
    if (error) {
      console.error('خطأ في جلب التوقعات:', error);
      return;
    }

    // 2. جلب النتائج الحقيقية من جدول matches في Supabase
    const { data: matches, error: matchError } = await db.from('matches').select('*');
    if (matchError) {
      console.error('خطأ في جلب المباريات:', matchError);
      return;
    }

    // عمل قاموس للنتائج الحقيقية بربط الـ match_id
    const matchesDict = {};
    if (matches) {
      matches.forEach(m => {
        matchesDict[m.id] = m;
      });
    }

    // 3. خريطة الهيكل المتوافقة مع IDs صفحة الـ HTML الخاصة بك
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
        // محاولة إيجاد الهيكل المطابق إما عن طريق الـ match_id أو أسماء الفرق
        let struct = matchesStructure.find((s, index) => (index + 1) === p.match_id) || 
                     matchesStructure.find(s => s.home === p.home_team && s.away === p.away_team);

        if (struct) {
          const hInput = document.getElementById(`p_r${struct.r}_m${struct.m}_h`);
          const aInput = document.getElementById(`p_r${struct.r}_m${struct.m}_a`);

          if (hInput) hInput.value = p.predicted_home_score;
          if (aInput) aInput.value = p.predicted_away_score;

          // البحث عن النتيجة الحقيقية لهذا الماتش
          const realMatch = matchesDict[p.match_id] || matchesDict[struct.r]; // حسب تصميم قاعدة البيانات عندك

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

            // إظهار النتيجة الفعلية والنقاط تحت صف المباراة مباشرة
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

// تهيئة الاتصال بـ Supabase عند فتح الملف
document.addEventListener("DOMContentLoaded", () => {
  if (typeof supabase !== 'undefined') {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  
  // التحقق لو المستخدم مسجل مسبقاً
  const savedUser = localStorage.getItem('current_user');
  if (savedUser) {
    currentUser = savedUser;
    const loginSec = document.getElementById('loginSection');
    const contentSec = document.getElementById('predictionsContent');
    const dispName = document.getElementById('displayName');
    
    if (loginSec) loginSec.style.display = 'none';
    if (contentSec) contentSec.display = 'block'; // تعديل العرض
    if (contentSec) contentSec.style.display = 'block';
    if (dispName) dispName.innerText = currentUser;
    
    setTimeout(() => {
      loadUserPredictions();
    }, 1000);
  }
});
