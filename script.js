(() => {
  "use strict";

  const CONFIG = Object.freeze({
    duracaoInicial: 60,
    bonusPorRegra: 10,
    intervaloEmbaralhamento: 12,
    pi: "3.14",
    emojiObrigatorio: "☝️",
    emojiProibido: "🖕",
    bandeira: "🇳🇱",
    codigoTelefonico: "+55",
    versoesAndroidAceitas: ["14", "15", "16"],
    anoPentacampeonatoBrasil: "2002",
    feiticos: [
      "Expelliarmus", "Lumos", "Nox", "Alohomora", "Expecto Patronum",
      "Wingardium Leviosa", "Accio", "Aparecium", "Riddikulus"
    ]
  });

  const $ = id => document.getElementById(id);
  const form = $("login-form");
  const email = $("email");
  const senha = $("senha");
  const toggle = $("toggle-senha");
  const entrar = $("entrar");
  const lista = $("lista-regras");
  const contador = $("contador");
  const contadorChars = $("contador-caracteres");
  const porcentagem = $("porcentagem");
  const progresso = $("progresso");
  const trilho = $("trilho-progresso");
  const mensagem = $("mensagem");
  const tempoEl = $("tempo");
  const cronometro = $("cronometro");
  const cartao = $("cartao");
  const shuffleStatus = $("shuffle-status");

  const estado = {
    tempoRestante: CONFIG.duracaoInicial,
    prazoFinal: null,
    intervalo: null,
    intervaloShuffle: null,
    iniciado: false,
    vitoria: false,
    esgotado: false,
    mensagemTemporaria: "",
    ordemRegras: [],
    regrasPremiadas: new Set(),
    estadosAnteriores: new Map()
  };

  function separarGraphemes(texto) {
    if (typeof Intl.Segmenter === "function") {
      return [...new Intl.Segmenter("pt-BR", { granularity: "grapheme" }).segment(texto)]
        .map(item => item.segment);
    }
    // Fallback melhor que Array.from para sequências com modificadores/ZWJ.
    return Array.from(texto);
  }

  function romano(numero) {
    const pares = [
      [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"],
      [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"],
      [5, "V"], [4, "IV"], [1, "I"]
    ];
    let resultado = "";
    for (const [valor, simbolo] of pares) {
      while (numero >= valor) {
        resultado += simbolo;
        numero -= valor;
      }
    }
    return resultado;
  }

  function androidValido(texto, versao) {
    // Evita aceitar 14 dentro de 140 ou 14.5.
    return new RegExp("(^|[^\\d])" + versao + "(?![\\d.])").test(texto);
  }

  // Cada regra tem um ID estável. A ordem de apresentação pode mudar sem
  // perder o estado ou premiar a mesma regra duas vezes.
  function obterRegras(texto) {
    const chars = separarGraphemes(texto);
    const n = chars.length;
    const diaRomano = romano(new Date().getDate());
    const lower = texto.toLocaleLowerCase("pt-BR");

    return [
      { id: "minimo", nome: "Mínimo de 5 caracteres visuais.", ok: n >= 5 },
      { id: "numero", nome: "Precisa conter ao menos um número (0–9).", ok: /\d/.test(texto) },
      { id: "maiuscula", nome: "Precisa conter uma letra maiúscula (A–Z).", ok: /[A-Z]/.test(texto) },
      { id: "emoji", nome: "Precisa conter pelo menos um emoji.", ok: /\p{Extended_Pictographic}/u.test(texto) },
      { id: "romano", nome: `Precisa conter o dia de hoje em algarismos romanos (${diaRomano}).`, ok: texto.includes(diaRomano) },
      { id: "pi", nome: "Precisa conter os primeiros dígitos de PI: 3.14.", ok: texto.includes(CONFIG.pi) },
      { id: "apontar", nome: "Precisa apontar para cima (☝️).", ok: texto.includes(CONFIG.emojiObrigatorio) },
      { id: "ano", nome: `Precisa conter 2002, ano do pentacampeonato do Brasil.`, ok: texto.includes(CONFIG.anoPentacampeonatoBrasil) },
      { id: "vogais", nome: "Precisa conter todas as vogais maiúsculas: A, E, I, O e U.", ok: ["A", "E", "I", "O", "U"].every(v => texto.includes(v)) },
      { id: "bandeira", nome: "A bandeira 🇳🇱 deve começar na quinta posição visual.", ok: chars[4] === CONFIG.bandeira },
      { id: "codigo", nome: `Precisa conter o código telefônico ${CONFIG.codigoTelefonico}.`, ok: texto.includes(CONFIG.codigoTelefonico) },
      { id: "feitico", nome: "Precisa conter um feitiço conhecido de Harry Potter.", ok: CONFIG.feiticos.some(f => lower.includes(f.toLocaleLowerCase("pt-BR"))) },
      { id: "android", nome: "Precisa conter uma versão Android aceita: 14, 15 ou 16.", ok: CONFIG.versoesAndroidAceitas.some(v => androidValido(texto, v)) },
      { id: "contagem", nome: `Precisa conter a quantidade atual de caracteres visuais (${n}).`, ok: texto.includes(String(n)) },
      { id: "maximo", nome: "Precisa conter menos de 40 caracteres visuais.", ok: n < 40 },
      { id: "minuscula", nome: "Precisa conter pelo menos uma letra minúscula (a–z).", ok: /[a-z]/.test(texto) }
    ];
  }

  function embaralhar(array) {
    // Fisher–Yates: embaralhamento sem viés de ordenação por sort aleatório.
    const resultado = [...array];
    for (let i = resultado.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
    }
    return resultado;
  }

  function iniciarEmbaralhamento() {
    if (estado.intervaloShuffle !== null) return;
    estado.intervaloShuffle = window.setInterval(() => {
      if (estado.vitoria || estado.esgotado) return pararEmbaralhamento();
      const ordemAnterior = estado.ordemRegras.map(r => r.id).join("|");
      let novaOrdem = embaralhar(estado.ordemRegras);
      // Evita repetir exatamente a mesma sequência.
      if (novaOrdem.map(r => r.id).join("|") === ordemAnterior && novaOrdem.length > 1) {
        novaOrdem = [...novaOrdem.slice(1), novaOrdem[0]];
      }
      estado.ordemRegras = novaOrdem;
      shuffleStatus.textContent = "Ordem embaralhada!";
      window.setTimeout(() => {
        if (!estado.vitoria && !estado.esgotado) shuffleStatus.textContent = "Ordem dinâmica";
      }, 1800);
      atualizarInterface();
    }, CONFIG.intervaloEmbaralhamento * 1000);
  }

  function pararEmbaralhamento() {
    if (estado.intervaloShuffle !== null) {
      window.clearInterval(estado.intervaloShuffle);
      estado.intervaloShuffle = null;
    }
  }

  function pararCronometro() {
    if (estado.intervalo !== null) {
      window.clearInterval(estado.intervalo);
      estado.intervalo = null;
    }
  }

  function atualizarRelogio() {
    if (!estado.iniciado || estado.prazoFinal === null || estado.vitoria || estado.esgotado) return;
    estado.tempoRestante = Math.max(0, Math.ceil((estado.prazoFinal - Date.now()) / 1000));
    tempoEl.textContent = String(estado.tempoRestante);
    cronometro.classList.toggle("urgente", estado.tempoRestante <= 10);
    if (estado.tempoRestante <= 0) finalizarPorTempo();
  }

  function adicionarTempo(segundos) {
    if (estado.iniciado && estado.prazoFinal !== null) {
      estado.prazoFinal += segundos * 1000;
      atualizarRelogio();
    } else {
      estado.tempoRestante += segundos;
      tempoEl.textContent = String(estado.tempoRestante);
    }
  }

  function iniciar() {
    if (estado.iniciado || estado.vitoria || estado.esgotado) return;
    estado.iniciado = true;
    estado.prazoFinal = Date.now() + estado.tempoRestante * 1000;
    estado.intervalo = window.setInterval(atualizarRelogio, 100);
    iniciarEmbaralhamento();
  }

  function mostrarMensagem(texto, tipo = "normal") {
    mensagem.textContent = texto;
    mensagem.style.color = tipo === "erro" ? "var(--danger)"
      : tipo === "sucesso" ? "var(--good)" : "var(--muted)";
  }

  function renderizarRegras(regras) {
    lista.replaceChildren();
    const primeiraPendente = estado.ordemRegras.find(regra => !regra.ok);

    for (const regra of estado.ordemRegras) {
      const li = document.createElement("li");
      li.className = regra.ok ? "cumprida" : (primeiraPendente?.id === regra.id ? "regra-atual" : "");
      const status = document.createElement("span");
      status.className = "rule-state";
      status.setAttribute("aria-hidden", "true");
      status.textContent = regra.ok ? "✓" : (primeiraPendente?.id === regra.id ? "→" : "○");
      li.append(status, document.createTextNode(regra.nome));
      lista.append(li);
    }
  }

  function atualizarInterface() {
    const texto = senha.value;
    const chars = separarGraphemes(texto);
    const regras = obterRegras(texto);
    const regrasPorId = new Map(regras.map(regra => [regra.id, regra]));

    // Atualiza as regras com os resultados mais recentes, mantendo a ordem atual.
    estado.ordemRegras = estado.ordemRegras.length
      ? estado.ordemRegras.map(regra => regrasPorId.get(regra.id))
      : [...regras];

    let novasRegras = 0;
    const jaHaviaEstadoAnterior = estado.estadosAnteriores.size > 0;
    for (const regra of regras) {
      const anterior = estado.estadosAnteriores.get(regra.id) || false;
      // A primeira renderização apenas estabelece a linha de base; não dá bônus.
      if (jaHaviaEstadoAnterior && regra.ok && !anterior && !estado.regrasPremiadas.has(regra.id)) {
        estado.regrasPremiadas.add(regra.id);
        novasRegras++;
      }
      estado.estadosAnteriores.set(regra.id, regra.ok);
    }

    if (novasRegras > 0 && !estado.vitoria && !estado.esgotado) {
      const bonus = novasRegras * CONFIG.bonusPorRegra;
      adicionarTempo(bonus);
      mostrarMensagem(`⏱️ +${bonus} segundos! ${novasRegras === 1 ? "Regra cumprida" : "Regras cumpridas"} pela primeira vez.`, "sucesso");
    }

    const cumpridas = regras.filter(regra => regra.ok).length;
    const percentual = Math.round(cumpridas / regras.length * 100);
    const emailValido = email.value.trim() !== "" && email.validity.valid;
    const proibido = texto.includes(CONFIG.emojiProibido);
    const tudoCerto = cumpridas === regras.length;
    const pronto = tudoCerto && emailValido && !proibido;

    contadorChars.textContent = `${chars.length} caractere${chars.length === 1 ? "" : "s"} visuais`;
    contador.textContent = `${cumpridas} de ${regras.length} regras`;
    porcentagem.textContent = `${percentual}%`;
    progresso.style.width = `${percentual}%`;
    trilho.setAttribute("aria-valuenow", String(cumpridas));

    renderizarRegras(regras);
    entrar.disabled = !pronto || estado.vitoria || estado.esgotado;

    if (!estado.vitoria && !estado.esgotado) {
      if (proibido) {
        mostrarMensagem("Não pode ter o dedo do meio, seu sem educação.", "erro");
      } else if (tudoCerto && !emailValido) {
        mostrarMensagem("Senha válida! Informe um e-mail válido para concluir.", "sucesso");
      } else if (tudoCerto && emailValido) {
        mostrarMensagem("🎉 Tudo certo! Clique para concluir o desafio.", "sucesso");
      } else if (novasRegras === 0 && !estado.mensagemTemporaria) {
        mensagem.textContent = "";
      }
    }
    estado.mensagemTemporaria = "";
  }

  function confetes() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cores = ["#8b5cf6", "#22d3ee", "#34d399", "#fbbf24", "#fb7185"];
    for (let i = 0; i < 70; i++) {
      const elemento = document.createElement("span");
      elemento.className = "confete";
      elemento.setAttribute("aria-hidden", "true");
      elemento.style.left = `${Math.random() * 100}vw`;
      elemento.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];
      elemento.style.setProperty("--duracao", `${2 + Math.random() * 2.5}s`);
      elemento.style.setProperty("--deslocamento", `${Math.random() * 180 - 90}px`);
      document.body.append(elemento);
      elemento.addEventListener("animationend", () => elemento.remove(), { once: true });
    }
  }

  function bloquearControles() {
    senha.disabled = true;
    email.disabled = true;
    toggle.disabled = true;
    entrar.disabled = true;
  }

  function vencer() {
    if (estado.vitoria || estado.esgotado) return;
    estado.vitoria = true;
    pararCronometro();
    pararEmbaralhamento();
    bloquearControles();
    cartao.classList.add("vitoria");
    mostrarMensagem(`🏆 Parabéns! Você venceu com ${estado.tempoRestante} segundo${estado.tempoRestante === 1 ? "" : "s"} restante${estado.tempoRestante === 1 ? "" : "s"}!`, "sucesso");
    confetes();
  }

  function finalizarPorTempo() {
    if (estado.esgotado || estado.vitoria) return;
    estado.tempoRestante = 0;
    estado.esgotado = true;
    pararCronometro();
    pararEmbaralhamento();
    bloquearControles();
    cartao.classList.add("derrota");
    tempoEl.textContent = "0";
    mostrarMensagem("⏰ O tempo acabou! Você pode tentar novamente.", "erro");

    if (!$("reiniciar")) {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.id = "reiniciar";
      botao.className = "submit";
      botao.textContent = "Tentar novamente";
      botao.addEventListener("click", reiniciar);
      entrar.after(botao);
    }
  }

  function reiniciar() {
    pararCronometro();
    pararEmbaralhamento();
    estado.tempoRestante = CONFIG.duracaoInicial;
    estado.prazoFinal = null;
    estado.iniciado = false;
    estado.vitoria = false;
    estado.esgotado = false;
    estado.mensagemTemporaria = "";
    estado.regrasPremiadas = new Set();
    estado.estadosAnteriores = new Map();
    estado.ordemRegras = [];

    email.value = "";
    senha.value = "";
    email.disabled = false;
    senha.disabled = false;
    toggle.disabled = false;
    senha.classList.add("senha-oculta");
    toggle.textContent = "Mostrar";
    toggle.setAttribute("aria-label", "Mostrar senha");
    tempoEl.textContent = String(CONFIG.duracaoInicial);
    cronometro.classList.remove("urgente");
    cartao.classList.remove("vitoria", "derrota");
    $("reiniciar")?.remove();
    shuffleStatus.textContent = "Ordem dinâmica";
    document.querySelectorAll(".confete").forEach(el => el.remove());
    mensagem.textContent = "";
    atualizarInterface();
    senha.focus();
  }

  toggle.addEventListener("click", () => {
    const mostrar = senha.classList.contains("senha-oculta");
    senha.classList.toggle("senha-oculta", !mostrar);
    toggle.textContent = mostrar ? "Ocultar" : "Mostrar";
    toggle.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
  });

  senha.addEventListener("focus", iniciar);
  senha.addEventListener("input", atualizarInterface);
  email.addEventListener("input", atualizarInterface);

  form.addEventListener("submit", evento => {
    evento.preventDefault();
    if (estado.vitoria || estado.esgotado) return;

    if (senha.value.includes(CONFIG.emojiProibido)) {
      mostrarMensagem("Não pode ter o dedo do meio, seu sem educação.", "erro");
      entrar.disabled = true;
      return;
    }
    if (!email.value.trim() || !email.validity.valid) {
      email.reportValidity();
      return;
    }
    const regras = obterRegras(senha.value);
    if (regras.every(regra => regra.ok)) {
      atualizarRelogio();
      if (!estado.esgotado) vencer();
    } else {
      atualizarInterface();
    }
  });

  // Inicialização: a contagem de regras vem da própria função de validação.
  const totalRegras = obterRegras("").length;
  trilho.setAttribute("aria-valuemax", String(totalRegras));
  atualizarInterface();
})();
