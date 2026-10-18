(() => {
"use strict";
const CONFIG={duracao:60,pi:"3.14",emojiObrigatorio:"☝️",emojiProibido:"🖕",bandeira:"🇳🇱",codigo:"+55",android:["14","15","16"],feiticos:["Expelliarmus","Lumos","Nox","Alohomora","Expecto Patronum","Wingardium Leviosa","Accio","Aparecium","Riddikulus"]};
const $=id=>document.getElementById(id);
const form=$("login-form"),email=$("email"),senha=$("senha"),toggle=$("toggle-senha"),entrar=$("entrar"),lista=$("lista-regras"),contador=$("contador"),contadorChars=$("contador-caracteres"),porcentagem=$("porcentagem"),progresso=$("progresso"),trilho=$("trilho-progresso"),mensagem=$("mensagem"),tempoEl=$("tempo"),cronometro=$("cronometro"),cartao=$("cartao");
let tempo=60,intervalo=null,iniciado=false,vitoria=false,esgotado=false;
function romano(n){const pares=[[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];let s="";for(const [v,c] of pares)while(n>=v){s+=c;n-=v}return s}
function separar(s){if(Intl.Segmenter)return [...new Intl.Segmenter("pt-BR",{granularity:"grapheme"}).segment(s)].map(x=>x.segment);return Array.from(s)}
function androidValido(s,v){return new RegExp("Android\\s+"+v+"(?![\\d.])","i").test(s)}
function validar(s){
 const chars=separar(s),n=chars.length,agora=new Date(),dia=romano(agora.getDate()),ano=String(agora.getFullYear());
 return [
 {nome:"Digite pelo menos 5 caracteres visuais.",ok:n>=5},
 {nome:"Adicione pelo menos um número (0–9).",ok:/\d/.test(s)},
 {nome:"Adicione uma letra maiúscula (A–Z).",ok:/[A-Z]/.test(s)},
 {nome:"Inclua pelo menos um emoji.",ok:/\p{Extended_Pictographic}/u.test(s)},
 {nome:"Inclua o dia de hoje em algarismos romanos.",ok:s.includes(dia)},
 {nome:"Inclua 3.14.",ok:s.includes(CONFIG.pi)},
 {nome:"Inclua o emoji ☝️.",ok:s.includes(CONFIG.emojiObrigatorio)},
 {nome:`Inclua o ano atual (${ano}).`,ok:s.includes(ano)},
 {nome:"Não inclua o emoji proibido 🖕.",ok:!s.includes(CONFIG.emojiProibido)},
 {nome:"Coloque a bandeira 🇳🇱 começando na quinta posição visual.",ok:chars[4]===CONFIG.bandeira},
 {nome:"Inclua todas as vogais maiúsculas: A, E, I, O e U.",ok:["A","E","I","O","U"].every(v=>s.includes(v))},
 {nome:"Inclua o código telefônico +55.",ok:s.includes(CONFIG.codigo)},
 {nome:"Inclua um feitiço conhecido de Harry Potter.",ok:CONFIG.feiticos.some(f=>s.toLocaleLowerCase("pt-BR").includes(f.toLocaleLowerCase("pt-BR")))},
 {nome:"Inclua Android 14, Android 15 ou Android 16.",ok:CONFIG.android.some(v=>androidValido(s,v))},
 {nome:`Inclua o número correspondente ao comprimento atual (${n}).`,ok:s.includes(String(n))},
 {nome:"A senha deve ter menos de 40 caracteres visuais.",ok:n<40}
 ]}
function parar(){if(intervalo!==null){clearInterval(intervalo);intervalo=null}}
function confetes(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;const cores=["#8b5cf6","#22d3ee","#34d399","#fbbf24","#fb7185"];for(let i=0;i<90;i++){const e=document.createElement("span");e.className="confete";e.setAttribute("aria-hidden","true");e.style.left=Math.random()*100+"vw";e.style.backgroundColor=cores[Math.floor(Math.random()*cores.length)];e.style.setProperty("--duracao",2+Math.random()*2.5+"s");e.style.setProperty("--deslocamento",Math.random()*180-90+"px");document.body.append(e);e.addEventListener("animationend",()=>e.remove(),{once:true})}}
function vencer(){if(vitoria||esgotado)return;vitoria=true;parar();cartao.classList.add("vitoria");senha.disabled=true;toggle.disabled=true;entrar.disabled=true;mensagem.style.color="var(--good)";mensagem.textContent=`🏆 Parabéns! Você venceu com ${tempo} segundo${tempo===1?"":"s"} restante${tempo===1?"":"s"}!`;confetes()}
function atualizar(){const s=senha.value,chars=separar(s),regras=validar(s),ok=regras.filter(r=>r.ok).length,idx=regras.findIndex(r=>!r.ok),pct=Math.round(ok/16*100),emailOk=email.value.trim()!==""&&email.validity.valid;
 contadorChars.textContent=`${chars.length} caractere${chars.length===1?"":"s"} visuais`;contador.textContent=`${ok} de 16 regras`;porcentagem.textContent=pct+"%";progresso.style.width=pct+"%";trilho.setAttribute("aria-valuenow",String(ok));lista.replaceChildren();const li=document.createElement("li");li.textContent=idx===-1?"🏆 Todas as regras foram cumpridas!":regras[idx].nome;li.className=idx===-1?"cumprida":"regra-atual";lista.append(li);
 const pronta=idx===-1&&emailOk;entrar.disabled=!pronta||vitoria||esgotado;
 if(idx===-1) {mensagem.style.color="var(--good)";mensagem.textContent=pronta?"🎉 Tudo certo! Clique para concluir o desafio.":"Senha válida! Informe um e-mail válido para concluir."} else if(!esgotado&&!vitoria)mensagem.textContent="";
 if(pronta&&!vitoria&&!esgotado)vencer();
}
function iniciar(){if(iniciado||vitoria||esgotado)return;iniciado=true;intervalo=setInterval(()=>{if(vitoria||esgotado){parar();return}tempo=Math.max(0,tempo-1);tempoEl.textContent=String(tempo);if(tempo<=10)cronometro.classList.add("urgente");if(tempo===0){esgotado=true;parar();senha.disabled=true;toggle.disabled=true;entrar.disabled=true;cartao.classList.add("derrota");mensagem.style.color="var(--danger)";mensagem.textContent="⏰ O tempo acabou! Tente novamente.";const b=document.createElement("button");b.type="button";b.id="reiniciar";b.className="submit";b.textContent="Tentar novamente";b.addEventListener("click",reiniciar);entrar.after(b)}},1000)}
function reiniciar(){parar();tempo=60;iniciado=false;vitoria=false;esgotado=false;email.value="";senha.value="";senha.disabled=false;toggle.disabled=false;senha.type="password";toggle.textContent="Mostrar";toggle.setAttribute("aria-label","Mostrar senha");tempoEl.textContent="60";cronometro.classList.remove("urgente");cartao.classList.remove("vitoria","derrota");mensagem.textContent="";document.querySelectorAll(".confete").forEach(e=>e.remove());$("reiniciar")?.remove();atualizar();senha.focus()}
toggle.addEventListener("click",()=>{const show=senha.type==="password";senha.type=show?"text":"password";toggle.textContent=show?"Ocultar":"Mostrar";toggle.setAttribute("aria-label",show?"Ocultar senha":"Mostrar senha")});
senha.addEventListener("focus",iniciar);senha.addEventListener("input",atualizar);email.addEventListener("input",atualizar);
form.addEventListener("submit",e=>{e.preventDefault();if(vitoria||esgotado)return;if(!email.value.trim()||!email.validity.valid){email.reportValidity();return}if(validar(senha.value).every(r=>r.ok))vencer();else atualizar()});
atualizar();
})();
