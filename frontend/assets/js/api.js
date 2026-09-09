const API_BASE_URL = "http://127.0.0.1:8000/api";

async function apiRequest(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_BASE_URL}/${caminho}`, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });
  return resposta.json();
}

async function verificarConexaoBackend() {
  try {
    const resposta = await fetch(`${API_BASE_URL}/status`);
    return await resposta.json();
  } catch (erro) {
    return { ok: false, mensagem: "Não foi possível conectar ao backend." };
  }
}
