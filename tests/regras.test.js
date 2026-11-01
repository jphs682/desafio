const test = require("node:test");
const assert = require("node:assert/strict");
const {
  separarGraphemes,
  romano,
  avaliarRegrasSenha
} = require("../regras.js");

function regra(id, texto, alvo = null, data = new Date(2026, 0, 9)) {
  return avaliarRegrasSenha(texto, alvo, data).find(item => item.id === id);
}

test("separa emojis compostos e bandeiras como caracteres visuais", () => {
  assert.equal(separarGraphemes("A☝️🇳🇱").length, 3);
});

test("converte números para algarismos romanos", () => {
  assert.equal(romano(1), "I");
  assert.equal(romano(9), "IX");
  assert.equal(romano(14), "XIV");
  assert.equal(romano(29), "XXIX");
});

test("valida o mínimo de cinco caracteres visuais", () => {
  assert.equal(regra("minimo", "Abc1!").ok, true);
  assert.equal(regra("minimo", "Ab1!").ok, false);
});

test("identifica número, letra maiúscula e letra minúscula", () => {
  assert.equal(regra("numero", "abc7").ok, true);
  assert.equal(regra("numero", "abcdef").ok, false);
  assert.equal(regra("maiuscula", "Senha").ok, true);
  assert.equal(regra("maiuscula", "senha").ok, false);
  assert.equal(regra("minuscula", "SENHA").ok, false);
  assert.equal(regra("minuscula", "Senha").ok, true);
});

test("identifica emoji e o emoji específico de apontar", () => {
  assert.equal(regra("emoji", "Senha☝️").ok, true);
  assert.equal(regra("apontar", "Senha☝️").ok, true);
  assert.equal(regra("apontar", "Senha😀").ok, false);
});

test("valida o dia atual em algarismos romanos", () => {
  assert.equal(regra("romano", "SenhaIX").ok, true);
  assert.equal(regra("romano", "SenhaX").ok, false);
});

test("valida PI, ano e código telefônico do Brasil", () => {
  assert.equal(regra("pi", "Senha3.14").ok, true);
  assert.equal(regra("ano", "Senha2002").ok, true);
  assert.equal(regra("codigo", "Senha+55").ok, true);
});

test("exige as cinco vogais maiúsculas", () => {
  assert.equal(regra("vogais", "AEIOU").ok, true);
  assert.equal(regra("vogais", "AEIO").ok, false);
});

test("exige a bandeira holandesa na quinta posição visual", () => {
  assert.equal(regra("bandeira", "abcd🇳🇱").ok, true);
  assert.equal(regra("bandeira", "abc🇳🇱d").ok, false);
});

test("aceita feitiços de Harry Potter sem diferenciar maiúsculas", () => {
  assert.equal(regra("feitico", "Minha senha tem lumos").ok, true);
  assert.equal(regra("feitico", "Minha senha tem magia").ok, false);
});

test("mantém estável o alvo da regra de contagem", () => {
  assert.equal(regra("contagem", "abc15", 5).ok, true);
  assert.equal(regra("contagem", "abc15", 6).ok, false);
});

test("limita a senha a menos de quarenta caracteres visuais", () => {
  assert.equal(regra("maximo", "a".repeat(39)).ok, true);
  assert.equal(regra("maximo", "a".repeat(40)).ok, false);
});

test("retorna todas as quinze regras esperadas", () => {
  const regras = avaliarRegrasSenha("");
  assert.equal(regras.length, 15);
  assert.equal(new Set(regras.map(item => item.id)).size, 15);
});
