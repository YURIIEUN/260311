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
  const PICK = 5;

  const countSelect = document.getElementById("count");
  const generateBtn = document.getElementById("generateBtn");
  const resultsEl = document.getElementById("results");

  // 로또 당첨 번호 데이터 및 통계
  var lottoData = null;
  var numberFrequency = {};
  var bonusFrequency = {};

  // 로또 데이터 로드 및 통계 계산
  function loadLottoData() {
    return fetch("lotto-data.json")
      .then(function (response) {
        if (!response.ok) throw new Error("데이터 로드 실패");
        return response.json();
      })
      .then(function (data) {
        lottoData = data;
        calculateStatistics();
        console.log("통계 분석 완료. 총 " + (data.winningNumbers ? data.winningNumbers.length : 0) + "회차 데이터 분석됨.");
        return data;
      })
      .catch(function (err) {
        console.warn("로또 데이터 로드 실패, 기본 랜덤 모드로 전환:", err);
        console.warn("lotto-data.json 파일이 없거나 접근할 수 없습니다. 실제 당첨 번호 데이터를 추가해주세요.");
        return null;
      });
  }

  // 통계 계산: 번호별 출현 빈도
  function calculateStatistics() {
    numberFrequency = {};
    bonusFrequency = {};
    
    // 1~45 번호 초기화
    for (let i = MIN; i <= MAX; i++) {
      numberFrequency[i] = 0;
      bonusFrequency[i] = 0;
    }

    // 당첨 번호 데이터 분석
    if (lottoData && lottoData.winningNumbers) {
      lottoData.winningNumbers.forEach(function (round) {
        // 일반 번호 빈도 계산
        if (round.numbers) {
          round.numbers.forEach(function (num) {
            if (num >= MIN && num <= MAX) {
              numberFrequency[num] = (numberFrequency[num] || 0) + 1;
            }
          });
        }
        // 보너스 번호 빈도 계산
        if (round.bonus && round.bonus >= MIN && round.bonus <= MAX) {
          bonusFrequency[round.bonus] = (bonusFrequency[round.bonus] || 0) + 1;
        }
      });
    }
  }

  // 가중치 기반 번호 선택
  function weightedRandomPick(weights, count, exclude) {
    exclude = exclude || [];
    var pool = [];
    var totalWeight = 0;

    // 가중치 계산 및 풀 생성
    for (let i = MIN; i <= MAX; i++) {
      if (exclude.indexOf(i) === -1) {
        var weight = weights[i] || 1;
        pool.push({ num: i, weight: weight });
        totalWeight += weight;
      }
    }

    var picked = [];
    for (let c = 0; c < count; c++) {
      var random = Math.random() * totalWeight;
      var currentWeight = 0;
      var selected = null;
      var selectedIndex = -1;

      for (let i = 0; i < pool.length; i++) {
        currentWeight += pool[i].weight;
        if (random <= currentWeight) {
          selected = pool[i].num;
          selectedIndex = i;
          break;
        }
      }

      if (selected !== null) {
        picked.push(selected);
        totalWeight -= pool[selectedIndex].weight;
        pool.splice(selectedIndex, 1);
      }
    }

    return picked;
  }

  function getRange(n) {
    if (n <= 9) return "1-9";
    if (n <= 19) return "10-19";
    if (n <= 29) return "20-29";
    if (n <= 39) return "30-39";
    return "40-45";
  }

  // 통계 기반 번호 추천
  function pickOneSet() {
    // 데이터가 없으면 기본 랜덤 모드
    if (!lottoData || Object.keys(numberFrequency).length === 0) {
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

    // 통계 기반 추천
    // 최소 빈도값 계산 (0이 아닌 최소값)
    var minFreq = Math.max(1, Math.min.apply(null, Object.values(numberFrequency).filter(function (v) { return v > 0; })));
    var maxFreq = Math.max.apply(null, Object.values(numberFrequency));
    
    // 가중치 계산: 빈도가 높을수록 높은 가중치 (최소값 기준으로 정규화)
    var weights = {};
    for (let i = MIN; i <= MAX; i++) {
      var freq = numberFrequency[i] || minFreq;
      // 빈도에 비례하되, 최소값 이상의 가중치 보장
      weights[i] = freq + (maxFreq - minFreq) * 0.3; // 빈도 차이를 완화
    }

    // 번호 선택 (가중치 기반)
    var picked = weightedRandomPick(weights, PICK, []);
    picked.sort(function (a, b) { return a - b; });

    // 보너스 번호 선택 (보너스 빈도 기반)
    var bonusMinFreq = Math.max(1, Math.min.apply(null, Object.values(bonusFrequency).filter(function (v) { return v > 0; })));
    var bonusMaxFreq = Math.max.apply(null, Object.values(bonusFrequency));
    var bonusWeights = {};
    for (let i = MIN; i <= MAX; i++) {
      if (picked.indexOf(i) === -1) {
        var bonusFreq = bonusFrequency[i] || bonusMinFreq;
        bonusWeights[i] = bonusFreq + (bonusMaxFreq - bonusMinFreq) * 0.3;
      }
    }
    
    var bonusPool = [];
    var bonusTotalWeight = 0;
    for (let i = MIN; i <= MAX; i++) {
      if (picked.indexOf(i) === -1 && bonusWeights[i]) {
        bonusPool.push({ num: i, weight: bonusWeights[i] });
        bonusTotalWeight += bonusWeights[i];
      }
    }
    
    var bonus = null;
    if (bonusPool.length > 0) {
      var bonusRandom = Math.random() * bonusTotalWeight;
      var bonusCurrentWeight = 0;
      for (let i = 0; i < bonusPool.length; i++) {
        bonusCurrentWeight += bonusPool[i].weight;
        if (bonusRandom <= bonusCurrentWeight) {
          bonus = bonusPool[i].num;
          break;
        }
      }
    }
    
    // 보너스가 선택되지 않았으면 랜덤 선택
    if (bonus === null) {
      var remaining = [];
      for (let i = MIN; i <= MAX; i++) {
        if (picked.indexOf(i) === -1) remaining.push(i);
      }
      bonus = remaining[Math.floor(Math.random() * remaining.length)];
    }

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

      const bonusLabel = document.createElement("span");
      bonusLabel.className = "bonus-label-inline";
      bonusLabel.textContent = "보너스";
      balls.appendChild(bonusLabel);

      const bonusBall = document.createElement("span");
      bonusBall.className = "ball ball-bonus";
      bonusBall.setAttribute("data-range", getRange(bonus));
      bonusBall.textContent = bonus;
      balls.appendChild(bonusBall);

      card.appendChild(title);
      card.appendChild(balls);
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

  // 로또 데이터 로드 (페이지 로드 시)
  loadLottoData().then(function () {
    if (lottoData) {
      console.log("로또 당첨 번호 데이터 로드 완료. 통계 기반 추천 모드 활성화.");
    }
  });
})();
