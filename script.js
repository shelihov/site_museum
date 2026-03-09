// Минимальный статический рендер экспонатов + простая навигация по хешу

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Экранирует потенциально опасные символы для безопасной вставки в HTML-строки.
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Генерирует SVG-заглушку в виде data URL, если у экспоната нет изображения.
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

// Рендерит список тегов в HTML-строку.
function renderTags(tags) {
  return tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
}

// Рендерит пункты списка (bullets) в HTML-строку.
function renderBullets(bullets) {
  return bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("");
}

// Создает DOM-карточку экспоната для сетки зала и вешает открытие модалки по клику.
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

// Открывает модалку для выбранного экспоната: сохраняет текущие индекс и зал.
function openModal(ex) {
  currentModalIndex = EXHIBITS.findIndex((e) => e.id === ex.id);
  currentModalHall = ex.hall;
  renderModal();
}

// Возвращает состояние текущей модалки: экспонат, список экспонатов зала и доступность навигации.
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

// Возвращает HTML-блок с видео, если у экспоната указан id ролика.
function renderVideo(videoId) {
  if (!videoId) return "";

  return `
    <h3>Видео</h3>
    <div class="video" data-video-id="${escapeHtml(videoId)}">
      <button class="videoPlayBtn" type="button" aria-label="Воспроизвести видео">
        ▶ Воспроизвести
      </button>
    </div>
  `;
}

// Рендерит раздел с источниками, если они есть.
function renderSources(sources) {
  if (!sources || !sources.length) return "";
  return `<h3>Источники</h3><ul>${sources
    .map(
      (s) =>
        `<li><a href="${escapeHtml(s)}" target="_blank">${escapeHtml(s)}</a></li>`
    )
    .join("")}</ul>`;
}

// Рендерит HTML теста (вопросы + варианты + кнопка проверки), если тест задан.
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

// Формирует список изображений для модалки и гарантирует минимум 2 кадра для слайдера.
function getExhibitImages(ex) {
  const fallback = fallbackImage(ex.icon, 500, 400, "#334", "#778", 120);
  const images = [];
  const seen = new Set();
  const addImage = (src) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    images.push(src);
  };

  if (Array.isArray(ex.modalImages)) {
    ex.modalImages.forEach((img) => {
      addImage(img);
    });
  }

  if (images.length < 2) {
    addImage(ex.modalImage);
    addImage(ex.image);
  }

  if (!images.length) {
    addImage(fallback);
  }

  if (images.length === 1) {
    images.push(images[0]);
  }

  return images;
}

// Рендерит ручной слайдер изображений для модального окна экспоната.
function renderImageSlider(images, exhibitName) {
  return `
    <div class="imageSlider" data-slider-index="0">
      <button class="imageSlideBtn imageSlidePrev" type="button" aria-label="Предыдущее фото">←</button>
      <button class="imageSlideBtn imageSlideNext" type="button" aria-label="Следующее фото">→</button>
      ${images
        .map(
          (src, index) => `
            <img
              class="slideImage ${index === 0 ? "active" : ""}"
              src="${escapeHtml(src)}"
              alt="${escapeHtml(exhibitName)}"
              data-slide-index="${index}"
            >
          `
        )
        .join("")}
      <div class="imageSlideCounter">
        <span class="imageSlideCurrent">1</span> / <span class="imageSlideTotal">${images.length}</span>
      </div>
    </div>
  `;
}

// Собирает основной HTML-контент модального окна экспоната.
function renderModalInner(ex, hallExhibits, canPrev, canNext) {
  const tags = ex.tags ?? [];
  const images = getExhibitImages(ex);

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
          ${renderImageSlider(images, ex.name)}
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

// Подключает перелистывание слайдов по кнопкам "назад/вперед".
function attachImageSliderHandlers(modal) {
  const slider = modal.querySelector(".imageSlider");
  if (!slider) return;

  const images = [...slider.querySelectorAll(".slideImage")];
  const current = slider.querySelector(".imageSlideCurrent");
  const prevBtn = slider.querySelector(".imageSlidePrev");
  const nextBtn = slider.querySelector(".imageSlideNext");
  let index = 0;

  // Фиксирует размер области слайдера по первому фото, чтобы контент не "прыгал" при листании.
  const firstImage = images[0];
  const applyFirstImageAspect = () => {
    if (!firstImage.naturalWidth || !firstImage.naturalHeight) return;
    slider.style.setProperty(
      "--slider-aspect",
      `${firstImage.naturalWidth} / ${firstImage.naturalHeight}`
    );
  };

  if (firstImage) {
    if (firstImage.complete) {
      applyFirstImageAspect();
    } else {
      firstImage.addEventListener("load", applyFirstImageAspect, { once: true });
    }
  }

  const update = () => {
    images.forEach((img, i) => {
      img.classList.toggle("active", i === index);
    });
    current.textContent = String(index + 1);
    slider.setAttribute("data-slider-index", String(index));
  };

  prevBtn.addEventListener("click", () => {
    index = (index - 1 + images.length) % images.length;
    update();
  });

  nextBtn.addEventListener("click", () => {
    index = (index + 1) % images.length;
    update();
  });
}

// Открывает увеличенное изображение поверх модалки для детального просмотра.
function openZoom(modal, src, alt) {
  const existing = modal.querySelector(".imageZoomOverlay");
  if (existing) existing.remove();

  const zoomOverlay = document.createElement("div");
  zoomOverlay.className = "imageZoomOverlay";
  zoomOverlay.innerHTML = `
    <button class="imageZoomClose" type="button" aria-label="Закрыть увеличение">&times;</button>
    <img class="imageZoomImg" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">
  `;

  modal.appendChild(zoomOverlay);

  const closeZoom = () => {
    zoomOverlay.remove();
  };

  zoomOverlay.querySelector(".imageZoomClose").addEventListener("click", closeZoom);
  zoomOverlay.addEventListener("click", (e) => {
    if (e.target === zoomOverlay) closeZoom();
  });
}

// Подключает клик по фото слайда для открытия увеличенной версии.
function attachImageZoomHandlers(modal) {
  modal.querySelectorAll(".slideImage").forEach((img) => {
    img.addEventListener("click", () => {
      openZoom(modal, img.getAttribute("src"), img.getAttribute("alt"));
    });
  });
}

// Подключает отложенную загрузку Rutube: iframe создается только после клика "Play".
function attachVideoHandlers(modal) {
  const videoEl = modal.querySelector(".video[data-video-id]");
  if (!videoEl) return;

  const playBtn = videoEl.querySelector(".videoPlayBtn");
  const videoId = videoEl.getAttribute("data-video-id");
  if (!playBtn || !videoId) return;

  playBtn.addEventListener("click", () => {
    videoEl.innerHTML = `
      <iframe
        src="https://rutube.ru/play/embed/${videoId}?autoplay=1"
        frameborder="0"
        allowfullscreen
        width="100%"
        height="315">
      </iframe>
    `;
  });
}

// Подключает логику проверки теста внутри модалки и вывод результата.
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

// Удаляет модалку из DOM и снимает обработчик клавиатуры, связанный с модалкой.
function removeModal(modal) {
  if (modalKeydownHandler) {
    document.removeEventListener("keydown", modalKeydownHandler);
    modalKeydownHandler = null;
  }
  modal.remove();
}

// Закрывает модалку и сбрасывает текущий выбранный индекс.
function closeModal(modal) {
  removeModal(modal);
  currentModalIndex = -1;
}

// Переключает экспонат в модалке на предыдущий/следующий и перерисовывает окно.
function navigateModal(modal, delta) {
  currentModalIndex += delta;
  removeModal(modal);
  renderModal();
}

// Рендерит модалку текущего экспоната и навешивает все обработчики взаимодействия.
function renderModal() {
  if (currentModalIndex < 0) return;

  const { ex, hallExhibits, canPrev, canNext } = getModalState();

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "currentModal";
  modal.innerHTML = renderModalInner(ex, hallExhibits, canPrev, canNext);

  document.body.appendChild(modal);
  attachImageSliderHandlers(modal);
  attachImageZoomHandlers(modal);
  attachVideoHandlers(modal);
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
    const zoomOverlay = modal.querySelector(".imageZoomOverlay");

    if (zoomOverlay) {
      if (e.key === "Escape") {
        zoomOverlay.remove();
      }
      return;
    }

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

// Рендерит карточки экспонатов по залам в соответствующие grid-контейнеры.
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

// Показывает секцию выбранного маршрута и скрывает остальные.
function showRoute(route) {
  $$('[data-route]').forEach((el) => {
    el.classList.toggle("show", el.getAttribute("data-route") === route);
  });

  $$("section[id]").forEach((el) => {
    el.classList.toggle("show", el.id === route);
  });
}

// Инициализирует hash-routing: обновляет видимую секцию при смене hash.
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
