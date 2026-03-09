// Минимальный статический рендер экспонатов + простая навигация по хешу

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

function escapeHtml(str){ return String(str||"").replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;"); }

function exhibitCard(ex){
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="cardImage">
      <img src="${escapeHtml(ex.image || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect fill=\'%23223\' width=\'400\' height=\'300\'/%3E%3Ctext x=\'50%\' y=\'50%\' font-size=\'48\' text-anchor=\'middle\' dominant-baseline=\'middle\' fill=\'%23667\'%3E${escapeHtml(ex.icon)}%3C/text%3E%3C/svg%3E')}" alt="${escapeHtml(ex.name)}">
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
        <ul class="bul">${(ex.bullets||[]).map(b=>`<li>${escapeHtml(b)}</li>`).join('')}</ul>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">${(ex.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      </div>
    </div>
  `;
  el.addEventListener('click', () => openModal(ex));
  return el;
}

let currentModalIndex = -1;
let currentModalHall = null;

function openModal(ex){
  currentModalIndex = EXHIBITS.findIndex(e => e.id === ex.id);
  currentModalHall = ex.hall;
  renderModal();
}

function renderModal(){
  if(currentModalIndex < 0) return;
  
  const ex = EXHIBITS[currentModalIndex];
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'currentModal';
  
  const hallExhibits = EXHIBITS.filter(e => e.hall === currentModalHall);
  const canPrev = currentModalIndex > 0 && EXHIBITS[currentModalIndex - 1].hall === currentModalHall;
  const canNext = currentModalIndex < EXHIBITS.length - 1 && EXHIBITS[currentModalIndex + 1].hall === currentModalHall;
  
  modal.innerHTML = `
    <div class="modalContent">
      <button class="modalClose" aria-label="Закрыть">&times;</button>
      
      <div class="modalNav">
        <button class="modalPrev" ${!canPrev ? 'disabled' : ''} aria-label="Предыдущий">← Назад</button>
        <div class="modalCounter">${hallExhibits.findIndex(e => e.id === ex.id) + 1} / ${hallExhibits.length}</div>
        <button class="modalNext" ${!canNext ? 'disabled' : ''} aria-label="Следующий">Вперед →</button>
      </div>
      
      <div class="modalGrid">
        <div class="modalImage">

          <img src="${escapeHtml(ex.modalImage || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'500\' height=\'400\'%3E%3Crect fill=\'%23334\' width=\'500\' height=\'400\'/%3E%3Ctext x=\'50%\' y=\'50%\' font-size=\'120\' text-anchor=\'middle\' dominant-baseline=\'middle\' fill=\'%23778\'%3E${escapeHtml(ex.icon)}%3C/text%3E%3C/svg%3E')}" alt="${escapeHtml(ex.name)}">

          ${ex.video ? `
              <h3>Видео</h3>
              <div class="video">
                <iframe
                  src="https://rutube.ru/play/embed/${ex.video}"
                  frameborder="0"
                  allowfullscreen
                  width="100%"
                  height="315">
                </iframe>
              </div>
          ` : ''}

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
            
            ${ex.sources && ex.sources.length ? `<h3>Источники</h3><ul>${ex.sources.map(s => `<li><a href="${escapeHtml(s)}" target="_blank">${escapeHtml(s)}</a></li>`).join('')}</ul>` : ''}
            
            ${ex.quiz ? `<h3>Тест</h3><form id="quizForm">${ex.quiz.map((q, i) => `
              <div class="quizQuestion">
                <p>${i+1}. ${escapeHtml(q.question)}</p>
                ${q.options.map((opt, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${escapeHtml(opt)}</label>`).join('<br>')}
              </div>
            `).join('')}<button type="button" id="checkQuiz">Проверить</button></form><div id="quizResult"></div>` : ''}
          </div>
          
          <div class="modalTags">
            ${(ex.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Добавить обработчик для теста
  if(ex.quiz){
    const checkBtn = modal.querySelector('#checkQuiz');
    const resultDiv = modal.querySelector('#quizResult');
    checkBtn.addEventListener('click', () => {
      let correct = 0;
      ex.quiz.forEach((q, i) => {
        const selected = modal.querySelector(`input[name="q${i}"]:checked`);
        if(selected && parseInt(selected.value) === q.correct) correct++;
      });
      resultDiv.innerHTML = `<p>Правильных ответов: ${correct} из ${ex.quiz.length}</p>`;
    });
  }
  
  const closeBtn = modal.querySelector('.modalClose');
  const prevBtn = modal.querySelector('.modalPrev');
  const nextBtn = modal.querySelector('.modalNext');
  
  closeBtn.addEventListener('click', () => {
    modal.remove();
    currentModalIndex = -1;
  });
  
  prevBtn.addEventListener('click', () => {
    currentModalIndex--;
    modal.remove();
    renderModal();
  });
  
  nextBtn.addEventListener('click', () => {
    currentModalIndex++;
    modal.remove();
    renderModal();
  });
  
  modal.addEventListener('click', (e) => {
    if(e.target === modal) {
      modal.remove();
      currentModalIndex = -1;
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
      modal.remove();
      currentModalIndex = -1;
    } else if(e.key === 'ArrowLeft' && canPrev) {
      currentModalIndex--;
      modal.remove();
      renderModal();
    } else if(e.key === 'ArrowRight' && canNext) {
      currentModalIndex++;
      modal.remove();
      renderModal();
    }
  }, { once: true });
}

function renderHalls(){
  const halls = ['hall1','hall2','hall3','hall4','hall5'];
  halls.forEach(h=>{
    const grid = $(`#${h}Grid`);
    if(!grid) return;
    grid.innerHTML = '';
    EXHIBITS
      .filter(e=>e.hall===h)
      .forEach(e=>grid.appendChild(exhibitCard(e)));
  });
}

function showRoute(route){
  $$('[data-route]').forEach(el=>el.classList.toggle('show', el.getAttribute('data-route')===route));
  $$('section[id]').forEach(el=>el.classList.toggle('show', el.id===route));
}
function initRouting(){
  function applyHash(){
    const r = (location.hash||'').replace('#','') || 'home';
    showRoute(r);
  }
  window.addEventListener('hashchange', applyHash);
  applyHash();
}

renderHalls(); initRouting();
