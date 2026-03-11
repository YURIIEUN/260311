(function () {
  "use strict";

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

    for (let s = 0; s < count; s++) {
      const { numbers, bonus } = pickOneSet();
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
  }

  generateBtn.addEventListener("click", render);
})();
