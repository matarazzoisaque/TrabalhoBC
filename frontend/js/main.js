const statusBackend = document.querySelector("#status-backend");
const listaProfessores = document.querySelector("#lista-professores");

async function buscarStatus() {
  const resposta = await fetch("/api/status");
  const dados = await resposta.json();
  statusBackend.textContent = `${dados.backend} conectado. ${dados.banco_dados}.`;
}

async function buscarProfessores() {
  const resposta = await fetch("/api/professores");
  const professores = await resposta.json();

  listaProfessores.innerHTML = professores
    .map(
      (professor) => `
        <article class="professor">
          <span class="numero">Numero ${professor.numero}</span>
          <h3>${professor.nome}</h3>
        </article>
      `
    )
    .join("");
}

async function iniciarAplicacao() {
  try {
    await buscarStatus();
    await buscarProfessores();
  } catch (erro) {
    statusBackend.textContent = "Nao foi possivel conectar ao backend.";
  }
}

document.addEventListener("DOMContentLoaded", iniciarAplicacao);
