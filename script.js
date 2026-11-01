(() => {
  "use strict";

  const CONFIG = Object.freeze({
    duracaoInicial: 60,
    bonusPorRegra: 10,
    pi: "3.14",
    emojiObrigatorio: "☝️",
    emojiProibido: "🖕",
    bandeira: "🇳🇱",
    codigoTelefonico: "+55",
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
  const botaoReiniciar = $("reiniciar");
  const lista = $("lista-regras");
  const contadorChars = $("contador-caracteres");
  const mensagem = $("mensagem");
  const tempoEl = $("tempo");
  const cronometro = $("cronometro");
  const cartao = $("cartao");

  // Estado centralizado: cada nova tentativa recebe coleções novas.
  function criarEstadoInicial() {
    return {
      tempoRestante: CONFIG.duracaoInicial,
      prazoFinal: null,
      intervalo: null,
      iniciado: false,
      vitoria: false,
      esgotado: false,
      regraAtualId: null,
      contagemAlvo: null,
      regrasPremiadas: new Set(),
      estadosAnteriores: new Map()
    };
  }

  const estado = criarEstadoInicial();

  function separarGraphemes(texto) {
    if (typeof Intl.Segmenter === "function") {
      return [...new Intl.Segmenter("pt-BR", { granularity: "grapheme" }).segment(texto)]
        .map(item => item.segment);
    }
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

  // Avaliação das regras fica isolada da interface e dos eventos do formulário.
  function avaliarRegrasSenha(texto) {
    const chars = separarGraphemes(texto);
    const n = chars.length;
    const diaRomano = romano(new Date().getDate());
    const lower = texto.toLocaleLowerCase("pt-BR");

    return [
      { id: "minimo", nome: "Sua senha precisa ter pelo menos 5 caracteres visuais.", ok: n >= 5 },
      { id: "numero", nome: "Inclua pelo menos um número (0–9).", ok: /\d/.test(texto) },
      { id: "maiuscula", nome: "Inclua uma letra maiúscula (A–Z).", ok: /[A-Z]/.test(texto) },
      { id: "emoji", nome: "Surpresa: sua senha precisa conter um emoji.", ok: /\p{Extended_Pictographic}/u.test(texto) },
      { id: "romano", nome: "Inclua o dia de hoje em algarismos romanos (" + diaRomano + ").", ok: texto.includes(diaRomano) },
      { id: "pi", nome: "Os primeiros dígitos de PI precisam aparecer: 3.14.", ok: texto.includes(CONFIG.pi) },
      { id: "apontar", nome: "Adicione o emoji que aponta para cima: ☝️.", ok: texto.includes(CONFIG.emojiObrigatorio) },
      { id: "ano", nome: "Inclua 2002, o ano do pentacampeonato do Brasil.", ok: texto.includes(CONFIG.anoPentacampeonatoBrasil) },
      { id: "vogais", nome: "Todas as vogais maiúsculas precisam aparecer: A, E, I, O e U.", ok: ["A", "E", "I", "O", "U"].every(v => texto.includes(v)) },
      { id: "bandeira", nome: "A bandeira 🇳🇱 precisa começar na quinta posição visual.", ok: chars[4] === CONFIG.bandeira },
      { id: "codigo", nome: "Inclua o código telefônico do Brasil: " + CONFIG.codigoTelefonico + ".", ok: texto.includes(CONFIG.codigoTelefonico) },
      { id: "feitico", nome: "Inclua um feitiço conhecido de Harry Potter.", ok: CONFIG.feiticos.some(f => lower.includes(f.toLocaleLowerCase("pt-BR"))) },
      {
        id: "contagem",
        nome: "O número de caracteres visuais definido nesta etapa (" +
          (estado.contagemAlvo ?? n) + ") precisa aparecer na senha.",
        ok: texto.includes(String(estado.contagemAlvo ?? n))
      },
      { id: "maximo", nome: "Sua senha precisa ter menos de 40 caracteres visuais.", ok: n < 40 },
      { id: "minuscula", nome: "Inclua pelo menos uma letra minúscula (a–z).", ok: /[a-z]/.test(texto) }
    ];
  }

  function validarEmail() {
    return email.value.trim() !== "" && email.validity.valid;
  }

  function avaliarSenha(texto) {
    const regras = avaliarRegrasSenha(texto);
    return {
      regras,
      tudoCerto: regras.every(regra => regra.ok),
      proibido: texto.includes(CONFIG.emojiProibido)
    };
  }

  function validarFormulario() {
    const senhaAvaliada = avaliarSenha(senha.value);
    return {
      ...senhaAvaliada,
      emailValido: validarEmail(),
      formularioValido: senhaAvaliada.tudoCerto &&
        validarEmail() && !senhaAvaliada.proibido
    };
  }

  function escolherRegraSurpresa(regras) {
    const pendentes = regras.filter(regra => !regra.ok);
    if (pendentes.length === 0) {
      estado.regraAtualId = null;
      return;
    }
    let candidatas = pendentes.filter(regra => regra.id !== estado.regraAtualId);
    if (candidatas.length === 0) candidatas = pendentes;
    const escolhida = candidatas[Math.floor(Math.random() * candidatas.length)];
    estado.regraAtualId = escolhida.id;

    // A contagem é congelada quando a regra é revelada, evitando que o alvo
    // mude a cada caractere digitado.
    estado.contagemAlvo = escolhida.id === "contagem"
      ? separarGraphemes(senha.value).length
      : null;
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
  }

  function mostrarMensagem(texto, tipo = "normal") {
    mensagem.textContent = texto;
    mensagem.style.color = tipo === "erro" ? "var(--danger)"
      : tipo === "sucesso" ? "var(--good)" : "var(--muted)";
  }

  function renderizarRegra(regra) {
    lista.replaceChildren();
    const item = document.createElement("li");
    item.className = "regra-atual";
    const status = document.createElement("span");
    status.className = "rule-state";
    status.setAttribute("aria-hidden", "true");
    status.textContent = "•";
    const texto = document.createElement("strong");
    texto.textContent = regra.nome;
    item.append(status, texto);
    lista.append(item);
  }

  function renderizarConclusao() {
    lista.replaceChildren();
    const item = document.createElement("li");
    item.className = "cumprida";
    item.textContent = "✓ Todas as condições foram cumpridas! Você conseguiu!";
    lista.append(item);
  }

  function atualizarInterface() {
    const texto = senha.value;
    const chars = separarGraphemes(texto);
    const avaliacao = avaliarSenha(texto);
    const regras = avaliacao.regras;
    const regrasPorId = new Map(regras.map(regra => [regra.id, regra]));

    let novasRegras = 0;
    const jaExisteEstadoAnterior = estado.estadosAnteriores.size > 0;
    for (const regra of regras) {
      const anterior = estado.estadosAnteriores.get(regra.id) || false;
      // A primeira leitura só registra o estado inicial; não concede bônus.
      if (jaExisteEstadoAnterior && regra.id === estado.regraAtualId &&
          regra.ok && !anterior && !estado.regrasPremiadas.has(regra.id)) {
        estado.regrasPremiadas.add(regra.id);
        novasRegras++;
      }
      estado.estadosAnteriores.set(regra.id, regra.ok);
    }

    if (novasRegras > 0 && !estado.vitoria && !estado.esgotado) {
      const bonus = novasRegras * CONFIG.bonusPorRegra;
      adicionarTempo(bonus);
      mostrarMensagem("⏱️ +" + bonus + " segundos! Boa, regra cumprida!", "sucesso");
    }

    const { tudoCerto, proibido } = avaliacao;
    const emailValido = validarEmail();

    if (!tudoCerto && !estado.vitoria && !estado.esgotado) {
      const atual = regrasPorId.get(estado.regraAtualId);
      if (!atual || atual.ok) escolherRegraSurpresa(regras);
    }

    contadorChars.textContent = chars.length + " caractere" + (chars.length === 1 ? "" : "s") + " visuais";
    entrar.disabled = !(tudoCerto && emailValido && !proibido) || estado.vitoria || estado.esgotado;

    if (tudoCerto) {
      renderizarConclusao();
    } else {
      const regraAtual = regrasPorId.get(estado.regraAtualId);
      if (regraAtual) renderizarRegra(regraAtual);
    }

    if (!estado.vitoria && !estado.esgotado) {
      if (proibido) {
        mostrarMensagem("Não pode ter o dedo do meio, seu sem educação.", "erro");
      } else if (tudoCerto && !emailValido) {
        mostrarMensagem("Você conseguiu! Informe um e-mail válido para concluir.", "sucesso");
      } else if (tudoCerto && emailValido) {
        mostrarMensagem("🎉 Tudo certo! Clique para concluir o desafio.", "sucesso");
      } else if (novasRegras === 0) {
        mensagem.textContent = "";
      }
    }
  }

  function confetes() {
    if (window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cores = ["#8b5cf6", "#22d3ee", "#34d399", "#fbbf24", "#fb7185"];
    for (let i = 0; i < 70; i++) {
      const elemento = document.createElement("span");
      elemento.className = "confete";
      elemento.setAttribute("aria-hidden", "true");
      elemento.style.left = (Math.random() * 100) + "vw";
      elemento.style.backgroundColor = cores[Math.floor(Math.random() * cores.length)];
      elemento.style.setProperty("--duracao", (2 + Math.random() * 2.5) + "s");
      elemento.style.setProperty("--deslocamento", (Math.random() * 180 - 90) + "px");
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
    bloquearControles();
    cartao.classList.add("vitoria");
    mostrarMensagem("🏆 Parabéns! Você venceu com " + estado.tempoRestante + " segundo" +
      (estado.tempoRestante === 1 ? "" : "s") + " restante" +
      (estado.tempoRestante === 1 ? "" : "s") + "!", "sucesso");
    confetes();
  }

  function finalizarPorTempo() {
    if (estado.esgotado || estado.vitoria) return;
    estado.tempoRestante = 0;
    estado.esgotado = true;
    pararCronometro();
    bloquearControles();
    cartao.classList.add("derrota");
    tempoEl.textContent = "0";
    mostrarMensagem("⏰ O tempo acabou! Você pode tentar novamente.", "erro");
  }

  function reiniciar() {
    pararCronometro();
    Object.assign(estado, criarEstadoInicial());

    email.value = "";
    senha.value = "";
    email.disabled = false;
    senha.disabled = false;
    toggle.disabled = false;
    senha.type = "password";
    toggle.textContent = "Mostrar";
    toggle.setAttribute("aria-label", "Mostrar senha");
    toggle.setAttribute("aria-pressed", "false");
    tempoEl.textContent = String(CONFIG.duracaoInicial);
    cronometro.classList.remove("urgente");
    cartao.classList.remove("vitoria", "derrota");
    document.querySelectorAll(".confete").forEach(el => el.remove());
    mensagem.textContent = "";
    escolherRegraSurpresa(avaliarRegrasSenha(""));
    atualizarInterface();
    email.focus();
  }

  botaoReiniciar.addEventListener("click", reiniciar);

  toggle.addEventListener("click", evento => {
    evento.preventDefault();
    const mostrar = senha.getAttribute("type") === "password";
    senha.setAttribute("type", mostrar ? "text" : "password");
    toggle.textContent = mostrar ? "Ocultar" : "Mostrar";
    toggle.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
    toggle.setAttribute("aria-pressed", mostrar ? "true" : "false");
    senha.focus();
    const tamanho = senha.value.length;
    try { senha.setSelectionRange(tamanho, tamanho); } catch (_) { /* Campo pode não suportar seleção. */ }
  });

  senha.addEventListener("focus", iniciar);
  senha.addEventListener("input", atualizarInterface);
  email.addEventListener("input", atualizarInterface);

  form.addEventListener("submit", evento => {
    evento.preventDefault();
    if (estado.vitoria || estado.esgotado) return;

    const validacao = validarFormulario();

    if (validacao.proibido) {
      mostrarMensagem("Não pode ter o dedo do meio, seu sem educação.", "erro");
      entrar.disabled = true;
      return;
    }
    if (!validacao.emailValido) {
      email.reportValidity();
      return;
    }
    if (validacao.tudoCerto) {
      atualizarRelogio();
      if (!estado.esgotado) vencer();
    } else {
      atualizarInterface();
    }
  });

  escolherRegraSurpresa(avaliarRegrasSenha(""));
  atualizarInterface();
})();