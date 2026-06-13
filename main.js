
// ── NBU valyuta kurslari ──
async function loadCurrencyRates() {
  try {
    const res = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/');
    const data = await res.json();
    const find = (code) => data.find(c => c.Ccy === code);

    const usd = find('USD'), eur = find('EUR'), rub = find('RUB'), cny = find('CNY');

    if (usd) document.getElementById('rate-usd').textContent = Number(usd.Rate).toLocaleString('uz-UZ');
    if (eur) document.getElementById('rate-eur').textContent = Number(eur.Rate).toLocaleString('uz-UZ');
    if (rub) {
      const rubPer100 = (Number(rub.Rate) * 100).toLocaleString('uz-UZ', {maximumFractionDigits: 0});
      document.getElementById('cur-rub').innerHTML =
        `<span class="cur-flag">🇷🇺</span> 100 RUB <span class="cur-rate" id="rate-rub">${rubPer100}</span> so'm`;
    }
    if (cny) document.getElementById('rate-cny').textContent = Number(cny.Rate).toLocaleString('uz-UZ');

    if (usd) document.getElementById('cur-date').textContent = usd.Date;
  } catch (e) {
    console.warn('Valyuta kurslari yuklanmadi:', e);
  }
}

// ── Ob-havo (OpenWeatherMap → Open-Meteo zaxira) ──
function weatherIcon(id) {
  if (id === 800)                  return '☀️';
  if (id === 801)                  return '🌤️';
  if (id >= 802 && id <= 804)      return id === 804 ? '☁️' : '⛅';
  if (id >= 700 && id < 800)       return '🌫️';
  if (id >= 600 && id < 700)       return '❄️';
  if (id >= 500 && id < 600)       return '🌧️';
  if (id >= 300 && id < 400)       return '🌦️';
  if (id >= 200 && id < 300)       return '⛈️';
  return '🌡️';
}

function openMeteoIcon(code) {
  const map = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',71:'❄️',73:'❄️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⛈️',96:'⛈️',99:'⛈️'};
  return map[code] ?? '🌡️';
}

async function loadWeather() {
  const iconEl = document.getElementById('weather-icon');
  const tempEl = document.getElementById('weather-temp');

  // 1. OpenWeatherMap
  try {
    const key = '8a5f0c93887df008622bd665b4a790bb';
    const res  = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Margilan,UZ&appid=${key}&units=metric`);
    const data = await res.json();
    if (data.cod === 401 || data.cod === '401') throw new Error('key_not_ready');
    const temp  = Math.round(data.main.temp);
    const feels = Math.round(data.main.feels_like);
    iconEl.textContent = weatherIcon(data.weather[0].id);
    tempEl.textContent = `${temp}°C`;
    document.getElementById('weather-widget').title = `His qilinadi: ${feels}°C`;
    return;
  } catch (_) {}

  // 2. Open-Meteo zaxira
  try {
    const res  = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.4736&longitude=71.7278&current=temperature_2m,weather_code&timezone=Asia%2FTashkent');
    const data = await res.json();
    iconEl.textContent = openMeteoIcon(data.current.weather_code);
    tempEl.textContent = `${Math.round(data.current.temperature_2m)}°C`;
  } catch (_) {
    iconEl.textContent = '🌡️';
    tempEl.textContent = '--°C';
  }
}

// ── Particles canvas ──
function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  const count = Math.min(60, Math.floor(W / 22));
  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.4,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    alpha: Math.random() * 0.5 + 0.1,
  }));

  let mouse = { x: -9999, y: -9999 };
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Connect nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }

      // Mouse interaction
      const mdx = particles[i].x - mouse.x;
      const mdy = particles[i].y - mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 120) {
        const force = (120 - mdist) / 120;
        particles[i].vx += (mdx / mdist) * force * 0.04;
        particles[i].vy += (mdy / mdist) * force * 0.04;
      }

      // Draw particle
      ctx.beginPath();
      ctx.arc(particles[i].x, particles[i].y, particles[i].r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167,139,250,${particles[i].alpha})`;
      ctx.fill();

      // Move
      particles[i].x += particles[i].vx;
      particles[i].y += particles[i].vy;

      // Dampen velocity
      particles[i].vx *= 0.99;
      particles[i].vy *= 0.99;

      // Bounce off edges
      if (particles[i].x < 0 || particles[i].x > W) particles[i].vx *= -1;
      if (particles[i].y < 0 || particles[i].y > H) particles[i].vy *= -1;
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// ── Scroll reveal (Intersection Observer) ──
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => observer.observe(el));
}

// ── Stagger children reveal ──
function initStagger() {
  const groups = document.querySelectorAll('.stagger-group');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const children = entry.target.children;
        Array.from(children).forEach((child, i) => {
          setTimeout(() => child.classList.add('visible'), i * 80);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  groups.forEach(g => observer.observe(g));
}

// ── Sticky header shadow on scroll ──
function initHeader() {
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

// ── Active nav link on scroll ──
function initActiveNav() {
  const sections = document.querySelectorAll('section[id], div[id]');
  const navLinks = document.querySelectorAll('nav a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  }, { passive: true });
}

// ── LED Cursor glow ──
function initCursorGlow() {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  window.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
}

// ── Skill bar progress on reveal ──
function initSkillBars() {
  const bars = document.querySelectorAll('.skill-bar-fill');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target.dataset.width;
        entry.target.style.width = target;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  bars.forEach(b => observer.observe(b));
}

// ── Translations ──
const translations = {
  uz: {
    'nav.about':      "Haqimda",
    'nav.skills':     "Ko'nikmalar",
    'nav.projects':   "Loyihalar",
    'nav.contract':   "Shartnoma",
    'nav.contact':    "Aloqa",
    'hero.mid':       "korxonasi va",
    'hero.end':       "SRM dasturi asoschisi",
    'skills.label':   "Texnologiyalar",
    'skills.h2':      "Ko'nikmalar",
    'prompt.h3':      "Prompt Injenerlik",
    'prompt.p':       "Sun'iy intellekt bilan ishlashda chuqur tajribaga egaman. ChatGPT, Claude va boshqa AI modellaridan professional darajada foydalanib, biznes muammolarini samarali hal qilaman. Har qanday vazifa uchun to'g'ri prompt tuzish — mening kuchli tomonim.",
    'laser.h3':       "Lazer Mutaxassisligi",
    'laser.p':        "PROF LASER korxonasi asoschisi sifatida lazer texnologiyalari sohasida keng bilim va amaliy tajribaga egaman. Lazer o'ymakorlik, kesish va ishlov berish bo'yicha mutaxassis bo'lib, zamonaviy uskunalar bilan ishlayman.",
    'vibe.h3':        "Vibe Coder",
    'vibe.p':         "KOSIB.UZ SRM dasturining asoschisi va yaratuvchisi. Zamonaviy vibe coding uslubida — AI yordamida tez, sifatli va chiroyli dasturiy mahsulotlar yarataman. Kod yozish endi san'at, va bu san'atni sevaman.",
    'projects.label': "Portfolio",
    'projects.h2':    "Loyihalar",
    'profLaser.p':    "O'zbekistondagi oyoq kiyim ishlab chiqaruvchilar uchun ixtisoslashgan lazer xizmatlari korxonasi. Charm va sun'iy materiallarni lazer bilan kesish, o'ymakorlik va ishlov berish xizmatlarini professional darajada taqdim etadi. Zamonaviy lazer uskunalari yordamida mahsulot sifati va ishlab chiqarish tezligini sezilarli oshiradi.",
    'kosib.p':        "Oyoq kiyim ishlab chiqaruvchilari uchun maxsus yaratilgan CRM dasturiy ta'minot. Buyurtmalarni boshqarish, mijozlar bazasi, ishlab chiqarish jarayonini kuzatish va moliyaviy hisobotlarni bir tizimda jamlaydi. Korxona samaradorligini oshirish va vaqtni tejash uchun mo'ljallangan zamonaviy yechim.",
    'tag.cut':        "Lazer Kesish",
    'tag.engrave':    "O'ymakorlik",
    'tag.leather':    "Charm Ishlov",
    'tag.order':      "Buyurtma Boshqaruv",
    'tag.finance':    "Moliyaviy Hisobot",
    'contact.btn':    "Murojaat qoldirish",
    'contact.label':  "Muloqot",
    'contact.h2':     "Aloqa",
    'footer.text':    "© 2026 Akramjon Abdulaxatov. Barcha huquqlar himoyalangan.",
    'modal.suffix':   " — Murojaat",
    'modal.sub':      "bo'yicha murojaat qoldirish uchun formani to'ldiring.",
    'form.name':      "Ism Familiya",
    'form.activity':  "Faoliyat turi",
    'form.phone':     "Telefon raqam",
    'form.email':     "Email manzil",
    'form.ph.name':   "Masalan: Akramjon Abdulaxatov",
    'form.ph.activity': "Masalan: Oyoq kiyim ishlab chiqarish",
    'form.submit':    "Yuborish",
  },
  en: {
    'nav.about':      "About",
    'nav.skills':     "Skills",
    'nav.projects':   "Projects",
    'nav.contract':   "Contract",
    'nav.contact':    "Contact",
    'hero.mid':       "company and",
    'hero.end':       "founder of KOSIB.UZ CRM",
    'skills.label':   "Technologies",
    'skills.h2':      "Skills",
    'prompt.h3':      "Prompt Engineering",
    'prompt.p':       "I have deep experience working with artificial intelligence. I professionally use ChatGPT, Claude and other AI models to solve business problems effectively. Building the right prompt for any task is my strongest skill.",
    'laser.h3':       "Laser Specialist",
    'laser.p':        "As the founder of PROF LASER, I have extensive knowledge and hands-on experience in laser technologies. I specialize in laser engraving, cutting and material processing using modern equipment.",
    'vibe.h3':        "Vibe Coder",
    'vibe.p':         "Founder and creator of the KOSIB.UZ CRM system. In the modern vibe coding style — with AI assistance I build fast, high-quality and beautiful software products. Writing code is an art, and I love this art.",
    'projects.label': "Portfolio",
    'projects.h2':    "Projects",
    'profLaser.p':    "A specialized laser services company for footwear manufacturers in Uzbekistan. Professionally provides laser cutting, engraving and processing services for leather and synthetic materials. Significantly increases product quality and production speed using modern laser equipment.",
    'kosib.p':        "CRM software specially designed for footwear manufacturers. Combines order management, client database, production process tracking and financial reports in one system. A modern solution designed to increase enterprise efficiency and save time.",
    'tag.cut':        "Laser Cutting",
    'tag.engrave':    "Engraving",
    'tag.leather':    "Leather Processing",
    'tag.order':      "Order Management",
    'tag.finance':    "Financial Report",
    'contact.btn':    "Send Request",
    'contact.label':  "Get in Touch",
    'contact.h2':     "Contact",
    'footer.text':    "© 2026 Akramjon Abdulaxatov. All rights reserved.",
    'modal.suffix':   " — Request",
    'modal.sub':      "Fill out the form to send a request about",
    'form.name':      "Full Name",
    'form.activity':  "Activity Type",
    'form.phone':     "Phone Number",
    'form.email':     "Email Address",
    'form.ph.name':   "E.g.: John Smith",
    'form.ph.activity': "E.g.: Footwear manufacturing",
    'form.submit':    "Submit",
  },
  ru: {
    'nav.about':      "Обо мне",
    'nav.skills':     "Навыки",
    'nav.projects':   "Проекты",
    'nav.contract':   "Договор",
    'nav.contact':    "Контакт",
    'hero.mid':       "компания и",
    'hero.end':       "основатель CRM системы KOSIB.UZ",
    'skills.label':   "Технологии",
    'skills.h2':      "Навыки",
    'prompt.h3':      "Инжиниринг промптов",
    'prompt.p':       "Имею глубокий опыт работы с искусственным интеллектом. Профессионально использую ChatGPT, Claude и другие AI-модели для эффективного решения бизнес-задач. Составление правильных промптов для любой задачи — моя сильная сторона.",
    'laser.h3':       "Специалист по лазерам",
    'laser.p':        "Как основатель компании PROF LASER, обладаю обширными знаниями и практическим опытом в области лазерных технологий. Специализируюсь на лазерной гравировке, резке и обработке материалов с использованием современного оборудования.",
    'vibe.h3':        "Вайб Кодер",
    'vibe.p':         "Основатель и создатель CRM-системы KOSIB.UZ. В современном стиле vibe coding — с помощью AI создаю быстрые, качественные и красивые программные продукты. Написание кода — это искусство, и я его люблю.",
    'projects.label': "Портфолио",
    'projects.h2':    "Проекты",
    'profLaser.p':    "Специализированная компания лазерных услуг для производителей обуви в Узбекистане. Профессионально предоставляет услуги лазерной резки, гравировки и обработки кожи и синтетических материалов. С помощью современного лазерного оборудования значительно повышает качество продукции и скорость производства.",
    'kosib.p':        "Программное обеспечение CRM, специально разработанное для производителей обуви. Объединяет управление заказами, базу клиентов, контроль производственного процесса и финансовую отчётность в единой системе. Современное решение для повышения эффективности предприятия и экономии времени.",
    'tag.cut':        "Лазерная Резка",
    'tag.engrave':    "Гравировка",
    'tag.leather':    "Обработка Кожи",
    'tag.order':      "Управление Заказами",
    'tag.finance':    "Финансовый Отчёт",
    'contact.btn':    "Оставить заявку",
    'contact.label':  "Связь",
    'contact.h2':     "Контакт",
    'footer.text':    "© 2026 Акрамжон Абдулахатов. Все права защищены.",
    'modal.suffix':   " — Заявка",
    'modal.sub':      "Заполните форму, чтобы оставить заявку по",
    'form.name':      "Имя Фамилия",
    'form.activity':  "Вид деятельности",
    'form.phone':     "Номер телефона",
    'form.email':     "Email адрес",
    'form.ph.name':   "Например: Иван Иванов",
    'form.ph.activity': "Например: Производство обуви",
    'form.submit':    "Отправить",
  }
};

let currentLang = localStorage.getItem('lang') || 'uz';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;

  const t = translations[lang];

  // text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  // placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  // lang buttons
  document.getElementById('btn-uz').classList.toggle('active', lang === 'uz');
  document.getElementById('btn-ru').classList.toggle('active', lang === 'ru');
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');
}

// ── Dark / Light theme ──
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  document.getElementById('theme-icon').textContent = isLight ? '☀️' : '🌙';
}

function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.body.classList.add('light');
    document.getElementById('theme-icon').textContent = '☀️';
  }
}

// ── Modal ──
function openModal(projectName) {
  const t = translations[currentLang];
  document.getElementById('modal-title').textContent = projectName + t['modal.suffix'];
  const sub = currentLang === 'uz'
    ? projectName + ' ' + t['modal.sub']
    : t['modal.sub'] + ' ' + projectName + '.';
  document.getElementById('modal-sub').textContent = sub;
  document.getElementById('modal-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay') && e.type !== 'click') return;
  if (e && e.currentTarget === document.getElementById('modal-overlay') && e.target !== e.currentTarget) return;
  document.getElementById('modal-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

const TG_TOKEN  = 'BU_YERGA_BOT_TOKEN';   // @BotFather dan olingan token
const TG_CHAT_ID = 'BU_YERGA_CHAT_ID';    // Telegram user ID raqamingiz

function submitForm(e) {
  e.preventDefault();

  const inputs  = e.target.querySelectorAll('input');
  const project = document.getElementById('modal-title').textContent;
  const message =
    `📬 Yangi murojaat!\n` +
    `📌 Loyiha: ${project}\n\n` +
    `👤 Ism Familiya: ${inputs[0].value}\n` +
    `💼 Faoliyat turi: ${inputs[1].value}\n` +
    `📞 Telefon: ${inputs[2].value}\n` +
    `✉️ Email: ${inputs[3].value}`;

  const btn = e.target.querySelector('.form-submit');
  btn.textContent = 'Yuborilmoqda...';
  btn.disabled = true;

  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT_ID, text: message })
  })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        btn.textContent = '✓ Yuborildi!';
        btn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        setTimeout(() => {
          closeModal();
          e.target.reset();
          btn.textContent = 'Yuborish';
          btn.style.background = '';
          btn.disabled = false;
        }, 1600);
      } else {
        throw new Error('Telegram xatosi');
      }
    })
    .catch(() => {
      btn.textContent = '✗ Xatolik. Qayta urining';
      btn.style.background = 'linear-gradient(135deg, #dc2626, #ef4444)';
      btn.disabled = false;
      setTimeout(() => {
        btn.textContent = 'Yuborish';
        btn.style.background = '';
      }, 2500);
    });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ── Shartnoma ──
let currentContractType = 'laser';

function selectContract(type) {
  currentContractType = type;
  document.getElementById('ctype-laser').classList.toggle('active', type === 'laser');
  document.getElementById('ctype-kosib').classList.toggle('active', type === 'kosib');
  document.getElementById('contract-preview-wrap').style.display = 'none';
}

function getContractData() {
  const name     = document.getElementById('cf-name').value.trim();
  const passport = document.getElementById('cf-passport').value.trim();
  const address  = document.getElementById('cf-address').value.trim();
  const phone    = document.getElementById('cf-phone').value.trim();
  const amount   = Number(document.getElementById('cf-amount').value);
  const desc     = document.getElementById('cf-desc').value.trim();
  const deadline = document.getElementById('cf-deadline').value.trim();
  const dateVal  = document.getElementById('cf-date').value;

  if (!name || !passport || !address || !phone || !amount || !desc || !deadline || !dateVal) {
    alert("Iltimos, barcha maydonlarni to'ldiring!");
    return null;
  }

  const date = new Date(dateVal);
  const months = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
  const dateStr = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} yil`;
  const half = Math.round(amount / 2).toLocaleString('uz-UZ');
  const total = amount.toLocaleString('uz-UZ');
  const num = Math.floor(Math.random() * 900 + 100);
  const contractNum = `${num}/${date.getFullYear()}`;

  return { name, passport, address, phone, amount, total, half, desc, deadline, dateStr, contractNum };
}

function buildContractHTML(d) {
  const isLaser = currentContractType === 'laser';
  const service = isLaser ? 'PROF LASER' : 'KOSIB.UZ';
  const role    = isLaser ? 'Pudratchi' : 'Dasturchi';
  const art1p   = isLaser
    ? `Pudratchi Buyurtmachining buyurtmasiga ko'ra lazer kesish, o'ymakorlik va material ishlov berish xizmatlarini bajaradi.`
    : `Dasturchi Buyurtmachining buyurtmasiga ko'ra KOSIB.UZ CRM dasturiy ta'minoti xizmatlarini taqdim etadi.`;

  return `
    <h3>XIZMATLAR KO'RSATISH SHARTNOMASI</h3>
    <div class="c-number">№ ${d.contractNum}</div>
    <div class="c-header-row">
      <span>Marg'ilon shahri</span>
      <span>${d.dateStr}</span>
    </div>
    <div class="c-intro">
      Bir tomondan, <strong>"${service}"</strong> nomidan ish yurituvchi
      <strong>Abdulaxatov Akramjon Ibrohimovich</strong>
      (keyingi o'rinlarda <em>"${role}"</em> deb yuritiladi),
      ikkinchi tomondan, <strong>${d.name}</strong>, passport/STIR: <strong>${d.passport}</strong>,
      manzil: <strong>${d.address}</strong>
      (keyingi o'rinlarda <em>"Buyurtmachi"</em> deb yuritiladi),
      quyidagi shartnomani tuzdilar:
    </div>

    <div class="c-article">
      <div class="c-article-title">1. Shartnoma predmeti</div>
      <p>1.1. ${art1p}</p>
      <p>1.2. Xizmat tavsifi: ${d.desc}</p>
    </div>

    <div class="c-article">
      <div class="c-article-title">2. Tomonlarning majburiyatlari</div>
      <p>2.1. ${role} majburiyatlari: xizmatni sifatli va o'z vaqtida bajarish; Buyurtmachi talablarini inobatga olish; xizmat natijasi to'g'risida xabardor etish.</p>
      <p>2.2. Buyurtmachi majburiyatlari: to'lovlarni belgilangan tartibda amalga oshirish; zarur ma'lumot va materiallarni o'z vaqtida taqdim etish.</p>
    </div>

    <div class="c-article">
      <div class="c-article-title">3. Narx va to'lov tartibi</div>
      <p>3.1. Xizmatning umumiy narxi: <strong>${d.total} so'm</strong>.</p>
      <p>3.2. Oldindan to'lov (50%): <strong>${d.half} so'm</strong> — shartnoma imzolangandan so'ng 1 ish kuni ichida.</p>
      <p>3.3. Qoldiq to'lov (50%): <strong>${d.half} so'm</strong> — xizmat to'liq yakunlangandan so'ng.</p>
      <p>3.4. To'lov naqd pul yoki bank o'tkazmasi orqali amalga oshiriladi.</p>
    </div>

    <div class="c-article">
      <div class="c-article-title">4. Muddatlar</div>
      <p>4.1. Xizmat bajarish muddati: <strong>${d.deadline}</strong>.</p>
      <p>4.2. Muddat shartnoma imzolangan va oldindan to'lov amalga oshirilgan kundan hisoblanadi.</p>
      <p>4.3. Kechikish holati yuzaga kelsa, ${role} Buyurtmachini 1 ish kuni oldin xabardor etadi.</p>
    </div>

    <div class="c-article">
      <div class="c-article-title">5. Maxfiylik</div>
      <p>5.1. Tomonlar shartnoma doirasidagi barcha ma'lumotlarni maxfiy saqlash majburiyatini oladilar.</p>
    </div>

    <div class="c-article">
      <div class="c-article-title">6. Nizolarni hal etish</div>
      <p>6.1. Nizolar avvalo muzokaralar yo'li bilan hal etiladi. Kelishuv bo'lmasa, O'zbekiston Respublikasi qonunchiligiga muvofiq sud tartibida ko'rib chiqiladi.</p>
    </div>

    <div class="c-signatures">
      <div class="c-sign-block">
        <div class="c-article-title">${role}:</div>
        <p><strong>Abdulaxatov Akramjon Ibrohimovich</strong></p>
        <p>"${service}"</p>
        <p>Tel: +998 90 405 78 01</p>
        <p>Marg'ilon shahri, O'zbekiston</p>
        <div class="c-sign-line">Imzo: ___________________</div>
      </div>
      <div class="c-sign-block">
        <div class="c-article-title">Buyurtmachi:</div>
        <p><strong>${d.name}</strong></p>
        <p>Passport/STIR: ${d.passport}</p>
        <p>Tel: ${d.phone}</p>
        <p>${d.address}</p>
        <div class="c-sign-line">Imzo: ___________________</div>
      </div>
    </div>`;
}

function previewContract() {
  const d = getContractData();
  if (!d) return;
  const wrap = document.getElementById('contract-preview-wrap');
  document.getElementById('contract-doc').innerHTML = buildContractHTML(d);
  wrap.style.display = 'block';
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function downloadContractPDF() {
  const d = getContractData();
  if (!d) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const isLaser = currentContractType === 'laser';
  const service = isLaser ? 'PROF LASER' : 'KOSIB.UZ';
  const role    = isLaser ? 'Pudratchi' : 'Dasturchi';
  const art1p   = isLaser
    ? "Pudratchi lazer kesish, o'ymakorlik va material ishlov berish xizmatlarini bajaradi."
    : "Dasturchi KOSIB.UZ CRM dasturiy ta'minoti xizmatlarini taqdim etadi.";

  const L = 20, RW = 170, lh = 6.5;
  let y = 20;

  const center = (text, yy) => { doc.text(text, 105, yy, { align: 'center' }); };
  const line   = (text, yy, x) => { doc.text(text, x ?? L, yy); };
  const wrap   = (text, yy, maxW) => {
    const lines = doc.splitTextToSize(text, maxW ?? RW);
    doc.text(lines, L, yy);
    return yy + lines.length * lh;
  };
  const title  = (text, yy) => {
    doc.setFont('helvetica', 'bold');
    doc.text(text, L, yy);
    doc.setFont('helvetica', 'normal');
    return yy + lh;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  center("XIZMATLAR KO'RSATISH SHARTNOMASI", y); y += 7;
  doc.setFontSize(11);
  center(`No ${d.contractNum}`, y); y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  line("Marg'ilon shahri", y);
  line(d.dateStr, y, 130); y += 10;

  y = wrap(`Bir tomondan, "${service}" nomidan ish yurituvchi Abdulaxatov Akramjon Ibrohimovich ("${role}"), ikkinchi tomondan, ${d.name}, passport/STIR: ${d.passport}, manzil: ${d.address} ("Buyurtmachi"), quyidagi shartnomani tuzdilar:`, y); y += 4;

  y = title("1. SHARTNOMA PREDMETI", y);
  y = wrap(`1.1. ${art1p}`, y); y += 2;
  y = wrap(`1.2. Xizmat tavsifi: ${d.desc}`, y); y += 6;

  y = title("2. TOMONLARNING MAJBURIYATLARI", y);
  y = wrap(`2.1. ${role}: xizmatni sifatli va o'z vaqtida bajarish; Buyurtmachi talablarini inobatga olish.`, y); y += 2;
  y = wrap("2.2. Buyurtmachi: to'lovlarni o'z vaqtida amalga oshirish; zarur materiallarni taqdim etish.", y); y += 6;

  y = title("3. NARX VA TO'LOV TARTIBI", y);
  y = wrap(`3.1. Umumiy narx: ${d.total} so'm.`, y); y += 2;
  y = wrap(`3.2. Oldindan to'lov (50%): ${d.half} so'm — shartnoma imzolangandan so'ng 1 ish kuni ichida.`, y); y += 2;
  y = wrap(`3.3. Qoldiq to'lov (50%): ${d.half} so'm — xizmat yakunlangandan so'ng.`, y); y += 6;

  y = title("4. MUDDATLAR", y);
  y = wrap(`4.1. Xizmat bajarish muddati: ${d.deadline}.`, y); y += 2;
  y = wrap("4.2. Muddat oldindan to'lov amalga oshirilgan kundan hisoblanadi.", y); y += 6;

  y = title("5. MAXFIYLIK VA NIZOLAR", y);
  y = wrap("5.1. Tomonlar shartnoma ma'lumotlarini maxfiy saqlaydilar.", y); y += 2;
  y = wrap("5.2. Nizolar muzokaralar yo'li, kelishuv bo'lmasa O'zbekiston qonunchiligiga muvofiq hal etiladi.", y); y += 10;

  doc.setLineWidth(0.3);
  doc.line(L, y, 195, y); y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  line(`${role}:`, y, L);
  line("Buyurtmachi:", y, 110); y += lh;

  doc.setFont('helvetica', 'normal');
  line("Abdulaxatov Akramjon Ibrohimovich", y, L);
  line(d.name, y, 110); y += lh;
  line(`"${service}"`, y, L);
  line(`Passport/STIR: ${d.passport}`, y, 110); y += lh;
  line("Tel: +998 90 405 78 01", y, L);
  line(`Tel: ${d.phone}`, y, 110); y += lh;
  line("Marg'ilon, O'zbekiston", y, L);
  y = wrap(d.address, y, 80); y += 10;

  line("Imzo: ___________________", y, L);
  line("Imzo: ___________________", y, 110);

  doc.save(`Shartnoma_${d.contractNum.replace('/', '-')}.pdf`);
}

// ── Init all ──
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  setLang(currentLang);
  const cfDate = document.getElementById('cf-date');
  if (cfDate) cfDate.value = new Date().toISOString().split('T')[0];
  initParticles();
  loadCurrencyRates();
  loadWeather();
  initScrollReveal();
  initStagger();
  initHeader();
  initActiveNav();
  initCursorGlow();
  initSkillBars();
});
