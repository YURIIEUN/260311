(function () {
  "use strict";

  var statusEl = document.getElementById("supabaseStatus");
  function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "supabase-status" + (isError ? " error" : msg.indexOf("저장됨") !== -1 ? " ok" : "");
  }
  setStatus("Supabase 로드 중...");

  // 설정 로드 Promise: 완료된 뒤에만 저장 가능 (버튼 빠르게 눌러도 대기)
  var configPromise = fetch("/api/supabase-config")
    .then(function (r) {
      if (!r.ok) throw new Error("API " + r.status);
      return r.json();
    })
    .then(function (data) {
      var url = (data && data.SUPABASE_URL) ? String(data.SUPABASE_URL).trim() : "";
      var key = (data && data.SUPABASE_ANON_KEY) ? String(data.SUPABASE_ANON_KEY).trim() : "";
      if (url) window.SUPABASE_URL = url;
      if (key) window.SUPABASE_ANON_KEY = key;
      if (url && key) setStatus("Supabase 준비됨");
      else setStatus("Supabase 설정 없음 (Vercel 환경 변수 확인)", true);
      return { url: url, key: key };
    })
    .catch(function (err) {
      console.warn("Supabase config load failed:", err);
      setStatus("설정 로드 실패: " + (err.message || "API 확인"), true);
      return { url: "", key: "" };
    });

  const MIN = 1;
  const MAX = 45;
  const PICK = 6;

  const countSelect = document.getElementById("count");
  const generateBtn = document.getElementById("generateBtn");
  const resultsEl = document.getElementById("results");

  function getRange(n) {
    if (n <= 9) return "1-9";
    if (n <= 19) return "10-19";
    if (n <= 29) return "20-29";
    if (n <= 39) return "30-39";
    return "40-45";
  }

  function pickOneSet() {
    const pool = [];
    for (let i = MIN; i <= MAX; i++) pool.push(i);
    const picked = [];
    for (let i = 0; i < PICK; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    picked.sort(function (a, b) { return a - b; });
    const bonusIdx = Math.floor(Math.random() * pool.length);
    const bonus = pool[bonusIdx];
    return { numbers: picked, bonus: bonus };
  }

  function render() {
    const count = Math.min(10, Math.max(1, parseInt(countSelect.value, 10) || 1));
    resultsEl.innerHTML = "";

    var sets = [];
    for (let s = 0; s < count; s++) {
      const set = pickOneSet();
      sets.push(set);
      const { numbers, bonus } = set;
      const card = document.createElement("div");
      card.className = "set-card";
      card.setAttribute("role", "group");
      card.setAttribute("aria-label", "추천 " + (s + 1) + "세트, 보너스 " + bonus);

      const check = document.createElement("div");
      check.className = "card-check";
      check.setAttribute("aria-hidden", "true");

      const title = document.createElement("div");
      title.className = "set-title";
      title.textContent = (s + 1) + "번째 추천";

      const balls = document.createElement("div");
      balls.className = "balls";
      numbers.forEach(function (num) {
        const ball = document.createElement("span");
        ball.className = "ball";
        ball.setAttribute("data-range", getRange(num));
        ball.textContent = num;
        balls.appendChild(ball);
      });

      const bonusWrap = document.createElement("div");
      bonusWrap.className = "bonus-wrap";
      const bonusLabel = document.createElement("span");
      bonusLabel.className = "bonus-label";
      bonusLabel.textContent = "보너스";
      const bonusBall = document.createElement("span");
      bonusBall.className = "ball ball-bonus";
      bonusBall.setAttribute("data-range", getRange(bonus));
      bonusBall.textContent = bonus;
      bonusWrap.appendChild(bonusLabel);
      bonusWrap.appendChild(bonusBall);

      const accent = document.createElement("div");
      accent.className = "card-accent";
      accent.textContent = "보너스는 따로 뽑았어요!";

      card.appendChild(check);
      card.appendChild(title);
      card.appendChild(balls);
      card.appendChild(bonusWrap);
      card.appendChild(accent);
      resultsEl.appendChild(card);
    }
    saveToSupabase(sets);
  }

  function getSupabaseLib(callback, attempt) {
    attempt = attempt || 0;
    var lib = window.supabase || (window.Supabase && { createClient: window.Supabase.createClient });
    if (lib && typeof lib.createClient === "function") {
      callback(lib);
      return;
    }
    if (attempt < 50) {
      setTimeout(function () { getSupabaseLib(callback, attempt + 1); }, 100);
    } else {
      callback(null);
    }
  }

  function saveToSupabase(sets) {
    function doInsert(config) {
      var url = config.url || window.SUPABASE_URL;
      var key = config.key || window.SUPABASE_ANON_KEY;
      if (!url || !key || url === "YOUR_SUPABASE_URL" || key === "YOUR_SUPABASE_ANON_KEY") {
        setStatus("저장 안 함: Supabase URL/키 없음", true);
        return;
      }
      setStatus("저장 중...");
      getSupabaseLib(function (lib) {
        if (!lib) {
          setStatus("저장 실패: Supabase 스크립트 로드 안 됨 (CDN 확인)", true);
          return;
        }
        try {
          var supabase = lib.createClient(url, key);
          var table = "lotto_results";
          var rows = sets.map(function (s) { return { numbers: s.numbers, bonus: s.bonus }; });
          supabase.from(table).insert(rows).then(function (r) {
            if (r.error) {
              setStatus("저장 실패: " + (r.error.message || r.error.code), true);
              console.warn("Supabase insert error:", r.error);
            } else {
              setStatus("저장됨 (" + sets.length + "세트)");
            }
          }).catch(function (e) {
            setStatus("저장 실패: " + (e.message || String(e)), true);
          });
        } catch (e) {
          setStatus("저장 실패: " + (e.message || String(e)), true);
          console.warn("Supabase save error:", e);
        }
      });
    }
    if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      doInsert({ url: window.SUPABASE_URL, key: window.SUPABASE_ANON_KEY });
    } else {
      configPromise.then(doInsert);
    }
  }

  generateBtn.addEventListener("click", render);

  // 어두운 버전 토글
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.querySelector(".theme-icon");
  const metaTheme = document.getElementById("metaTheme");
  const THEME_KEY = "lotto-theme";

  function applyTheme(isDark) {
    if (isDark) {
      document.body.classList.add("dark");
      document.body.setAttribute("data-theme", "dark");
      if (themeIcon) themeIcon.textContent = "🌙";
      if (metaTheme) metaTheme.setAttribute("content", "#0d1117");
      if (themeToggle) themeToggle.setAttribute("aria-label", "밝은 버전으로 전환");
    } else {
      document.body.classList.remove("dark");
      document.body.removeAttribute("data-theme");
      if (themeIcon) themeIcon.textContent = "☀";
      if (metaTheme) metaTheme.setAttribute("content", "#FFFFFF");
      if (themeToggle) themeToggle.setAttribute("aria-label", "어두운 버전으로 전환");
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const isDark = saved === "dark";
    applyTheme(isDark);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const isDark = !document.body.classList.contains("dark");
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
      applyTheme(isDark);
    });
  }
  initTheme();
})();
