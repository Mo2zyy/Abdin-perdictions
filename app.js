<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ULTIMATE TEAM LEAGUE - Matches</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <style>
    :root {
      --bg-dark: #0a0e14;
      --card-bg: rgba(18, 24, 36, 0.90);
      --accent-green: #00ff87;
      --text-white: #f8fafc;
      --border-color: #1e293b;
    }

    * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { background-color: var(--bg-dark); color: var(--text-white); margin: 0; padding: 20px; position: relative; min-height: 100vh; }
    .container { max-width: 800px; margin: 0 auto; position: relative; z-index: 1; }
    
    h1 { text-align: center; color: var(--text-white); font-weight: 900; letter-spacing: 1px; font-size: 2.2rem; margin-bottom: 10px; }
    h1 span { color: var(--accent-green); }
    h2 { text-align: center; color: var(--accent-green); margin-bottom: 20px; text-transform: uppercase; font-size: 1.4rem; }
    
    .nav { display: flex; justify-content: center; gap: 10px; margin-bottom: 25px; flex-wrap: wrap; }
    .nav a { color: var(--text-white); text-decoration: none; padding: 10px 18px; background: var(--card-bg); border-radius: 6px; font-weight: bold; border: 1px solid var(--border-color); transition: all 0.2s; font-size: 14px; backdrop-filter: blur(5px); }
    .nav a.active { background: var(--accent-green); color: #000; border-color: var(--accent-green); }
    .nav a:hover:not(.active) { border-color: var(--accent-green); }

    .matches-list { display: flex; flex-direction: column; gap: 12px; }
    .match-item { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; display: flex; justify-content: space-between; align-items: center; backdrop-filter: blur(10px); }
    .team-box { display: flex; align-items: center; gap: 10px; width: 40%; }
    .team-box.away { justify-content: flex-end; }
    .team-logo { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--accent-green); background: #000; object-fit: contain; }
    .score-badge { background: #06090e; border: 1px solid var(--accent-green); color: var(--accent-green); padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 16px; }

    /* Background Slideshow (.jpg) */
    .bg-slideshow { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; overflow: hidden; }
    .bg-slideshow div { position: absolute; width: 100%; height: 100%; background-size: cover; background-position: center; opacity: 0; animation: slideAnimation 28s infinite; filter: brightness(0.35); }

    .bg-slideshow div:nth-child(1) { background-image: url('./ahd1.png'); animation-delay: 0s; }
    .bg-slideshow div:nth-child(2) { background-image: url('./angle2.png'); animation-delay: 4s; }
    .bg-slideshow div:nth-child(3) { background-image: url('./desoky3.png'); animation-delay: 8s; }
    .bg-slideshow div:nth-child(4) { background-image: url('./eslam4.png'); animation-delay: 12s; }
    .bg-slideshow div:nth-child(5) { background-image: url('./kamal5.png'); animation-delay: 16s; }
    .bg-slideshow div:nth-child(6) { background-image: url('./loay6.png'); animation-delay: 20s; }
    .bg-slideshow div:nth-child(7) { background-image: url('./seif7.png'); animation-delay: 24s; }

    @keyframes slideAnimation {
      0% { opacity: 0; } 5% { opacity: 1; } 17% { opacity: 1; } 22% { opacity: 0; } 100% { opacity: 0; }
    }
  </style>
</head>
<body>

  <div class="bg-slideshow">
    <div></div><div></div><div></div><div></div><div></div><div></div><div></div>
  </div>

  <div class="container">
    <h1>ULTIMATE TEAM <span>LEAGUE</span></h1>
    
    <div class="nav">
      <a href="index.html">Standings</a>
      <a href="predictions.html">Predictions</a>
      <a href="matches.html" class="active">Matches</a>
    </div>

    <h2>⚽ ALL MATCHES</h2>
    <div class="matches-list" id="matches-container">
      <div style="text-align:center;">Loading Matches...</div>
    </div>
  </div>

  <script>
    const SUPABASE_URL = 'https://ffdltukfzqxqrcpvrxxe.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZGx0dWtmenF4cXJjcHZyeHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNDc5NDQsImV4cCI6MjEwNTgyMzk0NH0.utVnf2aOG9yxRZoYlAoziDH_LY3Bvd3KkkmcwdY-IoY';
    
    let db;

    const TEAM_LOGOS = {
      'Ahd': './ahd.png',
      'Angle': './Angle.png',
      'Desoky': './desoky.png',
      'Eslam': './eslam.png',
      'Kamal': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
      'Loay': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
      'Seif': './seif.png'
    };

    window.addEventListener('DOMContentLoaded', () => {
      if (window.supabase) {
        db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        loadMatches();
      }
    });

    async function loadMatches() {
      try {
        if (!db) return;
        const { data: matches } = await db.from('matches').select('*');
        if (!matches) return;

        let html = '';
        matches.forEach(m => {
          const homeLogo = TEAM_LOGOS[m.home_team] ? `<img src="${TEAM_LOGOS[m.home_team]}" class="team-logo">` : '';
          const awayLogo = TEAM_LOGOS[m.away_team] ? `<img src="${TEAM_LOGOS[m.away_team]}" class="team-logo">` : '';
          
          const scoreDisplay = (m.home_score !== null && m.home_score !== undefined) 
            ? `${m.home_score} - ${m.away_score}` 
            : 'VS';

          html += `
            <div class="match-item">
              <div class="team-box">${homeLogo} <span>${m.home_team}</span></div>
              <div class="score-badge">${scoreDisplay}</div>
              <div class="team-box away"><span>${m.away_team}</span> ${awayLogo}</div>
            </div>
          `;
        });

        document.getElementById('matches-container').innerHTML = html;

      } catch (err) {
        console.error(err);
      }
    }
  </script>
</body>
</html>
