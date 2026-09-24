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
