const urna = { numero: "", estado: "identification", candidato: null, candidatos: [], voter: null, vote: null, feedbackTimer: null };
const elementos = {
  numero: document.querySelector("#numero-digitado"), estado: document.querySelector("#estado-votacao"), dados: document.querySelector("#dados-candidato"),
  foto: document.querySelector("#foto-candidato"), fallbackFoto: document.querySelector("#fallback-foto"), nome: document.querySelector("#nome-candidato"),
  funcao: document.querySelector("#funcao-candidato"), partido: document.querySelector("#partido-candidato"), cargo: document.querySelector("#cargo-votacao"), mensagem: document.querySelector("#urna-mensagem"),
  identification: document.querySelector("#identificacao"), voting: document.querySelector("#votacao"), identificationForm: document.querySelector("#form-identificacao"),
  identificationMessage: document.querySelector("#identificacao-mensagem"), list: document.querySelector("#lista-candidatos"), help: document.querySelector("#abrir-santinho"), dialog: document.querySelector("#santinho"), closeDialog: document.querySelector("#fechar-santinho"),
};

function renderizar() {
  elementos.numero.textContent = urna.numero || "\u00a0";
  elementos.estado.textContent = urna.estado === "not-found" ? electionConfig.labels.notFound : urna.estado === "blank" ? electionConfig.labels.blank : electionConfig.labels[urna.estado] || "";
  elementos.dados.hidden = !urna.candidato;
  if (urna.candidato) {
    elementos.nome.textContent = urna.candidato.name;
    elementos.partido.textContent = urna.candidato.party;
    elementos.funcao.textContent = `${urna.candidato.role} - número ${urna.candidato.number}`;
    elementos.foto.alt = `Foto de ${urna.candidato.name}`;
    elementos.foto.src = urna.candidato.photo;
    elementos.foto.hidden = !urna.candidato.photo;
    elementos.fallbackFoto.hidden = Boolean(urna.candidato.photo);
    elementos.fallbackFoto.textContent = urna.candidato.name.charAt(0);
  }
  elementos.estado.dataset.estado = urna.estado;
  elementos.mensagem.textContent = urna.estado === "finished" ? "Voto registrado nesta simulação." : urna.feedback || "";
}

function mostrarFeedback(texto) {
  window.clearTimeout(urna.feedbackTimer);
  urna.feedback = texto;
  renderizar();
  urna.feedbackTimer = window.setTimeout(() => { urna.feedback = ""; renderizar(); }, 1600);
}

function corrigir() {
  if (urna.estado === "finished") return;
  if (!urna.numero && !urna.candidato && !["blank", "not-found"].includes(urna.estado)) {
    mostrarFeedback("Ação indisponível");
    return;
  }
  urna.numero = "";
  urna.estado = "idle";
  urna.candidato = null;
  urna.feedback = "";
  renderizar();
}

function digitar(digito) {
  if (!["idle", "typing", "found", "not-found", "blank"].includes(urna.estado) || urna.numero.length >= electionConfig.numberLength) return;
  urna.feedback = "";
  urna.numero += digito;
  urna.estado = "typing";
  urna.candidato = urna.candidatos.find((candidato) => candidato.number === urna.numero) || null;
  if (urna.candidato) urna.estado = "found";
  else if (urna.numero.length === electionConfig.numberLength) urna.estado = "not-found";
  renderizar();
}

function branco() {
  if (urna.estado !== "finished") { urna.feedback = ""; urna.numero = ""; urna.candidato = null; urna.estado = "blank"; renderizar(); }
}

function playConfirmationSound() {
  try {
    if (!electionConfig.sound.useLocalFile) { criarSomFallback(); return; }
    const audio = new Audio(electionConfig.sound.localFile);
    audio.play().catch(() => criarSomFallback());
  } catch (erro) { criarSomFallback(); }
}

function criarSomFallback() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const contexto = new AudioContextClass();
    [523.25, 659.25, 783.99].forEach((frequencia, indice) => {
      const oscilador = contexto.createOscillator();
      const ganho = contexto.createGain();
      oscilador.frequency.value = frequencia;
      ganho.gain.setValueAtTime(.0001, contexto.currentTime + indice * .09);
      ganho.gain.exponentialRampToValueAtTime(.12, contexto.currentTime + indice * .09 + .02);
      ganho.gain.exponentialRampToValueAtTime(.0001, contexto.currentTime + indice * .09 + .16);
      oscilador.connect(ganho).connect(contexto.destination);
      oscilador.start(contexto.currentTime + indice * .09);
      oscilador.stop(contexto.currentTime + indice * .09 + .17);
    });
  } catch (erro) { /* Audio is optional feedback. */ }
}

function confirmar() {
  if (urna.estado === "finished") return;
  if (!["found", "blank", "not-found"].includes(urna.estado) || (urna.estado === "not-found" && !electionConfig.allowNullVote)) {
    mostrarFeedback("Ação indisponível");
    return;
  }
  const estadoAnterior = urna.estado;
  urna.estado = "finished";
  urna.vote = { candidate: urna.candidato, blank: estadoAnterior === "blank", nullVote: !urna.candidato && estadoAnterior === "not-found" };
  urna.numero = "";
  urna.candidato = null;
  elementos.estado.textContent = electionConfig.labels.end;
  elementos.dados.hidden = true;
  elementos.numero.textContent = "";
  elementos.mensagem.textContent = "Voto registrado nesta simulação.";
  elementos.help.hidden = true;
  playConfirmationSound();
}

function iniciarVotacao(evento) {
  evento.preventDefault();
  const dados = new FormData(evento.currentTarget);
  const voter = { registration: String(dados.get("registration") || "").trim(), firstName: String(dados.get("firstName") || "").trim(), lastName: String(dados.get("lastName") || "").trim() };
  let valido = true;
  ["registration", "firstName", "lastName"].forEach((campo) => {
    const erro = document.querySelector(`[data-error-for="${campo}"]`);
    const preenchido = Boolean(voter[campo]);
    erro.textContent = preenchido ? "" : "Preencha este campo.";
    document.querySelector(`[name="${campo}"]`).setAttribute("aria-invalid", String(!preenchido));
    valido = valido && preenchido;
  });
  if (!valido) { elementos.identificationMessage.textContent = "Confira os dados para continuar."; return; }
  urna.voter = voter;
  urna.estado = "idle";
  elementos.identification.hidden = true;
  elementos.voting.hidden = false;
  elementos.help.hidden = false;
  document.querySelector("[data-digito]").focus();
  renderizar();
}

function renderizarCandidatos() {
  elementos.list.replaceChildren(...urna.candidatos.map((candidate) => {
    const item = document.createElement("div");
    item.className = "candidato-santinho";
    const avatar = document.createElement("div");
    avatar.className = "avatar-candidato";
    if (candidate.photo) {
      const image = document.createElement("img");
      image.src = candidate.photo;
      image.alt = `Foto de ${candidate.name}`;
      avatar.appendChild(image);
    } else {
      avatar.textContent = candidate.name.charAt(0);
    }
    const details = document.createElement("div");
    details.className = "candidato-detalhes";
    const number = document.createElement("strong");
    number.textContent = candidate.number;
    const name = document.createElement("span");
    name.textContent = candidate.name;
    const party = document.createElement("small");
    party.textContent = candidate.party;
    details.append(number, name, party);
    item.replaceChildren(avatar, details);
    return item;
  }));
}

function abrirSantinho() { if (urna.estado !== "identification" && urna.estado !== "finished") { elementos.dialog.showModal(); elementos.help.setAttribute("aria-expanded", "true"); elementos.closeDialog.focus(); } }
function fecharSantinho() { elementos.dialog.close(); elementos.help.setAttribute("aria-expanded", "false"); elementos.help.focus(); }

elementos.identificationForm.addEventListener("submit", iniciarVotacao);
document.querySelectorAll("[data-digito]").forEach((botao) => botao.addEventListener("click", () => digitar(botao.dataset.digito)));
document.querySelector("[data-acao=branco]").addEventListener("click", branco);
document.querySelector("[data-acao=corrige]").addEventListener("click", corrigir);
document.querySelector("[data-acao=confirma]").addEventListener("click", confirmar);
elementos.help.addEventListener("click", abrirSantinho);
elementos.closeDialog.addEventListener("click", fecharSantinho);
elementos.dialog.addEventListener("cancel", (evento) => { evento.preventDefault(); fecharSantinho(); });
elementos.dialog.addEventListener("keydown", (evento) => { if (evento.key === "Escape") { evento.preventDefault(); fecharSantinho(); } });
elementos.dialog.addEventListener("close", () => elementos.help.setAttribute("aria-expanded", "false"));
window.addEventListener("keydown", (evento) => { if (evento.key === "Escape" && elementos.dialog.open) fecharSantinho(); }, true);
document.addEventListener("keydown", (evento) => {
  if (elementos.dialog.open) {
    if (evento.key === "Escape") fecharSantinho();
    return;
  }
  if (urna.estado === "identification" || urna.estado === "finished") return;
  if (/^\d$/.test(evento.key)) digitar(evento.key);
  if (evento.key === "Backspace" || evento.key === "Escape") corrigir();
  if (evento.key === "Enter") confirmar();
});

elementos.cargo.textContent = electionConfig.role;
elementos.help.hidden = true;
candidateSource.getAll().then((candidatos) => { urna.candidatos = candidatos; renderizarCandidatos(); renderizar(); });
