

"use strict";

// ======================================
// ELEMENTOS DO HTML
// ======================================

const form = document.getElementById("login-form");
const email = document.getElementById("email");
const senha = document.getElementById("senha");
const toggleSenha = document.getElementById("toggle-senha");
const mensagem = document.getElementById("mensagem");
const listaRegras = document.getElementById("lista-regras");
const contador = document.getElementById("contador");
const porcentagem = document.getElementById("porcentagem");
const progresso = document.getElementById("progresso");
const entrar = document.getElementById("entrar");

const elementoTempo = document.getElementById("tempo");
const elementoCronometro = document.getElementById("cronometro");
const contadorCaracteres = document.getElementById("contador-caracteres");

const cartao = document.querySelector(".login-card");

// Verifica se o HTML possui os elementos necessários.
if (
    !form ||
    !senha ||
    !toggleSenha ||
    !mensagem ||
    !listaRegras ||
    !contador ||
    !porcentagem ||
    !progresso ||
    !entrar
) {
    throw new Error(
        "Não foi possível encontrar todos os elementos do desafio no HTML."
    );
}

// ======================================
// CONFIGURAÇÕES DO DESAFIO
// ======================================

const CONFIG = {
    codigoTelefonico: "+55",

    versaoAndroid: [
        "1.0", "1.1", "1.5", "1.6",
        "2.0", "2.1", "2.2", "2.3",
        "3.0", "3.1", "3.2",
        "4.0", "4.1", "4.2", "4.3", "4.4",
        "5.0", "5.1", "6.0",
        "7.0", "7.1", "8.0", "8.1",
        "9", "10", "11", "12", "12L",
        "13", "14", "15", "16", "17"
    ],

    bandeira: "🇳🇱",

    feitico: [
        "Accio",
        "Alohomora",
        "Aparecium",
        "Arresto Momentum",
        "Ascendio",
        "Avada Kedavra",
        "Bombarda",
        "Colloportus",
        "Confundo",
        "Crucio",
        "Depulso",
        "Diffindo",
        "Engorgio",
        "Episkey",
        "Expecto Patronum",
        "Expelliarmus",
        "Ferula",
        "Finite Incantatem",
        "Flagrate",
        "Furnunculus",
        "Geminio",
        "Immobulus",
        "Impedimenta",
        "Imperio",
        "Impervius",
        "Incarcerous",
        "Incendio",
        "Legilimens",
        "Levicorpus",
        "Liberacorpus",
        "Locomotor",
        "Lumos",
        "Meteolojinx Recanto",
        "Mobiliarbus",
        "Mobilicorpus",
        "Morsmordre",
        "Muffliato",
        "Nox",
        "Obliviate",
        "Obscuro",
        "Oppugno",
        "Orchideous",
        "Petrificus Totalus",
        "Point Me",
        "Portus",
        "Prior Incantato",
        "Protego",
        "Reducto",
        "Reducio",
        "Relashio",
        "Reparo",
        "Rictusempra",
        "Riddikulus",
        "Scourgify",
        "Sectumsempra",
        "Serpensortia",
        "Silencio",
        "Sonorus",
        "Stupefy",
        "Tarantallegra",
        "Tergeo",
        "Waddiwasi",
        "Wingardium Leviosa"
    ],

    pi: "3.14",
    anoCopa: "2026",
    seta: "☝️",
    emojiProibido: "🖕",

    tempoInicial: 60
};

// ======================================
// ESTADO DO JOGO
// ======================================

let tempoRestante = CONFIG.tempoInicial;
let cronometroIntervalo = null;
let cronometroIniciado = false;
let tentativaConcluida = false;
let tempoEsgotado = false;
let comemoracaoIniciada = false;

// ======================================
// CONTAR CARACTERES VISUAIS
// ======================================

function separarCaracteres(texto) {
    if (typeof Intl.Segmenter === "function") {
        return [
            ...new Intl.Segmenter("pt-BR", {
                granularity: "grapheme"
            }).segment(texto)
        ].map(item => item.segment);
    }

    // Alternativa para navegadores sem Intl.Segmenter.
    return Array.from(texto);
}

function obterTamanhoSenha(texto) {
    return separarCaracteres(texto).length;
}

// ======================================
// ALGARISMOS ROMANOS
// ======================================

function paraRomano(numero) {
    const valores = [
        [1000, "M"],
        [900, "CM"],
        [500, "D"],
        [400, "CD"],
        [100, "C"],
        [90, "XC"],
        [50, "L"],
        [40, "XL"],
        [10, "X"],
        [9, "IX"],
        [5, "V"],
        [4, "IV"],
        [1, "I"]
    ];

    let resultado = "";

    for (const [valor, simbolo] of valores) {
        while (numero >= valor) {
            resultado += simbolo;
            numero -= valor;
        }
    }

    return resultado;
}

function obterDiaRomano() {
    return paraRomano(new Date().getDate());
}

// ======================================
// VALIDAR VERSÃO ANDROID
// ======================================

// Evita aceitar uma versão só porque aparece
// dentro de outro número, como 17 dentro de 217.
function contemVersaoAndroid(valor) {
    return CONFIG.versaoAndroid.some(versao => {
        const escapada = versao.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const regex = new RegExp(
            `(^|[^0-9.])${escapada}(?=$|[^0-9.])`
        );

        return regex.test(valor);
    });
}

// ======================================
// VALIDAR AS 16 REGRAS
// ======================================

function validarSenha(valor) {
    const caracteres = separarCaracteres(valor);
    const tamanho = caracteres.length;
    const diaRomano = obterDiaRomano();

    return [
        {
            nome: "Digite pelo menos 5 caracteres",
            cumprida: tamanho >= 5
        },
        {
            nome: "Adicione pelo menos um número",
            cumprida: /\d/.test(valor)
        },
        {
            nome: "Adicione uma letra maiúscula",
            cumprida: /[A-Z]/.test(valor)
        },
        {
            nome: "Inclua um emoji",
            cumprida: /\p{Extended_Pictographic}/u.test(valor)
        },
        {
            nome: "O dia de hoje em algarismos romanos",
            cumprida: valor.includes(diaRomano)
        },
        {
            nome: "Inclua os primeiros dígitos de pi",
            cumprida: valor.includes(CONFIG.pi)
        },
        {
            nome: "Inclua o dedo para cima",
            cumprida: valor.includes(CONFIG.seta)
        },
        {
            nome: "Inclua o ano de 2026",
            cumprida: valor.includes(CONFIG.anoCopa)
        },
        {
            nome: "Não pode ter o dedo do meio, seu sem educação!",
            cumprida: !valor.includes(CONFIG.emojiProibido)
        },
        {
            nome: "Coloque a bandeira dos Países Baixos na quinta posição",
            cumprida: caracteres[4] === CONFIG.bandeira
        },
        {
            nome: "Inclua todas as vogais maiúsculas: A, E, I, O, U",
            cumprida: ["A", "E", "I", "O", "U"].every(
                vogal => valor.includes(vogal)
            )
        },
        {
            nome: "Inclua o código telefônico +55",
            cumprida: valor.includes(CONFIG.codigoTelefonico)
        },
        {
            nome: "Inclua um feitiço de Harry Potter",
            cumprida: CONFIG.feitico.some(feitico =>
                valor.toLowerCase().includes(feitico.toLowerCase())
            )
        },
        {
            nome: "Inclua uma versão válida do Android",
            cumprida: contemVersaoAndroid(valor)
        },
        {
            nome: `Inclua o número correspondente ao comprimento atual da senha (${tamanho})`,
            cumprida: valor.includes(String(tamanho))
        },
        {
            nome: "A senha deve ter menos de 40 caracteres",
            cumprida: tamanho < 40
        }
    ];
}

// ======================================
// PARAR O CRONÔMETRO
// ======================================

function pararCronometro() {
    if (cronometroIntervalo !== null) {
        clearInterval(cronometroIntervalo);
        cronometroIntervalo = null;
    }

    cronometroIniciado = false;
}

// ======================================
// ATUALIZAR CONTADOR DE CARACTERES
// ======================================

function atualizarContadorCaracteres() {
    if (!contadorCaracteres) return;

    const tamanho = obterTamanhoSenha(senha.value);

    contadorCaracteres.textContent =
        `${tamanho} ${tamanho === 1 ? "caractere" : "caracteres"}`;
}

// ======================================
// ATUALIZAR DESAFIO E PROGRESSO
// ======================================

function atualizarDesafio() {
    atualizarContadorCaracteres();

    if (tentativaConcluida) return;

    const valor = senha.value;
    const regras = validarSenha(valor);

    const indiceAtual = regras.findIndex(
        regra => !regra.cumprida
    );

    const cumpridas = regras.filter(
        regra => regra.cumprida
    ).length;

    const total = regras.length;
    const percentagem = Math.round((cumpridas / total) * 100);

    // Mostrar somente a primeira regra pendente.
    listaRegras.replaceChildren();

    if (indiceAtual !== -1) {
        const item = document.createElement("li");
        item.textContent = regras[indiceAtual].nome;
        item.classList.add("regra-atual");
        listaRegras.appendChild(item);
    } else {
        const item = document.createElement("li");
        item.textContent = "🏆 Todas as regras foram cumpridas!";
        item.classList.add("cumprida");
        listaRegras.appendChild(item);
    }

    contador.textContent = `${cumpridas} de ${total} regras cumpridas`;
    porcentagem.textContent = `${percentagem}%`;
    progresso.style.width = `${percentagem}%`;
    progresso.style.background =
        percentagem === 100 ? "#16a34a" : "#2563eb";

    // Atualiza a acessibilidade da barra, se disponível.
    const barraProgresso = progresso.parentElement;

    if (barraProgresso) {
        barraProgresso.setAttribute("role", "progressbar");
        barraProgresso.setAttribute("aria-valuemin", "0");
        barraProgresso.setAttribute("aria-valuemax", "100");
        barraProgresso.setAttribute("aria-valuenow", String(percentagem));
    }

    entrar.disabled = percentagem !== 100;

    if (percentagem < 100 && !tempoEsgotado) {
        mensagem.className = "message";
        mensagem.textContent = "";
    }
}

// ======================================
// MOSTRAR / OCULTAR SENHA
// ======================================

toggleSenha.addEventListener("click", () => {
    const mostrar = senha.type === "password";

    senha.type = mostrar ? "text" : "password";
    toggleSenha.textContent = mostrar ? "Ocultar" : "Mostrar";

    toggleSenha.setAttribute(
        "aria-label",
        mostrar ? "Ocultar senha" : "Mostrar senha"
    );
});

// ======================================
// CONFETES DA VITÓRIA
// ======================================

function criarConfetes() {
    // Respeita a preferência por menos animações.
    const prefereMenosMovimento = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefereMenosMovimento) return;

    const cores = [
        "#22c55e",
        "#3b82f6",
        "#facc15",
        "#f472b6",
        "#a855f7",
        "#fb923c"
    ];

    for (let i = 0; i < 120; i++) {
        const confete = document.createElement("div");

        confete.className = "confete";
        confete.setAttribute("aria-hidden", "true");

        confete.style.left = `${Math.random() * 100}vw`;
        confete.style.backgroundColor =
            cores[Math.floor(Math.random() * cores.length)];

        confete.style.setProperty(
            "--duracao",
            `${2 + Math.random() * 3}s`
        );

        confete.style.setProperty(
            "--desvio",
            `${Math.random() * 240 - 120}px`
        );

        confete.style.animationDelay = `${Math.random() * 0.8}s`;
        confete.style.borderRadius =
            Math.random() > 0.5 ? "50%" : "2px";

        document.body.appendChild(confete);

        confete.addEventListener("animationend", () => {
            confete.remove();
        }, { once: true });
    }
}

// ======================================
// COMEMORAÇÃO DA VITÓRIA
// ======================================

function comemorarVitoria() {
    if (comemoracaoIniciada) return;

    comemoracaoIniciada = true;
    tentativaConcluida = true;

    pararCronometro();

    if (cartao) {
        cartao.classList.add("vitoria");
    }

    mensagem.className = "message mensagem-vitoria";

    mensagem.innerHTML = `
        <h2>🏆 VOCÊ CONSEGUIU! 🎉</h2>
        <p>Você venceu o Desafio da Senha!</p>
        <p>🧠 16 regras dominadas. Você é uma lenda!</p>
        <p>👑 Sua senha é digna de um mestre!</p>
    `;

    entrar.disabled = true;
    senha.disabled = true;
    toggleSenha.disabled = true;

    criarConfetes();
}

// ======================================
// CRONÔMETRO DE 60 SEGUNDOS
// ======================================

function iniciarCronometro() {
    if (
        cronometroIniciado ||
        tentativaConcluida ||
        tempoEsgotado
    ) {
        return;
    }

    cronometroIniciado = true;
    elementoTempo.textContent = tempoRestante;

    cronometroIntervalo = setInterval(() => {
        if (tentativaConcluida) {
            pararCronometro();
            return;
        }

        tempoRestante--;
        elementoTempo.textContent = tempoRestante;

        if (tempoRestante <= 10 && elementoCronometro) {
            elementoCronometro.classList.add("urgente");
        }

        if (tempoRestante <= 0) {
            pararCronometro();

            tempoRestante = 0;
            tempoEsgotado = true;

            senha.value = "";
            senha.disabled = true;
            entrar.disabled = true;

            atualizarDesafio();

            mensagem.className = "message";
            mensagem.style.color = "#dc2626";
            mensagem.textContent =
                "⏰ Tempo esgotado! Sua tentativa terminou.";

            // Mostra o zero antes de permitir reiniciar.
            elementoTempo.textContent = "0";

            // O jogador pode iniciar uma nova tentativa
            // clicando no botão que será criado abaixo.
            mostrarBotaoTentarNovamente();
        }
    }, 1000);
}

senha.addEventListener("focus", iniciarCronometro);

// ======================================
// REINICIAR O DESAFIO
// ======================================

function mostrarBotaoTentarNovamente() {
    let botao = document.getElementById("tentar-novamente");

    if (botao) return;

    botao = document.createElement("button");
    botao.type = "button";
    botao.id = "tentar-novamente";
    botao.className = "login-button";
    botao.style.marginTop = "12px";
    botao.textContent = "🔄 Tentar novamente";

    form.appendChild(botao);

    botao.addEventListener("click", reiniciarDesafio);
}

function reiniciarDesafio() {
    pararCronometro();

    tempoRestante = CONFIG.tempoInicial;
    cronometroIniciado = false;
    tentativaConcluida = false;
    tempoEsgotado = false;
    comemoracaoIniciada = false;

    senha.value = "";
    senha.disabled = false;
    toggleSenha.disabled = false;

    senha.type = "password";
    toggleSenha.textContent = "Mostrar";
    toggleSenha.setAttribute("aria-label", "Mostrar senha");

    entrar.disabled = true;

    if (email) {
        email.value = "";
    }

    elementoTempo.textContent = tempoRestante;

    if (elementoCronometro) {
        elementoCronometro.classList.remove("urgente");
    }

    if (cartao) {
        cartao.classList.remove("vitoria");
    }

    mensagem.className = "message";
    mensagem.style.color = "";
    mensagem.textContent = "";

    const botao = document.getElementById("tentar-novamente");

    if (botao) {
        botao.remove();
    }

    document.querySelectorAll(".confete").forEach(confete => {
        confete.remove();
    });

    atualizarDesafio();
    senha.focus();
}

// ======================================
// ATUALIZAÇÃO EM TEMPO REAL
// ======================================

senha.addEventListener("input", () => {
    if (tempoEsgotado || tentativaConcluida) return;

    atualizarDesafio();
});

// ======================================
// ENVIO DO FORMULÁRIO
// ======================================

form.addEventListener("submit", evento => {
    evento.preventDefault();

    if (tentativaConcluida || tempoEsgotado) return;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const regras = validarSenha(senha.value);

    if (regras.every(regra => regra.cumprida)) {
        comemorarVitoria();
    } else {
        atualizarDesafio();
    }
});

// ======================================
// INICIALIZAÇÃO
// ======================================

atualizarDesafio();

