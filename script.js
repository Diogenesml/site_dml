const select = (selector, scope = document) => scope.querySelector(selector);
const selectAll = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const menuButton = select('.menu-button');
const navigation = select('.nav');

const closeMenu = () => {
  navigation?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
};

menuButton?.addEventListener('click', (event) => {
  event.stopPropagation();
  const isOpen = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

selectAll('.nav a').forEach((link) => link.addEventListener('click', closeMenu));

// Fecha o menu ao clicar fora dele (não existia antes)
document.addEventListener('click', (event) => {
  const clickedOutside =
    navigation &&
    !navigation.contains(event.target) &&
    !menuButton?.contains(event.target);

  if (clickedOutside && navigation.classList.contains('open')) {
    closeMenu();
  }
});

// Fecha o menu com a tecla Esc
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

// Efeito de revelação ao rolar a página, respeitando quem prefere menos animação
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  selectAll('.reveal').forEach((element) => element.classList.add('visible'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  selectAll('.reveal').forEach((element) => observer.observe(element));
}

// Ano do rodapé (com optional chaining para não quebrar se o elemento não existir)
const yearEl = select('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Formulário de orçamento: envia direto para o e-mail via Formspree
const quoteForm = select('#quote-form');
const quoteFeedback = select('#quote-feedback');

const setQuoteFeedback = (texto, isError) => {
  if (!quoteFeedback) return;
  quoteFeedback.textContent = texto;
  quoteFeedback.classList.toggle('is-error', isError);
};

quoteForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!quoteForm.reportValidity()) {
    setQuoteFeedback('Preencha os campos obrigatórios antes de enviar.', true);
    return;
  }

  const submitButton = select('button[type="submit"]', quoteForm);
  submitButton.disabled = true;
  setQuoteFeedback('Enviando...', false);

  try {
    const response = await fetch(quoteForm.action, {
      method: 'POST',
      body: new FormData(quoteForm),
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      setQuoteFeedback('Mensagem enviada! Vou te responder em breve.', false);
      quoteForm.reset();
    } else {
      setQuoteFeedback('Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp.', true);
    }
  } catch (error) {
    setQuoteFeedback('Falha de conexão. Tente novamente ou fale pelo WhatsApp.', true);
  } finally {
    submitButton.disabled = false;
  }
});