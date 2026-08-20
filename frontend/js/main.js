const backendStatusElement = document.querySelector("#backend-status");
const databaseStatusElement = document.querySelector("#database-status");
const statusMessageElement = document.querySelector("#status-message");
const apiBaseUrl =
  window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "";

async function verificarBackend() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/status`);

    if (!response.ok) {
      throw new Error("Resposta invalida do backend.");
    }

    const data = await response.json();

    backendStatusElement.textContent =
      data.status === "online" ? "Online" : "Indisponivel";
    databaseStatusElement.textContent = data.database;
    statusMessageElement.textContent = `Backend ${data.backend} respondendo corretamente.`;
  } catch (error) {
    backendStatusElement.textContent = "Indisponivel";
    statusMessageElement.textContent =
      "Nao foi possivel conectar ao backend Python.";
  }
}

document.addEventListener("DOMContentLoaded", verificarBackend);
