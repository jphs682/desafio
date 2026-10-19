
(() => {
    "use strict";

    const CONFIG = {
        duracao: 60,
        pi: "3.14",
        emojiObrigatorio: "☝️",
        emojiProibido: "🖕",
        bandeira: "🇳🇱",
        codigo: "+55",
        android: ["14", "15", "16"],
        feiticos: [
            "Expelliarmus",
            "Lumos",
            "Nox",
            "Alohomora",
            "Expecto Patronum",
            "Wingardium Leviosa",
            "Accio",
            "Aparecium",
            "Riddikulus"
        ]
    };

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

    let tempo = CONFIG.duracao;
    let intervalo = null;
    let iniciado = false;
    let vitoria = false;
    let esgotado = false;
    let estadosAnteriores = null;
    let regrasPremiadas = Array(15).fill(false);

    function romano(n) {
        const pares = [
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

        for (const [valor, simbolo] of pares) {
            while (n >= valor) {
                resultado += simbolo;
                n -= valor;
            }
        }

        return resultado;
    }

    function separar(s) {
        if (typeof Intl.Segmenter === "function") {
            return [
                ...new Intl.Segmenter("pt-BR", {
                    granularity: "grapheme"
                }).segment(s)
            ].map(item => item.segment);
        }

        return Array.from(s);
    }

    // Aceita 14, 15 ou 16 sem exigir a palavra "Android".
    // Não aceita esses números quando fazem parte de números maiores
    // nem quando são seguidos por um ponto decimal.
    function androidValido(s, versao) {
        const regex = new RegExp(
            "(^|[^\\d])" + versao + "(?![\\d.])"
        );

        return regex.test(s);
    }

    function validar(s) {
        const chars = separar(s);
        const n = chars.length;
        const agora = new Date();
        const dia = romano(agora.getDate());
        const ano = String(agora.getFullYear());

        return [
            {
                nome: "Minimo 5 caracteres.",
                ok: n >= 5
            },
            {
                nome: "Precisa conter ao menos um número (0–9).",
 ok: /\d/.test(s)
            },
            {
                nome: "Precisa conter uma letra maiúscula (A–Z).",
 ok: /[A-Z]/.test(s)
            },
            {
                nome: "Precisa conter pelo menos um emoji.",
                ok: /\p{Extended_Pictographic}/u.test(s)
            },
            {
                nome: "Precisa conter o dia de hoje em algarismos romanos.",
                ok: s.includes(dia)
            },
            {
                nome: "Precisa conter os primeiros carcaters do numero PI",
                ok: s.includes(CONFIG.pi)
            },
            {
                nome: "precisa apontar pra cima.",
                ok: s.includes(CONFIG.emojiObrigatorio)
            },
            {
                nome: `Precisa conter o ano que o brasil ganhou o Hexa (${ano}).`,
 ok: s.includes(ano)
            },
            {
                nome: "Precisa conter todas as vogais maiúsculas: A, E, I, O e U.",
                ok: ["A", "E", "I", "O", "U"].every(
                    vogal => s.includes(vogal)
                )
            },
            {
                nome: "Coloque a bandeira 🇳🇱 começando na quinta posição visual.",
                ok: chars[4] === CONFIG.bandeira
            },

            {
                nome: "Precisa conter o codigo de  telefônico do seu pais.",
                ok: s.includes(CONFIG.codigo)
            },
            {
                nome: "precisa conter um feitiço conhecido de Harry Potter.",
                ok: CONFIG.feiticos.some(feitico =>
                s.toLocaleLowerCase("pt-BR").includes(
                    feitico.toLocaleLowerCase("pt-BR")
                )
                )
            },
            {
                nome: "Precisa conter a versão do Andrid do seu aparelho.",
                ok: CONFIG.android.some(versao =>
                androidValido(s, versao)
                )
            },
            {
                nome: `precisar conter o numero de carcaters que a senha possui. (${n}).`,
 ok: s.includes(String(n))
            },
            {
                nome: "Precisar conter menos de 40 caracteres.",
                ok: n < 40
            }
        ];
    }

    function parar() {
        if (intervalo !== null) {
            clearInterval(intervalo);
            intervalo = null;
        }
    }

    function confetes() {
        if (window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches) {
            return;
        }

        const cores = [
            "#8b5cf6",
            "#22d3ee",
            "#34d399",
            "#fbbf24",
            "#fb7185"
        ];

        for (let i = 0; i < 90; i++) {
            const elemento = document.createElement("span");

            elemento.className = "confete";
            elemento.setAttribute("aria-hidden", "true");
            elemento.style.left = Math.random() * 100 + "vw";
            elemento.style.backgroundColor =
            cores[Math.floor(Math.random() * cores.length)];

            elemento.style.setProperty(
                "--duracao",
                2 + Math.random() * 2.5 + "s"
            );

            elemento.style.setProperty(
                "--deslocamento",
                Math.random() * 180 - 90 + "px"
            );

            document.body.append(elemento);

            elemento.addEventListener(
                "animationend",
                () => elemento.remove(),
                                      { once: true }
            );
        }
    }

    function vencer() {
        if (vitoria || esgotado) {
            return;
        }

        vitoria = true;
        parar();

        cartao.classList.add("vitoria");
        senha.disabled = true;
        email.disabled = true;
        toggle.disabled = true;
        entrar.disabled = true;

        mensagem.style.color = "var(--good)";
        mensagem.textContent =
        `🏆 Parabéns! Você venceu com ${tempo} segundo` +
        `${tempo === 1 ? "" : "s"} restante` +
        `${tempo === 1 ? "" : "s"}!`;

        confetes();
    }

    function atualizar() {
        const s = senha.value;
        const chars = separar(s);
        const regras = validar(s);

        if (
            estadosAnteriores !== null &&
            !vitoria &&
            !esgotado
        ) {
            let novas = 0;

            regras.forEach((regra, i) => {
                if (
                    regra.ok &&
                    !estadosAnteriores[i] &&
                    !regrasPremiadas[i]
                ) {
                    novas++;
                    regrasPremiadas[i] = true;
                }
            });

            if (novas > 0) {
                tempo += novas * 10;
                tempoEl.textContent = String(tempo);

                mensagem.style.color = "var(--good)";
                mensagem.textContent =
                `⏱️ +${novas * 10} segundos! ` +
                `${novas === 1 ? "Uma regra foi" : "Regras foram"} ` +
                `cumprida${novas === 1 ? "" : "s"}.`;
            }
        }

        estadosAnteriores = regras.map(regra => regra.ok);

        const ok = regras.filter(regra => regra.ok).length;
        const idx = regras.findIndex(regra => !regra.ok);
        const pct = Math.round((ok / regras.length) * 100);
        const emailOk =
        email.value.trim() !== "" && email.validity.valid;

        contadorChars.textContent =
        `${chars.length} caractere` +
        `${chars.length === 1 ? "" : "s"} visuais`;

        contador.textContent = `${ok} de ${regras.length} regras`;
        porcentagem.textContent = pct + "%";
        progresso.style.width = pct + "%";
        trilho.setAttribute("aria-valuenow", String(ok));

        lista.replaceChildren();

        const li = document.createElement("li");

        li.textContent =
        idx === -1
        ? "🏆 Todas as regras foram cumpridas!"
        : regras[idx].nome;

        li.className = idx === -1 ? "cumprida" : "regra-atual";
        lista.append(li);

        const pronta = idx === -1 && emailOk;

        entrar.disabled = !pronta || vitoria || esgotado;

        if (idx === -1) {
            mensagem.style.color = "var(--good)";
            mensagem.textContent = pronta
            ? "🎉 Tudo certo! Clique para concluir o desafio."
            : "Senha válida! Informe um e-mail válido para concluir.";
        } else if (!esgotado && !vitoria) {
            mensagem.textContent = "";
        }

        // O emoji proibido é uma condição de bloqueio, não uma regra pontuada.
        if (s.includes(CONFIG.emojiProibido) && !vitoria && !esgotado) {
            entrar.disabled = true;
            mensagem.style.color = "var(--danger)";
            mensagem.textContent = "Não pode ter o dedo do meio, seu sem educação.";
        }
    }

    function iniciar() {
        if (iniciado || vitoria || esgotado) {
            return;
        }

        iniciado = true;

        intervalo = setInterval(() => {
            if (vitoria || esgotado) {
                parar();
                return;
            }

            tempo = Math.max(0, tempo - 1);
            tempoEl.textContent = String(tempo);

            if (tempo <= 10) {
                cronometro.classList.add("urgente");
            }

            if (tempo === 0) {
                esgotado = true;
                parar();

                senha.disabled = true;
                email.disabled = true;
                toggle.disabled = true;
                entrar.disabled = true;

                cartao.classList.add("derrota");

                mensagem.style.color = "var(--danger)";
                mensagem.textContent =
                "⏰ O tempo acabou! Tente novamente.";

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
        }, 1000);
    }

    function reiniciar() {
        parar();

        tempo = CONFIG.duracao;
        iniciado = false;
        vitoria = false;
        esgotado = false;
        estadosAnteriores = null;
        regrasPremiadas = Array(15).fill(false);

        email.value = "";
        senha.value = "";

        email.disabled = false;
        senha.disabled = false;
        toggle.disabled = false;

        senha.classList.add("senha-oculta");
        toggle.textContent = "Mostrar";
        toggle.setAttribute("aria-label", "Mostrar senha");

        tempoEl.textContent = String(CONFIG.duracao);

        cronometro.classList.remove("urgente");
        cartao.classList.remove("vitoria", "derrota");

        mensagem.textContent = "";

        document.querySelectorAll(".confete").forEach(
            elemento => elemento.remove()
        );

        $("reiniciar")?.remove();

        atualizar();
        senha.focus();
    }

    toggle.addEventListener("click", () => {
        const mostrar = senha.classList.contains("senha-oculta");

        senha.classList.toggle("senha-oculta", !mostrar);
        toggle.textContent = mostrar ? "Ocultar" : "Mostrar";

        toggle.setAttribute(
            "aria-label",
            mostrar ? "Ocultar senha" : "Mostrar senha"
        );
    });

    senha.addEventListener("focus", iniciar);
    senha.addEventListener("input", atualizar);
    email.addEventListener("input", atualizar);

    form.addEventListener("submit", evento => {
        evento.preventDefault();

        if (vitoria || esgotado) {
            return;
        }

        if (senha.value.includes(CONFIG.emojiProibido)) {
            mensagem.style.color = "var(--danger)";
            mensagem.textContent = "Não pode ter o dedo do meio, seu sem educação.";
            entrar.disabled = true;
            return;
        }

        if (!email.value.trim() || !email.validity.valid) {
            email.reportValidity();
            return;
        }

        const regras = validar(senha.value);

        if (regras.every(regra => regra.ok)) {
            vencer();
        } else {
            atualizar();
        }
    });

    atualizar();
})();
