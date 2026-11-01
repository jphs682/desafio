/* Motor de regras do Desafio da Senha.
 * Compartilhado pelo navegador e pelos testes automatizados do Node.js.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.DesafioRegras = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CONFIG = Object.freeze({
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

  function separarGraphemes(texto) {
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
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

  function avaliarRegrasSenha(texto, contagemAlvo = null, data = new Date()) {
    const chars = separarGraphemes(texto);
    const quantidade = chars.length;
    const alvo = contagemAlvo ?? quantidade;
    const diaRomano = romano(data.getDate());
    const lower = texto.toLocaleLowerCase("pt-BR");

    return [
      { id: "minimo", nome: "Sua senha precisa ter pelo menos 5 caracteres visuais.", ok: quantidade >= 5 },
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
        nome: "O número de caracteres visuais definido nesta etapa (" + alvo + ") precisa aparecer na senha.",
        ok: texto.includes(String(alvo))
      },
      { id: "maximo", nome: "Sua senha precisa ter menos de 40 caracteres visuais.", ok: quantidade < 40 },
      { id: "minuscula", nome: "Inclua pelo menos uma letra minúscula (a–z).", ok: /[a-z]/.test(texto) }
    ];
  }

  return Object.freeze({
    CONFIG,
    separarGraphemes,
    romano,
    avaliarRegrasSenha
  });
});
