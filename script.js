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

// Формирует набор фото для мини-слайдера карточки.
function getCardImages(ex) {
  const fallback = fallbackImage(ex.icon, 400, 300, "#223", "#667", 48);
  const images = [];
  const seen = new Set();
  const addImage = (src) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    images.push(src);
  };

  if (Array.isArray(ex.images)) {
    ex.images.forEach((img) => addImage(img));
  }
  if (Array.isArray(ex.modalImages)) {
    ex.modalImages.forEach((img) => addImage(img));
  }

  addImage(ex.image);
  addImage(ex.modalImage);

  if (!images.length) {
    addImage(fallback);
  }

  return images;
}

// Рендерит мини-слайдер фото для карточки экспоната.
function renderCardImageSlider(images, exhibitName) {
  const hasMany = images.length > 1;

  return `
    <div class="cardImageSlider" data-slider-index="0">
      ${images
        .map(
          (src, index) => `
            <img
              class="cardSlideImage ${index === 0 ? "active" : ""}"
              src="${escapeHtml(src)}"
              alt="${escapeHtml(exhibitName)}"
              data-slide-index="${index}"
            >
          `
        )
        .join("")}
      ${
        hasMany
          ? `
            <button class="cardSlideBtn cardSlidePrev" type="button" aria-label="Предыдущее фото">←</button>
            <button class="cardSlideBtn cardSlideNext" type="button" aria-label="Следующее фото">→</button>
            <div class="cardSlideCounter">
              <span class="cardSlideCurrent">1</span> / <span class="cardSlideTotal">${images.length}</span>
            </div>
          `
          : ""
      }
    </div>
  `;
}

// Подключает листание мини-слайдера в карточке по стрелкам.
function attachCardImageSliderHandlers(cardEl) {
  const slider = cardEl.querySelector(".cardImageSlider");
  if (!slider) return;

  const images = [...slider.querySelectorAll(".cardSlideImage")];
  if (images.length <= 1) return;

  const current = slider.querySelector(".cardSlideCurrent");
  const prevBtn = slider.querySelector(".cardSlidePrev");
  const nextBtn = slider.querySelector(".cardSlideNext");
  let index = 0;

  const update = () => {
    images.forEach((img, i) => {
      img.classList.toggle("active", i === index);
    });
    current.textContent = String(index + 1);
    slider.setAttribute("data-slider-index", String(index));
  };

  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    index = (index - 1 + images.length) % images.length;
    update();
  });

  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    index = (index + 1) % images.length;
    update();
  });
}

// Создает DOM-карточку экспоната для сетки зала и вешает открытие модалки по клику.
function exhibitCard(ex) {
  const cardImages = getCardImages(ex);
  const bullets = ex.bullets ?? [];
  const tags = ex.tags ?? [];

  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `
    <div class="cardImage">
      ${renderCardImageSlider(cardImages, ex.name)}
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

  attachCardImageSliderHandlers(el);
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

// Извлекает id YouTube из URL или возвращает строку как id, если формат похож на id.
function extractYouTubeId(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const v = url.searchParams.get("v");
      if (v) return v;

      const parts = url.pathname.split("/").filter(Boolean);
      const embedIndex = parts.findIndex((part) => part === "embed" || part === "shorts");
      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }
    }
  } catch (_err) {
    // Ничего: значение могло быть просто id без URL.
  }

  return /^[A-Za-z0-9_-]{11}$/.test(raw) ? raw : null;
}

// Извлекает id Rutube из URL или id-строки.
function extractRutubeId(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host.includes("rutube.ru")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const videoIndex = parts.findIndex((part) => part === "video");
      if (videoIndex >= 0 && parts[videoIndex + 1]) {
        return parts[videoIndex + 1];
      }
      const embedIndex = parts.findIndex((part) => part === "embed");
      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }
    }
  } catch (_err) {
    // Ничего: значение могло быть просто id без URL.
  }

  const match = raw.match(/[a-f0-9]{32}/i);
  return match ? match[0] : null;
}

// Преобразует входное значение видео в нормализованный embed URL (Rutube или YouTube).
function resolveVideoEmbed(video) {
  if (!video) return null;

  if (typeof video === "object") {
    const platform = String(video.platform || "").toLowerCase();
    if (video.embedUrl) {
      return { platform: platform || "custom", embedUrl: String(video.embedUrl).trim() };
    }

    const value = String(video.url || video.id || "").trim();
    if (!value) return null;

    if (platform === "youtube" || platform === "yt") {
      const ytId = extractYouTubeId(value);
      if (!ytId) return null;
      return {
        platform: "youtube",
        embedUrl: `https://www.youtube.com/embed/${ytId}`,
        watchUrl: `https://www.youtube.com/watch?v=${ytId}`,
      };
    }
    if (platform === "rutube") {
      const rutubeId = extractRutubeId(value) || value;
      return {
        platform: "rutube",
        embedUrl: `https://rutube.ru/play/embed/${rutubeId}`,
        watchUrl: `https://rutube.ru/video/${rutubeId}/`,
      };
    }

    return resolveVideoEmbed(value);
  }

  const raw = String(video).trim();
  if (!raw) return null;

  const ytId = extractYouTubeId(raw);
  if (ytId) {
    return {
      platform: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytId}`,
      watchUrl: `https://www.youtube.com/watch?v=${ytId}`,
    };
  }

  const rutubeId = extractRutubeId(raw);
  if (rutubeId) {
    return {
      platform: "rutube",
      embedUrl: `https://rutube.ru/play/embed/${rutubeId}`,
      watchUrl: `https://rutube.ru/video/${rutubeId}/`,
    };
  }

  if (raw.includes("/embed/")) {
    return { platform: "custom", embedUrl: raw, watchUrl: raw };
  }

  // Обратная совместимость: если передали только строку-id, считаем это Rutube id.
  return {
    platform: "rutube",
    embedUrl: `https://rutube.ru/play/embed/${raw}`,
    watchUrl: `https://rutube.ru/video/${raw}/`,
  };
}

// Возвращает HTML-блок с видео (Rutube/YouTube) с отложенной загрузкой по кнопке Play.
function renderVideo(video, videoText) {
  const videoData = resolveVideoEmbed(video);
  if (!videoData) return "";

  return `
    <h3>Видео</h3>
    ${videoText ? `<p class="videoIntro">${escapeHtml(videoText)}</p>` : ""}
    <div
      class="video"
      data-video-embed="${escapeHtml(videoData.embedUrl)}"
      data-video-platform="${escapeHtml(videoData.platform)}"
      data-video-watch="${escapeHtml(videoData.watchUrl || "")}">
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

// Рендерит HTML пошагового теста: по одному вопросу с переходом "Далее".
function renderQuiz(quiz) {
  if (!quiz) return "";

  return `
    <h3>Тест</h3>
    <div class="quizWizard" data-total="${quiz.length}">
      <div class="quizProgress">
        Вопрос <span id="quizStep">1</span> из <span id="quizTotal">${quiz.length}</span>
      </div>
      <div id="quizQuestion" class="quizQuestion"></div>
      <div id="quizOptions" class="quizOptions"></div>
      <button type="button" id="quizNext" disabled>Дальше</button>
      <div id="quizResult"></div>
    </div>
  `;
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

// Формирует подписи к фото для модального слайдера (по слайдам или общая подпись).
function getExhibitImageCaptions(ex, imageCount) {
  const list =
    (Array.isArray(ex.photoCaptions) && ex.photoCaptions) ||
    (Array.isArray(ex.imageCaptions) && ex.imageCaptions) ||
    (Array.isArray(ex.modalImageCaptions) && ex.modalImageCaptions) ||
    [];

  const captions = Array.from({ length: imageCount }, (_unused, index) =>
    list[index] ? String(list[index]) : ""
  );

  if (!captions.some(Boolean) && typeof ex.photoCaption === "string") {
    captions[0] = ex.photoCaption;
  }

  return captions;
}

// Рендерит ручной слайдер изображений для модального окна экспоната.
function renderImageSlider(images, exhibitName, captions) {
  const hasCaption = captions.some((caption) => Boolean(caption));

  return `
    <div class="imageSliderWrap">
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
                data-caption="${escapeHtml(captions[index] || "")}"
              >
            `
          )
          .join("")}
        <div class="imageSlideCounter">
          <span class="imageSlideCurrent">1</span> / <span class="imageSlideTotal">${images.length}</span>
        </div>
      </div>
      <div class="imageSlideCaption ${hasCaption ? "show" : ""}">
        ${escapeHtml(captions[0] || "")}
      </div>
    </div>
  `;
}

// Собирает основной HTML-контент модального окна экспоната.
function renderModalInner(ex, hallExhibits, canPrev, canNext) {
  const tags = ex.tags ?? [];
  const images = getExhibitImages(ex);
  const captions = getExhibitImageCaptions(ex, images.length);

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
          ${renderImageSlider(images, ex.name, captions)}
          ${renderVideo(ex.video, ex.videoText)}
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
  const caption = modal.querySelector(".imageSlideCaption");
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

    if (caption) {
      const text = images[index]?.dataset.caption || "";
      caption.textContent = text;
      caption.classList.toggle("show", Boolean(text));
    }
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

// Подключает отложенную загрузку видео: iframe создается только после клика "Play".
function attachVideoHandlers(modal) {
  const videoEl = modal.querySelector(".video[data-video-embed]");
  if (!videoEl) return;

  const playBtn = videoEl.querySelector(".videoPlayBtn");
  const embedUrl = videoEl.getAttribute("data-video-embed");
  const platform = videoEl.getAttribute("data-video-platform");
  const watchUrl = videoEl.getAttribute("data-video-watch");
  if (!playBtn || !embedUrl || !platform) return;

  playBtn.addEventListener("click", () => {
    // Для YouTube при запуске страницы как file:// встраивание может падать с Error 153.
    if (platform === "youtube" && location.protocol === "file:") {
      videoEl.innerHTML = `
        <div class="videoNotice">
          <p>Встроенный YouTube-плеер недоступен в локальном режиме file://.</p>
          <a href="${escapeHtml(watchUrl || embedUrl)}" target="_blank" rel="noopener noreferrer">Открыть видео на YouTube</a>
        </div>
      `;
      return;
    }

    const originParam =
      platform === "youtube" && location.origin && location.origin !== "null"
        ? `&origin=${encodeURIComponent(location.origin)}`
        : "";
    const src = `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1${originParam}`;
    videoEl.innerHTML = `
      <iframe
        src="${escapeHtml(src)}"
        title="Видео экспоната"
        frameborder="0"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        width="100%"
        height="315">
      </iframe>
    `;
  });
}

// Подключает пошаговую логику теста: выбор ответа, подсветка и итоговый результат.
function attachQuizHandler(modal, quiz) {
  if (!quiz) return;

  const questionEl = modal.querySelector("#quizQuestion");
  const optionsEl = modal.querySelector("#quizOptions");
  const nextBtn = modal.querySelector("#quizNext");
  const stepEl = modal.querySelector("#quizStep");
  const totalEl = modal.querySelector("#quizTotal");
  const resultDiv = modal.querySelector("#quizResult");
  if (!questionEl || !optionsEl || !nextBtn || !stepEl || !totalEl || !resultDiv) return;

  let currentIndex = 0;
  let correctCount = 0;
  let answered = false;

  const renderCurrentQuestion = () => {
    const current = quiz[currentIndex];
    answered = false;
    nextBtn.disabled = true;
    nextBtn.textContent = currentIndex === quiz.length - 1 ? "Показать результат" : "Дальше";
    stepEl.textContent = String(currentIndex + 1);
    totalEl.textContent = String(quiz.length);
    resultDiv.textContent = "";

    questionEl.innerHTML = `<p>${currentIndex + 1}. ${escapeHtml(current.question)}</p>`;
    optionsEl.innerHTML = current.options
      .map(
        (opt, optionIndex) =>
          `<button type="button" class="quizOption" data-option-index="${optionIndex}">${escapeHtml(opt)}</button>`
      )
      .join("");

    const optionButtons = [...optionsEl.querySelectorAll(".quizOption")];
    optionButtons.forEach((btn, optionIndex) => {
      btn.addEventListener("click", () => {
        if (answered) return;
        answered = true;

        const isCorrect = optionIndex === current.correct;
        if (isCorrect) {
          correctCount++;
          btn.classList.add("correct");
        } else {
          btn.classList.add("wrong");
          const correctBtn = optionButtons[current.correct];
          if (correctBtn) correctBtn.classList.add("correct");
        }

        optionButtons.forEach((optionBtn) => {
          optionBtn.disabled = true;
        });
        nextBtn.disabled = false;
      });
    });
  };

  nextBtn.addEventListener("click", () => {
    if (!answered) return;

    if (currentIndex < quiz.length - 1) {
      currentIndex++;
      renderCurrentQuestion();
      return;
    }

    questionEl.innerHTML = "";
    optionsEl.innerHTML = "";
    nextBtn.style.display = "none";
    resultDiv.innerHTML = `<p>Правильных ответов: ${correctCount} из ${quiz.length}</p>`;
  });

  renderCurrentQuestion();
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

const HALL3_GENERATIONS = [
  {
    id: "gen1",
    title: "1 поколение (1940-е - конец 1950-х)",
    summary:
      "Электронные лампы. Громоздкие, потребляли много энергии, отличались низкой надежностью.",
    exhibits: "ENIAC (США), UNIVAC I (США), М-1, БЭСМ (СССР).",
  },
  {
    id: "gen2",
    title: "2 поколение (конец 1950-х - середина 1960-х)",
    summary:
      "Транзисторы. Меньше размер, выше быстродействие, надежнее ламповых систем.",
    exhibits: "IBM 7090 (США), CDC 1604 (США), ЭВМ «Раздан-2» (СССР).",
  },
  {
    id: "gen3",
    title: "3 поколение (середина 1960-х - 1970-е)",
    summary:
      "Интегральные схемы (ИС). Использование микросхем, развитие операционных систем, появление мини-ЭВМ.",
    exhibits: "Семейство IBM System/360 (США), ЕС ЭВМ (СССР).",
  },
  {
    id: "gen4",
    title: "4 поколение (1980-е - настоящее время)",
    summary:
      "Микропроцессоры и большие интегральные схемы (БИС). Появление персональных компьютеров и ноутбуков.",
    exhibits: "Apple II, IBM PC, Intel 4004.",
  },
  {
    id: "gen5",
    title: "5 поколение (с 1990-х)",
    summary:
      "Сверхбольшие интегральные схемы (СБИС), параллельно-векторные структуры, искусственный интеллект и нейросети.",
    exhibits: "Современные суперкомпьютеры.",
  },
];

function renderHall3WithDividers(grid) {
  const hall3Items = EXHIBITS.filter((e) => e.hall === "hall3");

  HALL3_GENERATIONS.forEach((generation) => {
    const divider = document.createElement("div");
    divider.className = "generationDivider";
    divider.innerHTML = `
      <h3>${escapeHtml(generation.title)}</h3>
      <p>${escapeHtml(generation.summary)}</p>
      <p><strong>Экспонаты:</strong> ${escapeHtml(generation.exhibits)}</p>
    `;
    grid.appendChild(divider);

    hall3Items
      .filter((item) => item.generation === generation.id)
      .forEach((item) => grid.appendChild(exhibitCard(item)));
  });
}

// Рендерит карточки экспонатов по залам в соответствующие grid-контейнеры.
function renderHalls() {
  const halls = ["hall1", "hall2", "hall3", "hall4", "hall5"];

  halls.forEach((hallId) => {
    const grid = $(`#${hallId}Grid`);
    if (!grid) return;

    grid.innerHTML = "";

    if (hallId === "hall3") {
      renderHall3WithDividers(grid);
      return;
    }

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
