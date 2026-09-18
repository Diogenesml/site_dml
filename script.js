const select = (selector, scope = document) => scope.querySelector(selector);
const selectAll = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Menu mobile ---------- */
const menuButton = select('.menu-button');
const navigation = select('.nav');

const setMenu = (open) => {
  if (!menuButton || !navigation) return;
  navigation.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
};

menuButton?.addEventListener('click', () => setMenu(!navigation.classList.contains('open')));
selectAll('.nav a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });
document.addEventListener('click', (event) => { if (!event.target.closest('.site-header')) setMenu(false); });

/* ---------- Aparecer ao rolar (com pequeno escalonamento em listas) ---------- */
selectAll('.reveal').forEach((element) => {
  const siblings = [...element.parentElement.children].filter((child) => child.classList.contains('reveal'));
  element.style.setProperty('--d', `${Math.min(siblings.indexOf(element), 5) * 90}ms`);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

selectAll('.reveal').forEach((element) => revealObserver.observe(element));

/* ---------- Barra de progresso + cabeçalho ao rolar ---------- */
const progressBar = select('.scroll-progress');
const headerBg = select('.header-bg');
let scrollTicking = false;

const updateScroll = () => {
  const root = document.documentElement;
  const max = root.scrollHeight - root.clientHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  progressBar?.style.setProperty('--progress', progress.toFixed(4));
  headerBg?.classList.toggle('on', window.scrollY > 24);
  scrollTicking = false;
};

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    scrollTicking = true;
    requestAnimationFrame(updateScroll);
  }
}, { passive: true });
updateScroll();

/* ---------- Link ativo no menu conforme a seção visível ---------- */
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    selectAll('.nav a').forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });

selectAll('main section[id]').forEach((section) => spy.observe(section));

/* ---------- Palavra que se reescreve no código do hero ---------- */
const typed = select('.typed');

if (typed && !reduceMotion) {
  const words = typed.dataset.words.split('|');
  let wordIndex = 0;
  let charCount = words[0].length;
  let deleting = true;

  const tick = () => {
    const word = words[wordIndex];
    charCount += deleting ? -1 : 1;
    typed.textContent = word.slice(0, charCount);

    let delay = deleting ? 45 : 90;
    if (!deleting && charCount === word.length) {
      deleting = true;
      delay = 1700;
    } else if (deleting && charCount === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 250;
    }
    setTimeout(tick, delay);
  };

  setTimeout(tick, 2200);
}

/* ---------- Efeitos de mouse (só em telas com mouse) ---------- */
if (finePointer && !reduceMotion) {
  // Inclinação suave em cards marcados com data-tilt
  selectAll('[data-tilt]').forEach((element) => {
    const max = Number(element.dataset.tilt) || 5;

    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      element.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
      element.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
      element.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
    });

    element.addEventListener('pointerleave', () => { element.style.transform = ''; });
  });

  // Luz que acompanha o mouse nos cards de serviço
  selectAll('.service-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });

  // Paralaxe leve na ilustração do hero
  const heroArt = select('.hero-art');
  heroArt?.addEventListener('pointermove', (event) => {
    const rect = heroArt.getBoundingClientRect();
    heroArt.style.setProperty('--px', (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
    heroArt.style.setProperty('--py', (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));
  });
  heroArt?.addEventListener('pointerleave', () => {
    heroArt.style.setProperty('--px', 0);
    heroArt.style.setProperty('--py', 0);
  });
}

/* ---------- Ano no rodapé ---------- */
const year = select('#year');
if (year) year.textContent = new Date().getFullYear();