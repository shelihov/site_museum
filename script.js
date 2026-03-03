// Минимальный статический рендер экспонатов + простая навигация по хешу
const EXHIBITS = [
  { id:"abacus", hall:"hall1", icon:"🧮", kicker:"Домеханическая эпоха", name:"Абак", period:"~3000 до н.э.", short:"Ручное счетное устройство.", desc:"Абак переводит операции счета в простые перемещения костяшек по разрядам.", history:"Абак — одно из самейших старых вычислительных приспособлений, используемое в Древнем Египте, Греции и Китае. Система разрядов позволяла эффективно выполнять операции сложения и вычитания.", work:"Костяшки нанизаны на горизонтальные палочки, разделенные по разрядам. Перемещение костяшек вверх или вниз изменяет значение в каждом разряде, позволяя считать от единиц до миллионов.", bullets:["Представление разрядов","Надежность","Интерфейс к вычислениям"], tags:["счет","интерфейс"] },
  { id:"antikythera", hall:"hall1", icon:"🪐", kicker:"Домеханическая эпоха", name:"Антикитерский механизм", period:"~II–I век до н.э.", short:"Механический аналоговый вычислитель.", desc:"Система шестерен для предсказания астрономических циклов.", history:"Обнаружен в 1901 году на затонувшем греческом корабле у острова Антикитера. Считается самым древним известным аналоговым компьютером. Использовался для расчета движения небесных тел и предсказания затмений.", work:"Система из 30+ бронзовых шестерен позволяла вычислять положение планет, луны и предсказывать астрономические события. Входные данные устанавливались вручную, результаты читались со шкал.", bullets:["Шестерни","Календарь","Специализация"], tags:["аналог","астрономия"] },
  { id:"pascaline", hall:"hall2", icon:"🧷", kicker:"Механические вычислители", name:"Паскалина", period:"1642", short:"Механический сумматор.", desc:"Сложение с автоматическим переносом разрядов.", history:"Создана французским математиком Блезом Паскалем в 1642 году для помощи отцу при расчетах налогов. Была одной из первых механических машин, способных выполнять все четыре арифметических операции (хотя вычитание требовало хитрости).", work:"Пользователь вводит цифры, вращая наборные диски. Зубчатые колеса механически выполняют сложение, автоматический перенос происходит при переполнении разряда (например, 9+1=10).", bullets:["Зубчатые колеса","Перенос"], tags:["механика"] },
  { id:"babbage", hall:"hall2", icon:"🧠", kicker:"Проекты универсальных машин", name:"Аналитическая машина Бэббиджа", period:"1837", short:"Проект программируемого компьютера.", desc:"Идеи процессора, памяти и управления.", history:"Спроектирована английским математиком Чарльзом Бэббиджем, но так и не была полностью построена при его жизни. Опередила свое время на столетие, предвосхищая архитектуру современных компьютеров.", work:"Состояла из трех частей: Мельница (процессор для вычислений), Склад (память для хранения данных) и механизм управления (по сути, четыре перфокарты). Позволяла выполнять сложные алгоритмы в автоматическом режиме.", bullets:["Мельница","Склад","Перфокарты"], tags:["архитектура"] },
  { id:"vacuum", hall:"hall3", icon:"🔥", kicker:"Поколения ЭВМ", name:"Ламповые ЭВМ", period:"1940-е", short:"Электронные лампы.", desc:"Большие, горячие, первые электронные компьютеры.", history:"Первое поколение электронных вычислительных машин, использовавшихся в 1940-1950-е годы. ENIAC, UNIVAC и подобные машины занимали целые комнаты и потребляли мегаватты электроэнергии.", work:"Электронные вакуумные лампы служили логическими элементами: накаленный катод излучал электроны, управляемые электрическим полем. Два состояния напряжения кодировали двоичные цифры 0 и 1.", bullets:["Лампы","Линии задержки"], tags:["лампы"] },
  { id:"transistor", hall:"hall3", icon:"🟢", kicker:"Поколения ЭВМ", name:"Транзисторные ЭВМ", period:"1950-е", short:"Переход к полупроводникам.", desc:"Меньше, надёжнее и энергоэффективнее.", history:"Второе поколение ЭВМ, появившееся в конце 1950-х годов. Замена электронных ламп на транзисторы позволила значительно уменьшить размер, теплоотдачу и энергопотребление машин.", work:"Транзистор — полупроводниковый прибор с тремя выводами, позволяющий усиливать и переключать электрические сигналы. Три состояния (открыт, закрыт, проводит) используются для реализации логических операций.", bullets:["Транзисторы","Миниатюризация"], tags:["транзисторы"] },
  { id:"super", hall:"hall4", icon:"🏎️", kicker:"Классификация", name:"Суперкомпьютеры", period:"современность", short:"Кластеры и ускорители.", desc:"Для науки, моделирования и ИИ.", history:"Суперкомпьютеры — самые мощные вычислительные системы в мире, используются для моделирования климата, ядерных реакций, высокочастотной торговли и тренировки нейросетей. Современные системы достигают экзафлопсов (10^18 операций в секунду).", work:"Состоят из тысяч процессорных ядер и специализированных ускорителей (GPU, TPU), работающих в параллель. Система охлаждения часто требует жидкого азота или специализированных циркуляционных систем.", bullets:["Параллелизм","Ускорители"], tags:["HPC"] },
  { id:"smartphone", hall:"hall4", icon:"📱", kicker:"Классификация", name:"Смартфоны", period:"современность", short:"Компьютер в кармане.", desc:"Сенсоры, связь, SoC и нейромодули.", history:"Революция мобильных вычислений, началось с iPhone в 2007 году. Сегодня смартфоны содержат больше вычислительной мощности, чем суперкомпьютеры 1990-х годов и являются главным каналом доступа в интернет для большинства пользователей.", work:"Система-на-кристалле (SoC) интегрирует процессор, GPU, нейромодули, модемы и контроллеры памяти на одном кристалле. Сенсоры (акселерометр, гироскоп, камеры) отслеживают движение и окружающую среду.", bullets:["SoC","Edge"], tags:["мобильность"] },
  { id:"crt", hall:"hall5", icon:"📺", kicker:"Эволюция отображения", name:"ЭЛТ-мониторы", period:"1920-е – 2000-е", short:"Электронно-лучевая трубка.", desc:"Основная технология отображения для телевизоров и компьютеров. Луч электронов рисует изображение на люминофорном экране.", history:"Электронно-лучевая трубка (ЭЛТ) была основной технологией отображения с 1920-х по 2000-е годы. Использовалась в телевизорах, компьютерных мониторах, осциллографах и радарах. Полностью вытеснена плоскими дисплеями.", work:"Нить накала создает поток электронов, управляемый электромагнитами для отклонения по горизонтали и вертикали. Электроны бомбардируют люминофорный слой на стеклянной панели, заставляя его светиться. Изображение обновляется 50-75 раз в секунду.", bullets:["Высокая яркость","Глубокий черный","Мерцание"], tags:["ЭЛТ","аналог"] },
  { id:"plasma", hall:"hall5", icon:"✨", kicker:"Эволюция отображения", name:"Плазменные панели", period:"1997 – 2010-е", short:"Газоразрядная технология.", desc:"Ячейки с инертным газом создают изображение через электрический разряд. Отличная контрастность и углы обзора.", history:"Плазменные экраны появились в 1997 году и достигли пика популярности в начале 2000-х. Использовались в основном для больших телевизоров (42-65 дюймов) и профессиональных дисплеев, но постепенно вытеснены LCD и OLED.", work:"Каждый пиксель содержит ячейку с благородным газом (неон и ксенон). При подаче высокого напряжения газ ионизируется, образуя плазму. УФ-излучение от плазмы возбуждает люминофоры, создавая видимый свет.", bullets:["Контраст","Размер","Углы обзора"], tags:["плазма","газ"] },
  { id:"lcd", hall:"hall5", icon:"💫", kicker:"Эволюция отображения", name:"ЖК-экраны (LCD)", period:"1990-е – настоящее", short:"Жидкие кристаллы с подсветкой.", desc:"Слой нематических кристаллов модулирует свет от лампы. Энергоэффективно и недорого, но худшая контрастность.", history:"ЖК-технология разработана в 1970-х, но массовое производство началось в 1990-х. Сегодня это самый распространенный тип дисплеев для ПК, телевизоров и мобильных устройств благодаря низкой стоимости и энергопотреблению.", work:"Слой жидких кристаллов между двумя поляризационными фильтрами меняет прозрачность при подаче напряжения. Позади кристаллов расположена подсветка (CCFL или LED). Каждый пиксель управляется тонкопленочным транзистором (TFT).", bullets:["Энергоэффективность","IPS/TN углы","Массовое производство"], tags:["LCD","кристаллы"] },
  { id:"oled", hall:"hall5", icon:"🌟", kicker:"Эволюция отображения", name:"OLED-экраны", period:"2000-е – настоящее", short:"Органические светодиоды.", desc:"Каждый пиксель светит сам. Идеальный черный, тонкие экраны, но проблемы с выгоранием и ценой.", history:"Первые коммерческие OLED-панели появились в начале 2000-х. Сегодня используются в флагманских смартфонах, носимых устройствах и премиальных телевизорах. Предоставляют лучшую контрастность и время отклика среди всех технологий.", work:"Каждый пиксель содержит органический светодиод, излучающий свет при подаче напряжения. Нет необходимости в подсветке, поэтому черные пиксели полностью отключены (истинный черный). Управляется активной матрицей TFT.", bullets:["Идеальный черный","Мобильность","Выгорание"], tags:["OLED","самосвет"] },
  { id:"qled", hall:"hall5", icon:"🎨", kicker:"Эволюция отображения", name:"QLED и мини-LED", period:"2017 – настоящее", short:"Квантовые точки и микросветодиоды.", desc:"LCD с квантовыми точками или матрицей из мини-светодиодов. Высокая яркость, локальное затемнение, конкурент OLED.", history:"QLED (Quantum Dot LED) разработан Samsung и соперничает с OLED начиная с 2017 года. Мини-LED (подмножество светодиодов размером 0,2-1 мм) обеспечивает локальное затемнение с тысячами независимых зон.", work:"QLED: слой жидких кристаллов с квантовыми точками, возбуждаемыми LED-подсветкой. Квантовые точки переизлучают синий свет в красный или зеленый с высокой эффективностью. Мини-LED: несколько тысяч крошечных светодиодов позади LCD для локального контроля яркости.", bullets:["Яркость","Локальное затемнение","Масштабируемость"], tags:["QLED","мини-LED"] }
];

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

function escapeHtml(str){ return String(str||"").replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;"); }

function exhibitCard(ex){
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="cardImage">
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23223' width='400' height='300'/%3E%3Ctext x='50%' y='50%' font-size='48' text-anchor='middle' dominant-baseline='middle' fill='%23667'%3E${escapeHtml(ex.icon)}%3C/text%3E%3C/svg%3E" alt="${escapeHtml(ex.name)}">
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
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='400'%3E%3Crect fill='%23334' width='500' height='400'/%3E%3Ctext x='50%' y='50%' font-size='120' text-anchor='middle' dominant-baseline='middle' fill='%23778'%3E${escapeHtml(ex.icon)}%3C/text%3E%3C/svg%3E" alt="${escapeHtml(ex.name)}">
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
          </div>
          
          <div class="modalTags">
            ${(ex.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
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
  const grids = { hall1: $('#hall1Grid'), hall2: $('#hall2Grid'), hall3: $('#hall3Grid'), hall4: $('#hall4Grid'), hall5: $('#hall5Grid') };
  for(const [id, grid] of Object.entries(grids)){
    if(!grid) continue;
    grid.innerHTML = '';
    EXHIBITS.filter(e=>e.hall===id).forEach(e=>grid.appendChild(exhibitCard(e)));
  }
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
