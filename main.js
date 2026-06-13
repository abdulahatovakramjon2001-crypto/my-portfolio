
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

// ── Init all ──
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  setLang(currentLang);
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
