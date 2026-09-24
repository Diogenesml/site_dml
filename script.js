const select = (selector, scope = document) => scope.querySelector(selector);
const selectAll = (selector, scope = document) => [
  ...scope.querySelectorAll(selector),
];

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const finePointer = window.matchMedia(
  "(hover: hover) and (pointer: fine)",
).matches;

/* ==========================================================================
   01. Navegação
   ========================================================================== */
const menuButton = select(".menu-button");
const navigation = select(".nav");

const setMenu = (open) => {
  if (!menuButton || !navigation) return;
  navigation.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
};

menuButton?.addEventListener("click", () =>
  setMenu(!navigation.classList.contains("open")),
);
selectAll(".nav a").forEach((link) =>
  link.addEventListener("click", () => setMenu(false)),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) setMenu(false);
});

/* ==========================================================================
   02. Animações de entrada
   ========================================================================== */
if (!reduceMotion && "IntersectionObserver" in window) {
  const revealElements = selectAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  revealElements.forEach((element) => {
    const siblings = [...element.parentElement.children].filter((child) =>
      child.classList.contains("reveal"),
    );
    element.style.setProperty(
      "--d",
      `${Math.min(siblings.indexOf(element), 5) * 90}ms`,
    );
    element.classList.add("reveal-pending");
    revealObserver.observe(element);
  });
}

/* ==========================================================================
   03. Estado de rolagem
   ========================================================================== */
const progressBar = select(".scroll-progress");
const headerBg = select(".header-bg");
let scrollTicking = false;

const updateScroll = () => {
  const root = document.documentElement;
  const max = root.scrollHeight - root.clientHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  progressBar?.style.setProperty("--progress", progress.toFixed(4));
  headerBg?.classList.toggle("on", window.scrollY > 24);
  scrollTicking = false;
};

window.addEventListener(
  "scroll",
  () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateScroll);
    }
  },
  { passive: true },
);
updateScroll();

/* ==========================================================================
   04. Navegação ativa (scroll spy)
   ========================================================================== */
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      selectAll(".nav a").forEach((link) => {
        link.classList.toggle(
          "active",
          link.getAttribute("href") === `#${entry.target.id}`,
        );
      });
    });
  },
  { rootMargin: "-45% 0px -50% 0px" },
);

selectAll("main section[id]").forEach((section) => spy.observe(section));

/* ==========================================================================
   05. Efeito de digitação do hero
   ========================================================================== */
const typed = select(".typed");

if (typed && !reduceMotion) {
  const words = typed.dataset.words.split("|");
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

/* ==========================================================================
   06. Interações de ponteiro
   ========================================================================== */
if (finePointer && !reduceMotion) {
  // Inclinação suave em cards marcados com data-tilt
  selectAll("[data-tilt]").forEach((element) => {
    const max = Number(element.dataset.tilt) || 5;

    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      element.style.transform = `perspective(900px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
      element.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
      element.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
    });

    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });

  // Luz que acompanha o mouse nos cards de serviço
  selectAll(".service-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });

  // Paralaxe leve na ilustração do hero
  const heroArt = select(".hero-art");
  heroArt?.addEventListener("pointermove", (event) => {
    const rect = heroArt.getBoundingClientRect();
    heroArt.style.setProperty(
      "--px",
      (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3),
    );
    heroArt.style.setProperty(
      "--py",
      (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3),
    );
  });
  heroArt?.addEventListener("pointerleave", () => {
    heroArt.style.setProperty("--px", 0);
    heroArt.style.setProperty("--py", 0);
  });
}

/* ==========================================================================
   07. Calculadora do portfólio
   ========================================================================== */
const calc = select("[data-calc]");

if (calc) {
  const out = select("[data-calc-out]", calc);
  const exprLine = select("[data-calc-expr]", calc);
  const opButtons = selectAll("[data-op]", calc);
  const symbols = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  // Já começa com a conta do exemplo: 142 × 7 (aperte "=" para ver o resultado)
  let current = "7";
  let previous = "142";
  let operator = "*";
  let overwrite = true;
  let lastExpr = "";
  let error = false;

  const fmt = (value) => String(value).replace(".", ",");
  const clean = (number) => String(Number(number.toPrecision(12)));

  const compute = (a, b, op) => {
    const x = Number(a);
    const y = Number(b);
    if (op === "+") return x + y;
    if (op === "-") return x - y;
    if (op === "*") return x * y;
    return y === 0 ? null : x / y;
  };

  const reset = () => {
    current = "0";
    previous = null;
    operator = null;
    overwrite = true;
    lastExpr = "";
    error = false;
  };

  const render = () => {
    out.textContent = error ? "Erro" : fmt(current);
    exprLine.textContent =
      lastExpr || (operator ? `${fmt(previous)} ${symbols[operator]}` : "");
    opButtons.forEach((button) =>
      button.classList.toggle(
        "active",
        operator === button.dataset.op && overwrite,
      ),
    );
  };

  const press = {
    digit(d) {
      if (error) reset();
      if (overwrite) {
        current = d;
        overwrite = false;
      } else if (current.replace(/[-.]/g, "").length < 12) {
        current = current === "0" ? d : current + d;
      }
      lastExpr = "";
    },
    dot() {
      if (error) reset();
      if (overwrite) {
        current = "0.";
        overwrite = false;
      } else if (!current.includes(".")) {
        current += ".";
      }
      lastExpr = "";
    },
    op(o) {
      if (error) reset();
      if (operator && !overwrite) {
        const result = compute(previous, current, operator);
        if (result === null) {
          reset();
          error = true;
          return;
        }
        previous = clean(result);
        current = previous;
      } else if (!operator) {
        previous = current;
      }
      operator = o;
      overwrite = true;
      lastExpr = "";
    },
    equals() {
      if (error) {
        reset();
        return;
      }
      if (!operator) return;
      const line = `${fmt(previous)} ${symbols[operator]} ${fmt(current)} =`;
      const result = compute(previous, current, operator);
      if (result === null) {
        reset();
        error = true;
        return;
      }
      current = clean(result);
      previous = null;
      operator = null;
      overwrite = true;
      lastExpr = line;
    },
    clear() {
      reset();
    },
  };

  calc.addEventListener("click", (event) => {
    const key = event.target.closest("button");
    if (!key) return;
    if (key.dataset.k !== undefined) press.digit(key.dataset.k);
    else if (key.dataset.dot !== undefined) press.dot();
    else if (key.dataset.op) press.op(key.dataset.op);
    else if (key.dataset.eq !== undefined) press.equals();
    else if (key.dataset.clear !== undefined) press.clear();
    render();
  });

  // Teclado físico, quando o foco estiver dentro da calculadora
  calc.addEventListener("keydown", (event) => {
    const { key } = event;
    if (/^\d$/.test(key)) press.digit(key);
    else if (key === "," || key === ".") press.dot();
    else if (key.length === 1 && "+-*/".includes(key)) press.op(key);
    else if (key === "=") press.equals();
    else if (key === "Escape" || key === "c" || key === "C") press.clear();
    else return;
    event.preventDefault();
    render();
  });

  render();
}

/* ==========================================================================
   08. Rodapé
   ========================================================================== */
const year = select("#year");
if (year) year.textContent = new Date().getFullYear();

/* ==========================================================================
   09. Tema claro / escuro
   ========================================================================== */
const themeToggle = select("#themeToggle");

if (themeToggle) {
  const root = document.documentElement;
  const themeIcon = select(".theme-toggle-icon", themeToggle);

  const renderTheme = (theme) => {
    const isDark = theme === "dark";
    if (themeIcon) themeIcon.textContent = isDark ? "☀️" : "🌙";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Ativar modo claro" : "Ativar modo escuro",
    );
  };

  renderTheme(root.dataset.theme || "light");

  themeToggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
    renderTheme(nextTheme);
  });
}
