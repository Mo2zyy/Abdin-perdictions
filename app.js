// تحميل وتحديث التوقعات وعرض النتائج الحقيقية والنقاط مباشرة (نسخة الطوارئ المضمونة)
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

            // جلب النتيجة الحقيقية للماتش من Supabase
            const realMatch = matchesDict[p.match_id];
            
            if (realMatch && realMatch.home_score !== null && realMatch.home_score !== undefined && 
                realMatch.away_score !== null && realMatch.away_score !== undefined) {
              
              let points = 0;
              if (p.predicted_home_score === realMatch.home_score && p.predicted_away_score === realMatch.away_score) {
                points = 3;
              } else if (
                (p.predicted_home_score > p.predicted_away_score && realMatch.home_score > realMatch.away_score) ||
                (p.predicted_home_score < p.predicted_away_score && realMatch.home_score < realMatch.away_score) ||
                (p.predicted_home_score === realMatch.home_score && realMatch.away_score === realMatch.away_score)
              ) {
                points = 1;
              }

              // الحل الأضمن: إضافة النتيجة والنقاط جوه العنصر الحاضن للإيمبوتات
              let container = hInput.parentElement;
              while (container && container.tagName !== 'DIV' && container.tagName !== 'LI') {
                container = container.parentElement;
              }

              if (container) {
                let infoBox = container.querySelector('.emergency-result-box');
                if (!infoBox) {
                  infoBox = document.createElement('div');
                  infoBox.className = 'emergency-result-box';
                  infoBox.style.cssText = 'background: #111; color: #00ff87; border: 1px solid #00ff87; padding: 4px 8px; margin-top: 5px; border-radius: 4px; font-size: 12px; text-align: center; width: 100%; grid-column: span 3;';
                  container.appendChild(infoBox);
                }
                infoBox.innerHTML = `✅ النتيجة الفعلية: <b>${realMatch.home_score} - ${realMatch.away_score}</b> | النقاط: <span style="color: #ffcc00;">+${points}</span>`;
              }
            }
          }
        }
      });
    }
  } catch (err) {
    console.error('خطأ أثناء تحميل التوقعات وعرض النتائج:', err);
  }
}
