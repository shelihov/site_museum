(function () {
  // Короткие помощники для поиска элементов.
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  // Небольшое экранирование, чтобы безопасно вставлять src/alt в модальное окно.
  function esc(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // Инициализируем один статический слайдер, уже сверстанный прямо в HTML.
  function initSlider(wrapper) {
    const slider = $('.imageSlider', wrapper);
    const images = $$('.slideImage', slider);
    const thumbs = $$('.imageThumb', wrapper);
    const caption = $('.imageSlideCaption', wrapper);
    const current = $('.imageSlideCurrent', wrapper);
    const prevBtn = $('.imageSlidePrev', wrapper);
    const nextBtn = $('.imageSlideNext', wrapper);

    if (!slider || !images.length || !current) return;

    let index = Math.max(images.findIndex((img) => img.classList.contains('active')), 0);

    // Переключаем активную картинку, миниатюру и подпись.
    function renderSlide() {
      images.forEach((img, imgIndex) => {
        img.classList.toggle('active', imgIndex === index);
      });

      thumbs.forEach((thumb, thumbIndex) => {
        thumb.classList.toggle('active', thumbIndex === index);
      });

      current.textContent = String(index + 1);

      if (caption) {
        const text = images[index]?.dataset.caption || '';
        caption.textContent = text;
        caption.classList.toggle('show', Boolean(text));
      }
    }

    // Открываем увеличенную версию текущей картинки в модальном оверлее.
    function openZoom(image) {
      const overlay = document.createElement('div');
      overlay.className = 'imageZoomOverlay';
      overlay.innerHTML = `
        <button class="imageZoomClose" type="button" aria-label="Закрыть">&times;</button>
        <img class="imageZoomImg" src="${esc(image.getAttribute('src'))}" alt="${esc(image.getAttribute('alt'))}" />
      `;

      document.body.appendChild(overlay);

      function closeZoom() {
        overlay.remove();
      }

      $('.imageZoomClose', overlay)?.addEventListener('click', closeZoom);
      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) closeZoom();
      });
    }

    // Листаем назад по кругу.
    prevBtn?.addEventListener('click', function () {
      index = (index - 1 + images.length) % images.length;
      renderSlide();
    });

    // Листаем вперед по кругу.
    nextBtn?.addEventListener('click', function () {
      index = (index + 1) % images.length;
      renderSlide();
    });

    // Даем переключать слайд кликом по миниатюре.
    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', function () {
        const nextIndex = Number(thumb.dataset.slideIndex);
        if (!Number.isInteger(nextIndex)) return;
        index = nextIndex;
        renderSlide();
      });
    });

    // Даем открыть увеличенную версию кликом по большому фото.
    images.forEach((image, imageIndex) => {
      image.dataset.caption = caption && imageIndex === index ? caption.textContent || '' : image.dataset.caption || '';
      image.addEventListener('click', function () {
        openZoom(image);
      });
    });

    renderSlide();
  }

  // Превращаем статический список вариантов в пошаговый тест с подсветкой ответов.
  function initQuiz(section) {
    const list = $('ol', section);
    if (!list) return;

    const questions = $$('li', list).map(function (item, itemIndex) {
      const title = $('strong', item)?.textContent.trim() || `Вопрос ${itemIndex + 1}`;
      const options = ($('.quizOptionRaw', item)?.textContent || '')
        .split(' / ')
        .map((text) => text.trim())
        .filter(Boolean);
      const correct = Number(item.dataset.correct);

      return { title, options, correct };
    }).filter((question) => question.options.length && Number.isInteger(question.correct));

    if (!questions.length) return;

    list.remove();

    const wizard = document.createElement('div');
    wizard.className = 'quizWizard';
    wizard.innerHTML = `
      <div class="quizProgress">Вопрос <span id="quizStep">1</span> из <span id="quizTotal">${questions.length}</span></div>
      <div id="quizQuestion" class="quizQuestion"></div>
      <div id="quizOptions" class="quizOptions"></div>
      <button type="button" id="quizNext" disabled>Дальше</button>
      <div id="quizResult"></div>
    `;

    $('.cardContent', section)?.appendChild(wizard);

    let step = 0;
    let score = 0;
    let answered = false;

    const stepNode = $('#quizStep', wizard);
    const questionNode = $('#quizQuestion', wizard);
    const optionsNode = $('#quizOptions', wizard);
    const nextNode = $('#quizNext', wizard);
    const resultNode = $('#quizResult', wizard);

    // Рисуем текущий вопрос и кнопки ответов.
    function renderQuestion() {
      const question = questions[step];
      answered = false;

      stepNode.textContent = String(step + 1);
      questionNode.innerHTML = `<p>${esc(question.title)}</p>`;
      optionsNode.innerHTML = question.options
        .map((option, optionIndex) => `<button type="button" class="quizOption" data-index="${optionIndex}">${esc(option)}</button>`)
        .join('');

      resultNode.textContent = '';
      nextNode.disabled = true;
      nextNode.textContent = step === questions.length - 1 ? 'Показать результат' : 'Дальше';

      $$('.quizOption', optionsNode).forEach((button) => {
        button.addEventListener('click', function () {
          if (answered) return;
          answered = true;

          const chosen = Number(button.dataset.index);
          const correct = question.correct;

          if (chosen === correct) {
            score += 1;
            button.classList.add('correct');
          } else {
            button.classList.add('wrong');
            $(`.quizOption[data-index="${correct}"]`, optionsNode)?.classList.add('correct');
          }

          $$('.quizOption', optionsNode).forEach((optionButton) => {
            optionButton.disabled = true;
          });

          nextNode.disabled = false;
        });
      });
    }

    // После ответа переходим к следующему вопросу или показываем итог.
    nextNode.addEventListener('click', function () {
      if (!answered) return;

      if (step < questions.length - 1) {
        step += 1;
        renderQuestion();
        return;
      }

      questionNode.innerHTML = '';
      optionsNode.innerHTML = '';
      nextNode.style.display = 'none';
      resultNode.innerHTML = `<p>Правильных ответов: ${score} из ${questions.length}</p>`;
    });

    renderQuestion();
  }

  // После загрузки страницы подключаем только поведение к уже готовому HTML.
  document.addEventListener('DOMContentLoaded', function () {
    $$('.imageSliderWrap').forEach(initSlider);
    $$('#test').forEach(initQuiz);
  });
})();
