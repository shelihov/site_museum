// Минимальный статический рендер экспонатов + простая навигация по хешу

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fallbackImage(icon, width, height, bg, fg, fontSize) {
  return (
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='" +
    width +
    "' height='" +
    height +
    "'%3E%3Crect fill='" +
    encodeURIComponent(bg) +
    "' width='" +
    width +
    "' height='" +
    height +
    "'/%3E%3Ctext x='50%25' y='50%25' font-size='" +
    fontSize +
    "' text-anchor='middle' dominant-baseline='middle' fill='" +
    encodeURIComponent(fg) +
    "'%3E" +
    escapeHtml(icon) +
    "%3C/text%3E%3C/svg%3E"
  );
}

function renderTags(tags) {
  return tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
}

function renderBullets(bullets) {
  return bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("");
}

function exhibitCard(ex) {
  const imageSrc = ex.image || fallbackImage(ex.icon, 400, 300, "#223", "#667", 48);
  const bullets = ex.bullets ?? [];
  const tags = ex.tags ?? [];

  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `
    <div class="cardImage">
      <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(ex.name)}">
      <div class="cardGlow"></div>
    </div>
    <div class="cardContent">
      <div class="top">
        <div>
          <div class="kicker">${escapeHtml(ex.kicker)}</div>
          <div class="name">${escapeHtml(ex.name)}</div>
        </div>
        <div class="badge">${escapeHtml(ex.period)}</div>
      </div>
      <div class="thumb">
        <div class="glyph">${ex.icon}</div>
        <div class="line">${escapeHtml(ex.short)}</div>
      </div>
      <div class="preview">${escapeHtml(ex.desc)}</div>
      <div style="padding:0 0 0 0;color:var(--muted);font-size:13px;line-height:1.4;">
        <ul class="bul">${renderBullets(bullets)}</ul>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">${renderTags(tags)}</div>
      </div>
    </div>
  `;

  el.addEventListener("click", () => openModal(ex));
  return el;
}

let currentModalIndex = -1;
let currentModalHall = null;
let modalKeydownHandler = null;

function openModal(ex) {
  currentModalIndex = EXHIBITS.findIndex((e) => e.id === ex.id);
  currentModalHall = ex.hall;
  renderModal();
}

function getModalState() {
  const ex = EXHIBITS[currentModalIndex];
  const hallExhibits = EXHIBITS.filter((e) => e.hall === currentModalHall);
  const canPrev =
    currentModalIndex > 0 && EXHIBITS[currentModalIndex - 1].hall === currentModalHall;
  const canNext =
    currentModalIndex < EXHIBITS.length - 1 &&
    EXHIBITS[currentModalIndex + 1].hall === currentModalHall;

  return { ex, hallExhibits, canPrev, canNext };
}

function renderVideo(videoId) {
  if (!videoId) return "";

  return `
    <h3>Видео</h3>
    <div class="video">
      <iframe
        src="https://rutube.ru/play/embed/${videoId}"
        frameborder="0"
        allowfullscreen
        width="100%"
        height="315">
      </iframe>
    </div>
  `;
}

function renderSources(sources) {
  if (!sources || !sources.length) return "";
  return `<h3>Источники</h3><ul>${sources
    .map(
      (s) =>
        `<li><a href="${escapeHtml(s)}" target="_blank">${escapeHtml(s)}</a></li>`
    )
    .join("")}</ul>`;
}

function renderQuiz(quiz) {
  if (!quiz) return "";

  return `<h3>Тест</h3><form id="quizForm">${quiz
    .map(
      (q, i) => `
      <div class="quizQuestion">
        <p>${i + 1}. ${escapeHtml(q.question)}</p>
        ${q.options
          .map(
            (opt, j) =>
              `<label><input type="radio" name="q${i}" value="${j}"> ${escapeHtml(opt)}</label>`
          )
          .join("<br>")}
      </div>
    `
    )
    .join("")}<button type="button" id="checkQuiz">Проверить</button></form><div id="quizResult"></div>`;
}

function renderModalInner(ex, hallExhibits, canPrev, canNext) {
  const modalImage =
    ex.modalImage || fallbackImage(ex.icon, 500, 400, "#334", "#778", 120);
  const tags = ex.tags ?? [];

  return `
    <div class="modalContent">
      <button class="modalClose" aria-label="Закрыть">&times;</button>

      <div class="modalNav">
        <button class="modalPrev" ${!canPrev ? "disabled" : ""} aria-label="Предыдущий">← Назад</button>
        <div class="modalCounter">${hallExhibits.findIndex((e) => e.id === ex.id) + 1} / ${hallExhibits.length}</div>
        <button class="modalNext" ${!canNext ? "disabled" : ""} aria-label="Следующий">Вперед →</button>
      </div>

      <div class="modalGrid">
        <div class="modalImage">
          <img src="${escapeHtml(modalImage)}" alt="${escapeHtml(ex.name)}">
          ${renderVideo(ex.video)}
        </div>

        <div class="modalInfo">
          <div class="modalHeader">
            <div class="modalKicker">${escapeHtml(ex.kicker)}</div>
            <h2 class="modalTitle">${escapeHtml(ex.name)}</h2>
            <div class="modalPeriod">${escapeHtml(ex.period)}</div>
          </div>

          <div class="modalText">
            <h3>Описание</h3>
            <p>${escapeHtml(ex.desc)}</p>

            <h3>История</h3>
            <p>${escapeHtml(ex.history)}</p>

            <h3>Принцип работы</h3>
            <p>${escapeHtml(ex.work)}</p>

            ${renderSources(ex.sources)}
            ${renderQuiz(ex.quiz)}
          </div>

          <div class="modalTags">${renderTags(tags)}</div>
        </div>
      </div>
    </div>
  `;
}

function attachQuizHandler(modal, quiz) {
  if (!quiz) return;

  const checkBtn = modal.querySelector("#checkQuiz");
  const resultDiv = modal.querySelector("#quizResult");

  checkBtn.addEventListener("click", () => {
    let correct = 0;

    quiz.forEach((q, i) => {
      const selected = modal.querySelector(`input[name="q${i}"]:checked`);
      if (selected && parseInt(selected.value, 10) === q.correct) {
        correct++;
      }
    });

    resultDiv.innerHTML = `<p>Правильных ответов: ${correct} из ${quiz.length}</p>`;
  });
}

function removeModal(modal) {
  if (modalKeydownHandler) {
    document.removeEventListener("keydown", modalKeydownHandler);
    modalKeydownHandler = null;
  }
  modal.remove();
}

function closeModal(modal) {
  removeModal(modal);
  currentModalIndex = -1;
}

function navigateModal(modal, delta) {
  currentModalIndex += delta;
  removeModal(modal);
  renderModal();
}

function renderModal() {
  if (currentModalIndex < 0) return;

  const { ex, hallExhibits, canPrev, canNext } = getModalState();

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "currentModal";
  modal.innerHTML = renderModalInner(ex, hallExhibits, canPrev, canNext);

  document.body.appendChild(modal);
  attachQuizHandler(modal, ex.quiz);

  const closeBtn = modal.querySelector(".modalClose");
  const prevBtn = modal.querySelector(".modalPrev");
  const nextBtn = modal.querySelector(".modalNext");

  closeBtn.addEventListener("click", () => closeModal(modal));
  prevBtn.addEventListener("click", () => navigateModal(modal, -1));
  nextBtn.addEventListener("click", () => navigateModal(modal, 1));

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });

  modalKeydownHandler = (e) => {
    if (e.key === "Escape") {
      closeModal(modal);
    } else if (e.key === "ArrowLeft" && canPrev) {
      navigateModal(modal, -1);
    } else if (e.key === "ArrowRight" && canNext) {
      navigateModal(modal, 1);
    }
  };

  document.addEventListener("keydown", modalKeydownHandler);
}

function renderHalls() {
  const halls = ["hall1", "hall2", "hall3", "hall4", "hall5"];

  halls.forEach((hallId) => {
    const grid = $(`#${hallId}Grid`);
    if (!grid) return;

    grid.innerHTML = "";
    EXHIBITS
      .filter((e) => e.hall === hallId)
      .forEach((e) => grid.appendChild(exhibitCard(e)));
  });
}

function showRoute(route) {
  $$('[data-route]').forEach((el) => {
    el.classList.toggle("show", el.getAttribute("data-route") === route);
  });

  $$("section[id]").forEach((el) => {
    el.classList.toggle("show", el.id === route);
  });
}

function initRouting() {
  function applyHash() {
    const route = (location.hash || "").replace("#", "") || "home";
    showRoute(route);
  }

  window.addEventListener("hashchange", applyHash);
  applyHash();
}

renderHalls();
initRouting();
